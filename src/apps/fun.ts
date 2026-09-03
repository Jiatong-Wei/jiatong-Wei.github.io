// Flavor commands: neofetch identity card, ROS muscle memory, easter eggs.

import { C, R, bold, dim, link, padEnd } from '../term/ansi';
import { renderDoc } from '../term/mdansi';
import { getPet } from '../term/pet';
import { Command, docByName, wikiDocs } from './env';

// neofetch art: classic industrial arm silhouette — pedestal, column, boom,
// forearm reaching down, open two-finger gripper — hovering over the red
// 5 cm cube, which is still on the table (grasp 0/5).
const arm = (s: string) => `${C.accent}${s}${R}`;
const cube = (s: string) => `${C.red}${s}${R}`;
const ART = [
  arm('            ██████'), // hand
  arm('            ██  ██'), // open fingers
  arm('              ███'), // wrist
  arm('              ███'), // forearm
  arm('    ████████████'), // boom + elbow
  arm('    ███'), // column
  arm('    ███'),
  arm('  ██████'), // base taper
  arm('██████████████'), // pedestal
  cube('              ▄██▄'), // the cube. still on the table.
  cube('              ▀▀▀▀'),
];

const INFO: Array<[string, string]> = [
  ['', `${C.accent}${bold('魏佳桐')}${R} ${C.dim}(Leo Wei)${R}`],
  ['os', 'RoboStation 6.0 — 在仿真里较真'],
  ['host', '西安 · NWPU 水声工程 2023–2027'],
  ['research', 'manipulation · mobile robots'],
  ['stack', 'STM32 · ROS2 · LeRobot · PyTorch'],
  ['sim', 'Isaac Sim 6.0 · Franka Panda'],
  ['best', '0.094 m approach (4× DAgger)'],
  ['grasp', '0/5 — 只报真数字'],
  ['mail', 'joyetong58@gmail.com'],
  ['shell', '本终端，灵感欠 jyy 一次饭'],
];

export const neofetch: Command = {
  name: 'neofetch',
  summary: '身份卡',
  run: () => {
    const lines: string[] = [''];
    const n = Math.max(ART.length, INFO.length);
    for (let i = 0; i < n; i++) {
      const art = ART[i] ?? '';
      const [k, v] = INFO[i] ?? ['', ''];
      const key = k ? `${C.accent}${k}${R}` : '';
      lines.push(`${C.accent}${padEnd(art, 42)}${R}${key ? key + ' '.repeat(k ? 9 - k.length : 0) : ''}${v}`);
    }
    lines.push('');
    return lines.join('\n');
  },
};

const topicList = (): string[] => [
  '/about',
  '/awards',
  '/news',
  '/links',
  ...wikiDocs().map((d) => '/' + d.name.replace('wiki/', 'wiki_').replace(/-/g, '_')),
];

export const rostopic: Command = {
  name: 'rostopic',
  summary: 'ROS 肌肉记忆通道',
  usage: 'rostopic list | rostopic echo /topic',
  run: ({ argv }) => {
    const sub = argv[0];
    if (!sub) {
      return [
        `${C.dim}装机没带 ROS，但肌肉记忆给你保留了接口：${R}`,
        `  rostopic ${C.accent}list${R}`,
        `  rostopic ${C.accent}echo${R} /about`,
        '',
      ].join('\n');
    }
    if (sub === 'list') return topicList().map((t) => `${C.cyan}${t}${R}`).join('\n') + '\n';
    if (sub === 'echo') {
      const topic = (argv[1] ?? '').replace(/^\//, '');
      if (!topic) return `rostopic echo: 缺 topic — rostopic echo /about`;
      const doc = docByName(topic.replace(/_/g, '-').replace(/^wiki_/, 'wiki/')) ??
        docByName(topic.replace(/_/g, '-'));
      if (!doc) return `${C.red}ERROR:${R} topic [/${topic}] does not exist`;
      return renderDoc(doc);
    }
    return `rostopic: unknown command ${sub} — 这台机器上只会 list 和 echo`;
  },
};

export const joints: Command = {
  name: 'joints',
  summary: '假快照：Franka 关节状态',
  run: () => {
    const J = [
      ['panda_joint1', 0.4217, -0.0031, 0.4212],
      ['panda_joint2', -0.1983, 0.0012, 1.8923],
      ['panda_joint3', -0.1102, -0.0004, 1.2245],
      ['panda_joint4', -2.3141, 0.0028, 1.1178],
      ['panda_joint5', 0.0521, 0.0001, 0.3521],
      ['panda_joint6', 2.0108, -0.0017, 0.9834],
      ['panda_joint7', 0.6890, 0.0009, 0.2210],
      ['panda_finger', 0.0031, 0.0000, 4.1120],
    ];
    const head = `${C.accent}${padEnd('name', 16)}${padEnd('pos [rad]', 12)}${padEnd('vel [rad/s]', 13)}eff [Nm]${R}`;
    const rows = J.map(
      ([n, p, v, e]) =>
        `${C.cyan}${padEnd(String(n), 16)}${R}${padEnd((p as number).toFixed(4), 12)}${padEnd((v as number).toFixed(4), 13)}${(e as number).toFixed(4)}`,
    );
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    return [
      `${C.dim}[sim] franka_emika_panda @ Isaac Sim 6.0 — snapshot ${now}${R}`,
      head,
      ...rows,
      '',
      `${C.dim}假快照。真快照在 wiki/nine-generations 里躺着九代。${R}`,
      '',
    ].join('\n');
  },
};

export const sudo: Command = {
  name: 'sudo',
  summary: '不允许的',
  run: ({ argv }) =>
    [
      `${C.red}visitor is not in the sudoers file.${R} This incident will be reported.`,
      `${C.dim}${argv.length ? `"${argv.join(' ')}" 也不是例外。` : '（放心，站长记性很好。）'}${R}`,
    ].join('\n'),
};

export const pet: Command = {
  name: 'pet',
  summary: '和桌宠优米（UMI）互动',
  usage: 'pet [pet|sit|spin|sleep|wake|on|off]',
  run: ({ argv }) => getPet().run(argv[0] ?? 'pet'),
};

export const funCommands: Command[] = [neofetch, rostopic, joints, sudo, pet];
