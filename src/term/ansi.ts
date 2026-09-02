// ANSI / SGR helpers. Palette-index colors (not truecolor) so switching the
// xterm theme re-colors every emitted line at once.

export const C = {
  accent: '\x1b[92m', // bright green — prompt / headers / badges
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[90m',
  codeBg: '\x1b[100m', // bright black background for code spans/blocks
};

export const R = '\x1b[0m';

export const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;
export const italic = (s: string) => `\x1b[3m${s}\x1b[23m`;
export const underline = (s: string) => `\x1b[4m${s}\x1b[24m`;
export const dim = (s: string) => `${C.dim}${s}${R}`;

/** OSC 8 clickable hyperlink (works in xterm.js). Control chars in URLs are stripped
 * so markdown-provided hrefs can never inject terminal escape sequences. */
export const link = (text: string, url: string) => {
  const safe = url.replace(/[\x00-\x1f\x7f]/g, '');
  return `\x1b]8;;${safe}\x07${text}\x1b]8;;\x07`;
};

const ANSI_RE = /\x1b\[[0-9;]*m|\x1b\]8;;[^\x07]*\x07/g;

function codePointWidth(cp: number): 1 | 2 {
  if (
    (cp >= 0x1100 && cp <= 0x115f) ||
    cp === 0x2329 ||
    cp === 0x232a ||
    (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  ) {
    return 2;
  }
  return 1;
}

/** Display width of a string, ignoring ANSI escapes, CJK-aware. */
export function strWidth(s: string): number {
  const clean = s.replace(ANSI_RE, '');
  let w = 0;
  for (const ch of clean) w += codePointWidth(ch.codePointAt(0) ?? 0);
  return w;
}

/** Left-pad to a display width. */
export function padEnd(s: string, n: number): string {
  const w = strWidth(s);
  return w >= n ? s : s + ' '.repeat(n - w);
}
