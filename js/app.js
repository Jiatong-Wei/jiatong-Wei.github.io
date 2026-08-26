/* ============================================================
   LEO.WEI // Swiss Editorial Light — 交互层 v5
   渲染数据层(js/data.js) + 瑞士编辑式长页动效:
   1. 数据渲染(项目卡/实验弧时间线/方法/媒体墙/写作/关于)
   2. hero 视频点击播放
   3. scroll-reveal(IntersectionObserver, respect prefers-reduced-motion)
   4. hero 统计数字滚动计数
   ============================================================ */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- 项目卡渲染 ---------- */
function renderProject(elId, data) {
  const el = document.getElementById(elId);
  if (!el || !data) return;
  el.querySelector('.projcard__title').textContent = data.title;
  el.querySelector('.projcard__sub').textContent = data.subtitle;
  el.querySelector('.projcard__metrics').innerHTML = data.metrics.map(m =>
    `<div class="pmetric"><span class="pmetric__name">${esc(m.name)}</span>` +
    `<span class="pmetric__value">${esc(m.value)}</span>` +
    `<span class="pmetric__note">${esc(m.note)}</span></div>`
  ).join('');
  el.querySelector('.projcard__note').textContent = data.note;
}

/* ---------- 实验弧时间线 ---------- */
function renderArc() {
  const tl = document.getElementById('arcTimeline');
  if (!tl || !EXPERIMENT_ARC) return;
  const NUM = ['01', '02', '03', '04', '05', '06', '07'];
  tl.innerHTML = EXPERIMENT_ARC.rows.map((r, i) => {
    let cls = 'tl-item', badge = '';
    if (i === 6) { cls += ' tl-item--best'; badge = '<span class="cfg-badge cfg-badge--best">最近</span>'; }
    else if (i === 5) { cls += ' tl-item--good'; badge = '<span class="cfg-badge cfg-badge--good">进展</span>'; }
    else if (i === 4) { cls += ' tl-item--fail'; badge = '<span class="cfg-badge cfg-badge--fail">失效</span>'; }
    return `<div class="${cls} reveal">` +
      `<div class="tl-item__num">${NUM[i]}</div>` +
      `<div class="tl-item__body">` +
      `<div class="tl-item__cfg">${esc(r.cfg)}${badge}<span class="mono tl-item__loss">loss ${esc(r.loss)}</span></div>` +
      `<p class="tl-item__setup">${esc(r.setup)}</p>` +
      `<p class="tl-item__behavior">${esc(r.behavior)}</p>` +
      `<p class="tl-item__takeaway">${esc(r.takeaway)}</p>` +
      `</div></div>`;
  }).join('');

  const steps = document.getElementById('methodList');
  steps.innerHTML = EXPERIMENT_ARC.method.map(m => `<li>${esc(m)}</li>`).join('');
  document.getElementById('arcConclusion').textContent = '结论：' + EXPERIMENT_ARC.conclusion;
}

/* ---------- 视频墙 ---------- */
function renderWall() {
  const grid = document.getElementById('wallGrid');
  grid.innerHTML = MEDIA_WALL.map((m, i) => {
    if (m.type === 'image') {
      return `<figure class="wall__item reveal" style="transition-delay:${(i % 3) * 60}ms">` +
        `<img src="${m.src}" alt="${esc(m.label)}" loading="lazy" />` +
        `<figcaption class="wall__cap"><span class="wall__tag">${esc(m.tag)}</span><span class="wall__label mono">${esc(m.label)}</span></figcaption>` +
        `<p class="wall__note">${esc(m.caption)}</p></figure>`;
    }
    return `<figure class="wall__item wall__item--vid reveal" style="transition-delay:${(i % 3) * 60}ms">` +
      `<video muted loop playsinline preload="none" poster="${m.poster}">` +
      `<source src="${m.src}" type="video/mp4" /></video>` +
      `<button class="vbtn--mini" aria-label="播放/暂停 ${esc(m.label)}">▶</button>` +
      `<figcaption class="wall__cap"><span class="wall__tag">${esc(m.tag)}</span><span class="wall__label mono">${esc(m.label)}</span></figcaption>` +
      `<p class="wall__note">${esc(m.caption)}</p></figure>`;
  }).join('');

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

/* ---------- hero 视频 ---------- */
function initHeroVideo() {
  const vid = document.getElementById('heroVideo');
  const btn = document.getElementById('heroVideoBtn');
  if (!vid || !btn) return;
  const toggle = () => {
    if (vid.paused) { vid.play(); btn.textContent = '❚❚ 暂停'; }
    else { vid.pause(); btn.textContent = '▶ 播放混剪 43s'; }
  };
  btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  vid.addEventListener('click', toggle);
  vid.addEventListener('play', () => { btn.textContent = '❚❚ 暂停'; });
  vid.addEventListener('pause', () => { btn.textContent = '▶ 播放混剪 43s'; });
}

/* ---------- 写作 ---------- */
function renderPosts() {
  const list = document.getElementById('postList');
  const first = POSTS[0];
  const count = document.getElementById('postCount');
  if (count) count.textContent = `共 ${POSTS.length} 篇 · UPDATED 2026.08.26`;
  const fTitle = document.getElementById('featuredTitle');
  const fDate = document.getElementById('featuredDate');
  const fChip = document.getElementById('featuredChip');
  if (first) {
    if (fTitle) fTitle.textContent = first.title;
    if (fDate) fDate.textContent = first.date;
    if (fChip) fChip.textContent = first.tag;
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

/* ---------- scroll-reveal ---------- */
function initReveal() {
  if (reduced) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ---------- hero 统计计数 ---------- */
function initCount() {
  const els = document.querySelectorAll('.hstat__num[data-count]');
  if (reduced) {
    els.forEach(el => { el.textContent = el.dataset.count; });
    return;
  }
  const animate = el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const dur = 1000;
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(dec);
    })(start);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
}

/* ---------- init ---------- */
renderProject('projIsaac', ISAAC_PROJECT);
renderProject('projPush', PUSHT_PROJECT);
renderArc();
renderWall();
renderPosts();
renderAbout();
initHeroVideo();
initReveal();
initCount();
