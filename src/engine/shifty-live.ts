// Shifty, alive. One shared ticker animates every Shifty on screen: the hem floats, the headset LED blinks,
// his tongue wiggles, he glances around, waves now and then, dozes off when you are idle, and reacts to the game.
// Put `<span class="mascot shifty-live" data-mood="dead" data-px="48">` anywhere; initShifty() brings it to life.
import { shiftySvg, type Look, type Pose } from './shifty';

interface Inst {
  el: HTMLElement;
  body: HTMLElement; // the svg lives here, so sparkles appended to `el` survive redraws
  px: number;
  mood: Pose;
  reactive: boolean;
  over: Pose | null; overUntil: number;
  frame: number; lastKey: string; lastPoke: number;
  nextBlink: number; blinkUntil: number; nextWave: number; waveUntil: number; nextGaze: number; gaze: -1 | 0 | 1;
}

const insts = new Set<Inst>();
let timer = 0;
const TICK = 140;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** The static markup (also the no-JS fallback); initShifty() upgrades it. */
export function shiftyHtml(mood: Pose = 'dead', px = 48, cls = '', reactive = false): string {
  return `<span class="mascot ${cls} shifty-live" data-mood="${mood}" data-px="${px}"${reactive ? ' data-reactive="1"' : ''}>${shiftySvg(mood, px)}</span>`;
}

function lookFor(i: Inst, now: number): Look {
  i.frame++;
  const idle = now - i.lastPoke > 40_000;
  const pose: Pose = i.over && now < i.overUntil ? i.over : idle && i.mood === 'dead' ? 'sleepy' : i.mood;
  if (i.over && now >= i.overUntil) i.over = null;
  if (now >= i.nextBlink) { i.blinkUntil = now + 170; i.nextBlink = now + rnd(2200, 5600); }
  if (now >= i.nextWave) { i.waveUntil = now + 1100; i.nextWave = now + rnd(7000, 14000); }
  if (now >= i.nextGaze) { i.gaze = ([-1, 0, 1] as const)[Math.floor(Math.random() * 3)]; i.nextGaze = now + rnd(2500, 6000); }
  const cheer = pose === 'cheer';
  const arm = cheer ? ((i.frame & 1) ? 3 : 0) : now < i.waveUntil && pose !== 'sleepy' ? ((i.frame & 1) ? 1 : 2) : 0;
  return {
    pose,
    hem: ((i.frame >> 1) & 1) as 0 | 1,
    arm: arm as Look['arm'],
    led: i.frame % 14 !== 0 && ((i.frame >> 2) & 1) === 0 ? true : i.frame % 6 < 4,
    tongue: ((i.frame >> 2) & 1) as 0 | 1,
    gaze: pose === 'dead' ? i.gaze : 0,
    blink: now < i.blinkUntil,
  };
}

function draw(i: Inst, look: Look): void {
  const key = JSON.stringify(look);
  if (key === i.lastKey) return;
  i.lastKey = key;
  i.body.innerHTML = shiftySvg(look, i.px);
}

function tick(): void {
  const now = performance.now();
  for (const i of insts) {
    if (!i.el.isConnected) { insts.delete(i); continue; }
    draw(i, lookFor(i, now));
  }
  if (!insts.size) { clearInterval(timer); timer = 0; }
}

export function mountShifty(el: HTMLElement): void {
  if (el.dataset.live) return;
  el.dataset.live = '1';
  for (const o of insts) if (!o.el.isConnected) insts.delete(o);
  const body = document.createElement('span');
  body.className = 'sf';
  el.textContent = '';
  el.appendChild(body);
  const now = performance.now();
  const i: Inst = {
    el, body, px: Number(el.dataset.px) || 48, mood: (el.dataset.mood as Pose) || 'dead', reactive: !!el.dataset.reactive,
    over: null, overUntil: 0, frame: 0, lastKey: '', lastPoke: now,
    nextBlink: now + rnd(800, 3000), blinkUntil: 0, nextWave: now + rnd(3000, 8000), waveUntil: 0, nextGaze: now + rnd(1500, 4000), gaze: 0,
  };
  (el as HTMLElement & { _s?: Inst })._s = i;
  insts.add(i);
  draw(i, lookFor(i, now));
  if (calm()) return; // reduced motion: a single still frame (reactions still swap the pose)
  if (!timer) timer = window.setInterval(tick, TICK);
}

/** Make one Shifty (or, with no argument, every "reactive" one: the little guy in the round header) react. */
export function shiftyReact(mood: Pose, ms = 1400, only?: HTMLElement): void {
  const now = performance.now();
  for (const i of insts) {
    if (only ? i.el !== only : !i.reactive) continue;
    i.over = mood; i.overUntil = now + ms; i.lastPoke = now;
    draw(i, lookFor(i, now));
    if (calm()) setTimeout(() => { if (i.el.isConnected) draw(i, lookFor(i, performance.now())); }, ms + 20);
  }
}

/** A few pixel sparkles rising from Shifty. */
function puff(el: HTMLElement): void {
  if (calm()) return;
  for (let k = 0; k < 4; k++) {
    const s = document.createElement('i');
    s.className = 'spark';
    s.textContent = ['✦', '✧', '★', '♥'][k % 4];
    s.style.left = 15 + k * 22 + '%';
    s.style.animationDelay = k * 70 + 'ms';
    el.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}

/** Upgrade every .shifty-live that appears, now or later. Call once at startup. */
export function initShifty(): void {
  const scan = () => document.querySelectorAll<HTMLElement>('.shifty-live:not([data-live])').forEach(mountShifty);
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
  // poking Shifty anywhere makes him cheer (and wakes him up)
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.shifty-live');
    if (!el) return;
    shiftyReact('cheer', 1300, el);
    puff(el);
  });
}
