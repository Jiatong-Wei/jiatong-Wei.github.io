// ~wei@nwpu — boot sequence + wiring.

import { createUi, initButtons } from './term/ui';
import { Shell } from './shell/shell';
import { bootLog } from './apps/builtins';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const ui = createUi();
  const shell = new Shell(ui);
  initButtons((line) => shell.inject(line));

  document.getElementById('term-wrap')?.addEventListener('click', () => ui.term.focus());
  // Desktop: focus right away. Mobile: don't auto-raise the soft keyboard.
  if (window.matchMedia('(pointer: fine)').matches) ui.term.focus();

  for (const line of bootLog()) {
    ui.term.write(line + '\r\n');
    await sleep(70);
  }
  await shell.run();
}

void main();
