// Shared app types + the persona filesystem (docs, assets, curated open targets).

import { DOCS } from '../generated/content';
import type { Ui } from '../term/ui';
import type { RenderableDoc } from '../term/mdansi';

export interface Ctx {
  argv: string[];
  stdin: string;
  api: Ui;
  /** True when this command received another command's output via a pipe. */
  piped?: boolean;
}

export interface Command {
  name: string;
  summary: string;
  usage?: string;
  minArgs?: number;
  /** Hide from `help` table (docs are discovered via ls/wiki instead). */
  hidden?: boolean;
  run(ctx: Ctx): string | Promise<string>;
}

export type Doc = DocMetaLike & RenderableDoc;
interface DocMetaLike {
  path: string;
  name: string;
  title: string;
  summary: string;
  date: string;
  cert: 'human' | 'hitl' | null;
  hidden: boolean;
}

export const docByName = (name: string): Doc | undefined =>
  DOCS.find((d) => d.name === name || d.name === name.replace(/\.md$/, '') || d.path === name);

export const topDocs = (): Doc[] => DOCS.filter((d) => !d.name.includes('/'));
export const wikiDocs = (): Doc[] => DOCS.filter((d) => d.name.startsWith('wiki/') && !d.hidden);
