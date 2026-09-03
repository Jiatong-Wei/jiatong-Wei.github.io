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
}

export const docByName = (name: string): Doc | undefined =>
  DOCS.find((d) => d.name === name || d.name === name.replace(/\.md$/, '') || d.path === name);

export const topDocs = (): Doc[] => DOCS.filter((d) => !d.name.includes('/'));
export const wikiDocs = (): Doc[] => DOCS.filter((d) => d.name.startsWith('wiki/'));

export interface Asset {
  file: string;
  url: string;
  kind: 'img' | 'pdf';
  cap: string;
}

export const GC_ASSETS: Asset[] = [
  { file: 'grasp.jpg', url: 'images/gc/grasp.jpg', kind: 'img', cap: 'FIG.03 · 省赛夹取实况 — 转盘供料，车在盘沿作业' },
  { file: 'prototype.jpg', url: 'images/gc/prototype.jpg', kind: 'img', cap: 'FIG.02 · 原型机 — 前伸舵机爪 + 前置相机 + 双侧料盒' },
  { file: 'venue.jpg', url: 'images/gc/venue.jpg', kind: 'img', cap: 'FIG.01 · 省赛决赛场地入口，陕西赛区竞赛' },
];

export const REPORT: Asset = {
  file: 'Isaac_Grasping_Research_Report.pdf',
  url: 'files/Isaac_Grasping_Research_Report.pdf',
  kind: 'pdf',
  cap: '技术报告 · 28 页 · 2026-08-29 封版',
};

export const OPEN_TARGETS: Record<string, { url: string; desc: string }> = {
  'gc-1': { url: 'images/gc/grasp.jpg', desc: '省赛夹取实况（图）' },
  'gc-2': { url: 'images/gc/prototype.jpg', desc: '备赛原型机（图）' },
  'gc-3': { url: 'images/gc/venue.jpg', desc: '省赛决赛场地（图）' },
  report: { url: 'files/Isaac_Grasping_Research_Report.pdf', desc: 'Isaac 抓取技术报告（PDF，28 页）' },
  splat: { url: 'https://3d.explorerglobal.cn/collection/web/5vxjmwx8', desc: '高斯泼溅作品（外链）' },
  github: { url: 'https://github.com/Jiatong-Wei', desc: 'GitHub @Jiatong-Wei（外链）' },
  email: { url: 'mailto:joyetong58@gmail.com', desc: '发邮件' },
};
