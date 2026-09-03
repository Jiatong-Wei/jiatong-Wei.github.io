// robo — the terminal desktop pet. A mini mecanum rover that lives on the
// bottom edge of the terminal: wanders, blinks, sleeps when ignored, spins
// on click (mecanum party trick), and reacts to shell activity.
// Rendered as monospace glyphs so it stays native to the terminal look.

import { C, R } from './ansi';

const EYES = { open: '▪ ▪', blink: '─ ─', sleep: '▄ ▄', happy: '♥ ♥' };
const WHEELS = ['◎', '◉', '○', '◎'];

export interface PetApi {
  /** Called after every command run — robo hops. */
  notify(): void;
  /** Run a pet action by name: pet | spin | sleep | wake | on | off. Returns status text. */
  run(action: string): string;
  visible(): boolean;
}

let container: HTMLDivElement | null = null;
let api: PetApi | null = null;
let hidden = false;
let sleeping = false;
let happyUntil = 0;
let blinkUntil = 0;
let wheelIdx = 0;
let driving = false;
let lastInteraction = Date.now();
let renderTimer: number | null = null;
let behaviorTimer: number | null = null;
let sleepTimer: number | null = null;

function sprite(): string {
  const eyes = sleeping ? EYES.sleep : happyUntil > Date.now() ? EYES.happy : blinkUntil > Date.now() ? EYES.blink : EYES.open;
  const w = driving ? WHEELS[wheelIdx % WHEELS.length] : '◎';
  const w2 = driving ? WHEELS[(wheelIdx + 2) % WHEELS.length] : '◎';
  const body = sleeping
    ? ['  ╭─────╮', '  │     │', '  ╰─────╯']
    : [' ╭─────╮', ` │ ${eyes} │`, `╰${w}───${w2}╯`];
  const antenna = sleeping ? '        ' : '   ╭─╮  ';
  return [antenna, ...body].join('\n');
}

function render(): void {
  if (!container || hidden) return;
  const pre = container.querySelector('pre')!;
  pre.textContent = sprite();
}

function bubble(text: string, ms = 1400): void {
  if (!container || hidden) return;
  const el = container.querySelector('.pet-bubble') as HTMLDivElement;
  el.textContent = text;
  el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), ms);
}

function markInteraction(): void {
  lastInteraction = Date.now();
  if (sleeping) {
    sleeping = false;
    scheduleSleep();
    bubble('beep!', 900);
  }
  render();
}

function hop(): void {
  if (!container || hidden || sleeping) return;
  container.classList.remove('hop');
  void container.offsetWidth; // restart animation
  container.classList.add('hop');
}

function spin(): void {
  if (!container || hidden) return;
  markInteraction();
  container.classList.remove('spin');
  void container.offsetWidth;
  container.classList.add('spin');
  driving = true;
  window.setTimeout(() => {
    driving = false;
    render();
  }, 900);
  bubble('（原地转圈：麦克纳姆轮基本功）', 1800);
}

function wander(): void {
  if (!container || hidden || sleeping) return;
  const dx = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 140);
  const current = container.getBoundingClientRect();
  const minX = 8;
  const maxX = window.innerWidth - current.width - 8;
  let next = current.left + dx;
  if (next < minX || next > maxX) next = current.left - dx;
  next = Math.min(maxX, Math.max(minX, next));
  driving = true;
  container.style.left = `${Math.round(next)}px`;
  const dist = Math.abs(next - current.left);
  const step = window.setInterval(() => {
    wheelIdx++;
    render();
  }, 90);
  window.setTimeout(() => {
    window.clearInterval(step);
    driving = false;
    render();
  }, Math.max(600, dist * 4));
}

function scheduleBehavior(): void {
  if (behaviorTimer !== null) window.clearTimeout(behaviorTimer);
  behaviorTimer = window.setTimeout(() => {
    if (!hidden && !sleeping) {
      Math.random() < 0.7 ? wander() : (blinkUntil = Date.now() + 200);
      render();
    }
    scheduleBehavior();
  }, 6000 + Math.random() * 9000);
}

function scheduleSleep(): void {
  if (sleepTimer !== null) window.clearTimeout(sleepTimer);
  sleepTimer = window.setTimeout(() => {
    if (!hidden && Date.now() - lastInteraction > 60000) {
      sleeping = true;
      render();
      bubble('zzz…', 2500);
    }
    scheduleSleep();
  }, 15000);
}

function mount(): void {
  container = document.createElement('div');
  container.id = 'pet';
  container.title = 'robo — 点我会转圈';
  container.innerHTML = '<div class="pet-bubble"></div><pre></pre>';
  document.body.appendChild(container);

  container.addEventListener('click', (e) => {
    e.stopPropagation();
    markInteraction();
    spin();
  });
  container.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    markInteraction();
    const el = container;
    if (!el) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    const originLeft = rect.left;
    const originTop = rect.top;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const left = Math.min(window.innerWidth - rect.width - 4, Math.max(4, originLeft + ev.clientX - startX));
      const top = Math.min(window.innerHeight - rect.height - 4, Math.max(30, originTop + ev.clientY - startY));
      el.style.left = `${Math.round(left)}px`;
      el.style.top = `${Math.round(top)}px`;
      el.style.bottom = 'auto';
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  });

  renderTimer = window.setInterval(render, 1200); // idle blink/wheel refresh
  scheduleBehavior();
  scheduleSleep();
}

export function initPet(): PetApi {
  if (api) return api;
  mount();
  api = {
    notify: () => {
      markInteraction();
      hop();
    },
    run: (action: string): string => {
      switch (action) {
        case 'pet':
          if (hidden) return 'robo 已隐藏 — pet on 唤回';
          markInteraction();
          happyUntil = Date.now() + 2000;
          hop();
          bubble('♥', 1200);
          return `${C.accent}robo${R} 开心地原地弹了一下`;
        case 'spin':
          if (hidden) return 'robo 已隐藏 — pet on 唤回';
          spin();
          return `${C.accent}robo${R} 原地旋转 360°（麦轮特权）`;
        case 'sleep':
          sleeping = true;
          render();
          return `${C.accent}robo${R} 蜷进壳里睡了`;
        case 'wake':
          markInteraction();
          return `${C.accent}robo${R} 醒了，天线支棱起来`;
        case 'off':
          hidden = true;
          if (container) container.style.display = 'none';
          return 'robo 收工回充电座（pet on 唤回）';
        case 'on':
          hidden = false;
          if (container) container.style.display = '';
          markInteraction();
          return 'robo 回到岗哨';
        default:
          return `pet: 未知动作 ${action} — 可用：pet | spin | sleep | wake | on | off`;
      }
    },
    visible: () => !hidden,
  };
  return api;
}

/** Pet handle for commands; mounts lazily if the main flow hasn't yet. */
export function getPet(): PetApi {
  if (!api) return initPet();
  return api;
}
