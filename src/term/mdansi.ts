// Markdown -> terminal renderer. Walks marked tokens, emits ANSI-styled text
// (plain mode for use inside pipes). Content docs live in content/*.md.

import { C, R, bold, dim, link, strWidth } from './ansi';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Tok = any;

export interface RenderableDoc {
  title: string;
  date: string;
  cert: 'human' | 'hitl' | null;
  tokens: Tok[];
}

export function renderInline(tokens: Tok[] | undefined, plain = false): string {
  if (!tokens) return '';
  let out = '';
  for (const t of tokens) out += inlineTok(t, plain);
  return out;
}

function inlineTok(t: Tok, plain: boolean): string {
  switch (t.type) {
    case 'text':
      return t.tokens ? renderInline(t.tokens, plain) : (t.text ?? '');
    case 'escape':
      return t.text ?? '';
    case 'strong': {
      const s = renderInline(t.tokens, plain);
      return plain ? s : `\x1b[1m${s}\x1b[22m`;
    }
    case 'em': {
      const s = renderInline(t.tokens, plain);
      return plain ? s : `\x1b[3m${s}\x1b[23m`;
    }
    case 'del': {
      const s = renderInline(t.tokens, plain);
      return plain ? s : `\x1b[9m${s}\x1b[29m`;
    }
    case 'codespan': {
      const s = t.text ?? '';
      // no background block: theme-mapped accent + bold carries the highlight;
      // a colored box that works on dark inevitably fails on light (and vice versa)
      return plain ? s : `${C.accent}${bold(s)}${R}`;
    }
    case 'link': {
      const inner = renderInline(t.tokens, plain) || t.text || t.href;
      if (plain) return `${inner} <${t.href}>`;
      return link(`${C.cyan}${inner}${R}`, t.href);
    }
    case 'image': {
      const alt = t.text || t.alt || '图片';
      return plain ? `[图: ${alt}] ${t.href}` : `${C.dim}[图]${R} ${alt}`;
    }
    case 'br':
      return '\n';
    case 'html':
      return '';
    default:
      return t.text ?? '';
  }
}

function renderTable(t: Tok, plain: boolean): string[] {
  const widths: number[] = [];
  const cells = (row: Tok) => row.tokens?.map((c: Tok) => c.tokens ? renderInline(c.tokens, plain) : (c.text ?? '')) ?? [];
  const raw: string[][] = [cells(t.header), ...t.rows.map(cells)];
  for (const row of raw) row.forEach((cell, i) => { widths[i] = Math.max(widths[i] ?? 0, strWidth(cell)); });
  const sepWidth = Math.max(0, widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * 2);
  const fmt = (row: string[]) => row.map((c, i) => c + ' '.repeat(Math.max(0, (widths[i] ?? 0) - strWidth(c)))).join('  ');
  const lines: string[] = [];
  lines.push(plain ? fmt(raw[0]) : `${C.accent}${bold(fmt(raw[0]))}${R}`);
  lines.push(dim('─'.repeat(sepWidth)));
  for (const row of raw.slice(1)) lines.push(fmt(row));
  return lines;
}

function blockLines(t: Tok, plain: boolean): string[] {
  switch (t.type) {
    case 'space':
      return [''];
    case 'heading': {
      const text = renderInline(t.tokens, plain);
      const hashes = '#'.repeat(t.depth);
      if (t.depth === 1) return ['', plain ? `${hashes} ${text}` : `${C.accent}${bold(`${hashes} ${text}`)}${R}`, ''];
      if (t.depth === 2) return ['', plain ? `${hashes} ${text}` : `${bold(`${hashes} ${text}`)}${R}`, ''];
      return ['', plain ? `${hashes} ${text}` : `${C.dim}${hashes}${R} ${bold(text)}`, ''];
    }
    case 'paragraph':
      return [renderInline(t.tokens, plain), ''];
    case 'code': {
      const body = String(t.text ?? '').replace(/\n$/, '').split('\n');
      // fenced blocks keep a subtle background but use theme text color
      return ['', ...body.map((l) => (plain ? l : `${C.codeBg}${C.fgText} ${l}${R}`)), ''];
    }
    case 'blockquote': {
      const inner: string[] = [];
      for (const b of t.tokens ?? []) inner.push(...blockLines(b, plain));
      return inner.map((l) => (l === '' ? '' : `${dim('│ ')}${l}`));
    }
    case 'hr':
      return [dim('─'.repeat(34)), ''];
    case 'table':
      return [...renderTable(t, plain), ''];
    case 'list':
      return renderList(t, '', plain);
    case 'html':
      return [''];
    default:
      return [renderInline(t.tokens ?? [], plain)];
  }
}

function renderList(t: Tok, indent: string, plain: boolean): string[] {
  const lines: string[] = [''];
  (t.items ?? []).forEach((it: Tok, i: number) => {
    const marker = t.ordered ? `${String(i + 1).padStart(2, ' ')}. ` : '▸ ';
    const head = indent + marker;
    const hang = ' '.repeat(strWidth(marker));
    const subs: Tok[] = it.tokens ?? [];
    let first = true;
    for (const b of subs) {
      if (b.type === 'text' || b.type === 'paragraph') {
        const txt = renderInline(b.tokens ?? [b], plain);
        const parts = txt.split('\n');
        lines.push((first ? head : indent + hang) + parts[0]);
        for (const p of parts.slice(1)) lines.push(indent + hang + p);
      } else if (b.type === 'list') {
        lines.push(...renderList(b, indent + '  ', plain).slice(1));
      } else {
        lines.push(...blockLines(b, plain));
      }
      first = false;
    }
  });
  lines.push('');
  return lines;
}

function collapse(lines: string[]): string {
  const out: string[] = [];
  for (const l of lines) {
    if (l === '' && out[out.length - 1] === '') continue;
    out.push(l);
  }
  while (out[0] === '') out.shift();
  while (out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

function certLine(doc: RenderableDoc, plain: boolean): string | null {
  if (doc.cert === 'hitl') {
    return plain
      ? '[cert] Human in the loop — 本文使用了生成式AI工具，并由作者 review'
      : `${C.yellow}◈${R} ${C.yellow}${bold('Human in the loop')}${R}${C.dim} — 本文使用了生成式AI工具，并由作者 review${R}`;
  }
  if (doc.cert === 'human') {
    return plain
      ? '[cert] Human — 本文未使用生成式AI工具'
      : `${C.green}◈${R} ${C.green}${bold('Human')}${R}${C.dim} — 本文未使用生成式AI工具${R}`;
  }
  return null;
}

/** Full document render: optional cert line, then the markdown body. */
export function renderDoc(doc: RenderableDoc, plain = false): string {
  const parts: string[] = [];
  const cert = certLine(doc, plain);
  if (cert) parts.push(cert, '');
  if (doc.date) parts.push(plain ? doc.date : dim(doc.date), '');
  parts.push(collapse(doc.tokens.flatMap((t: Tok) => blockLines(t, plain))));
  return parts.join('\n');
}
