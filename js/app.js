/* LEO.WEI // NIGHT CITY — 交互层 v3
   1. 开机序列（终端自检逐行打出 → 整体上滑揭示 → 内容错峰入场 → 姓名解码）
   2. Tab 切换（旧面板滑出 + 新面板浮入级联）
   3. 数据雨 / 4. 夜城时钟 / 5. 霓虹随机闪烁
   所有动效尊重 prefers-reduced-motion。 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  clockEl.innerHTML = `${y}.${p(now.getMonth() + 1)}.${p(now.getDate())} // ${p(now.getHours())}<span class="c">:</span>${p(now.getMinutes())}<span class="c">:</span>${p(now.getSeconds())}`;
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

/* ---------- 6. 无规律 RGB 故障（hover 驱动） ----------
   真实信号干扰不是匀速的：在随机间隔（40~340ms）随机切换
   三种错位姿态，偶尔完全归位——这才是"活"的故障。 */
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
