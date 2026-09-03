// robo — the terminal desktop pet. Like Claude Code's octopus, robo is ALL FACE: a big
// front-view robot-dog head built from solid color blocks — magenta sensor ears, cyan
// head, yellow block eyes, darker muzzle with nose and mouth. It wanders along the
// bottom edge with a head-bob, blinks, tilts when curious, sleeps when ignored, barks
// on click and hops whenever the shell runs a command.

import { C, R } from './ansi';

export interface PetApi {
  /** Called after every command run — the dog hops. */
  notify(): void;
  /** Run a pet action by name: pet | sit | spin | sleep | wake | on | off. Returns status text. */
  run(action: string): string;
  visible(): boolean;
}

let container: HTMLDivElement | null = null;
let api: PetApi | null = null;
let hidden = false;
let sleeping = false;
let sitting = false;
let happyUntil = 0;
let blinkUntil = 0;
let walking = false;
let lastInteraction = Date.now();
let renderTimer: number | null = null;
let behaviorTimer: number | null = null;
let sleepTimer: number | null = null;

const seg = (cls: string, text: string) => `<i class="${cls}">${text}</i>`;

// ALL FACE — the whole pet is a dog head, 18 cells × 9 rows. Ears are two
// isosceles triangles pointing up, seated on the head's top-left and top-right
// corners (tip 1 cell → 3 → 5, each centered on its own axis — no direction).
// Chars: E ear, H head, Y eye (rendered 2 cells wide), M muzzle, N nose/mouth, T tongue, . blank.
// Verified: every row renders exactly 18 cells.
const PALETTE: Record<string, string> = {
  E: 'pc-ear',
  H: 'pc-head',
  M: 'pc-muzzle',
  N: 'pc-nose',
  T: 'pc-eyeH', // tongue shares the happy-pink
};

const HEAD_BASE: string[] = [
  '  E            E  ', // ear tips (axis col 2 / col 15): 2sp+1+12sp+1+2sp
  ' EEE          EEE ', // ears: 1+3+10+3+1
  'EEEEE        EEEEE', // ear bases merge into head top: 5+8+5
  'HHHHHHHHHHHHHHHHHH',
  'HHHHHYHHHHYHHHHH', // eyes: 5 + eye2 + 4 + eye2 + 5 = 18 cells
  'HHHHHHHHHHHHHHHHHH',
  'HHHHHMMMMMMMMHHHHH', // muzzle: 5+8+5
  'HHHHHMMNNNNMMHHHHH', // nose: 5+2+4+2+5
  'HHHHHMMMMMMMMHHHHH', // chin / tongue row when happy
];

type PetState = 'open' | 'happy' | 'blink' | 'sleep';

function sprite(state: PetState): string {
  const eyeGlyph = state === 'sleep' || state === 'blink' ? '▄▄' : '██';
  const eyeCls = state === 'happy' ? 'pc-eyeH' : 'pc-eye';
  const base =
    state === 'happy'
      ? HEAD_BASE.map((r, i) => (i === 8 ? 'HHHHHMMTTTTMMHHHHH' : r)) // tongue out
      : HEAD_BASE;
  return base
    .map((row) =>
      [...row]
        .map((ch) => {
          if (ch === '.') return ' ';
          if (ch === 'Y') return seg(eyeCls, eyeGlyph);
          return seg(PALETTE[ch] ?? 'pc-head', '█');
        })
        .join(''),
    )
    .join('\n');
}

function render(): void {
  if (!container || hidden) return;
  const pre = container.querySelector('pre')!;
  const state: PetState = sleeping
    ? 'sleep'
    : happyUntil > Date.now()
      ? 'happy'
      : blinkUntil > Date.now()
        ? 'blink'
        : 'open';
  pre.innerHTML = sprite(state);
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
    bubble('汪！', 900);
  }
  render();
}

function hop(): void {
  if (!container || hidden || sleeping) return;
  container.classList.remove('hop');
  void container.offsetWidth; // restart animation
  container.classList.add('hop');
}

function bark(): void {
  markInteraction();
  happyUntil = Date.now() + 2000;
  hop();
  bubble('汪！汪！', 1400);
}

function spin(): void {
  if (!container || hidden) return;
  markInteraction();
  container.classList.remove('spin');
  void container.offsetWidth;
  container.classList.add('spin');
  bubble('（原地转圈）', 1200);
}

function setTilt(on: boolean): void {
  sitting = on;
  if (container) container.classList.toggle('sit', on);
}

function walk(): void {
  const el = container;
  if (!el || hidden || sleeping || sitting) return;
  const rect = el.getBoundingClientRect();
  const minX = 8;
  const maxX = window.innerWidth - rect.width - 8;
  let next = rect.left + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 150);
  if (next < minX || next > maxX) next = rect.left - (next - rect.left);
  next = Math.min(maxX, Math.max(minX, next));
  const dist = Math.abs(next - rect.left);
  if (dist < 12) return;
  walking = true;
  el.classList.add('walk'); // head bob while strolling
  el.style.transitionDuration = `${Math.max(700, Math.round(dist * 5))}ms`;
  el.style.left = `${Math.round(next)}px`;
  el.style.right = 'auto'; // left+right together would stretch the fixed box
  window.setTimeout(() => {
    walking = false;
    el.classList.remove('walk');
  }, Math.max(700, Math.round(dist * 5)) + 80);
}

function scheduleBehavior(): void {
  if (behaviorTimer !== null) window.clearTimeout(behaviorTimer);
  behaviorTimer = window.setTimeout(() => {
    if (!hidden && !sleeping && !walking) {
      const roll = Math.random();
      if (roll < 0.6) walk();
      else if (roll < 0.78) {
        blinkUntil = Date.now() + 220;
        render();
      } else {
        setTilt(true); // curious head tilt
        window.setTimeout(() => setTilt(false), 2500 + Math.random() * 3000);
      }
    }
    scheduleBehavior();
  }, 5500 + Math.random() * 8000);
}

function scheduleSleep(): void {
  if (sleepTimer !== null) window.clearTimeout(sleepTimer);
  sleepTimer = window.setTimeout(() => {
    if (!hidden && !sleeping && Date.now() - lastInteraction > 60000) {
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
  container.title = 'robo — 点我会有汪';
  container.innerHTML = '<div class="pet-bubble"></div><pre></pre>';
  document.body.appendChild(container);

  container.addEventListener('click', (e) => {
    e.stopPropagation();
    bark();
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
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  });

  renderTimer = window.setInterval(render, 1100); // idle blink/eye refresh
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
          bark();
          return `${C.accent}robo${R} 开心地蹭了蹭你`;
        case 'sit':
          if (hidden) return 'robo 已隐藏 — pet on 唤回';
          markInteraction();
          setTilt(true);
          window.setTimeout(() => setTilt(false), 3000);
          return `${C.accent}robo${R} 歪了歪头（等指令）`;
        case 'spin':
          if (hidden) return 'robo 已隐藏 — pet on 唤回';
          spin();
          return `${C.accent}robo${R} 原地转了个圈`;
        case 'sleep':
          sleeping = true;
          render();
          return `${C.accent}robo${R} 趴下睡了`;
        case 'wake':
          markInteraction();
          return `${C.accent}robo${R} 一个激灵精神了`;
        case 'off':
          hidden = true;
          if (container) container.style.display = 'none';
          return 'robo 回狗窝了（pet on 唤回）';
        case 'on':
          hidden = false;
          if (container) container.style.display = '';
          markInteraction();
          return 'robo 回到岗哨';
        default:
          return `pet: 未知动作 ${action} — 可用：pet | sit | spin | sleep | wake | on | off`;
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
