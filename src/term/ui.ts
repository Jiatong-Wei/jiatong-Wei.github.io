// Terminal surface: xterm creation/theme, overlay lightbox, quick-command buttons.

import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const FONT_STACK =
  '"Cascadia Mono", "JetBrains Mono", Menlo, Consolas, "Sarasa Mono SC", ' +
  '"Noto Sans Mono CJK SC", "Source Han Mono SC", "Microsoft YaHei Mono", monospace';

export const THEME = {
  background: '#100c0a',
  foreground: '#e6dcc8',
  cursor: '#d64538',
  cursorAccent: '#100c0a',
  selectionBackground: '#5a211c',
  black: '#100c0a',
  red: '#e0524a',
  green: '#8aa872',
  yellow: '#d9a441',
  blue: '#7a9cc4',
  magenta: '#b07aa8',
  cyan: '#6aa8a8',
  white: '#e6dcc8',
  brightBlack: '#7a6f5d',
  brightRed: '#ff6b5e',
  brightGreen: '#a3c585',
  brightYellow: '#f0bd5e',
  brightBlue: '#93b4dc',
  brightMagenta: '#cf97c5',
  brightCyan: '#83c4c4',
  brightWhite: '#f5eee0',
};

export interface Ui {
  term: Terminal;
  fit: FitAddon;
  clear(): void;
  openImage(url: string, caption: string): void;
  openUrl(url: string): void;
  note(text: string): void;
}

export function createUi(): Ui {
  const isSmall = window.matchMedia('(max-width: 480px)').matches;
  const term = new Terminal({
    convertEol: true,
    cursorBlink: true,
    fontSize: isSmall ? 13 : 15,
    lineHeight: 1.25,
    fontFamily: FONT_STACK,
    theme: THEME,
    scrollback: 5000,
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById('term')!);
  fit.fit();
  const ro = new ResizeObserver(() => {
    try {
      fit.fit();
    } catch {
      /* transient layout states can throw during fit */
    }
  });
  ro.observe(document.getElementById('term')!);

  // --- overlay lightbox ---
  const overlay = document.getElementById('overlay')!;
  const overlayImg = document.getElementById('overlay-img') as HTMLImageElement;
  const overlayCap = document.getElementById('overlay-cap')!;
  const hideOverlay = () => {
    overlay.classList.remove('show');
    overlayImg.src = '';
    overlayCap.textContent = '';
    overlayImg.style.display = '';
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideOverlay();
  });
  (overlay.querySelector('.close') as HTMLButtonElement).addEventListener('click', hideOverlay);
  // Capture phase: xterm swallows Escape in the bubble phase.
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('show')) hideOverlay();
    },
    true,
  );

  return {
    term,
    fit,
    clear: () => {
      term.clear();
      term.write('\x1b[2J\x1b[H');
    },
    openImage: (url, caption) => {
      overlayImg.style.display = '';
      overlayImg.src = url;
      overlayCap.textContent = caption;
      overlay.classList.add('show');
    },
    openUrl: (url) => window.open(url, '_blank', 'noopener'),
    note: (text) => {
      overlayImg.style.display = 'none';
      overlayCap.textContent = text;
      overlay.classList.add('show');
    },
  };
}

// --- quick-command buttons ---

const BUTTONS: Array<[string, string]> = [
  ['whoami', 'whoami'],
  ['about', 'cat about'],
  ['awards', 'cat awards'],
  ['news', 'cat news'],
  ['wiki', 'wiki'],
  ['links', 'cat links'],
  ['neofetch', 'neofetch'],
];

export function initButtons(inject: (line: string) => void): void {
  const bar = document.getElementById('btnbar')!;
  for (const [label, cmd] of BUTTONS) {
    const b = document.createElement('button');
    b.textContent = label;
    b.type = 'button';
    b.addEventListener('click', () => inject(cmd));
    bar.appendChild(b);
  }
}
