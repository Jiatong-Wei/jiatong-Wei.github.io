/* ============================================================
   LEO.WEI // NIGHT CITY — 数据层 v1
   内容集中在此，修改站点只需编辑本文件与 data.md 文案。
   所有数字来自 2026-08-25 实测报告（RA-apply/outputs/）。
   ============================================================ */

/* ---------- 旗舰项目：Isaac Sim × ACT 具身智能管线 ---------- */
const ISAAC_PROJECT = {
  id: 'isaac-act',
  title: 'Isaac Sim × ACT 具身智能数据管线',
  subtitle: '从仿真采数到行为克隆的完整链路',
  stack: ['Isaac Sim', 'LeRobot', 'ACT', 'UMI 表示', 'SE(3)'],
  highlights: [
    { k: '12', v: '程序化 oracle 演示', sub: '12/12 双门禁验证' },
    { k: '3600', v: '帧演示数据', sub: '60fps · 12 ep' },
    { k: '224²', v: '腕部 RGB 观测', sub: '+ 9 维状态' },
    { k: '2000', v: 'ACT 训练步', sub: 'loss 5.759→0.860' },
  ],
  metrics: [
    { name: '训练 loss', value: '5.759 → 0.860', note: '2000 步 · −85%' },
    { name: '峰值显存', value: '1.03 GB', note: '4060 8GB 仅占 1GB' },
    { name: '闭环 eval', value: '0/5', note: '诚实记录 · 待改进' },
  ],
  note: '演示含相对 SE(3) 动作（3 平移 + 3 轴角 + 夹爪开度），对齐 UMI 表示；转换 LeRobot 格式后训练。',
};

/* ---------- 第二条线：PushT ACT 50k ---------- */
const PUSHT_PROJECT = {
  id: 'pusht-act',
  title: 'PushT · ACT 50k 步训练',
  subtitle: 'LeRobot 官方数据集上的行为克隆',
  stack: ['PushT', 'ACT', 'LeRobot'],
  highlights: [
    { k: '50k', v: '训练步数', sub: '20.5 step/s' },
    { k: '0.347→0.448', v: 'avg_max_reward', sub: '20k→50k 单调上升' },
    { k: '0.993', v: '单局最高', sub: '近完成 rollout' },
    { k: '0.95 GB', v: '峰值显存', sub: '8GB 卡余量充足' },
  ],
  metrics: [
    { name: 'avg_max_reward', value: '0.347 → 0.448', note: '20k/40k/50k 单调' },
    { name: 'loss', value: '6.630 → 0.147', note: '50k 步 · −98%' },
    { name: 'pc_success', value: '0/10', note: '未破零 · 方向正确' },
  ],
  note: 'PushT 长 horizon 任务，成功率未破零属预期；avg_max_reward 随步数单调上升，训练方向正确。',
};

/* ---------- 视频墙：媒体定义 ---------- */
const MEDIA_WALL = [
  {
    type: 'video',
    src: 'assets/media/oracle_ep05.mp4',
    poster: 'assets/media/posters/oracle_ep05.jpg',
    label: 'ORACLE_EP05.mp4',
    caption: 'Isaac Sim · oracle 抓取回放',
    tag: 'ISAAC SIM',
    color: 'c',
    videoMode: 'click',
  },
  {
    type: 'video',
    src: 'assets/media/domain_rand_ep00.mp4',
    poster: 'assets/media/posters/domain_rand_ep00.jpg',
    label: 'DOMAIN_RAND_EP00.mp4',
    caption: '域随机化 · 绿方块/米黄地面',
    tag: 'DOMAIN RANDOM',
    color: 'y',
    videoMode: 'click',
  },
  {
    type: 'video',
    src: 'assets/media/domain_rand_ep01.mp4',
    poster: 'assets/media/posters/domain_rand_ep01.jpg',
    label: 'DOMAIN_RAND_EP01.mp4',
    caption: '域随机化 · 橙方块/蓝灰地面',
    tag: 'DOMAIN RANDOM',
    color: 'y',
    videoMode: 'click',
  },
  {
    type: 'video',
    src: 'assets/media/domain_rand_ep02.mp4',
    poster: 'assets/media/posters/domain_rand_ep02.jpg',
    label: 'DOMAIN_RAND_EP02.mp4',
    caption: '域随机化 · 红方块/灰地面',
    tag: 'DOMAIN RANDOM',
    color: 'y',
    videoMode: 'click',
  },
  {
    type: 'video',
    src: 'assets/media/closedloop_ep02.mp4',
    poster: 'assets/media/posters/closedloop_ep02.jpg',
    label: 'CLOSEDLOOP_EP02.mp4',
    caption: '闭环 eval · 诚实记录 0/5',
    tag: 'CLOSED LOOP',
    color: 'm',
    videoMode: 'click',
  },
  {
    type: 'video',
    src: 'assets/media/eval_progression.mp4',
    poster: 'assets/media/posters/eval_progression.jpg',
    label: 'EVAL_PROGRESSION.mp4',
    caption: 'PushT 20k/40k/50k 三档对比',
    tag: 'PUSHT',
    color: 'c',
    videoMode: 'click',
  },
  {
    type: 'image',
    src: 'assets/img/learning_curve.png',
    label: 'learning_curve.png',
    caption: 'PushT ACT 学习曲线 · 单调上升',
    tag: 'CHART',
    color: 'y',
  },
  {
    type: 'image',
    src: 'assets/img/act-day5-train-curve.png',
    label: 'act-day5-train-curve.png',
    caption: 'ACT 2000 步训练曲线 · loss 分解',
    tag: 'CHART',
    color: 'c',
  },
];

/* ---------- 终端 / meta（左面板） ---------- */
const WHOAMI = {
  whoami: 'robotics learner. builds, breaks, documents.',
  interests: '[imitation_learning, sim2real, robot_demos]',
};

const META = [
  { k: 'ROLE', v: 'ROBOTICS · EMBODIED AI' },
  { k: 'BASE', v: "XI'AN · 34.34°N 108.94°E" },
  { k: 'MAIL', v: 'JOYETONG58@GMAIL.COM' },
  { k: 'STAT', v: 'OPEN TO RESEARCH', cls: 'ok' },
];

const PROCESSES = [
  { pid: '023', name: 'isaac-franka-demos', st: 'run', label: 'RUNNING' },
  { pid: '017', name: 'act-pusht-50k', st: 'train', label: 'TRAINING' },
  { pid: '041', name: 'grasp-vla-queue', st: 'queue', label: 'QUEUED' },
];

/* ---------- 日志（写作/记录） ---------- */
const POSTS = [
  { date: '2026.08.25', title: 'Isaac Sim 采数到 ACT 训练：一条管线跑通的记录', tag: 'ACT' },
  { date: '2026.08.25', title: '闭环 eval 0/5：我如何判读一次失败', tag: 'EVAL' },
  { date: '2026.08.12', title: '高斯泼溅二三事：从论文到校园重建实践', tag: '3DGS' },
  { date: '2026.06.28', title: '强化学习入门：从策略梯度到 PPO', tag: 'RL' },
  { date: '2026.04.09', title: 'ROS2 通讯机制的工程实践笔记', tag: 'ROS2' },
  { date: '2026.03.02', title: '四足机器人 Sim-to-Real 迁移记录', tag: 'RL' },
  { date: '2026.01.18', title: '论文笔记：VLA 模型综述与方法对比', tag: 'VLA' },
  { date: '2025.11.05', title: '从零搭建 ROS2 开发环境的一些坑', tag: 'ROS2' },
];

const READING = { title: 'OpenVLA: An Open-Source Vision-Language-Action Model', p: 62, note: 'CH.4 EVAL' };

const TAGS = ['ACT', 'SIM2REAL', 'ISAAC', 'VLA', 'RL', '3DGS', 'ROS2'];

/* ---------- 时间线 / 关于 ---------- */
const TIMELINE = [
  { year: '2026', event: '在 Isaac Sim 里跑通采数→训练→闭环 eval 全链路，写下第一份诚实记录' },
  { year: '2025', event: '四足强化学习步态实机部署；开始系统读 VLA 论文' },
  { year: '2024', event: '加入机器人队，第一次把代码烧进真实硬件' },
  { year: '2023', event: '入学西北工业大学' },
];

const LINKS = [
  { label: 'GITHUB', href: 'https://github.com/Jiatong-Wei' },
  { label: 'EMAIL', href: 'mailto:joyetong58@gmail.com' },
];
