/* ============================================================
   LEO.WEI · Research Dossier — 交互层
   1. i18n:中英切换(data-i18n 字典注入,localStorage 持久)
   2. 主题:浅/深切换(localStorage 持久,浅色默认)
   零依赖 · vanilla JS
   ============================================================ */
(function () {
  "use strict";

  var I18N = {
    zh: {
      nav_work: "项目", nav_log: "动态", nav_about: "关于",
      hero_kicker: "机器人学习 · 具身智能",
      hero_line: "在仿真里较真：给机械臂的数据采集与模仿学习建管线、立门禁、跑证伪。",
      chip_1: "模仿学习 · ACT / DAgger",
      chip_2: "仿真数据采集 · Isaac Sim / LeRobot",
      chip_3: "安卓应用 · Kotlin",
      hero_loc: "西安 · 西北工业大学",
      sec_work: "项目", sec_log: "研究动态", sec_about: "关于",
      cap_reel: "闭环评估实录",
      isaac_title: "Isaac Sim 机械臂抓取研究管线",
      isaac_sub: "采集 → 转换 → 训练 → 门禁 → 闭环 · 全链路单卡可复现",
      isaac_p1: "建成 Franka 抓取的完整仿真研究管线：程序化 oracle 采集、LeRobot 数据集转换、ACT 训练、机器可读门禁与逐帧诊断工具链——每一步都有验收标准，每一个数字都可复算。",
      isaac_p2: "九代受控实验证伪了纯模仿路线并定位根因（下降动作与目标物的耦合丢失），随后转向 DAgger 数据聚合：四轮迭代将末端-方块距离从 0.21m 推进至 0.094m，并首次实现策略回合的物理接触。方法有效，仍在推进。",
      st1: "DAgger 迭代轮次", st2: "末端最佳逼近", st3: "受控实验代", st4: "闭环评估回合",
      chip_gate: "三层质量门禁",
      badge_dev: "开发中",
      arx_p: "学术会议助手 Android 应用（Kotlin）——会议信息聚合与浏览体验。正在打磨，本卡片将随版本更新。",
      tl1: "DAgger 弧四轮收官：最佳逼近 0.094m，策略回合首次物理接触",
      tl2: "三个 AI 代理经 git 协作协议完成一夜无人值守实验",
      tl3: "LeRobot × PushT 端到端交叉验证：排除评估链路暗缺陷",
      tl4: "九代受控实验弧收官，证伪纯模仿路线并定位耦合丢失根因",
      tl5: "arxiarxi 安卓应用立项开发",
      edu: "西北工业大学 · 本科在读",
      focus: "机器人学习与具身智能：行为克隆（ACT）、仿真数据采集（Isaac Sim / LeRobot）、Sim-to-Real 迁移、VLA 模型。关注从仿真到真实世界的迁移，以及机器人在开放环境中的泛化能力。",
      foot: "vanilla HTML/CSS/JS · 影像来自 Isaac Sim 4.5 实验记录"
    },
    en: {
      nav_work: "Work", nav_log: "Log", nav_about: "About",
      hero_kicker: "Robotics · Embodied AI",
      hero_line: "Rigorous in simulation: building pipelines, gates, and falsification runs for robot data collection and imitation learning.",
      chip_1: "Imitation Learning · ACT / DAgger",
      chip_2: "Sim Data · Isaac Sim / LeRobot",
      chip_3: "Android · Kotlin",
      hero_loc: "Xi'an · Northwestern Polytechnical University",
      sec_work: "Selected Work", sec_log: "Research Log", sec_about: "About",
      cap_reel: "closed-loop evaluation footage",
      isaac_title: "Isaac Sim Manipulation Research Pipeline",
      isaac_sub: "collect → convert → train → gate → closed-loop · reproducible on one GPU",
      isaac_p1: "Built a complete simulation research pipeline for Franka grasping: programmatic-oracle data collection, LeRobot dataset conversion, ACT training, and a machine-readable gating & per-frame diagnostics toolkit — every step has acceptance criteria, every number is recomputable.",
      isaac_p2: "Nine generations of controlled experiments falsified pure imitation and isolated the root cause (loss of coupling between descent and the target object), motivating a pivot to DAgger aggregation: four rounds pushed best end-effector approach from 0.21m to 0.094m and achieved the first physical contact by a policy rollout. The method works; the work continues.",
      st1: "DAgger iterations", st2: "best approach", st3: "controlled exp. gens", st4: "closed-loop rollouts",
      chip_gate: "3-layer QA gates",
      badge_dev: "IN DEVELOPMENT",
      arx_p: "Academic conference companion app for Android (Kotlin) — venue info aggregation and reading experience. Being polished; this card will update with releases.",
      tl1: "DAgger arc wrapped in four rounds: best approach 0.094m, first physical contact by a policy rollout",
      tl2: "Three AI agents ran an unsupervised overnight experiment via a git-based collaboration protocol",
      tl3: "LeRobot × PushT end-to-end cross-validation: ruled out hidden defects in the eval harness",
      tl4: "Nine-generation experiment arc concluded; falsified pure imitation, isolated the coupling-loss root cause",
      tl5: "arxiarxi Android app project started",
      edu: "Northwestern Polytechnical University · undergraduate",
      focus: "Robot learning & embodied AI: behavior cloning (ACT), sim data collection (Isaac Sim / LeRobot), sim-to-real transfer, VLA models. Interested in transferring from simulation to the real world and generalization in open environments.",
      foot: "vanilla HTML/CSS/JS · footage from Isaac Sim 4.5 experiment logs"
    }
  };

  var root = document.documentElement;
  var langBtn = document.getElementById("langBtn");
  var themeBtn = document.getElementById("themeBtn");

  /* ── i18n ─────────────────────────────── */
  function applyLang(lang) {
    var dict = I18N[lang] || I18N.zh;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (dict[key] != null) nodes[i].textContent = dict[key];
    }
    root.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    langBtn.textContent = lang === "en" ? "中" : "EN";
    try { localStorage.setItem("leo.lang", lang); } catch (e) {}
  }
  var savedLang = "zh";
  try { savedLang = localStorage.getItem("leo.lang") || "zh"; } catch (e) {}
  applyLang(savedLang);
  langBtn.addEventListener("click", function () {
    applyLang(root.getAttribute("lang") === "en" ? "zh" : "en");
  });

  /* ── 主题 ─────────────────────────────── */
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "☀" : "☾";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#131417" : "#FAFAF8");
    try { localStorage.setItem("leo.theme", t); } catch (e) {}
  }
  var savedTheme = "light";
  try { savedTheme = localStorage.getItem("leo.theme") || "light"; } catch (e) {}
  applyTheme(savedTheme);
  themeBtn.addEventListener("click", function () {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
})();
