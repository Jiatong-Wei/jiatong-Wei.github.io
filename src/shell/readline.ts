// Line editor over xterm.js: prompt, cursor movement, history, tab completion.
// CJK-aware display width math via ansi.strWidth.

import type { Terminal } from '@xterm/xterm';
import { strWidth } from '../term/ansi';

export interface CompletionSource {
  /** Candidates for the current input line (full line text). */
  candidates(line: string): string[];
}

type CompletionFn = (line: string) => string[];
type Resolve = (line: string) => void;

export class Readline {
  private buf: string[] = [];
  private pos = 0;
  private histIdx: number | null = null;
  private draft: string | null = null;
  private active = false;
  private resolve: Resolve | null = null;

  constructor(
    private term: Terminal,
    private prompt: string,
    private history: string[],
    private completion?: CompletionFn,
  ) {}

  /** Show the prompt and resolve with the entered line. */
  read(): Promise<string> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.active = true;
      this.buf = [];
      this.pos = 0;
      this.histIdx = null;
      this.draft = null;
      this.term.write(this.prompt);
      this.dataDisposable = this.term.onData((d: string) => this.onData(d));
    });
  }

  detach(): void {
    this.active = false;
    this.resolve = null;
    this.dataDisposable?.dispose();
    this.dataDisposable = null;
  }

  /** Programmatically type into the prompt (button injection). No-op when idle. */
  feed(data: string): void {
    if (this.active) this.onData(data);
  }

  private dataDisposable: { dispose(): void } | null = null;

  /** Prompt without the leading newline — for in-place redraws. */
  private get linePrompt(): string {
    return this.prompt.replace(/^\r\n/, '');
  }

  private finish(line: string): void {
    this.dataDisposable?.dispose();
    this.dataDisposable = null;
    this.active = false;
    const r = this.resolve;
    this.resolve = null;
    r?.(line);
  }

  private onData(data: string): void {
    if (!this.active) return;
    let i = 0;
    while (i < data.length) {
      const rest = data.slice(i);
      // multi-char escape sequences and control names first
      const seq = matchSeq(rest);
      if (seq) {
        this.onSeq(seq);
        i += seq.length;
        continue;
      }
      const ch = rest[0];
      const cp = ch.codePointAt(0) ?? 0;
      if (ch === '\r') {
        const line = this.buf.join('');
        this.term.write('\r\n');
        return this.submit(line);
      }
      if (ch === '\x03') {
        // Ctrl+C: cancel line
        this.term.write('^C\r\n');
        return this.submit('');
      }
      if (ch === '\x7f') {
        if (this.pos > 0) {
          this.buf.splice(this.pos - 1, 1);
          this.pos--;
          this.redraw();
        }
      } else if (ch === '\x1b') {
        // lone ESC — ignore
      } else if (cp >= 0x7f && cp < 0xa0) {
        // C1 controls (incl. bare CSI) — never let clipboard text become live escape codes
      } else if (ch === '\t') {
        this.tabComplete();
      } else if (cp >= 32) {
        // printable chunk (also handles multi-codepoint IME commits arriving as runs)
        const run = rest.slice(0, runLength(rest));
        for (const c of run) this.buf.splice(this.pos++, 0, c);
        this.redraw();
        i += run.length;
        continue;
      }
      i += 1;
    }
  }

  private submit(line: string): void {
    this.finish(line);
  }

  private onSeq(seq: string): void {
    switch (seq) {
      case '\x1b[A': // up — history
        if (!this.history.length) break;
        if (this.histIdx === null) {
          this.draft = this.buf.join('');
          this.histIdx = this.history.length;
        }
        this.histIdx = Math.max(0, this.histIdx - 1);
        this.setLine(this.history[this.histIdx]);
        break;
      case '\x1b[B': // down — history
        if (this.histIdx === null) break;
        this.histIdx++;
        if (this.histIdx >= this.history.length) {
          this.histIdx = null;
          this.setLine(this.draft ?? '');
        } else {
          this.setLine(this.history[this.histIdx]);
        }
        break;
      case '\x1b[C': // right
        if (this.pos < this.buf.length) {
          this.pos++;
          this.redraw();
        }
        break;
      case '\x1b[D': // left
        if (this.pos > 0) {
          this.pos--;
          this.redraw();
        }
        break;
      case '\x1b[H':
      case '\x1bOH':
      case '\x1b[1~':
        this.pos = 0;
        this.redraw();
        break;
      case '\x1b[F':
      case '\x1bOF':
      case '\x1b[4~':
        this.pos = this.buf.length;
        this.redraw();
        break;
      case '\x1b[3~': // delete key
        if (this.pos < this.buf.length) {
          this.buf.splice(this.pos, 1);
          this.redraw();
        }
        break;
      default:
        break;
    }
  }

  private setLine(line: string): void {
    this.buf = [...line];
    this.pos = this.buf.length;
    this.redraw();
  }

  private redraw(): void {
    const text = this.buf.join('');
    this.term.write(`\r\x1b[2K${this.linePrompt}${text}`);
    const tail = this.buf.slice(this.pos).join('');
    const w = strWidth(tail);
    if (w > 0) this.term.write(`\x1b[${w}D`);
  }

  private tabComplete(): void {
    if (!this.completion) return;
    const line = this.buf.slice(0, this.pos).join('');
    const cands = this.completion(line);
    if (!cands.length) return;
    const [head, fragment] = splitFragment(line);
    if (cands.length === 1) {
      const done = head + cands[0] + ' ';
      const tail = this.buf.slice(this.pos).join('');
      this.buf = [...done, ...tail];
      this.pos = done.length;
      this.redraw();
      return;
    }
    const common = commonPrefix(cands);
    if (common.length > fragment.length) {
      this.setLine(head + common);
    }
    this.term.write('\r\n');
    const cols = 4;
    const width = Math.max(...cands.map((c) => strWidth(c))) + 2;
    for (let i = 0; i < cands.length; i += cols) {
      this.term.write(
        cands
          .slice(i, i + cols)
          .map((c) => c.padEnd(width))
          .join('')
          .trimEnd() + '\r\n',
      );
    }
    this.term.write(this.linePrompt + this.buf.join(''));
  }
}

/** How many leading chars of `s` form one printable run (stop at \r, \x1b, \x7f, C1, control, tab). */
function runLength(s: string): number {
  let n = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === '\r' || ch === '\x1b' || ch === '\x7f' || ch === '\t' || cp < 32 || (cp >= 0x7f && cp < 0xa0)) break;
    n += ch.length;
  }
  return Math.max(1, n);
}

const SEQ_RE = /^(?:\x1b\[[0-9;]*[A-Za-z~]|\x1bO[A-Za-z]|\x1b[A-Za-z])/;

function matchSeq(s: string): string | null {
  if (!s.startsWith('\x1b')) return null;
  const m = SEQ_RE.exec(s);
  return m ? m[0] : '\x1b';
}

function splitFragment(line: string): [string, string] {
  const m = /(?:^|\s)([^\s]*)$/.exec(line);
  const frag = m?.[1] ?? '';
  // head keeps its trailing separator so completion re-joins cleanly
  return [line.slice(0, line.length - frag.length), frag];
}

function commonPrefix(items: string[]): string {
  if (!items.length) return '';
  let p = items[0];
  for (const it of items.slice(1)) {
    let i = 0;
    while (i < p.length && i < it.length && p[i] === it[i]) i++;
    p = p.slice(0, i);
  }
  return p;
}
