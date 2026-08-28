/* ============================================================
   魏佳桐 LEO WEI — 单屏面板交互层 v2
   1. 视图切换:标签 → .view 显隐(hash 同步)+ 滑动指示条
   2. 动效:级联入场 / 统计数字累加(尊重 prefers-reduced-motion)
   3. 顶栏:时段问候 + 实时时钟
   4. i18n 中英切换 · 主题浅深切换(localStorage 持久)
   零依赖 · vanilla JS
   ============================================================ */
(function () {
  "use strict";

  var I18N = {
    zh: {
      tab_work: "项目", tab_log: "研究动态", tab_about: "关于",
      g_morning: "早安", g_afternoon: "午安", g_evening: "傍晚好", g_night: "夜安",
      hero_kicker: "机器人学习 · 具身智能",
      hero_line: "在仿真里较真：给机械臂的数据采集与模仿学习建管线、立门禁、跑证伪。",
      chip_1: "模仿学习 · ACT / DAgger",
      chip_2: "仿真数据采集 · Isaac Sim / LeRobot",
      chip_3: "安卓应用 · Kotlin",
      hero_loc: "西安 · 西北工业大学",
      cap_reel: "闭环评估实录",
      isaac_title: "Isaac Sim 机械臂抓取研究管线",
      isaac_sub: "采集 → 转换 → 训练 → 门禁 → 闭环 · 全链路单卡可复现",
      isaac_p1: "建成 Franka 抓取的完整仿真研究管线：程序化 oracle 采集、LeRobot 转换、ACT 训练、机器可读门禁与逐帧诊断——每步有验收标准，每个数字可复算。",
      isaac_p2: "九代受控实验证伪纯模仿路线并定位根因后转向 DAgger：四轮将末端-方块距离从 0.21m 推进至 0.094m，策略回合首次物理接触。方法有效，仍在推进。",
      st1: "DAgger 迭代轮次", st2: "末端最佳逼近", st3: "受控实验代", st4: "闭环评估回合",
      badge_dev: "开发中",
      arx_p: "学术会议助手 Android 应用（Kotlin）——会议信息聚合与浏览体验。正在打磨，本卡片将随版本更新。",
      sec_log: "研究动态",
      tl1: "DAgger 弧四轮收官：最佳逼近 0.094m，策略回合首次物理接触",
      tl2: "三个 AI 代理经 git 协作协议完成一夜无人值守实验",
      tl3: "LeRobot × PushT 端到端交叉验证：排除评估链路暗缺陷",
      tl4: "九代受控实验弧收官，证伪纯模仿路线并定位耦合丢失根因",
      tl5: "arxiarxi 安卓应用立项开发",
      edu: "西北工业大学 · 本科在读",
      focus: "机器人学习与具身智能：行为克隆（ACT）、仿真数据采集（Isaac Sim / LeRobot）、Sim-to-Real 迁移、VLA 模型。关注从仿真到真实世界的迁移，以及机器人在开放环境中的泛化能力。",
      foot: " · vanilla HTML/CSS/JS"
    },
    en: {
      tab_work: "Work", tab_log: "Log", tab_about: "About",
      g_morning: "Good morning", g_afternoon: "Good afternoon",
      g_evening: "Good evening", g_night: "Good night",
      hero_kicker: "Robotics · Embodied AI",
      hero_line: "Rigorous in simulation: building pipelines, gates, and falsification runs for robot data collection and imitation learning.",
      chip_1: "Imitation Learning · ACT / DAgger",
      chip_2: "Sim Data · Isaac Sim / LeRobot",
      chip_3: "Android · Kotlin",
      hero_loc: "Xi'an · Northwestern Polytechnical University",
      cap_reel: "closed-loop evaluation footage",
      isaac_title: "Isaac Sim Manipulation Research Pipeline",
      isaac_sub: "collect → convert → train → gate → closed-loop · reproducible on one GPU",
      isaac_p1: "Built a complete simulation research pipeline for Franka grasping: programmatic-oracle data collection, LeRobot conversion, ACT training, and a machine-readable gating & per-frame diagnostics toolkit — every step has acceptance criteria, every number is recomputable.",
      isaac_p2: "Nine generations of controlled experiments falsified pure imitation and isolated the root cause, motivating a pivot to DAgger: four rounds pushed best approach from 0.21m to 0.094m with the first physical contact by a policy rollout. The method works; the work continues.",
      st1: "DAgger iterations", st2: "best approach", st3: "controlled exp. gens", st4: "closed-loop rollouts",
      badge_dev: "IN DEVELOPMENT",
      arx_p: "Academic conference companion app for Android (Kotlin) — venue info aggregation and reading experience. Being polished; this card will update with releases.",
      sec_log: "Research Log",
      tl1: "DAgger arc wrapped in four rounds: best approach 0.094m, first physical contact by a policy rollout",
      tl2: "Three AI agents ran an unsupervised overnight experiment via a git-based collaboration protocol",
      tl3: "LeRobot × PushT end-to-end cross-validation: ruled out hidden defects in the eval harness",
      tl4: "Nine-generation experiment arc concluded; falsified pure imitation, isolated the coupling-loss root cause",
      tl5: "arxiarxi Android app project started",
      edu: "Northwestern Polytechnical University · undergraduate",
      focus: "Robot learning & embodied AI: behavior cloning (ACT), sim data collection (Isaac Sim / LeRobot), sim-to-real transfer, VLA models. Interested in transferring from simulation to the real world and generalization in open environments.",
      foot: " · vanilla HTML/CSS/JS"
    }
  };

  var root = document.documentElement;
  var langBtn = document.getElementById("langBtn");
  var themeBtn = document.getElementById("themeBtn");
  var curLang = "zh";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 视图切换 + 滑动指示条 ───────────── */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var views = Array.prototype.slice.call(document.querySelectorAll(".view"));
  var ind = document.querySelector(".tab-ind");

  function moveInd(btn) {
    if (!ind || !btn) return;
    ind.style.left = btn.offsetLeft + "px";
    ind.style.width = btn.offsetWidth + "px";
  }
  function reAnim(view) {
    view.classList.remove("anim");
    void view.offsetWidth;            /* 强制回流以重触发级联动画 */
    view.classList.add("anim");
  }
  function showView(name, animate) {
    var hit = false;
    views.forEach(function (v) {
      var on = v.id === "v-" + name;
      v.classList.toggle("is-on", on);
      if (on) { hit = true; if (animate) reAnim(v); }
    });
    if (!hit && views.length) { views[0].classList.add("is-on"); name = "work"; }
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-view") === name;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      if (on) moveInd(t);
    });
    try { history.replaceState(null, "", "#v-" + name); } catch (e) {}
    if (name === "work") countUp();
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { showView(t.getAttribute("data-view"), true); });
  });

  /* ── 统计数字累加 ─────────────────────── */
  var counted = false;
  function countUp() {
    if (counted || reduceMotion) return;
    var els = document.querySelectorAll(".stat__n[data-count]");
    if (!els.length) return;
    counted = true;
    Array.prototype.forEach.call(els, function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var unit = el.querySelector(".stat__u");
      var unitHtml = unit ? unit.outerHTML : "";
      var t0 = null, dur = 750;
      function fmt(v) {
        return v.toFixed(dec) + suffix + unitHtml;
      }
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);   /* easeOutCubic */
        el.innerHTML = fmt(target * e);
        if (p < 1) requestAnimationFrame(step);
        else el.innerHTML = fmt(target);
      }
      requestAnimationFrame(step);
    });
  }

  /* ── 问候 + 时钟 ─────────────────────── */
  var greetEl = document.getElementById("greet");
  var clockEl = document.getElementById("clock");
  function greetKey(h) {
    if (h >= 5 && h < 11) return "g_morning";
    if (h < 17) return "g_afternoon";
    if (h < 23) return "g_evening";
    return "g_night";
  }
  function tick() {
    var d = new Date();
    var dict = I18N[curLang] || I18N.zh;
    if (greetEl) greetEl.textContent = dict[greetKey(d.getHours())];
    if (clockEl) {
      clockEl.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    }
  }
  tick();
  setInterval(tick, 30000);

  /* ── i18n ─────────────────────────────── */
  function applyLang(lang) {
    curLang = lang;
    var dict = I18N[lang] || I18N.zh;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (dict[key] != null) nodes[i].textContent = dict[key];
    }
    root.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    langBtn.textContent = lang === "en" ? "中" : "EN";
    tick();
    try { localStorage.setItem("leo.lang", lang); } catch (e) {}
  }
  var savedLang = "zh";
  try { savedLang = localStorage.getItem("leo.lang") || "zh"; } catch (e) {}
  applyLang(savedLang);
  langBtn.addEventListener("click", function () {
    applyLang(curLang === "en" ? "zh" : "en");
  });

  /* ── 主题 ─────────────────────────────── */
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "☀" : "☾";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#14120F" : "#F7F4EC");
    try { localStorage.setItem("leo.theme", t); } catch (e) {}
  }
  var savedTheme = "light";
  try { savedTheme = localStorage.getItem("leo.theme") || "light"; } catch (e) {}
  applyTheme(savedTheme);
  themeBtn.addEventListener("click", function () {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ── 启动 ─────────────────────────────── */
  var m = location.hash.match(/^#v-([a-z]+)/);
  showView(m ? m[1] : "work", false);
  window.addEventListener("resize", function () {
    var onTab = tabs.filter(function (t) { return t.classList.contains("is-on"); })[0];
    moveInd(onTab);
  });
})();
