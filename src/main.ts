// ~wei@nwpu — first screen + wiring.

import { createUi, setCommandLinkHandler } from './term/ui';
import { Shell } from './shell/shell';
import { profileScreen } from './apps/builtins';

async function main(): Promise<void> {
  const ui = createUi();
  const shell = new Shell(ui);
  setCommandLinkHandler((cmd) => shell.inject(cmd));

  document.getElementById('theme-btn')?.addEventListener('click', () => ui.toggleTheme());
  document.getElementById('term-wrap')?.addEventListener('click', () => ui.term.focus());
  // Desktop: focus right away. Mobile: don't auto-raise the soft keyboard.
  if (window.matchMedia('(pointer: fine)').matches) ui.term.focus();

  for (const line of profileScreen(ui.term.cols)) ui.term.write(line + '\r\n');
  await shell.run();
}

void main();
