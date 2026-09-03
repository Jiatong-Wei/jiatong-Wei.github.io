// robo — the terminal desktop pet. A front-facing quadruped robot dog
// (四足机器狗), built from solid color blocks like a terminal logo: cyan head,
// yellow eyes, green body with a chest LED, blue front legs and green rear
// legs. Walks with a two-frame leg gait, blinks, sits, wags, sleeps when
// ignored, barks on click and hops whenever the shell runs a command.

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
let gait = 0; // 0|1 — walk frame
let walking = false;
let lastInteraction = Date.now();
let renderTimer: number | null = null;
let behaviorTimer: number | null = null;
let sleepTimer: number | null = null;

const seg = (cls: string, text: string) => `<i class="${cls}">${text}</i>`;

/** Front-view block dog. eyes: 'open'|'blink'|'sleep'|'happy'; gait picks leg spread. */
function sprite(eyes: string, gaitFrame: 0 | 1, sit: boolean, lying: boolean): string {
  const earL = seg('pc-ear', '██');
  const earR = seg('pc-ear', '██');
  const headL = seg('pc-head', '███');
  const headR = seg('pc-head', '███');
  const headTop = seg('pc-head', '█████████████');
  const jaw = seg('pc-head', '█████████████');

  let face: string;
  if (lying) face = seg('pc-head', '███') + seg('pc-eye', ' ▄▄ ▄▄ ') + seg('pc-head', '███');
  else if (eyes === 'open') face = headL + seg('pc-eye', '██') + seg('pc-head', ' ') + seg('pc-eye', '██') + headR;
  else if (eyes === 'happy') face = headL + seg('pc-eyeH', '██') + seg('pc-head', ' ') + seg('pc-eyeH', '██') + headR;
  else face = seg('pc-head', '███████████████'); // blink/sleep: eyes shut, solid face

  const legsA =
    seg('pc-legF', '██') + '  ' + seg('pc-legR', '██') + '  ' + seg('pc-legR', '██') + '  ' + seg('pc-legF', '██');
  const legsB =
    seg('pc-legF', ' ██') + ' ' + seg('pc-legR', '████') + ' ' + seg('pc-legF', '██ ');
  const pawsA =
    seg('pc-paw', '▄▄') + '  ' + seg('pc-paw', '▄▄') + '  ' + seg('pc-paw', '▄▄') + '  ' + seg('pc-paw', '▄▄');
  const pawsB =
    seg('pc-paw', ' ▄▄') + ' ' + seg('pc-paw', '▄▄▄▄') + ' ' + seg('pc-paw', '▄▄ ');

  if (lying) {
    return [
      seg('pc-ear', ' ██   ██ '),
      seg('pc-head', '█████████████'),
      face,
      seg('pc-body', '███████████████'),
      seg('pc-paw', '▀▀▀▀▀▀▀▀▀▀▀▀▀▀'),
    ].join('\n');
  }
  if (sit) {
    return [
      seg('pc-ear', ' ██       ██ ') + (eyes === 'happy' ? seg('pc-eyeH', ' ♥') : ''),
      seg('pc-head', '███████████████'),
      face,
      jaw,
      seg('pc-body', '███████████████'),
      seg('pc-legF', '███') + '     ' + seg('pc-legF', '███'),
      seg('pc-paw', '▄▄▄') + '   ' + seg('pc-paw', '▄▄▄') + seg('pc-legR', '  ▄▄▄▄▄▄▄'),
    ].join('\n');
  }
  const legs = gaitFrame === 0 ? legsA : legsB;
  const paws = gaitFrame === 0 ? pawsA : pawsB;
  const chest = seg('pc-body', '█████') + seg('pc-led', '▄▄') + seg('pc-body', '████████');
  return [
    earL + '       ' + earR,
    headTop,
    face,
    jaw,
    chest,
    legs,
    paws,
  ].join('\n');
}

function render(): void {
  if (!container || hidden) return;
  const pre = container.querySelector('pre')!;
  const eyes = sleeping ? 'sleep' : happyUntil > Date.now() ? 'happy' : blinkUntil > Date.now() ? 'blink' : 'open';
  pre.innerHTML = sprite(eyes, gait as 0 | 1, sitting, sleeping);
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

function walk(): void {
  if (!container || hidden || sleeping || sitting) return;
  const rect = container.getBoundingClientRect();
  const minX = 8;
  const maxX = window.innerWidth - rect.width - 8;
  let next = rect.left + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 150);
  if (next < minX || next > maxX) next = rect.left - (next - rect.left);
  next = Math.min(maxX, Math.max(minX, next));
  const dist = Math.abs(next - rect.left);
  if (dist < 12) return;
  walking = true;
  container.style.transitionDuration = `${Math.max(700, Math.round(dist * 5))}ms`;
  container.style.left = `${Math.round(next)}px`;
  container.style.right = 'auto'; // left+right together would stretch the fixed box
  const step = window.setInterval(() => {
    gait = gait ? 0 : 1;
    render();
  }, 150);
  window.setTimeout(() => {
    window.clearInterval(step);
    walking = false;
    render();
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
      } else if (roll < 0.9 && !sitting) {
        sitting = true;
        render();
        window.setTimeout(() => {
          sitting = false;
          render();
        }, 4000 + Math.random() * 4000);
      } else {
        sitting = true;
        render();
        window.setTimeout(() => {
          sitting = false;
          render();
        }, 3000);
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

  renderTimer = window.setInterval(render, 1100); // idle blink refresh
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
          return `${C.accent}robo${R} 摇着尾巴蹭了蹭你`;
        case 'sit':
          if (hidden) return 'robo 已隐藏 — pet on 唤回';
          markInteraction();
          sitting = true;
          render();
          return `${C.accent}robo${R} 坐下了（等指令）`;
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
          return `${C.accent}robo${R} 一个激灵站起来`;
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
