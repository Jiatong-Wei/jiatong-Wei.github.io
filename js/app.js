/* ============================================================
   LEO.WEI // Instrument Panel — 交互层 v7
   1. 数据渲染(Home/指标/实验弧/媒体墙/写作/关于)
   2. 面板切换 hash 同步 + 逐行级联(≤400ms)
   3. 左轨指示条 FLIP 滑动
   4. #stage 等比缩放 fit()(1440×900 画布)
   5. 首次加载 boot(≤600ms, session 内一次)
   6. 媒体 lightbox / 状态栏时钟 + 光标
   全部 respect prefers-reduced-motion
   ============================================================ */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PANELS = ['home', 'work', 'arc', 'media', 'writing', 'about'];
const stage = document.getElementById('stage');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- #stage 等比缩放 ---------- */
function fit() {
  if (window.innerWidth <= 768) {
    stage.style.zoom = '';
    stage.style.transform = '';
    document.body.classList.add('no-zoom');
    return;
  }
  document.body.classList.remove('no-zoom');
  const s = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
  if (CSS.supports('zoom', '1')) {
    // zoom 是布局级缩放，body flex 会自动按缩放后尺寸居中
    stage.style.zoom = s;
    stage.style.transform = '';
  } else {
    // fallback：flex 先把 1440×900 盒子居中，绕中心 scale 后仍居中
    stage.style.zoom = '';
    stage.style.transform = `scale(${s})`;
    stage.style.transformOrigin = 'center center';
  }
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', fit);

/* ---------- Home 渲染 ---------- */
function renderHome() {
  const focus = document.getElementById('homeFocus');
  if (focus) {
    const aboutText = document.querySelector('.about__text');
    focus.textContent = aboutText ? aboutText.textContent.trim() : '';
  }
  const tags = document.getElementById('homeTags');
  if (tags) tags.innerHTML = TAGS.map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const links = document.getElementById('homeLinks');
  if (links) links.innerHTML = LINKS.map(l =>
    `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`
  ).join('');
  // NEWS: 从 TIMELINE + POSTS 派生密集日志行（日期 desc，取 6 条）
  const news = document.getElementById('homeNews');
  const timelineRows = (TIMELINE || []).map(t => ({ date: `${t.year}.00`, sort: `${t.year}.00`, evt: t.event, tag: 'TL' }));
  const postRows = (POSTS || []).map(p => ({ date: p.date, sort: p.date, evt: p.title, tag: p.tag }));
  const rows = [...timelineRows, ...postRows]
    .sort((a, b) => (a.sort < b.sort ? 1 : -1))
    .slice(0, 6);
  news.innerHTML = rows.map(r =>
    `<div class="news__row"><span class="news__date">${esc(r.date)}</span>` +
    `<span class="news__evt">${esc(r.evt)}</span>` +
    `<span class="news__tag">${esc(r.tag)}</span></div>`
  ).join('');
}

/* ---------- 指标表 ---------- */
function renderMetrics(elId, data) {
  const el = document.getElementById(elId);
  if (!el || !data) return;
  el.innerHTML = data.metrics.map(m =>
    `<div class="metric-row"><span class="metric-row__name">${esc(m.name)}</span>` +
    `<span class="metric-row__value">${esc(m.value)}</span>` +
    `<span class="metric-row__note">${esc(m.note)}</span></div>`
  ).join('');
}

/* ---------- 项目卡左信息 ---------- */
function renderProjectMeta() {
  if (ISAAC_PROJECT) {
    document.getElementById('projIsaacTitle').textContent = ISAAC_PROJECT.title;
    document.getElementById('projIsaacSub').textContent = ISAAC_PROJECT.subtitle;
  }
  if (PUSHT_PROJECT) {
    document.getElementById('projPushTitle').textContent = PUSHT_PROJECT.title;
    document.getElementById('projPushSub').textContent = PUSHT_PROJECT.subtitle;
  }
}

/* ---------- 实验弧表格 ---------- */
function renderArc() {
  const tbody = document.getElementById('arcBody');
  if (!tbody || !EXPERIMENT_ARC) return;
  tbody.innerHTML = EXPERIMENT_ARC.rows.map((r, i) => {
    let dot = '', badge = '';
    if (i === 6)      { dot = '<i class="arc-dot dot-blue"></i>';   badge = '<span class="arc-badge badge-best">最近</span>'; }
    else if (i === 5) { dot = '<i class="arc-dot dot-green"></i>';  badge = '<span class="arc-badge badge-good">进展</span>'; }
    else if (i === 4) { dot = '<i class="arc-dot dot-red"></i>';    badge = '<span class="arc-badge badge-fail">失效</span>'; }
    return `<tr>` +
      `<td class="arc-no">${String(i + 1).padStart(2, '0')}</td>` +
      `<td class="arc-cfg">${dot}${esc(r.cfg)}${badge}</td>` +
      `<td class="arc-loss">${esc(r.loss)}</td>` +
      `<td class="arc-beh">${esc(r.behavior)}</td>` +
      `<td class="arc-take">${esc(r.takeaway)}</td></tr>`;
  }).join('');
  document.getElementById('arcConclusion').textContent = '结论：' + EXPERIMENT_ARC.conclusion;
}

/* ---------- 媒体墙 ---------- */
function renderWall() {
  const grid = document.getElementById('wallGrid');
  grid.innerHTML = MEDIA_WALL.map((m, i) => {
    const span = (i === MEDIA_WALL.length - 1) ? ' wall__item--span' : '';
    if (m.type === 'image') {
      return `<figure class="wall__item wall__item--img${span}" data-kind="img">` +
        `<img src="${m.src}" alt="${esc(m.label)}" loading="lazy" />` +
        `<figcaption class="wall__cap"><span class="wall__tag">${esc(m.tag)}</span><span class="wall__label mono">${esc(m.label)}</span></figcaption>` +
        `<p class="wall__note">${esc(m.caption)}</p></figure>`;
    }
    return `<figure class="wall__item wall__item--vid${span}" data-src="${m.src}" data-cap="${esc(m.caption)}" data-poster="${m.poster}" role="button" tabindex="0">` +
      `<video muted loop playsinline preload="none" poster="${m.poster}">` +
      `<source src="${m.src}" type="video/mp4" /></video>` +
      `<button class="vbtn--mini" aria-label="播放 ${esc(m.label)}">▶</button>` +
      `<figcaption class="wall__cap"><span class="wall__tag">${esc(m.tag)}</span><span class="wall__label mono">${esc(m.label)}</span></figcaption>` +
      `<p class="wall__note">${esc(m.caption)}</p></figure>`;
  }).join('');

  grid.querySelectorAll('.wall__item--vid').forEach(item => {
    const open = () => openLightbox(item.dataset.src, item.dataset.poster, item.dataset.cap);
    item.addEventListener('click', open);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });
}

/* ---------- lightbox ---------- */
function openLightbox(src, poster, cap) {
  const lbVideo = document.getElementById('lightboxVideo');
  const lb = document.getElementById('lightbox');
  lbVideo.src = src;
  lbVideo.poster = poster;
  document.getElementById('lightboxCap').textContent = cap || '';
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  lbVideo.currentTime = 0;
  if (!reduced) lbVideo.play().catch(() => {});
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.getElementById('lightboxVideo').pause();
}
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});
document.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('lightbox').classList.contains('open')) closeLightbox();
});

/* ---------- 写作 ---------- */
function renderPosts() {
  const list = document.getElementById('postList');
  const first = POSTS[0];
  if (first) {
    document.getElementById('featuredTitle').textContent = first.title;
    document.getElementById('featuredDate').textContent = first.date;
    document.getElementById('featuredChip').textContent = first.tag;
  }
  list.innerHTML = POSTS.slice(1).map(p =>
    `<a class="log__row" href="https://github.com/Jiatong-Wei" target="_blank" rel="noopener">` +
    `<span class="log__date">${p.date}</span>` +
    `<span class="log__title">${esc(p.title)}</span>` +
    `<span class="log__tag">${p.tag}</span></a>`
  ).join('');
}

/* ---------- 关于 ---------- */
function renderAbout() {
  const tags = document.getElementById('aboutTags');
  if (tags) tags.innerHTML = TAGS.map(t => `<span class="tag">${esc(t)}</span>`).join('');
  const tl = document.getElementById('aboutTimeline');
  if (tl) tl.innerHTML = TIMELINE.map(t =>
    `<div class="tl__row"><span class="tl__year">${t.year}</span>` +
    `<span class="tl__event">${esc(t.event)}</span></div>`
  ).join('');
  const links = document.getElementById('aboutLinks');
  if (links) links.innerHTML = LINKS.map(l =>
    `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`
  ).join('');
}

/* ---------- 面板切换(hash + 级联) ---------- */
function showPanel(name, fromInit) {
  if (!PANELS.includes(name)) name = 'home';
  const cur = document.querySelector('.pane.is-active');
  const next = document.getElementById(`pane-${name}`);
  if (cur === next) return;

  if (cur) {
    cur.classList.remove('is-active');
    if (!reduced) { cur.classList.add('is-leaving'); setTimeout(() => cur.classList.remove('is-leaving'), 90); }
  }
  next.classList.add('is-active');

  // 级联:给面板子元素加 cascade + stagger delay
  if (!reduced) {
    next.classList.remove('is-entering');
    void next.offsetWidth;
    next.classList.add('is-entering');
    const rows = next.querySelectorAll('.pane__title, .metric-row, .arc-table tbody tr, .log__row, .wall__item, .news__row, .tl__row, .featured, .proj, .about__col, .tags, .home__left, .home__right');
    rows.forEach((r, i) => {
      r.classList.remove('cascade', 'c-on');
      void r.offsetWidth;
      r.classList.add('cascade');
      r.style.setProperty('--cd', `${i * 25}ms`);
    });
    setTimeout(() => {
      rows.forEach(r => r.classList.add('c-on'));
      setTimeout(() => {
        rows.forEach(r => r.classList.remove('cascade', 'c-on'));
        next.classList.remove('is-entering');
      }, 420);
    }, 10);
  }

  document.querySelectorAll('.rail__item').forEach(a =>
    a.classList.toggle('is-active', a.dataset.panel === name)
  );
  moveRailBar(name);
  if (!fromInit && location.hash !== `#${name}`) history.pushState(null, '', `#${name}`);
}

/* ---------- 左轨指示条 FLIP ---------- */
function moveRailBar(name) {
  const item = document.querySelector(`.rail__item[data-panel="${name}"]`);
  if (!item || reduced) return;
  let bar = document.querySelector('.rail-bar');
  if (!bar) { bar = document.createElement('i'); bar.className = 'rail-bar'; document.querySelector('.rail').appendChild(bar); }
  bar.style.top = `${item.offsetTop}px`;
  bar.style.height = `${item.offsetHeight}px`;
}

/* ---------- 面板事件 ---------- */
document.querySelectorAll('.rail__item').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showPanel(a.dataset.panel);
  });
});
window.addEventListener('hashchange', () => showPanel(location.hash.slice(1)));

/* ---------- 状态栏时钟 + 光标 ---------- */
const clockEl = document.getElementById('clock');
function tickClock() {
  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  clockEl.textContent = `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);

/* ---------- boot(session 内一次, ≤600ms) ---------- */
function boot() {
  if (reduced || sessionStorage.getItem('ip-booted')) {
    showPanel(location.hash.slice(1) || 'home', true);
    return;
  }
  sessionStorage.setItem('ip-booted', '1');
  // 快速串联：顶栏 → 左轨逐项 → 面板级联（CSS class 驱动，终态不依赖 inline style）
  const railItems = document.querySelectorAll('.rail__item');
  railItems.forEach(a => a.classList.remove('is-active'));
  document.body.classList.add('is-booting');
  const target = PANELS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  setTimeout(() => {
    document.body.classList.remove('is-booting');
    showPanel(target, true);
    railItems.forEach(a => a.classList.toggle('is-active', a.dataset.panel === target));
    moveRailBar(target);
  }, 480);
}

/* ---------- init ---------- */
renderHome();
renderProjectMeta();
renderMetrics('projIsaacMetrics', ISAAC_PROJECT);
renderMetrics('projPushMetrics', PUSHT_PROJECT);
renderArc();
renderWall();
renderPosts();
renderAbout();
fit();
boot();
