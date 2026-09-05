// Terminal surface: xterm creation, dark/light themes, command-link provider,
// overlay lightbox. Palette-index SGR codes in the output stream get re-colored
// here by swapping the theme.

import { Terminal } from '@xterm/xterm';
import type { IBufferLine, ILink } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const FONT_STACK =
  '"Maple Mono", "Cascadia Mono", "JetBrains Mono", Menlo, Consolas, "Sarasa Mono SC", ' +
  '"Noto Sans Mono CJK SC", "Source Han Mono SC", "Microsoft YaHei Mono", monospace';

// Green phosphor on near-black — the classic terminal.
// red/yellow/cyan/blue/magenta double as the rainbow bands for the ASCII name.
const DARK = {
  background: '#0a0d0b',
  foreground: '#c9d6c9',
  cursor: '#3fd968',
  cursorAccent: '#0a0d0b',
  selectionBackground: '#1d3a26',
  black: '#0a0d0b',
  red: '#ff6b6b',
  green: '#3ccf6d',
  yellow: '#ffd166',
  blue: '#6aa6ff',
  magenta: '#c792ea',
  cyan: '#4dd0e1',
  white: '#c9d6c9',
  brightBlack: '#5c6b5c',
  brightRed: '#ff6b5e',
  brightGreen: '#57e389',
  brightYellow: '#f0e06e',
  brightBlue: '#7db8e8',
  brightMagenta: '#cf9ae0',
  brightCyan: '#6adddd',
  brightWhite: '#e8f2e8',
};

// Paper white with dark ink — the printed-terminal look.
const LIGHT = {
  background: '#f7f6f2',
  foreground: '#20241f',
  cursor: '#0b7d2e',
  cursorAccent: '#f7f6f2',
  selectionBackground: '#cfe8d4',
  black: '#20241f',
  red: '#b3261e',
  green: '#0a8f33',
  yellow: '#9a6d00',
  blue: '#2456d0',
  magenta: '#8a2ba0',
  cyan: '#00838f',
  white: '#20241f',
  brightBlack: '#6b706b',
  brightRed: '#c93a30',
  brightGreen: '#0a8f33',
  brightYellow: '#967800',
  brightBlue: '#2f62e0',
  brightMagenta: '#9a3bb0',
  brightCyan: '#0a8a8a',
  brightWhite: '#3a3f3a',
};

const THEME_KEY = 'weijiatong.term.theme';
export type ThemeName = 'dark' | 'light';

function initialTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* private mode */
  }
  return 'dark';
}

export interface Ui {
  term: Terminal;
  fit: FitAddon;
  themeName(): ThemeName;
  toggleTheme(): ThemeName;
  clear(): void;
  openImage(url: string, caption: string): void;
  openUrl(url: string): void;
  /** PDF in the overlay lightbox (desktop); falls back to a new tab on touch. */
  openPdf(url: string, caption: string): void;
  note(text: string): void;
  /** True when the screen rectangle (viewport px) covers no terminal text. */
  isBlankRect(x: number, y: number, w: number, h: number): boolean;
}

// --- clickable command words in terminal output (jyy-style inject-on-click) ---

let commandHandler: ((cmd: string) => void) | null = null;

export function setCommandLinkHandler(fn: (cmd: string) => void): void {
  commandHandler = fn;
}

const CMD_MAP: Record<string, string> = {
  about: 'cat about',
  awards: 'cat awards',
  news: 'cat news',
  links: 'cat links',
  help: 'help',
  neofetch: 'neofetch',
  whoami: 'whoami',
  joints: 'joints',
  boot: 'boot',
  tree: 'tree',
  github: 'open github',
  splat: 'open splat',
  umi: 'umi',
};

const CMD_RE = /\b(?:about|awards|news|links|help|neofetch|whoami|joints|boot|tree|github|splat|umi)\b|wiki\/[a-z0-9-]+/gi;

function registerCommandLinks(term: Terminal): void {
  const workingCell = term.buffer.active.getNullCell();
  /**
   * Map a UTF-16 string offset to a buffer cell x. m.index is a string offset,
   * but ILink ranges are in cells — CJK chars are 1 unit / 2 cells, emoji 2 / 2,
   * so the two only coincide on pure-ASCII prefixes. Walk the actual buffer.
   */
  const cellOfStringIndex = (line: IBufferLine, target: number): number => {
    let x = 0;
    let units = 0;
    for (let guard = 0; guard < 2000 && units < target; guard++) {
      line.getCell(x, workingCell);
      const width = workingCell.getWidth();
      if (width === 0) {
        x += 1; // wide-char continuation cell — never a token start
        continue;
      }
      units += Math.max(1, workingCell.getChars().length);
      x += width;
    }
    return x;
  };
  term.registerLinkProvider({
    provideLinks(lineNumber, callback) {
      const line = term.buffer.active.getLine(lineNumber);
      if (!line) {
        callback([]);
        return;
      }
      const text = line.translateToString(true);
      const links: ILink[] = [];
      for (const m of text.matchAll(CMD_RE)) {
        const token = m[0];
        const lower = token.toLowerCase();
        const cmd = CMD_MAP[lower] ?? (lower.startsWith('wiki/') ? `cat ${lower}` : null);
        if (!cmd) continue;
        const cellX = cellOfStringIndex(line, m.index);
        links.push({
          range: {
            start: { x: cellX, y: lineNumber },
            end: { x: cellX + token.length, y: lineNumber }, // tokens are pure ASCII
          },
          text: token,
          activate: () => commandHandler?.(cmd),
        });
      }
      callback(links);
    },
  });
}

// --- overlay lightbox ---

function initOverlay(): Pick<Ui, 'openImage' | 'openUrl' | 'openPdf' | 'note'> {
  const overlay = document.getElementById('overlay')!;
  const overlayImg = document.getElementById('overlay-img') as HTMLImageElement;
  const overlayCap = document.getElementById('overlay-cap')!;
  const overlayPdf = document.getElementById('overlay-pdf') as HTMLIFrameElement;
  const hideOverlay = () => {
    overlay.classList.remove('show');
    overlayImg.src = '';
    overlayCap.textContent = '';
    overlayImg.style.display = '';
    overlayPdf.style.display = 'none';
    overlayPdf.src = '';
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
    openImage: (url, caption) => {
      overlayImg.style.display = '';
      overlayImg.src = url;
      overlayCap.textContent = caption;
      overlay.classList.add('show');
    },
    openUrl: (url) => window.open(url, '_blank', 'noopener'),
    // PDFs render inline on desktop; iOS/Android webviews can't, so those
    // still pop a new tab
    openPdf: (url, caption) => {
      const touch = window.matchMedia('(pointer: coarse)').matches;
      if (touch) {
        window.open(url, '_blank', 'noopener');
        return;
      }
      overlayImg.style.display = 'none';
      overlayPdf.style.display = '';
      overlayPdf.src = url;
      overlayCap.textContent = caption;
      overlay.classList.add('show');
    },
    note: (text) => {
      overlayImg.style.display = 'none';
      overlayCap.textContent = text;
      overlay.classList.add('show');
    },
  };
}

// --- terminal + theme ---

export function createUi(): Ui {
  const isSmall = window.matchMedia('(max-width: 480px)').matches;
  const term = new Terminal({
    convertEol: true,
    cursorBlink: true,
    fontSize: isSmall ? 13 : 15,
    lineHeight: 1.3,
    fontFamily: FONT_STACK,
    theme: initialTheme() === 'light' ? LIGHT : DARK,
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
  registerCommandLinks(term);

  const applyTheme = (name: ThemeName): void => {
    term.options.theme = name === 'light' ? LIGHT : DARK;
    document.documentElement.dataset.theme = name;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', name === 'light' ? '#f7f6f2' : '#0a0d0b');
    try {
      localStorage.setItem(THEME_KEY, name);
    } catch {
      /* non-persistent is fine */
    }
  };
  applyTheme(initialTheme());

  const overlay = initOverlay();

  // Map a viewport-pixel rectangle onto terminal cells and scan the buffer:
  // blank means the pet can sit there without covering any text.
  const isBlankRect = (x: number, y: number, w: number, h: number): boolean => {
    const el = term.element;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const cellW = rect.width / term.cols;
    const cellH = rect.height / term.rows;
    const c0 = Math.floor((x - rect.left) / cellW);
    const c1 = Math.ceil((x + w - rect.left) / cellW) - 1;
    const r0 = Math.floor((y - rect.top) / cellH);
    const r1 = Math.ceil((y + h - rect.top) / cellH) - 1;
    if (c1 < 0 || r1 < 0 || c0 >= term.cols) return true; // outside the terminal entirely
    const buf = term.buffer.active;
    for (let row = Math.max(r0, 0); row <= Math.min(r1, term.rows - 1); row++) {
      const line = buf.getLine(buf.viewportY + row);
      const text = line?.translateToString(true) ?? '';
      for (let c = Math.max(c0, 0); c <= Math.min(c1, term.cols - 1); c++) {
        if (text[c] && text[c] !== ' ') return false;
      }
    }
    return true;
  };

  return {
    term,
    fit,
    themeName: () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'),
    toggleTheme: () => {
      const next: ThemeName = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return next;
    },
    clear: () => {
      term.clear();
      term.write('\x1b[2J\x1b[H');
    },
    ...overlay,
    isBlankRect,
  };
}
