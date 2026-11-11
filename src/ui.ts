// Shared UI plumbing: the app root, toasts, confetti, sound, haptics, the bottom dock and navigation.
import { $, esc } from './util';
import { S } from './state';

export const app = $('#app');

// ---------------------------------------------------------------- toast / confetti

export function toast(t: string): void {
  const e = $('#toast') as HTMLElement & { _t?: number };
  e.textContent = t;
  e.classList.add('on');
  clearTimeout(e._t);
  e._t = window.setTimeout(() => e.classList.remove('on'), 2200);
}

export function confetti(n: number): void {
  const cs = ['#3ee68a', '#22d3ee', '#fbbf24', '#f472b6', '#a78bfa', '#ff4d5e'];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'conf';
    d.style.left = Math.random() * 100 + 'vw';
    d.style.background = cs[i % cs.length];
    d.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    d.style.animationDelay = Math.random() * 0.4 + 's';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3800);
  }
}

/**
 * "+15 XP" feedback. With an anchor and `pulse` the anchor's own label pulses. With just an anchor the float lives
 * inside that element (absolutely positioned), so it scrolls with the card instead of drifting over the log box.
 * Without an anchor it floats near the top of the screen.
 */
export function xpFloat(n: number, anchor?: HTMLElement | null, pulse = false): void {
  if (!n) return;
  if (anchor && pulse) {
    // the label already says "+20 XP": pulse it in place rather than stacking a second copy on top of it
    anchor.classList.remove('xp-pop', 'xp-neg');
    void anchor.offsetWidth;
    anchor.classList.add('xp-pop');
    if (n < 0) anchor.classList.add('xp-neg');
    return;
  }
  const e = document.createElement('div');
  e.className = 'xpf' + (n < 0 ? ' neg' : '') + (anchor ? ' in' : '');
  e.textContent = (n > 0 ? '+' : '') + n + ' XP';
  if (anchor) anchor.appendChild(e);
  else {
    e.style.left = innerWidth / 2 - 40 + 'px';
    e.style.top = innerHeight * 0.3 + 'px';
    document.body.appendChild(e);
  }
  setTimeout(() => e.remove(), 1000);
}

// ---------------------------------------------------------------- sound / haptics

let AC: AudioContext | undefined;
const SEQ: Record<string, [number, number][]> = {
  ok: [[660, 0.06], [990, 0.11]], no: [[200, 0.16], [140, 0.24]], rank: [[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.22]],
  drop: [[880, 0.05], [1175, 0.05], [1568, 0.16]], hit: [[300, 0.05], [600, 0.08]], tick: [[1200, 0.03]], sure: [[440, 0.04], [880, 0.04]],
};
export function sfx(k: string, pitch = 1): void {
  if (!S.sound) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    AC = AC || new Ctx();
    const ac = AC;
    let t = ac.currentTime;
    for (const [f, d] of SEQ[k] ?? []) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square';
      o.frequency.value = k === 'ok' ? f * pitch : f;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + d);
      t += d;
    }
  } catch { /* audio unavailable */ }
}

export const buzz = (p: number | number[]): void => {
  try { navigator.vibrate?.(p); } catch { /* not supported (iOS) */ }
};

// ---------------------------------------------------------------- dock (the big Next button)

let dockEl: HTMLElement | null = null;
export function stopDock(): void {
  if (dockEl) { dockEl.remove(); dockEl = null; }
}
export function dock(label: string, fn: () => void): void {
  stopDock();
  dockEl = document.createElement('div');
  dockEl.className = 'dock';
  dockEl.innerHTML = `<button>${esc(label)}</button>`;
  (dockEl.firstChild as HTMLElement).onclick = () => { stopDock(); fn(); };
  document.body.appendChild(dockEl);
}

// ---------------------------------------------------------------- navigation
// History-based back, no router. `leaving` is a cleanup hook the active screen sets (stop the dock, stop ride mode...).

let leaving: (() => void) | null = null;
export const setLeaving = (f: (() => void) | null) => { leaving = f; };
const runLeaving = () => { if (leaving) { leaving(); leaving = null; } };

/** Late-bound screens, so modules that need to jump "home" or start a shift don't import each other in circles. */
export const routes: { home: () => void; startShift: () => void } = { home: () => {}, startShift: () => {} };

export function go(fn: () => void): void {
  runLeaving();
  try { history.pushState({ s: 1 }, ''); } catch { /* ignore */ }
  window.onkeydown = null;
  fn();
  app.scrollTop = 0;
}

export function initNavigation(): void {
  addEventListener('popstate', () => {
    runLeaving();
    window.onkeydown = null;
    routes.home();
  });
  try { history.replaceState({ s: 0 }, ''); } catch { /* ignore */ }
}
