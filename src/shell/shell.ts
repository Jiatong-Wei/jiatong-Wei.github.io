// REPL: prompt loop, pipeline execution, history persistence, injection.

import { parseLine } from './parser';
import { Readline } from './readline';
import type { Ui } from '../term/ui';
import { C, R, bold } from '../term/ansi';
import { registry, completionCandidates } from '../apps/registry';

const HIST_KEY = 'weijiatong.term.history';
const HIST_MAX = 200;

function loadHist(): string[] {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string').slice(-HIST_MAX) : [];
  } catch {
    return [];
  }
}

function saveHist(hist: string[]): void {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(-HIST_MAX)));
  } catch {
    /* private mode etc. — history just won't persist */
  }
}

export function promptString(): string {
  return `\r\n${C.accent}wei${R}${C.dim}:/${R}$ `;
}

export class Shell {
  private hist: string[] = loadHist();
  private rl: Readline;
  private busy = false;
  private started = false;
  private injectTimer: number | null = null;
  /** Fired after each command finishes (pet reacts). */
  onDone: ((cmd: string, ok: boolean) => void) | null = null;

  constructor(private ui: Ui) {
    this.rl = new Readline(
      ui.term,
      promptString(),
      this.hist,
      (line) => completionCandidates(line),
    );
  }

  /** Main loop — one awaited prompt at a time. */
  async run(): Promise<void> {
    this.started = true;
    for (;;) {
      const line = await this.rl.read();
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (this.hist[this.hist.length - 1] !== trimmed) {
        this.hist.push(trimmed);
        saveHist(this.hist);
      }
      await this.exec(trimmed);
    }
  }

  /** Button entrypoint: echo the command into the prompt, then run it.
   *  Ignored while busy or when the user has half-typed a command. */
  inject(line: string): void {
    if (!this.started || this.busy || this.injectTimer !== null || !this.rl.isIdle()) return;
    this.rl.feed(line);
    this.injectTimer = window.setTimeout(() => {
      this.injectTimer = null;
      this.rl.feed('\r');
    }, 90);
  }

  private writeErr(msg: string): void {
    this.ui.term.write(`${C.red}✗${R} ${msg}\r\n`);
  }

  /** Closest registered command within edit distance 2 — for "did you mean". */
  private suggest(name: string): string | null {
    const lev = (a: string, b: string): number => {
      const m = a.length;
      const n = b.length;
      const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
      for (let j = 0; j <= n; j++) d[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          d[i][j] = Math.min(
            d[i - 1][j] + 1,
            d[i][j - 1] + 1,
            d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
          );
        }
      }
      return d[m][n];
    };
    let best: string | null = null;
    let bestD = 3;
    for (const key of registry.keys()) {
      if (registry.get(key)!.hidden) continue;
      const d = lev(name, key);
      if (d < bestD || (d === bestD && best !== null && key.length < best.length)) {
        best = key;
        bestD = d;
      }
    }
    return bestD <= 2 ? best : null;
  }

  private async exec(line: string): Promise<void> {
    this.busy = true;
    let firstName = line.trim().split(/\s+/)[0] ?? '';
    let ok = true;
    try {
      const pipeline = parseLine(line);
      if (!pipeline) return;
      let stdin = '';
      let result = '';
      for (let i = 0; i < pipeline.length; i++) {
        const argv = pipeline[i];
        const name = argv[0];
        const cmd = registry.get(name);
        if (!cmd) {
          const hint = this.suggest(name);
          this.writeErr(
            `command not found: ${bold(name)}` +
              (hint ? ` ${C.dim}— 是不是想敲 ${R}${C.accent}${hint}${R}${C.dim}？${R}` : ` ${C.dim}(试试 help)${R}`),
          );
          ok = false;
          return;
        }
        if (argv.length - 1 < (cmd.minArgs ?? 0)) {
          this.writeErr(`${name}: ${cmd.usage ?? '缺参数'}`);
          ok = false;
          return;
        }
        try {
          result = await cmd.run({ argv: argv.slice(1), stdin, api: this.ui, piped: i > 0 });
        } catch (e) {
          this.writeErr(`${name}: ${e instanceof Error ? e.message : String(e)}`);
          ok = false;
          return;
        }
        stdin = result;
      }
      if (result) this.ui.term.write(result.endsWith('\n') ? result : `${result}\r\n`);
    } finally {
      this.busy = false;
      this.onDone?.(firstName, ok);
    }
  }
}
