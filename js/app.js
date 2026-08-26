/* ============================================================
   LEO.WEI // NIGHT CITY — 交互层 v4
   渲染数据层（js/data.js）+ 原有动效系统。
   1. 数据渲染（meta/进程/日志/视频墙）
   2. 视频点击播放（hero + 视频墙）
   3. 开机序列 / Tab 切换 / 数据雨 / 时钟 / 霓虹闪烁
   所有动效尊重 prefers-reduced-motion。
   ============================================================ */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 0. 数据渲染 ---------- */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMeta() {
  const dl = document.getElementById('metaList');
  dl.innerHTML = META.map(m =>
    `<div><dt>${m.k}</dt><dd${m.cls ? ` class="${m.cls}"` : ''}>${esc(m.v)}</dd></div>`
  ).join('');
}

function renderProcs() {
  const el = document.querySelector('.procs');
  el.innerHTML = '<p class="procs__label">PROCESSES</p>' + PROCESSES.map(p =>
    `<p class="proc"><span class="proc__pid">${p.pid}</span>` +
    `<span class="proc__name">${esc(p.name)}</span>` +
    `<span class="proc__st st--${p.st}">${p.label}</span></p>`
  ).join('');
}

function renderPosts() {
  const list = document.getElementById('postList');
  const first = POSTS[0];
  const count = document.getElementById('postCount');
  if (count) count.textContent = `共 ${POSTS.length} 篇`;
  // 首页 FEATURED（写作页头条）—— 标题/日期/标签数据驱动；
  // 摘要保留 index.html 静态文案（避免 JS 覆盖漂移）
  const featured = document.querySelector('.featured');
  if (featured && first) {
    featured.querySelector('h3').textContent = first.title;
    featured.querySelector('.featured__side .mono').textContent = first.date;
    featured.querySelector('.chip').textContent = first.tag;
  }
  list.innerHTML = POSTS.map(p =>
    `<a class="log__row" href="https://github.com/Jiatong-Wei" target="_blank" rel="noopener">` +
    `<span class="log__date">${p.date}</span>` +
    `<span class="log__title">&gt; ${esc(p.title)}</span>` +
    `<span class="log__tag">${p.tag}</span></a>`
  ).join('');
}

/* 视频墙：点击播放/暂停 */
function renderWall() {
  const grid = document.getElementById('wallGrid');
  grid.innerHTML = MEDIA_WALL.map((m, i) => {
    if (m.type === 'image') {
      return `<figure class="wall__item wall__item--img" style="--d:${i * 45}ms">` +
        `<img src="${m.src}" alt="${esc(m.label)}" loading="lazy" />` +
        `<figcaption class="wall__cap"><span class="tag tag--${m.color}">${m.tag}</span>` +
        `<span class="mono dim">${esc(m.label)}</span></figcaption>` +
        `<p class="wall__note">${esc(m.caption)}</p></figure>`;
    }
    return `<figure class="wall__item wall__item--vid" style="--d:${i * 45}ms">` +
      `<video muted loop playsinline preload="none" poster="${m.poster}">` +
      `<source src="${m.src}" type="video/mp4" /></video>` +
      `<button class="vbtn vbtn--mini" aria-label="播放/暂停 ${esc(m.label)}">▶</button>` +
      `<figcaption class="wall__cap"><span class="tag tag--${m.color}">${m.tag}</span>` +
      `<span class="mono dim">${esc(m.label)}</span></figcaption>` +
      `<p class="wall__note">${esc(m.caption)}</p></figure>`;
  }).join('');

  // 视频点击播放
  grid.querySelectorAll('.wall__item--vid').forEach(item => {
    const vid = item.querySelector('video');
    const btn = item.querySelector('.vbtn--mini');
    const toggle = () => {
      if (vid.paused) {
        grid.querySelectorAll('video').forEach(v => { if (v !== vid) v.pause(); });
        vid.play();
        btn.textContent = '❚❚';
      } else {
        vid.pause();
        btn.textContent = '▶';
      }
    };
    item.addEventListener('click', toggle);
  });
}

/* ---------- 实验弧：七档闭环对照渲染 ---------- */
function renderArc() {
  const tbody = document.getElementById('arcRows');
  const steps = document.getElementById('arcSteps');
  const conclusion = document.getElementById('arcConclusion');
  if (!tbody || !EXPERIMENT_ARC) return;
  tbody.innerHTML = EXPERIMENT_ARC.rows.map(r =>
    `<tr><td class="arc__cfg">${esc(r.cfg)}</td>` +
    `<td>${esc(r.setup)}</td>` +
    `<td class="arc__loss">${esc(r.loss)}</td>` +
    `<td>${esc(r.behavior)}</td>` +
    `<td>${esc(r.takeaway)}</td></tr>`
  ).join('');
  if (steps) {
    steps.innerHTML = EXPERIMENT_ARC.method.map(m => `<li>${esc(m)}</li>`).join('');
  }
  if (conclusion) conclusion.textContent = EXPERIMENT_ARC.conclusion;
}

/* ---------- hero 视频点击播放 ---------- */
function initHeroVideo() {
  // 每个 .card__flag 内：video + .vbtn 配对，点击播放/暂停
  document.querySelectorAll('.card__flag').forEach(flag => {
    const vid = flag.querySelector('video');
    const btn = flag.querySelector('.vbtn');
    if (!vid || !btn) return;
    const toggle = () => {
      if (vid.paused) { vid.play(); btn.textContent = '❚❚ PAUSE'; }
      else { vid.pause(); btn.textContent = '▶ PLAY'; }
    };
    btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });
    vid.addEventListener('click', toggle);
    vid.addEventListener('play', () => { btn.textContent = '❚❚ PAUSE'; });
    vid.addEventListener('pause', () => { btn.textContent = '▶ PLAY'; });
  });
}

/* ---------- 1. 开机序列 ---------- */
const boot = document.getElementById('boot');

function scramble(el, duration = 800) {
  if (reduced || !el) return;
  const final = el.dataset.text || el.textContent;
  const chars = '!<>-_\\/[]{}—=+*^?#01';
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const settled = Math.floor(p * final.length);
    el.textContent =
      final.slice(0, settled) +
      [...final.slice(settled)].map(c => (c === ' ' ? ' ' : chars[(Math.random() * chars.length) | 0])).join('');
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = final;
  })(start);
}

window.addEventListener('load', () => {
  if (reduced) {
    boot.remove();
    document.body.classList.add('is-ready');
    return;
  }
  // 逐行打出自检日志
  const lines = document.querySelectorAll('.boot__ln');
  const LINE_MS = 170;
  lines.forEach((ln, i) => setTimeout(() => ln.classList.add('show'), 120 + i * LINE_MS));
  // 日志完成 → 上滑揭示 → 内容入场 → 姓名解码
  const revealAt = 120 + lines.length * LINE_MS + 260;
  setTimeout(() => {
    boot.classList.add('is-done');
    document.body.classList.add('is-ready');
  }, revealAt);
  setTimeout(() => scramble(document.querySelector('[data-scramble]'), 800), revealAt + 320);
  setTimeout(() => boot.remove(), revealAt + 700);
});

/* ---------- 2. Tab 切换 ---------- */
const tabs = document.querySelectorAll('.tab');
let switching = false;

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (switching || tab.classList.contains('is-active')) return;
    switching = true;

    const current = document.querySelector('.tabpane.is-active');
    const next = document.getElementById(`pane-${tab.dataset.tab}`);

    const activate = () => {
      tabs.forEach(t => t.classList.toggle('is-active', t === tab));
      if (current) current.classList.remove('is-active', 'is-leaving');
      next.classList.add('is-active');
    };

    if (reduced) {
      activate();
      switching = false;
      return;
    }

    if (current) current.classList.add('is-leaving');
    setTimeout(() => {
      activate();
      next.classList.add('is-entering');
      setTimeout(() => {
        next.classList.remove('is-entering');
        switching = false;
      }, 300);
    }, 90);
  });
});

/* ---------- 3. 数据雨 ---------- */
function fillRain(el, lines = 60) {
  if (!el) return;
  const col = document.createElement('span');
  col.textContent = Array.from({ length: lines }, () => (Math.random() > 0.5 ? '1' : '0')).join('\n');
  col.style.animationDuration = `${40 + Math.random() * 30}s`;
  el.appendChild(col);
}
if (!reduced) {
  fillRain(document.querySelector('.fx-rain--left'));
  fillRain(document.querySelector('.fx-rain--right'));
}

/* ---------- 4. 夜城时钟（现实时间 + 51 年） ---------- */
const clockEl = document.getElementById('clock');
function tickClock() {
  const now = new Date();
  const y = now.getFullYear() + 51;
  const p = n => String(n).padStart(2, '0');
  clockEl.textContent = `${y}.${p(now.getMonth() + 1)}.${p(now.getDate())} // ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);

/* ---------- 5. 霓虹随机闪烁 ---------- */
if (!reduced) {
  (function flickerLoop() {
    setTimeout(() => {
      document.querySelectorAll('.tabpane.is-active .blocktitle').forEach(b => {
        b.classList.add('flicker');
        setTimeout(() => b.classList.remove('flicker'), 280);
      });
      flickerLoop();
    }, 6000 + Math.random() * 4000);
  })();
}

/* ---------- 6. 无规律 RGB 故障（hover 驱动） ---------- */
if (!reduced) {
  document.querySelectorAll('.glitch').forEach(el => {
    let timer = null;
    const states = ['j1', 'j2', 'j3', '', '']; // 空态概率更高，避免持续抖动
    const tick = () => {
      el.classList.remove('j1', 'j2', 'j3');
      const next = states[(Math.random() * states.length) | 0];
      if (next) el.classList.add(next);
      timer = setTimeout(tick, 40 + Math.random() * 300);
    };
    el.addEventListener('mouseenter', tick);
    el.addEventListener('mouseleave', () => {
      clearTimeout(timer);
      el.classList.remove('j1', 'j2', 'j3');
    });
  });
}

/* ---------- init ---------- */
renderMeta();
renderProcs();
renderPosts();
renderWall();
renderArc();
initHeroVideo();
