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
  'EEEEE        EEEEE', // ear bases: 5+8+5
  'HHHHHHHHHHHHHHHHHH', // head top, full face width — both ears sit on its ends
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
          // gaps render as transparent blocks, NOT spaces: the space glyph can
          // have a different advance than █ (per-glyph font fallback), which
          // shifts everything after a gap — measured as 15px vs 30px at 30px font
          if (ch === '.' || ch === ' ') return seg('pc-gap', '█');
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
  if (bubbleTimer !== null) window.clearTimeout(bubbleTimer); // a short bubble must not kill a longer one early
  bubbleTimer = window.setTimeout(() => {
    el.classList.remove('show');
    bubbleTimer = null;
  }, ms);
}

let bubbleTimer: number | null = null;
let tiltTimer: number | null = null;
let suppressBark = false;
let blankRect: ((x: number, y: number, w: number, h: number) => boolean) | null = null;

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
  if (tiltTimer !== null) {
    window.clearTimeout(tiltTimer);
    tiltTimer = null;
  }
}

function tiltFor(ms: number): void {
  setTilt(true);
  tiltTimer = window.setTimeout(() => {
    setTilt(false);
    tiltTimer = null;
  }, ms);
}

function walk(): void {
  const el = container;
  if (!el || hidden || sleeping || sitting) return;
  const rect = el.getBoundingClientRect();
  const margin = 8;
  const maxX = window.innerWidth - rect.width - margin;
  const maxY = window.innerHeight - rect.height - margin;
  // pick a blank spot: bottom-band strolls or a lane up the right side —
  // candidates are rejected when they would cover terminal text
  let nextX = rect.left;
  let nextY = rect.top;
  let ok = false;
  for (let attempt = 0; attempt < 6 && !ok; attempt++) {
    if (Math.random() < 0.35) {
      nextX = Math.max(maxX - 60 - Math.random() * 100, margin);
      nextY = Math.min(Math.max(70 + Math.random() * (window.innerHeight * 0.55), margin + 60), maxY);
    } else {
      nextX = margin + Math.random() * Math.max(40, maxX - margin);
      nextY = maxY;
    }
    nextX = Math.min(maxX, Math.max(margin, nextX));
    ok = !blankRect || blankRect(nextX, nextY, rect.width, rect.height);
  }
  if (!ok) return; // every candidate would cover text — stay put
  const dist = Math.hypot(nextX - rect.left, nextY - rect.top);
  if (dist < 24) return;
  walking = true;
  el.classList.add('walk'); // head bob while strolling
  el.style.transitionDuration = `${Math.max(700, Math.round(dist * 5))}ms`;
  el.style.left = `${Math.round(nextX)}px`;
  el.style.top = `${Math.round(nextY)}px`;
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  window.setTimeout(() => {
    walking = false;
    el.classList.remove('walk');
    el.style.transitionDuration = ''; // or every later sit-tilt inherits the walk duration
  }, Math.max(700, Math.round(dist * 5)) + 80);
}

function sniff(): void {
  // little two-tap bounce — UMI inspecting the floor
  hop();
  window.setTimeout(hop, 260);
}

function scheduleBehavior(): void {
  if (behaviorTimer !== null) window.clearTimeout(behaviorTimer);
  behaviorTimer = window.setTimeout(() => {
    if (!hidden && !sleeping && !walking) {
      const roll = Math.random();
      if (roll < 0.55) walk();
      else if (roll < 0.7) {
        blinkUntil = Date.now() + 220;
        render();
      } else if (roll < 0.82) {
        tiltFor(2500 + Math.random() * 3000); // curious head tilt
      } else {
        sniff();
      }
    }
    scheduleBehavior();
  }, 3500 + Math.random() * 6000);
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
  container.title = '优米 UMI — 点我会有汪';
  container.innerHTML = '<div class="pet-bubble"></div><pre></pre>';
  document.body.appendChild(container);

  container.addEventListener('click', () => {
    if (suppressBark) {
      suppressBark = false; // that pointer sequence was a drag, not a pat
      return;
    }
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
    el.classList.add('dragging'); // kill the left-transition so the pet tracks the pointer
    // assignment (not addEventListener) so a new pointerdown replaces any
    // dangling pair, and cancel is handled alongside up — no listener leaks
    el.onpointermove = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 6) suppressBark = true;
      const left = Math.min(window.innerWidth - rect.width - 4, Math.max(4, originLeft + ev.clientX - startX));
      const top = Math.min(window.innerHeight - rect.height - 4, Math.max(30, originTop + ev.clientY - startY));
      el.style.left = `${Math.round(left)}px`;
      el.style.top = `${Math.round(top)}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    };
    const release = () => {
      el.onpointermove = null;
      el.onpointerup = null;
      el.onpointercancel = null;
      el.classList.remove('dragging');
    };
    el.onpointerup = release;
    el.onpointercancel = release;
  });

  renderTimer = window.setInterval(render, 1100); // idle blink/eye refresh
  scheduleBehavior();
  scheduleSleep();
}

export interface PetDeps {
  /** True when the screen rectangle (viewport px) covers no terminal text. */
  isBlankRect?: (x: number, y: number, w: number, h: number) => boolean;
}

export function initPet(deps: PetDeps = {}): PetApi {
  if (api) return api;
  blankRect = deps.isBlankRect ?? null;
  mount();
  api = {
    notify: () => {
      markInteraction();
      hop();
      // fresh output may now run under UMI — duck to a blank corner if covered
      const el = container;
      if (el && blankRect) {
        const r = el.getBoundingClientRect();
        if (!blankRect(r.left, r.top, r.width, r.height)) {
          el.style.transitionDuration = '600ms';
          el.style.left = `${Math.round(window.innerWidth - r.width - 18)}px`;
          el.style.top = `${Math.round(window.innerHeight - r.height - 6)}px`;
          el.style.right = 'auto';
          el.style.bottom = 'auto';
          window.setTimeout(() => {
            el.style.transitionDuration = '';
          }, 650);
        }
      }
    },
    run: (action: string): string => {
      switch (action) {
        case 'pet':
          if (hidden) return '优米已躲起来 — pet on 唤回';
          bark();
          return `${C.accent}优米${R} 开心地蹭了蹭你`;
        case 'sit':
          if (hidden) return '优米已躲起来 — pet on 唤回';
          markInteraction();
          tiltFor(3000);
          return `${C.accent}优米${R} 歪了歪头（等指令）`;
        case 'spin':
          if (hidden) return '优米已躲起来 — pet on 唤回';
          spin();
          return `${C.accent}优米${R} 原地转了个圈`;
        case 'sleep':
          sleeping = true;
          render();
          return `${C.accent}优米${R} 趴下睡了`;
        case 'wake':
          markInteraction();
          return `${C.accent}优米${R} 一个激灵精神了`;
        case 'off':
          hidden = true;
          if (container) container.style.display = 'none';
          return '优米回狗窝了（pet on 唤回）';
        case 'on':
          hidden = false;
          if (container) container.style.display = '';
          markInteraction();
          return '优米回到岗哨';
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
