// ~wei@nwpu — first screen + wiring.

import { createUi, setCommandLinkHandler } from './term/ui';
import { initPet } from './term/pet';
import { Shell } from './shell/shell';
import { profileScreenParts } from './apps/builtins';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  // The fit addon measures the cell grid at init — wait for the real font
  // (bounded) or cols/rows get computed from fallback-font metrics.
  await Promise.race([
    Promise.all([
      document.fonts.load('15px "Maple Mono"'),
      document.fonts.load('italic 15px "Maple Mono"'),
    ]),
    new Promise((r) => setTimeout(r, 1500)),
  ]);
  const ui = createUi();
  const shell = new Shell(ui);
  const pet = initPet({ isBlankRect: (x, y, w, h) => ui.isBlankRect(x, y, w, h) });
  setCommandLinkHandler((cmd) => shell.inject(cmd));
  shell.onDone = (cmd, ok) => {
    pet.notify();
    pet.react(cmd, ok);
  };

  document.getElementById('theme-btn')?.addEventListener('click', () => ui.toggleTheme());
  document.getElementById('term-wrap')?.addEventListener('click', () => ui.term.focus());
  // Desktop: focus right away. Mobile: don't auto-raise the soft keyboard.
  if (window.matchMedia('(pointer: fine)').matches) ui.term.focus();

  // First screen: the profile prints instantly, but the rainbow name comes
  // out row by row, like a dot-matrix printer — a two-cell print head rides
  // the end of each row while the head pauses, then erases as the paper
  // advances. Small tiers pause shorter so phones don't wait forever.
  const { head, art, tail } = profileScreenParts(ui.term.cols);
  for (const line of head) ui.term.write(line + '\r\n');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    for (const row of art) ui.term.write(row + '\r\n');
  } else {
    const PRINT_HEAD = '\x1b[0m\x1b[7m  \x1b[0m'; // reset+inverse: constant theme-fg block, visible over every rainbow segment
    const STEP = 2; // cells deposited per tick
    const TICK_MS = 15; // ~4.3s for the whole name
    // For every cell count k, the string that renders cells 0..k of a row —
    // SGR codes ride along so colors reproduce correctly on each rewrite.
    const prefixesFor = (row: string): string[] => {
      const out: string[] = [];
      let acc = '';
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '\x1b') {
          let j = i + 1;
          while (j < row.length && !/[a-zA-Z]/.test(row[j])) j++;
          acc += row.slice(i, j + 1);
          i = j;
        } else {
          acc += ch;
          out.push(acc);
        }
      }
      return out;
    };
    for (let r = 0; r < art.length; r++) {
      if (r > 0) ui.term.write('\r\n'); // paper advance
      const pfx = prefixesFor(art[r]);
      for (let c = 0; c < pfx.length; c += STEP) {
        const upto = Math.min(c + STEP, pfx.length) - 1;
        const done = upto >= pfx.length - 1;
        // rewrite cells 0..upto from col 0; head rides the ink edge. The head
        // width equals STEP so the next tick overwrites it — no residue, and
        // no \x1b[2K anywhere (that would eat the printed name).
        ui.term.write('\r' + pfx[upto] + (done ? '' : PRINT_HEAD));
        await sleep(TICK_MS);
      }
      ui.term.write('\r' + art[r] + '\x1b[K'); // strip head past row end
    }
    ui.term.write('\r\n');
  }
  for (const line of tail) ui.term.write(line + '\r\n');
  await shell.run();
}

void main();
