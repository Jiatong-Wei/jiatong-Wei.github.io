// Command registry + tab-completion candidate source.

import { DOCS } from '../generated/content';
import { renderDoc } from '../term/mdansi';
import { builtins } from './builtins';
import { funCommands } from './fun';
import { Command, docByName, OPEN_TARGETS, wikiDocs } from './env';

/** Every content document is also a command: `about` ≡ `cat about`. */
const contentCommands: Command[] = DOCS.map((d) => ({
  name: d.name,
  summary: d.title,
  hidden: true,
  run: () => renderDoc(d),
}));

export const registry = new Map<string, Command>();
for (const c of [...builtins, ...funCommands, ...contentCommands]) registry.set(c.name, c);
// a few honest aliases
registry.set('more', registry.get('cat')!);

export function completionCandidates(line: string): string[] {
  const hasSpace = /\s/.test(line.replace(/^\s+/, ''));
  if (!hasSpace) {
    const frag = line.trim();
    return [...registry.keys()]
      .filter((k) => !registry.get(k)!.hidden)
      .filter((k) => k.startsWith(frag))
      .sort();
  }
  // completing an argument: docs (with/without slash form), open targets, wiki entries
  const fragMatch = /(^|\s)([^\s]*)$/.exec(line);
  const frag = (fragMatch?.[2] ?? '').replace(/^\//, '');
  const pool = [
    ...DOCS.map((d) => d.name),
    ...DOCS.map((d) => `${d.name}.md`),
    ...Object.keys(OPEN_TARGETS),
    'wiki gc-1 gc-2 gc-3 files images/gc',
  ]
    .flatMap((s) => s.split(' '))
    .filter((s) => s.startsWith(frag));
  return [...new Set(pool)].sort();
}
