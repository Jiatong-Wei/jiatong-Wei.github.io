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
  onDone: (() => void) | null = null;

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

  private async exec(line: string): Promise<void> {
    this.busy = true;
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
          this.writeErr(`command not found: ${bold(name)} ${C.dim}(试试 help)${R}`);
          return;
        }
        if (argv.length - 1 < (cmd.minArgs ?? 0)) {
          this.writeErr(`${name}: ${cmd.usage ?? '缺参数'}`);
          return;
        }
        try {
          result = await cmd.run({ argv: argv.slice(1), stdin, api: this.ui });
        } catch (e) {
          this.writeErr(`${name}: ${e instanceof Error ? e.message : String(e)}`);
          return;
        }
        stdin = result;
      }
      if (result) this.ui.term.write(result.endsWith('\n') ? result : `${result}\r\n`);
    } finally {
      this.busy = false;
      this.onDone?.();
    }
  }
}
