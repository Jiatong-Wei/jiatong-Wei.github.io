/* ============================================================
   魏佳桐 LEO WEI — 个人 wiki 交互层 v3
   1. 视图切换(方向性级联 + 弹簧指示条 + hash 同步)
   2. 文章:数据渲染 + 手风琴展开(双语)
   3. 视频:海报 + 点击播放(contain 不裁切)
   4. 动效:名字逐字浮现 / 统计累加 / 机械臂鼠标视差 / 按钮磁吸
   5. 主题:View Transition 交叉淡化 + localStorage
   6. i18n 中英切换 · 时段问候 + 时钟
   零依赖 · vanilla JS
   ============================================================ */
(function () {
  "use strict";

  var I18N = {
    zh: {
      tab_home: "首页", tab_arts: "文章", tab_work: "项目", tab_about: "关于",
      g_morning: "早安", g_afternoon: "午安", g_evening: "傍晚好", g_night: "夜安",
      hero_kicker: "机器人学习 · 具身智能",
      hero_line: "在仿真里较真：给机械臂的数据采集与模仿学习建管线、立门禁、跑证伪。",
      chip_1: "模仿学习 · ACT / DAgger",
      chip_2: "仿真数据采集 · Isaac Sim / LeRobot",
      chip_3: "安卓应用 · Kotlin",
      hero_loc: "西安 · 西北工业大学",
      arm_cap: "七自由度机械臂 · 抓取任务研究平台",
      h_welcome: "你好，这里是魏佳桐的个人 wiki",
      h_intro: "我在西北工业大学做机器人学习：在 Isaac Sim 里搭数据管线、训练与证伪模仿学习策略，并把每一步做成可复算的工程。下面是最近发生的事。",
      h_recent: "最新动态",
      h_flag: "旗舰",
      h_arts_n: "4 篇研究复盘",
      arts_sub: "研究复盘 / RESEARCH NOTES",
      a1_t: "DAgger 四轮：把末端-方块距离从 0.54m 压到 0.094m",
      a1_s: "九代受控实验定位根因之后，用策略自访状态 + 几何 oracle 重标注的迭代弧线。",
      a1_b: "九代受控实验把「纯模仿 + 数据手术」证伪到头：瓶颈是 policy 实访状态 OOD 于演示分布。转向 DAgger——policy 自己闭环跑，几何教师在每个实访状态上逐帧重标注正确动作，聚合重训。四轮迭代把末端-方块最佳逼近从 0.54m 推进到 0.094m，并拿到策略回合的首次物理接触；随后 15 集确认跑判定进入平台（0.10–0.30m 带宽）。改进 5.4 倍真实、平台也真实，全部证据入档。",
      a2_t: "九代受控实验：证伪纯模仿路线",
      a2_s: "一次只改一个变量的九代实验，确认 ACT 无法从 oracle 演示 alone 学到稳定抓取。",
      a2_b: "从超重聚合回退、类平衡手术、静止过滤到覆盖补丁，九代实验逐一排除了数据配比假说：补「对齐高位→下降」治好了泊车，补「未对齐→先对准」反而教会悬停——手工覆盖是打地鼠，两代在「下降意图」轴上振荡。结论：缺的不是数据配比，是下降动作与目标物的耦合，这直接催生了 DAgger 弧线。",
      a3_t: "LeRobot × PushT 交叉验证：排除评估链路暗缺陷",
      a3_s: "用官方基准端到端跑通训练-评估链路，确认 0/N 不是评估侧的 bug。",
      a3_b: "在策略长时间 0/N 时，第一件该做的事是排除评估链路暗缺陷。用 LeRobot 官方 PushT 数据集与基准端到端跑通训练与评估：覆盖率随训练提升（50k→100k 可见改善），证明采集、转换、训练、评估全链路无暗 bug；ACT 在 PushT 上的绝对分数属于模型-任务适配性，不是管线缺陷。这一步把后续所有实验的结论建立在可信的地基上。",
      a4_t: "三个 AI 代理的 git 协作协议",
      a4_s: "用纯 git 仓库当通信总线，一夜无人值守跑完采集、QA、训练、评估全流程。",
      a4_b: "三个 AI 代理（不同模型、不同席位）以一个裸 git 仓库为唯一通信总线：前缀帖子（zcode:/kimi:/cursor:）+ 唤醒正则 + 裁决线程。一夜无人值守完成了 DAgger 弧线的采集、QA、合并、训练与评估，代理间互查抓住了 4 处彼此的错漏（帧数虚报、门禁统计口径、相位映射缺口、路径落错）。协议本身也成为可复用的协作资产。",
      cap_reel: "闭环评估实录（点击播放）",
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
      site_p: "本站是我的个人 wiki：单屏面板式 SPA，原生 HTML/CSS/JS，无构建无依赖；中英与深浅主题由访客切换。",
      foot: " · vanilla HTML/CSS/JS"
    },
    en: {
      tab_home: "Home", tab_arts: "Articles", tab_work: "Work", tab_about: "About",
      g_morning: "Good morning", g_afternoon: "Good afternoon",
      g_evening: "Good evening", g_night: "Good night",
      hero_kicker: "Robotics · Embodied AI",
      hero_line: "Rigorous in simulation: building pipelines, gates, and falsification runs for robot data collection and imitation learning.",
      chip_1: "Imitation Learning · ACT / DAgger",
      chip_2: "Sim Data · Isaac Sim / LeRobot",
      chip_3: "Android · Kotlin",
      hero_loc: "Xi'an · Northwestern Polytechnical University",
      arm_cap: "7-DOF manipulator · grasping research platform",
      h_welcome: "Hello — this is Jiatong Wei's personal wiki",
      h_intro: "I do robot learning at NPU: building data pipelines in Isaac Sim, training and falsifying imitation-learning policies, and turning every step into recomputable engineering. Here is what happened recently.",
      h_recent: "Recent",
      h_flag: "FLAGSHIP",
      h_arts_n: "4 research notes",
      arts_sub: "RESEARCH NOTES",
      a1_t: "Four DAgger rounds: end-effector distance 0.54m → 0.094m",
      a1_s: "After nine controlled generations isolated the root cause, an arc of on-policy states relabeled by a geometric oracle.",
      a1_b: "Nine controlled generations falsified pure imitation + data surgery down to the root cause: the policy visits states that are out-of-distribution for the demos. The pivot was DAgger — the policy rolls out closed-loop while a geometric oracle relabels every visited state frame-by-frame; aggregate and retrain. Four rounds pushed best approach from 0.54m to 0.094m with the first physical contact by a policy rollout; a 15-episode confirmation run then established the plateau (0.10–0.30m band). The 5.4× gain is real, and so is the plateau — all evidence archived.",
      a2_t: "Nine controlled generations: falsifying pure imitation",
      a2_s: "One variable at a time, nine generations showed ACT cannot learn stable grasping from oracle demos alone.",
      a2_b: "From overweight aggregation regressions through class-balance surgery and static filtering to coverage patches: patching aligned-high→descend fixed parking, while patching unaligned→align-first taught hovering — hand-crafted coverage is whack-a-mole, oscillating along the descent-intent axis. Conclusion: the missing piece was not data mixture but the coupling between descent and the target object, which motivated the DAgger arc.",
      a3_t: "LeRobot × PushT cross-validation: ruling out eval-harness defects",
      a3_s: "An official benchmark run end-to-end confirmed 0/N was not an evaluation bug.",
      a3_b: "When a policy stays at 0/N, the first job is ruling out dark defects in the harness. Training and evaluating on the official LeRobot PushT benchmark end-to-end: coverage improved with training (50k→100k), proving collection, conversion, training, and evaluation are all sound; ACT's absolute PushT score reflects model-task fit, not pipeline defects. Every later conclusion now stands on verified ground.",
      a4_t: "A git-based collaboration protocol for three AI agents",
      a4_s: "A bare git repo as the only communication bus; an unsupervised overnight ran collection, QA, training, and eval.",
      a4_b: "Three AI agents (different models, different seats) used one bare git repository as their only communication bus: prefixed posts (zcode:/kimi:/cursor:), wake-up regexes, and a rulings thread. One unsupervised overnight completed the DAgger arc's collection, QA, merge, training, and evaluation. Cross-reviewing caught four of each other's mistakes (an inflated frame count, a gate-statistic mismatch, phase-mapping gaps, a misplaced path). The protocol itself became a reusable collaboration asset.",
      cap_reel: "closed-loop footage (click to play)",
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
      site_p: "This site is my personal wiki: a single-screen SPA in vanilla HTML/CSS/JS — no build, no dependencies; language and theme are visitor-switchable.",
      foot: " · vanilla HTML/CSS/JS"
    }
  };

  var root = document.documentElement;
  var langBtn = document.getElementById("langBtn");
  var themeBtn = document.getElementById("themeBtn");
  var curLang = "zh";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 名字逐字浮现 ─────────────────────── */
  (function splitName() {
    var cjk = document.getElementById("nameCjk");
    if (!cjk || reduceMotion) return;
    var text = cjk.textContent;
    cjk.textContent = "";
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.className = "ch";
      s.textContent = text[i];
      s.style.animationDelay = (0.14 + i * 0.09) + "s";
      cjk.appendChild(s);
    }
  })();

  /* ── 视图切换 + 弹簧指示条 ───────────── */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var views = Array.prototype.slice.call(document.querySelectorAll(".view"));
  var ind = document.querySelector(".tab-ind");
  var order = tabs.map(function (t) { return t.getAttribute("data-view"); });

  function moveInd(btn) {
    if (!ind || !btn) return;
    ind.style.left = btn.offsetLeft + "px";
    ind.style.width = btn.offsetWidth + "px";
  }
  function showView(name, dir) {
    var prev = tabs.filter(function (t) { return t.classList.contains("is-on"); })[0];
    var prevIdx = prev ? order.indexOf(prev.getAttribute("data-view")) : -1;
    var nextIdx = order.indexOf(name);
    var hit = false;
    views.forEach(function (v) {
      var on = v.id === "v-" + name;
      v.classList.toggle("is-on", on);
      if (on) {
        hit = true;
        v.classList.remove("anim", "back");
        void v.offsetWidth;
        if (dir && !reduceMotion) {
          if (dir < 0) v.classList.add("back");
          v.classList.add("anim");
        }
      }
    });
    if (!hit && views.length) { views[0].classList.add("is-on"); name = "home"; }
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
    t.addEventListener("click", function () {
      var target = t.getAttribute("data-view");
      var cur = tabs.filter(function (x) { return x.classList.contains("is-on"); })[0];
      var curIdx = cur ? order.indexOf(cur.getAttribute("data-view")) : 0;
      showView(target, order.indexOf(target) > curIdx ? 1 : -1);
    });
  });
  /* 首页快捷卡跳转 */
  Array.prototype.forEach.call(document.querySelectorAll("[data-goto]"), function (b) {
    b.addEventListener("click", function () { showView(b.getAttribute("data-goto"), 1); });
  });

  /* ── 文章渲染 + 手风琴 ────────────────── */
  var ART_KEYS = ["a1", "a2", "a3", "a4"];
  var ART_DATES = ["2026.08.27", "2026.07.28", "2026.08.25", "2026.08.26"];
  var artOpen = {};
  function renderArts() {
    var dict = I18N[curLang] || I18N.zh;
    var box = document.getElementById("artList");
    if (!box) return;
    box.innerHTML = "";
    ART_KEYS.forEach(function (k, i) {
      var art = document.createElement("div");
      art.className = "art" + (artOpen[k] ? " open" : "");
      art.innerHTML =
        '<button class="art__btn" type="button">' +
        '<span class="art__date mono">' + ART_DATES[i] + '</span>' +
        '<span class="art__t">' + dict[k + "_t"] + '</span>' +
        '<span class="art__arrow">›</span>' +
        '<span class="art__sum">' + dict[k + "_s"] + '</span>' +
        '</button><div class="art__body"><div class="art__bodyin"><p>' + dict[k + "_b"] + '</p></div></div>';
      art.querySelector(".art__btn").addEventListener("click", function () {
        artOpen[k] = !artOpen[k];
        art.classList.toggle("open");
      });
      box.appendChild(art);
    });
  }

  /* ── 视频:海报 + 点击播放 ─────────────── */
  (function videoCtl() {
    var box = document.getElementById("videoBox");
    var vid = document.getElementById("reelVideo");
    var btn = document.getElementById("playBtn");
    if (!box || !vid || !btn) return;
    vid.removeAttribute("autoplay");
    function play() { vid.play().then(function () { box.classList.add("playing"); }).catch(function () {}); }
    box.addEventListener("click", function (e) {
      if (vid.paused) play();
      else { vid.pause(); box.classList.remove("playing"); }
    });
    vid.addEventListener("play", function () { box.classList.add("playing"); });
    vid.addEventListener("pause", function () { box.classList.remove("playing"); });
  })();

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
      var t0 = null, dur = 800;
      function fmt(v) { return v.toFixed(dec) + suffix + unitHtml; }
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.innerHTML = fmt(target * e);
        if (p < 1) requestAnimationFrame(step);
        else el.innerHTML = fmt(target);
      }
      requestAnimationFrame(step);
    });
  }

  /* ── 机械臂鼠标视差 ───────────────────── */
  (function parallax() {
    var box = document.getElementById("armBox");
    var svg = document.getElementById("armSvg");
    if (!box || !svg || reduceMotion) return;
    var raf = null, tx = 0, ty = 0, rx = 0, ry = 0;
    box.addEventListener("mousemove", function (e) {
      var r = box.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 14;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 10;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    box.addEventListener("mouseleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    function tick() {
      rx += (tx - rx) * 0.08;
      ry += (ty - ry) * 0.08;
      svg.style.transform = "translate(" + rx.toFixed(2) + "px," + ry.toFixed(2) + "px)";
      if (Math.abs(tx - rx) + Math.abs(ty - ry) > 0.05) raf = requestAnimationFrame(tick);
      else raf = null;
    }
  })();

  /* ── 按钮磁吸 ─────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll(".ctrl"), function (b) {
    if (reduceMotion) return;
    b.addEventListener("mousemove", function (e) {
      var r = b.getBoundingClientRect();
      var dx = (e.clientX - r.left - r.width / 2) / r.width;
      var dy = (e.clientY - r.top - r.height / 2) / r.height;
      b.style.transform = "translate(" + (dx * 5).toFixed(1) + "px," + (dy * 4).toFixed(1) + "px)";
    });
    b.addEventListener("mouseleave", function () { b.style.transform = ""; });
  });

  /* ── 问候 + 时钟 ─────────────────────── */
  var greetEl = document.getElementById("greet");
  var clockEl = document.getElementById("clock");
  function greetKey(h) {
    if (h < 5) return "g_night";
    if (h < 11) return "g_morning";
    if (h < 17) return "g_afternoon";
    if (h < 23) return "g_evening";
    return "g_night";
  }
  function tickClock() {
    var d = new Date();
    var dict = I18N[curLang] || I18N.zh;
    if (greetEl) greetEl.textContent = dict[greetKey(d.getHours())];
    if (clockEl) {
      clockEl.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    }
  }
  tickClock();
  setInterval(tickClock, 30000);

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
    renderArts();
    tickClock();
    try { localStorage.setItem("leo.lang", lang); } catch (e) {}
  }
  var savedLang = "zh";
  try { savedLang = localStorage.getItem("leo.lang") || "zh"; } catch (e) {}
  applyLang(savedLang);
  langBtn.addEventListener("click", function () {
    applyLang(curLang === "en" ? "zh" : "en");
  });

  /* ── 主题(View Transition 交叉淡化) ───── */
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
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    if (document.startViewTransition && !reduceMotion) {
      document.startViewTransition(function () { applyTheme(next); });
    } else {
      applyTheme(next);
    }
  });

  /* ── 启动 ─────────────────────────────── */
  var m = location.hash.match(/^#v-([a-z]+)/);
  showView(m ? m[1] : "home", 0);
  window.addEventListener("resize", function () {
    var onTab = tabs.filter(function (t) { return t.classList.contains("is-on"); })[0];
    moveInd(onTab);
  });
})();
