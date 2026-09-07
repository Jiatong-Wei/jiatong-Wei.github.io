// Built-in commands: first-screen profile, filesystem views, system flavor.

import { C, R, bold, dim, italic, link, padEnd, strWidth } from '../term/ansi';
import { renderDoc } from '../term/mdansi';
import { GENERATED_AT } from '../generated/content';
import { Command, Ctx, docByName, topDocs, wikiDocs } from './env';

const OK = `${C.green}[  OK  ]${R}`;
const WARN = `${C.yellow}[ WARN ]${R}`;

export const help: Command = {
  name: 'help',
  summary: '列出全部命令',
  run: () => {
    const rows: Array<[string, string]> = [];
    rows.push(['', '文档即命令：cat about ≡ about；试试 Tab 补全和 ↑↓ 历史']);
    rows.push(['ls / tree', '快来看看我的个人站里都有什么']);
    rows.push(['cat <doc>', '读一读我的手作文章（about / awards / news / links / wiki/…）']);
    rows.push(['wiki', '研究札记']);
    rows.push(['wc [-l] <doc>', '数行数，支持管道 cat about | wc -l']);
    rows.push(['grep <词> [<doc>]', '找关键词，命中高亮，支持管道']);
    rows.push(['neofetch', '我是谁']);
    rows.push(['rostopic', 'ROS 惯急了的可以试这个']);
    rows.push(['whoami / joints / boot', '彩蛋三件套']);
    rows.push(['pet', '优米（UMI）：爱遛弯并且喜欢被摸狗头']);
    rows.push(['fetch / walk umi', '优米会叼走方块 / 撒欢（再敲一次 walk umi 召回）']);
    rows.push(['theme / clear / history / echo', '老四样']);
    const w = Math.max(...rows.map(([a]) => strWidth(a)));
    return [
      `${C.accent}${bold('help')} ${C.dim}— 可用命令${R}`,
      '',
      ...rows.map(([a, b]) => (a ? `  ${padEnd(a, w)}  ${C.dim}${b}${R}` : `  ${C.dim}${b}${R}`)),
      '',
      `${C.dim}本站借鉴了 jiangyy.github.io —— 感谢我那素未谋面的绿导师。${R}`,
      '',
    ].join('\n');
  },
};

export const ls: Command = {
  name: 'ls',
  summary: '列出文件',
  usage: 'ls [wiki]',
  run: ({ argv }) => {
    const arg = argv[0] ?? '';
    if (arg === '' || arg === '.' || arg === '~') {
      const lines = topDocs().map((d) => {
        const cert = d.cert ? (d.cert === 'hitl' ? `${C.yellow}[HITL]${R}` : `${C.green}[H]${R}`) : '      ';
        return `  ${padEnd(cert, 12)}${C.cyan}${padEnd(d.name + '.md', 14)}${R}${C.dim}${d.title ?? ''}${R}`;
      });
      lines.push(
        `  ${padEnd('', 12)}${C.accent}${bold('wiki/')}${R}${' '.repeat(9)}${C.dim}${wikiDocs().length} 篇研究记录（照片与 PDF 在 wiki 站）${R}`,
        '',
      );
      return lines.join('\n');
    }
    if (arg === 'wiki' || arg === 'wiki/') return wikiLs();
    return `ls: ${arg}: No such file or directory`;
  },
};

function wikiLs(): string {
  const lines = wikiDocs().map((d) => {
    const cert = d.cert === 'hitl' ? `${C.yellow}[HITL]${R}` : d.cert === 'human' ? `${C.green}[H]${R}` : '     ';
    return `  ${padEnd(cert, 10)}${C.cyan}${padEnd(d.name.replace('wiki/', ''), 24)}${R}${C.dim}${d.summary}${R}`;
  });
  return [`${C.dim}wiki/ — Human in the loop = 使用GenAI+人工review；[H] = 匠心手作${R}`, ...lines, `${C.dim}全文带图表版：${R}${link(`${C.cyan}jiatong-wei.github.io/wiki${R}`, 'https://jiatong-wei.github.io/wiki/')}${R}`, ''].join('\n');
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
    if (/\.(jpe?g|png|pdf)$/i.test(name)) return `${C.dim}binary file — 图片和 PDF 全文都在 wiki 站${R}`;
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
      `└── ${C.accent}wiki/${R}`,
      ...wikiDocs().map((d) => `    ├── ${C.cyan}${d.name.replace('wiki/', '')}.md${R}`),
      '',
    ];
    return lines.join('\n');
  },
};

export const wc: Command = {
  name: 'wc',
  summary: '数行数/词数',
  usage: 'wc [-l] [<doc>]',
  run: ({ argv, stdin, piped }) => {
    const linesOnly = argv[0] === '-l';
    const target = linesOnly ? argv[1] : argv[0];
    let text = stdin;
    let label = '';
    if (target) {
      const doc = docByName(target.replace(/^\//, ''));
      if (!doc) return `wc: ${target}: No such file or directory`;
      text = renderDoc(doc, true);
      label = doc.name;
    } else if (!stdin && !piped) {
      return `wc: 缺输入 — 用 wc <doc> 或接在管道后面（cat about | wc -l）`;
    }
    const lines = text ? text.split('\n').length : 0;
    if (linesOnly) return `${lines} ${label}`;
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.replace(/\x1b\[[0-9;]*m|\x1b\]8;;[^\x07]*\x07/g, '').length;
    return `${String(lines).padStart(6)} ${String(words).padStart(6)} ${String(chars).padStart(6)} ${label || '(stdin)'}`;
  },
};

export const grep: Command = {
  name: 'grep',
  summary: '在文档/管道输出里找关键词',
  usage: 'grep <关键词> [<doc>]（支持 cat about | grep robotics）',
  minArgs: 1,
  run: ({ argv, stdin, piped }) => {
    const pattern = argv[0].toLowerCase();
    const target = argv[1];
    let text = stdin;
    if (target) {
      const doc = docByName(target.replace(/^\//, ''));
      if (!doc) return `grep: ${target}: No such file or directory`;
      text = renderDoc(doc);
    } else if (!stdin && !piped) {
      return `grep: 缺输入 — 用 grep <词> <doc>，或接在管道后面（cat about | grep robotics）`;
    }
    const hits: string[] = [];
    for (const line of text.split('\n')) {
      const plain = line.replace(/\x1b\[[0-9;]*m|\x1b\]8;;[^\x07]*\x07/g, '');
      const idx = plain.toLowerCase().indexOf(pattern);
      if (idx < 0) continue;
      // highlight the hit inside the plain line, keep it simple
      hits.push(
        plain.slice(0, idx) + `${C.accent}${bold(plain.slice(idx, idx + pattern.length))}${R}` + plain.slice(idx + pattern.length),
      );
    }
    if (!hits.length) return `${C.dim}（没有匹配行）${R}`;
    return hits.join('\n');
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
      `${C.accent}${bold('魏佳桐')}${R} ${C.dim}(joye)${R} — 西北工业大学 · 水声工程 · 2023–2027`,
      '',
      `${C.dim}toward more capable, safer, and more inclusive Physical AI${R}`,
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
  run: () => 'RoboStation 1.0 nwpu franka/gnu ROS2 Humble',
};

// --- first screen (jyy-style profile) ---

// ansi_shadow glyphs joined per-letter (gap 2/1), programmatically padded so every
// row of a block is the same width. W is hand-drawn per user spec: 5 block rows —
// rows 1-2 outer strokes flush at col 0; row 3 three blocks, middle narrower and
// equidistant from both (11-col W puts the single middle block dead center); row 4
// solid; row 5 solid but 2 narrower, centered on row 4; thin shadow base row.
const ART_FULL = [
  '     ██╗  ██╗   █████╗   ████████╗   ██████╗   ███╗   ██╗   ██████╗   ██       ██  ███████╗  ██╗',
  '     ██║  ██║  ██╔══██╗  ╚══██╔══╝  ██╔═══██╗  ████╗  ██║  ██╔════╝   ██       ██  ██╔════╝  ██║',
  '     ██║  ██║  ███████║     ██║     ██║   ██║  ██╔██╗ ██║  ██║  ███╗  ██   █   ██  █████╗    ██║',
  '██   ██║  ██║  ██╔══██║     ██║     ██║   ██║  ██║╚██╗██║  ██║   ██║  ███████████  ██╔══╝    ██║',
  '╚█████╔╝  ██║  ██║  ██║     ██║     ╚██████╔╝  ██║ ╚████║  ╚██████╔╝   █████████   ███████╗  ██║',
  ' ╚════╝   ╚═╝  ╚═╝  ╚═╝     ╚═╝      ╚═════╝   ╚═╝  ╚═══╝   ╚═════╝   ╚═════════╝  ╚══════╝  ╚═╝',
];
const ART_STACKED = [
  '     ██╗  ██╗   █████╗   ████████╗   ██████╗   ███╗   ██╗   ██████╗ ',
  '     ██║  ██║  ██╔══██╗  ╚══██╔══╝  ██╔═══██╗  ████╗  ██║  ██╔════╝ ',
  '     ██║  ██║  ███████║     ██║     ██║   ██║  ██╔██╗ ██║  ██║  ███╗',
  '██   ██║  ██║  ██╔══██║     ██║     ██║   ██║  ██║╚██╗██║  ██║   ██║',
  '╚█████╔╝  ██║  ██║  ██║     ██║     ╚██████╔╝  ██║ ╚████║  ╚██████╔╝',
  ' ╚════╝   ╚═╝  ╚═╝  ╚═╝     ╚═╝      ╚═════╝   ╚═╝  ╚═══╝   ╚═════╝ ',
  '',
  '██       ██  ███████╗  ██╗',
  '██       ██  ██╔════╝  ██║',
  '██   █   ██  █████╗    ██║',
  '███████████  ██╔══╝    ██║',
  ' █████████   ███████╗  ██║',
  '╚═════════╝  ╚══════╝  ╚═╝',
];
// phones: syllable stack — 魏(Wei) 佳(Jia) 桐(tong), 中文姓在前
const ART_SMALL = [
  '██       ██ ███████╗ ██╗',
  '██       ██ ██╔════╝ ██║',
  '██   █   ██ █████╗   ██║',
  '███████████ ██╔══╝   ██║',
  ' █████████  ███████╗ ██║',
  '╚═════════╝ ╚══════╝ ╚═╝',
  '',
  '     ██╗ ██╗  █████╗ ',
  '     ██║ ██║ ██╔══██╗',
  '     ██║ ██║ ███████║',
  '██   ██║ ██║ ██╔══██║',
  '╚█████╔╝ ██║ ██║  ██║',
  ' ╚════╝  ╚═╝ ╚═╝  ╚═╝',
  '',
  '████████╗  ██████╗  ███╗   ██╗  ██████╗ ',
  '╚══██╔══╝ ██╔═══██╗ ████╗  ██║ ██╔════╝ ',
  '   ██║    ██║   ██║ ██╔██╗ ██║ ██║  ███╗',
  '   ██║    ██║   ██║ ██║╚██╗██║ ██║   ██║',
  '   ██║    ╚██████╔╝ ██║ ╚████║ ╚██████╔╝',
  '   ╚═╝     ╚═════╝  ╚═╝  ╚═══╝  ╚═════╝ ',
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
  // GENERATED_AT is a UTC ISO string — read it back with UTC getters so the
  // date doesn't drift a day for visitors west of Greenwich
  return `${W[d.getUTCDay()]} ${M[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
}

export function profileScreenParts(cols: number): {
  head: string[];
  art: string[];
  tail: string[];
} {
  const art = cols >= 102 ? ART_FULL : cols >= 71 ? ART_STACKED : ART_SMALL;
  const head: string[] = [''];
  head.push(
    `${C.accent}${bold('# 魏佳桐')}${R}  ${link(`${C.blue}joyetong58@gmail.com${R}`, 'mailto:joyetong58@gmail.com')}`,
  );
  head.push(dim('─'.repeat(Math.max(0, Math.min(cols - 4, 44)))));
  head.push('');
  const artRows = rainbowize(art);
  const tail: string[] = [''];
  tail.push(
    `${bold('Undergraduate')}${C.dim} · ${R}Underwater Acoustics Engineering`,
  );
  tail.push(
    `${link(`${C.blue}Northwestern Polytechnical University${R}`, 'https://www.nwpu.edu.cn/')}${C.dim} · ${R}Xi'an`,
  );
  tail.push(
    `${bold('Vision')}${C.dim} — ${R}${italic('toward Physical AI that is more capable, safer, and more inclusive')}`,
  );
  tail.push('');
  tail.push(`${C.dim}│${R} 🤖  ${C.accent}About${R}${C.dim} · ${R}🏅  ${C.accent}Awards${R}${C.dim} · ${R}📰  ${C.accent}News${R}`);
  tail.push(`${C.dim}│${R} 📖  ${C.accent}Wiki${R}${C.dim} · ${R}🔗  ${C.accent}Links${R}${C.dim} · ${R}🐙  ${C.accent}GitHub${R}`);
  tail.push(`${C.dim}│${R}`);
  tail.push(`${C.dim}│${R} mail   ${link(`${C.cyan}joyetong58@gmail.com${R}`, 'mailto:joyetong58@gmail.com')}`);
  tail.push(`${C.dim}│${R} github ${link(`${C.cyan}github.com/Jiatong-Wei${R}`, 'https://github.com/Jiatong-Wei')}`);
  tail.push('');
  tail.push(`${C.accent}•${R} This page doubles as a shell.`);
  tail.push(`  Try: ${C.accent}help${R}${C.dim}, ${R}${C.accent}neofetch${R}${C.dim}, ${R}${C.accent}cat about | wc -l${R}${C.dim}.${R}`);
  tail.push('');
  tail.push(`${C.dim}│${R} 🐶  右下角那只狗叫 ${C.accent}优米${R}${C.dim}(${R}${C.accent}UMI${R}${C.dim})——试试摸摸它，或者键入 ${C.accent}pet${R}${C.dim}。${R}`);
  tail.push('');
  tail.push(dim(`Last update: ${lastUpdate()}`));
  tail.push('');
  return { head, art: artRows, tail };
}

export function profileScreen(cols: number): string[] {
  const { head, art, tail } = profileScreenParts(cols);
  return [...head, ...art, ...tail];
}

export const BOOT_LINES: Array<{ kind: 'ok' | 'warn'; text: string; delay?: number }> = [
  { kind: 'ok', text: 'mcu: STM32 angle-loop @ 200Hz — 角度环加载成功（wiki/gc-logistics）' },
  { kind: 'warn', text: 'grasp success: 0/5 — 只报真数字（wiki/nine-generations）' },
  { kind: 'ok', text: 'net: joyetong58@gmail.com · github.com/Jiatong-Wei' },
  { kind: 'ok', text: 'operator: 魏佳桐 (joye) online' },
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
  help, ls, wiki, cat, tree, wc, grep, clear, echo, history, whoami, pwd, date, uname, boot, theme,
];
