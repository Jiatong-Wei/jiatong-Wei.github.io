// Shell line parser: quote-aware tokenizer, top-level pipe splitting.

/**
 * Parse a command line into a pipeline of argv arrays.
 * Returns null for a blank line. Quotes group text; no backslash escapes (keep it honest).
 */
export function parseLine(line: string): string[][] | null {
  const segs: string[] = [];
  let cur = '';
  let quote: string | null = null;

  for (const ch of line) {
    if (quote) {
      if (ch === quote) {
        quote = null;
        cur += ch; // keep the closing quote so tokenizeArgs sees balanced input
      } else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === '|') {
      segs.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  segs.push(cur);

  const argvs: string[][] = [];
  for (const seg of segs) {
    const argv = tokenizeArgs(seg);
    if (argv.length) argvs.push(argv);
  }
  // `a |` (trailing empty segment after a non-empty one) or `| b` — tolerate.
  if (!argvs.length) return null;
  return argvs;
}

function tokenizeArgs(seg: string): string[] {
  const argv: string[] = [];
  let arg = '';
  let quote: string | null = null;
  let started = false;
  for (const ch of seg) {
    if (quote) {
      if (ch === quote) quote = null;
      else arg += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
      continue;
    }
    if (ch === ' ' || ch === '\t') {
      if (arg || started) argv.push(arg);
      arg = '';
      started = false;
      continue;
    }
    arg += ch;
    started = true;
  }
  if (arg || started) argv.push(arg);
  return argv;
}
