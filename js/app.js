/* ============================================================
   LEO.WEI // Instrument Panel — 交互层 v6
   1. 数据渲染(指标表/实验弧表格/媒体墙/写作/关于)
   2. 面板切换(hash 同步, 120ms 淡入, 无位移)
   3. 媒体 lightbox(遮罩+居中视频, Esc/遮罩关闭)
   4. 状态栏时钟
   所有交互 ≤150ms, respect prefers-reduced-motion
   ============================================================ */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PANELS = ['work', 'arc', 'media', 'writing', 'about'];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- 指标表(项目卡右侧) ---------- */
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

/* ---------- 媒体墙 + lightbox ---------- */
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
const lightbox = document.getElementById('lightbox');
const lbVideo = document.getElementById('lightboxVideo');
const lbCap = document.getElementById('lightboxCap');

function openLightbox(src, poster, cap) {
  lbVideo.src = src;
  lbVideo.poster = poster;
  lbCap.textContent = cap || '';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  lbVideo.currentTime = 0;
  if (!reduced) lbVideo.play().catch(() => {});
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lbVideo.pause();
}

lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});
document.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
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
  list.innerHTML = POSTS.map(p =>
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

/* ---------- 面板切换(hash 同步) ---------- */
function showPanel(name, fromHash) {
  if (!PANELS.includes(name)) name = 'work';
  const cur = document.querySelector('.pane.is-active');
  const next = document.getElementById(`pane-${name}`);
  if (cur === next) return;

  if (cur) cur.classList.remove('is-active');
  next.classList.add('is-active');
  if (!reduced) {
    next.classList.remove('fade-in');
    void next.offsetWidth;            // 重启动画
    next.classList.add('fade-in');
  }
  document.querySelectorAll('.rail__item').forEach(a =>
    a.classList.toggle('is-active', a.dataset.panel === name)
  );
  if (!fromHash && location.hash !== `#${name}`) {
    history.pushState(null, '', `#${name}`);
  }
}

document.querySelectorAll('.rail__item').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showPanel(a.dataset.panel);
  });
});

window.addEventListener('hashchange', () => {
  showPanel(location.hash.slice(1));
});

/* ---------- 状态栏时钟 ---------- */
const clockEl = document.getElementById('clock');
function tickClock() {
  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  clockEl.textContent = `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);

/* ---------- init ---------- */
renderProjectMeta();
renderMetrics('projIsaacMetrics', ISAAC_PROJECT);
renderMetrics('projPushMetrics', PUSHT_PROJECT);
renderArc();
renderWall();
renderPosts();
renderAbout();
showPanel(location.hash.slice(1), true);
