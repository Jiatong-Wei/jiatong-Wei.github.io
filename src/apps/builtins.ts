// Built-in commands: first-screen profile, filesystem views, system flavor.

import { C, R, bold, dim, italic, link, padEnd, strWidth } from '../term/ansi';
import { renderDoc } from '../term/mdansi';
import { GENERATED_AT } from '../generated/content';
import { Command, Ctx, docByName, GC_ASSETS, REPORT, topDocs, wikiDocs, OPEN_TARGETS } from './env';

const OK = `${C.green}[  OK  ]${R}`;
const WARN = `${C.yellow}[ WARN ]${R}`;

export const help: Command = {
  name: 'help',
  summary: '列出全部命令',
  run: () => {
    const rows: Array<[string, string]> = [];
    rows.push(['', '文档即命令：cat about ≡ about；试试 Tab 补全和 ↑↓ 历史']);
    rows.push(['ls / tree', '看看这里有什么']);
    rows.push(['cat <doc>', '读一篇文章（about / awards / news / links / wiki/…）']);
    rows.push(['wiki', '研究记录目录（Human / Human in the loop 标识都在）']);
    rows.push(['open <target>', `打开图片/文件/链接：${Object.keys(OPEN_TARGETS).join(' · ')}`]);
    rows.push(['wc [-l] <doc>', '数行数，支持管道 cat about | wc -l']);
    rows.push(['neofetch', '我是谁，我的机器是什么']);
    rows.push(['rostopic', 'ROS 惯急了的可以试这个']);
    rows.push(['whoami / joints / boot', '彩蛋三件套']);
    rows.push(['pet', '桌宠 robo 机器狗：会遛弯会坐下，点它汪']);
    rows.push(['theme / clear / history / echo', '老四样']);
    const w = Math.max(...rows.map(([a]) => strWidth(a)));
    return [
      `${C.accent}${bold('help')} ${C.dim}— 可用命令${R}`,
      '',
      ...rows.map(([a, b]) => (a ? `  ${padEnd(a, w)}  ${C.dim}${b}${R}` : `  ${C.dim}${b}${R}`)),
      '',
      `${C.dim}本站灵感抄自 jiangyy.github.io —— 站在 jyy 的终端里。${R}`,
      '',
    ].join('\n');
  },
};

export const ls: Command = {
  name: 'ls',
  summary: '列出文件',
  usage: 'ls [wiki|files|images/gc]',
  run: ({ argv }) => {
    const arg = argv[0] ?? '';
    if (arg === '' || arg === '.' || arg === '~') {
      const lines = topDocs().map((d) => {
        const cert = d.cert ? (d.cert === 'hitl' ? `${C.yellow}[HITL]${R}` : `${C.green}[H]${R}`) : '      ';
        return `  ${padEnd(cert, 12)}${C.cyan}${padEnd(d.name + '.md', 14)}${R}${C.dim}${d.title ?? ''}${R}`;
      });
      lines.push(
        `  ${padEnd('', 12)}${C.accent}${bold('wiki/')}${R}${' '.repeat(9)}${C.dim}${wikiDocs().length} 篇研究记录${R}`,
        `  ${padEnd('', 12)}${C.accent}${bold('files/')}${R}${' '.repeat(9)}${C.dim}${REPORT.file}${R}`,
        `  ${padEnd('', 12)}${C.accent}${bold('images/gc/')}${R}${' '.repeat(5)}${C.dim}赛场照片 ×${GC_ASSETS.length}（open gc-1）${R}`,
        '',
      );
      return lines.join('\n');
    }
    if (arg === 'wiki' || arg === 'wiki/') return wikiLs();
    if (arg === 'images' || arg === 'images/' || arg === 'images/gc' || arg === 'images/gc/') {
      return [
        `${C.dim}images/gc/${R}`,
        ...GC_ASSETS.map((a) => `  ${padEnd(a.file, 16)}${C.dim}${a.cap}${R}`),
        '',
        `${C.dim}视频素材约 1.5 GB 不入库，等 B 站归档。${R}`,
        '',
      ].join('\n');
    }
    if (arg === 'files' || arg === 'files/') {
      return [`  ${padEnd(REPORT.file, 40)}${C.dim}${REPORT.cap}${R}`, `  ${C.dim}open report 打开${R}`, ''].join('\n');
    }
    return `ls: ${arg}: No such file or directory`;
  },
};

function wikiLs(): string {
  const lines = wikiDocs().map((d) => {
    const cert = d.cert === 'hitl' ? `${C.yellow}[HITL]${R}` : d.cert === 'human' ? `${C.green}[H]${R}` : '     ';
    return `  ${padEnd(cert, 10)}${C.cyan}${padEnd(d.name.replace('wiki/', ''), 24)}${R}${C.dim}${d.summary}${R}`;
  });
  return [`${C.dim}wiki/ — Human in the loop = 用了生成式AI并由我 review；[H] = 纯手工${R}`, ...lines, ''].join('\n');
}

export const wiki: Command = {
  name: 'wiki',
  summary: '研究记录目录',
  run: () => wikiLs(),
};

export const cat: Command = {
  name: 'cat',
  summary: '读文件（支持管道）',
  usage: 'cat <doc>',
  minArgs: 1,
  run: ({ argv }) => {
    const name = argv[0].replace(/^\//, '');
    const doc = docByName(name);
    if (doc) return renderDoc(doc);
    if (GC_ASSETS.some((a) => a.file === name)) return `${C.dim}binary file — 试试 open gc-1${R}`;
    if (name === REPORT.file) return `${C.dim}binary file — 试试 open report${R}`;
    return `cat: ${argv[0]}: No such file or directory`;
  },
};

export const tree: Command = {
  name: 'tree',
  summary: '整棵文件树',
  run: () => {
    const lines = [
      `${C.accent}~${R}`,
      ...topDocs().map((d) => `├── ${C.cyan}${d.name}.md${R}`),
      `├── ${C.accent}wiki/${R}`,
      ...wikiDocs().map((d) => `│   ├── ${C.cyan}${d.name.replace('wiki/', '')}.md${R}`),
      `├── ${C.accent}files/${R} ${C.dim}${REPORT.file}${R}`,
      `└── ${C.accent}images/gc/${R} ${C.dim}${GC_ASSETS.map((a) => a.file).join(' · ')}${R}`,
      '',
    ];
    return lines.join('\n');
  },
};

export const wc: Command = {
  name: 'wc',
  summary: '数行数/词数',
  usage: 'wc [-l] [<doc>]',
  run: ({ argv, stdin }) => {
    const linesOnly = argv[0] === '-l';
    const target = linesOnly ? argv[1] : argv[0];
    let text = stdin;
    let label = '';
    if (target) {
      const doc = docByName(target.replace(/^\//, ''));
      if (!doc) return `wc: ${target}: No such file or directory`;
      text = renderDoc(doc, true);
      label = doc.name;
    } else if (!stdin) {
      return `wc: 缺输入 — 用 wc <doc> 或接在管道后面（cat about | wc -l）`;
    }
    const lines = text.split('\n').length;
    if (linesOnly) return `${lines} ${label}`;
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.replace(/\x1b\[[0-9;]*m|\x1b\]8;;[^\x07]*\x07/g, '').length;
    return `${String(lines).padStart(6)} ${String(words).padStart(6)} ${String(chars).padStart(6)} ${label || '(stdin)'}`;
  },
};

export const open: Command = {
  name: 'open',
  summary: '打开图片/文件/链接',
  usage: 'open <gc-1|gc-2|gc-3|report|splat|github|email>',
  minArgs: 1,
  run: ({ argv, api }) => {
    const t = OPEN_TARGETS[argv[0]];
    if (!t) return `open: 未知目标 ${argv[0]} — 可选：${Object.keys(OPEN_TARGETS).join(' · ')}`;
    if (t.url.endsWith('.jpg') || t.url.endsWith('.png')) api.openImage(t.url, t.desc);
    else api.openUrl(t.url);
    return `${C.accent}→${R} ${t.desc}`;
  },
};

export const clear: Command = {
  name: 'clear',
  summary: '清屏',
  run: ({ api }) => {
    api.clear();
    return '';
  },
};

export const echo: Command = {
  name: 'echo',
  summary: '回声',
  run: ({ argv }) => argv.join(' '),
};

export const history: Command = {
  name: 'history',
  summary: '命令历史',
  run: () => {
    let raw: unknown = [];
    try {
      raw = JSON.parse(localStorage.getItem('weijiatong.term.history') ?? '[]');
    } catch {
      raw = [];
    }
    const items = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
    if (!items.length) return `${C.dim}（历史还是空的）${R}`;
    return items.map((h, i) => `${C.dim}${String(i + 1).padStart(4)}${R}  ${h}`).join('\n');
  },
};

export const whoami: Command = {
  name: 'whoami',
  summary: '我是谁',
  run: () =>
    [
      `${C.accent}${bold('魏佳桐')}${R} ${C.dim}(Leo Wei)${R} — 西北工业大学 · 水声工程 · 2023–2027`,
      '',
      `${C.dim}把实车上调过的控制环，和仿真里拆过的抓取任务，接到同一条研究路上。${R}`,
      `${C.dim}manipulation · mobile robots · 能被证伪的学习与控制${R}`,
      '',
      `  mail   ${link(`${C.cyan}joyetong58@gmail.com${R}`, 'mailto:joyetong58@gmail.com')}`,
      `  github ${link(`${C.cyan}github.com/Jiatong-Wei${R}`, 'https://github.com/Jiatong-Wei')}`,
      '',
      `${C.dim}about 看细节 · neofetch 看装备 · awards 看战绩${R}`,
      '',
    ].join('\n'),
};

export const pwd: Command = {
  name: 'pwd',
  summary: '当前路径',
  run: () => '/home/wei',
};

export const date: Command = {
  name: 'date',
  summary: '当前时间',
  run: () => new Date().toString(),
};

export const uname: Command = {
  name: 'uname',
  summary: '系统信息',
  run: () => 'RoboStation 6.0 nwpu-xian franka/gnu ROS2 Humble — 在仿真里较真',
};

// --- first screen (jyy-style profile) ---

// ansi_shadow glyphs joined per-letter with explicit gaps — solid blocks, loose kerning.
const ART_FULL = [
  '     ██╗  ██╗   █████╗   ████████╗   ██████╗   ███╗   ██╗   ██████╗      ██╗    ██╗  ███████╗  ██╗',
  '     ██║  ██║  ██╔══██╗  ╚══██╔══╝  ██╔═══██╗  ████╗  ██║  ██╔════╝      ██║    ██║  ██╔════╝  ██║',
  '     ██║  ██║  ███████║     ██║     ██║   ██║  ██╔██╗ ██║  ██║  ███╗      ██║ █╗ ██║  █████╗    ██║',
  '██   ██║  ██║  ██╔══██║     ██║     ██║   ██║  ██║╚██╗██║  ██║   ██║      ██║███╗██║  ██╔══╝    ██║',
  '╚█████╔╝  ██║  ██║  ██║     ██║     ╚██████╔╝  ██║ ╚████║  ╚██████╔╝      ╚███╔███╔╝  ███████╗  ██║',
  ' ╚════╝   ╚═╝  ╚═╝  ╚═╝     ╚═╝      ╚═════╝   ╚═╝  ╚═══╝   ╚═════╝       ╚══╝╚══╝   ╚══════╝  ╚═╝',
];
const ART_STACKED = [
  '     ██╗  ██╗   █████╗   ████████╗   ██████╗   ███╗   ██╗   ██████╗',
  '     ██║  ██║  ██╔══██╗  ╚══██╔══╝  ██╔═══██╗  ████╗  ██║  ██╔════╝',
  '     ██║  ██║  ███████║     ██║     ██║   ██║  ██╔██╗ ██║  ██║  ███╗',
  '██   ██║  ██║  ██╔══██║     ██║     ██║   ██║  ██║╚██╗██║  ██║   ██║',
  '╚█████╔╝  ██║  ██║  ██║     ██║     ╚██████╔╝  ██║ ╚████║  ╚██████╔╝',
  ' ╚════╝   ╚═╝  ╚═╝  ╚═╝     ╚═╝      ╚═════╝   ╚═╝  ╚═══╝   ╚═════╝',
  '',
  '██╗    ██╗  ███████╗  ██╗',
  '██║    ██║  ██╔════╝  ██║',
  '██║ █╗ ██║  █████╗    ██║',
  '██║███╗██║  ██╔══╝    ██║',
  '╚███╔███╔╝  ███████╗  ██║',
  ' ╚══╝╚══╝   ╚══════╝  ╚═╝',
];
// phones: syllable stack — 魏(Wei) 佳(Jia) 桐(tong), 中文姓在前
const ART_SMALL = [
  '██╗    ██╗ ███████╗ ██╗',
  '██║    ██║ ██╔════╝ ██║',
  '██║ █╗ ██║ █████╗   ██║',
  '██║███╗██║ ██╔══╝   ██║',
  '╚███╔███╔╝ ███████╗ ██║',
  ' ╚══╝╚══╝  ╚══════╝ ╚═╝',
  '',
  '     ██╗ ██╗  █████╗',
  '     ██║ ██║ ██╔══██╗',
  '     ██║ ██║ ███████║',
  '██   ██║ ██║ ██╔══██║',
  '╚█████╔╝ ██║ ██║  ██║',
  ' ╚════╝  ╚═╝ ╚═╝  ╚═╝',
  '',
  '████████╗  ██████╗  ███╗   ██╗  ██████╗',
  '╚══██╔══╝ ██╔═══██╗ ████╗  ██║ ██╔════╝',
  '   ██║    ██║   ██║ ██╔██╗ ██║ ██║  ███╗',
  '   ██║    ██║   ██║ ██║╚██╗██║ ██║   ██║',
  '   ██║    ╚██████╔╝ ██║ ╚████║ ╚██████╔╝',
  '   ╚═╝     ╚═════╝  ╚═╝  ╚═══╝  ╚═════╝',
];

// lolcat-style diagonal rainbow over the name, palette-indexed so both
// themes re-color it on switch.
const RAINBOW = [C.red, C.yellow, C.green, C.cyan, C.blue, C.magenta];

function rainbowize(rows: string[]): string[] {
  const width = Math.max(...rows.map((r) => strWidth(r)));
  return rows.map((row, r) => {
    let out = '';
    let last = -1;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ' ') {
        out += ' ';
        last = -1;
        continue;
      }
      const idx = Math.floor((((c + r * 5) % width) / width) * RAINBOW.length);
      if (idx !== last) {
        out += RAINBOW[idx];
        last = idx;
      }
      out += ch;
    }
    return `${out}${R}`;
  });
}

function lastUpdate(): string {
  const d = new Date(GENERATED_AT);
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const W = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${W[d.getDay()]} ${M[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

export function profileScreen(cols: number): string[] {
  const art = cols >= 102 ? ART_FULL : cols >= 71 ? ART_STACKED : ART_SMALL;
  const lines: string[] = [''];
  lines.push(
    `${C.accent}${bold('# 魏佳桐')}${R}  ${link(`${C.blue}joyetong58@gmail.com${R}`, 'mailto:joyetong58@gmail.com')}`,
  );
  lines.push(dim('─'.repeat(Math.max(0, Math.min(cols - 4, 44)))));
  lines.push('');
  for (const row of rainbowize(art)) lines.push(row);
  lines.push('');
  lines.push(
    `${bold('Undergraduate')}${C.dim} · ${R}Underwater Acoustics Engineering`,
  );
  lines.push(
    `${link(`${C.blue}Northwestern Polytechnical University${R}`, 'https://www.nwpu.edu.cn/')}${C.dim} · ${R}西安`,
  );
  lines.push(`${bold('Robotics')}${C.dim} — ${R}manipulation · mobile robots · learning & control`);
  lines.push('');
  lines.push(`${C.dim}│${R} 🤖 ${C.accent}About${R}${C.dim} · ${R}🏅 ${C.accent}Awards${R}${C.dim} · ${R}📰 ${C.accent}News${R}`);
  lines.push(`${C.dim}│${R} 📖 ${C.accent}Wiki${R}${C.dim} · ${R}🔗 ${C.accent}Links${R}${C.dim} · ${R}🐙 ${C.accent}GitHub${R}`);
  lines.push(`${C.dim}│${R}`);
  lines.push(`${C.dim}│${R} mail   ${link(`${C.cyan}joyetong58@gmail.com${R}`, 'mailto:joyetong58@gmail.com')}`);
  lines.push(`${C.dim}│${R} github ${link(`${C.cyan}github.com/Jiatong-Wei${R}`, 'https://github.com/Jiatong-Wei')}`);
  lines.push('');
  lines.push(`${italic('把实车上调过的控制环，和仿真里拆过的抓取任务，接到同一条研究路上。')}`);
  lines.push('');
  lines.push(`${C.accent}•${R} 本页同时是一个 shell。`);
  lines.push(`  试试：${C.accent}help${R}${C.dim}、${R}${C.accent}neofetch${R}${C.dim}、${R}${C.accent}cat about | wc -l${R}${C.dim}。${R}`);
  lines.push('');
  lines.push(dim(`Last update: ${lastUpdate()}`));
  lines.push('');
  return lines;
}

export const BOOT_LINES: Array<{ kind: 'ok' | 'warn'; text: string; delay?: number }> = [
  { kind: 'ok', text: 'mcu: STM32 angle-loop @ 200Hz — 麦轮底盘听话了（wiki/gc-logistics）' },
  { kind: 'ok', text: 'sim: Isaac Sim 6.0 · Franka Panda loaded — reach 0.855 m' },
  { kind: 'ok', text: 'policy: DAgger ×4 · best approach 0.094 m' },
  { kind: 'warn', text: 'grasp success: 0/5 — 只报真数字（wiki/nine-generations）' },
  { kind: 'ok', text: 'net: joyetong58@gmail.com · github.com/Jiatong-Wei' },
  { kind: 'ok', text: 'operator: 魏佳桐 (Jiatong Wei) online — 在仿真里较真' },
];

export const boot: Command = {
  name: 'boot',
  summary: '重放机器人 bring-up 日志',
  run: () =>
    [
      dim('RoboStation bios 2026.09'),
      ...BOOT_LINES.map(({ kind, text }) => `${kind === 'ok' ? OK : WARN} ${text}`),
      '',
    ].join('\n'),
};

export const theme: Command = {
  name: 'theme',
  summary: '切换深浅色主题',
  run: ({ api }) => `theme → ${api.toggleTheme()}`,
};

export const builtins: Command[] = [
  help, ls, wiki, cat, tree, wc, open, clear, echo, history, whoami, pwd, date, uname, boot, theme,
];
