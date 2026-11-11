// The alert runner: call -> evidence pick -> feedback, for every mode (shift, daily, drill, tutorial, incident, boss).
// Each mode's starter supplies `finish`, which draws its own end screen, so this file never imports those.
import type { Containment, Crew, Followup, Incident, QueueAlert } from './types';
import { D, byId, conceptAlerts, ruleOf, tUrl } from './content';
import { S, logEv, save } from './state';
import { today } from './time';
import { GAPS, gradeConcept, pushRolling } from './srs';
import { gainIntel } from './crews';
import { DALE, TAUNT, line, type RoastKind } from './voice';
import { addXP } from './progress';
import { app, buzz, dock, setLeaving, sfx, stopDock, toast } from './ui';
import { $, $$, $o, esc, rnd, shuffle } from './util';
import { reportHtml } from './report';

export type Mode = 'shift' | 'daily' | 'drill' | 'tut' | 'inc' | 'boss';

export interface RunResult {
  won: boolean;      // incident contained / boss HP emptied (unused by other modes)
  right: number;
  n: number;
  xp: number;
  grid: string[];
  chain: number[];   // incident: indexes of true positives you escalated
  queue: QueueAlert[];
}

export interface RunCfg {
  mode: Mode;
  queue: QueueAlert[];
  inc?: Incident;
  boss?: Crew;
  finish: (r: RunResult) => void;
}

export const DOM: Record<string, [string, string]> = {
  endpoint: ['Endpoint', 'var(--cy)'], identity: ['Identity', 'var(--pu)'], cloud: ['Cloud / SaaS', 'var(--pk)'], email: ['Email', 'var(--yl)'],
  network: ['Network', 'var(--grn)'], linux: ['Linux / K8s', 'var(--or)'], edr: ['EDR / AV', 'var(--red)'], macos: ['macOS', '#e2e8f0'],
};

type Phase = 'call' | 'pick' | 'fb';

export function shufQ<T extends { o: string[]; a: number; _s?: 1 }>(q: T): T {
  if (q._s) return q;
  const idx = shuffle(q.o.map((_, k) => k));
  return { ...q, o: idx.map((k) => q.o[k]), a: idx.indexOf(q.a), _s: 1 };
}

const followup = (q: Followup): string =>
  `<div class="fq"><div class="qh">${q.kind === 'tune' ? 'DETECTION LEAD QUESTION' : q.kind === 'contain' ? 'CONTAINMENT' : 'NEXT MOVE'}</div><div class="qq">${esc(q.ask)}</div>${q.o.map((o, k) => `<button data-o="${k}">${esc(o)}</button>`).join('')}<div class="qw"></div></div>`;

function answerQ(q: Followup, b: HTMLElement): void {
  const box = b.closest('.fq') as HTMLElement;
  if (box.dataset.done) return;
  box.dataset.done = '1';
  const k = +b.dataset.o!, ok = k === q.a;
  $$('[data-o]', box).forEach((x, j) => {
    if (j === q.a) x.classList.add('r');
    else if (j === k) x.classList.add('w');
  });
  box.querySelector('.qw')!.innerHTML = `<div class="why">${ok ? '✔ ' : '✘ '}${esc(q.why)}</div>`;
  if (ok) { addXP(5, b); sfx('ok'); } else sfx('no');
  logEv({ q: 1, ok });
  save();
}

export function runAlerts(cfg: RunCfg): void {
  let i = 0, combo = 0, right = 0, xp = 0, lives = 3, phase: Phase = 'call', conf = 0, call: boolean | null = null, extra = 0;
  let sure = false, flying = false; // SURE is an armed toggle, reset every card; flying = the swipe-away animation is running
  const grid: string[] = [];
  const chain: number[] = [];
  const Q = cfg.queue;
  const isInc = cfg.mode === 'inc', isBoss = cfg.mode === 'boss', isTut = cfg.mode === 'tut';
  let hp = 100;
  const dmg = isBoss ? Math.ceil(100 / Math.max(1, Q.length * 0.75)) : 0;
  let flyT = 0, frameAt = 0; // flyT: the 230 ms fly-off timer; frameAt: when the current card appeared
  setLeaving(() => { stopDock(); unmountActs(); clearTimeout(flyT); swipeAc?.abort(); try { app.releasePointerCapture(drag.pid); } catch { /* none held */ } drag.on = false; flying = false; }); // leaving the screen must also cancel a card in flight

  const unmountActs = () => $o('#after')?.remove();
  function mountActs(html: string): void {
    unmountActs();
    const d = document.createElement('div');
    d.id = 'after';
    d.innerHTML = html;
    document.body.appendChild(d);
  }

  const result = (won: boolean): RunResult => (swipeAc?.abort(), { won, right, n: Q.length, xp, grid, chain, queue: Q });

  function header(): string {
    const right_ = isInc || isBoss
      ? `<span class="hearts">${'❤️'.repeat(Math.max(0, lives))}${'🖤'.repeat(3 - Math.max(0, lives))}</span>`
      : `<span class="combo" id="cb">${combo > 1 ? 'x' + combo + (combo >= 5 ? ' 🔥' : '') : ''}</span>`;
    return `<div class="bar"><button class="x" id="quit" aria-label="Quit">✕</button><div class="prog"><i style="width:${(100 * i) / Q.length}%"></i></div>${right_}</div>
  ${isBoss ? `<div class="boss"><div class="bn"><span>${esc(cfg.boss!.n.toUpperCase())}</span><span id="hpn">${hp}/100</span></div><div class="hp"><i id="hpb" style="width:${hp}%"></i></div><div class="taunt" id="tn">${i ? '' : '"Let\'s see what you\'ve got."'}</div></div>` : ''}
  ${isInc ? `<div class="chain">${cfg.inc!.a.map((a, k) => `<span class="${chain.includes(k) ? 'on' : ''}">${k < i ? (chain.includes(k) ? '⚑ ' + a.x : '·') : '?'}</span>`).join('')}</div>` : ''}`;
  }

  function frame(): void {
    const a = Q[i];
    const [dn, dc] = DOM[a.d] || ['Alert', 'var(--cy)'];
    phase = 'call'; conf = 0; call = null; sure = false; flying = false; frameAt = performance.now(); drag.on = false; drag.locked = false; drag.pid = -1; dragEl = null;
    const cls = combo >= 8 ? 'c8' : combo >= 5 ? 'c5' : combo >= 3 ? 'c3' : '';
    app.innerHTML = `<div class="scr">${header()}
  ${isTut ? `<div class="coachtxt">${i === 0 ? 'Real attack or not? This one is pretty loud. Swipe the card RIGHT (or tap Escalate) to escalate.' : i === 1 ? "Scary-sounding, but read the details. Swipe LEFT to close if it's normal." : 'Last one. Read every line. Certain? Tap ⚡ SURE first: +15 if right, −10 if wrong (no penalty in training).'}</div>` : ''}
  <div class="stage"><div class="card calling ${cls}" id="card" style="--c:${dc}"><div class="stamp esc" id="se" aria-hidden="true">ESCALATE</div><div class="stamp cls" id="sc" aria-hidden="true">CLOSE</div>
  <div class="dom"><span class="dot"></span>${dn} · ${esc(a.src)}${a.review ? ' <span class="flag cb">CALLBACK</span>' : ''}${a.twin ? ' <span class="flag tw">TWIN</span>' : ''}${a.retry ? ' <span class="flag rt">RETRY</span>' : ''}</div>
  <h2>${esc(a.t)}</h2><div class="h" data-k="h">${esc(a.h)}</div>
  <div class="log" id="log">${a.l.map((x, k) => { const p = x.indexOf(': '); return `<div class="ln" data-k="${k}">${p > 0 && p < 24 ? `<span class="k">${esc(x.slice(0, p))}:</span> ${esc(x.slice(p + 2))}` : esc(x)}</div>`; }).join('')}</div>
  <div id="fb" role="status" aria-live="polite"></div>
  ${isTut && i < 2 ? `<div class="coach" style="--dx:${i === 0 ? 80 : -80}px">👆</div>` : ''}</div></div></div>`;
    mountActs(`<div class="acts">
   <button class="b-cls" data-c="0" aria-label="Close: benign">✕<span>Close</span></button>
   <button class="sure-tog" id="sure" aria-pressed="false" aria-label="Sure: plus 15 if right, minus 10 if wrong">⚡︎<small>SURE</small></button>
   <button class="b-esc" data-c="1" aria-label="Escalate: true positive">✓<span>Escalate</span></button></div>
  <div class="stake" id="stake">${stakeText(false)}</div>
  <div class="hint">swipe ← close · → escalate · tap ⚡ first if you are sure<span class="kbd"> · keys ←/→ answer, S = sure</span> · ${i + 1}/${Q.length}</div>`);
    $('#quit').onclick = () => history.back();
    $$('.acts button[data-c]').forEach((b) => (b.onclick = () => commit(b.dataset.c === '1')));
    $('#sure').onclick = () => setSure(!sure);
    app.scrollTop = 0;
    stopDock();
  }

  const stakeText = (v: boolean) =>
    isTut ? (v ? '⚡ SURE · +15 right (no penalty in training)' : 'lean call · +8 right (no penalty in training)')
      : v ? '⚡ SURE · +15 right, −10 wrong · a miss comes back' : 'lean call · +8 right, −2 wrong';

  const stampText = (escl: boolean) => (escl ? 'ESCALATE' : 'CLOSE') + (sure ? ' ⚡' : '');

  function setSure(v: boolean): void {
    if (phase !== 'call' || flying) return;
    sure = v;
    const t = $o('#sure');
    if (t) { t.setAttribute('aria-pressed', String(v)); t.classList.toggle('on', v); }
    $o('#card')?.classList.toggle('armed', v);
    const stake = $o('#stake');
    if (stake) { stake.textContent = stakeText(v); stake.classList.toggle('on', v); }
    buzz(v ? 10 : 5);
    sfx(v ? 'sure' : 'tick');
  }

  /** Remove every transient drag / flight effect from the card (inline styles and state classes). */
  const clearFx = (el: HTMLElement) => {
    el.classList.remove('drag', 'fly', 'armed');
    el.style.transform = ''; el.style.opacity = ''; el.style.boxShadow = '';
  };

  /** Throw the card off the screen (like a dating app), then show the verdict on a fresh card. */
  function commit(escl: boolean): void {
    if (phase !== 'call' || flying) return;
    const el = $o('#card');
    if (!el) return;
    const st = escl ? $('#se') : $('#sc'), other = escl ? $('#sc') : $('#se');
    st.textContent = stampText(escl);
    st.style.opacity = '1';
    other.style.opacity = '0';
    drag.on = false; drag.pid = -1; // a button or key answer ends any drag in progress
    const finish = () => { flying = false; decide(escl, sure); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { clearFx(el); return finish(); }
    flying = true;
    const dir = escl ? 1 : -1;
    el.classList.remove('drag');
    el.classList.add('fly');
    el.style.transform = `translate(${dir * innerWidth * 1.1}px, -30px) rotate(${dir * 26}deg)`;
    el.style.opacity = '0';
    flyT = window.setTimeout(() => {
      el.style.transition = 'none';
      clearFx(el);
      void el.offsetWidth;
      el.style.transition = '';
      el.classList.add('reenter');
      finish();
    }, 230);
  }

  const drag = { on: false, locked: false, past: false, pid: -1, sx: 0, sy: 0, dx: 0, vx: 0, lx: 0, lt: 0 };
  let dragEl: HTMLElement | null = null;
  let swipeAc: AbortController | null = null;

  /**
   * Dating-app swipe, listening on the whole screen (so the thumb can start anywhere, not just on the card).
   * One finger at a time (pointer id), vertical intent scrolls the page, the card follows 1:1 with tilt and tint,
   * and it commits past max(70px, 28% of the card) or on a fresh flick. Otherwise it springs back.
   */
  function installSwipe(): void {
    swipeAc?.abort();
    const ac = (swipeAc = new AbortController());
    const opt = { signal: ac.signal };
    const threshold = () => Math.max(70, (dragEl?.offsetWidth ?? 360) * 0.28);
    const reset = () => {
      drag.on = false; drag.locked = false; drag.past = false; drag.pid = -1;
      if (dragEl) { clearFx(dragEl); if (sure) dragEl.classList.add('armed'); }
      for (const st of [$o('#se'), $o('#sc')]) if (st) st.style.opacity = '0';
    };
    app.addEventListener('pointerdown', (e) => {
      if (phase !== 'call' || flying || drag.on) return; // one finger at a time
      if (e.pointerType === 'mouse' && e.button) return;
      if (e.pointerType === 'touch' && (e.clientX < 16 || e.clientX > innerWidth - 16)) return; // leave the OS edge-back gesture alone
      if ((e.target as HTMLElement).closest('button, a, .dock, #after, .bar')) return; // controls keep their own taps
      dragEl = $o('#card');
      if (!dragEl) return;
      Object.assign(drag, { on: true, locked: false, past: false, pid: e.pointerId, sx: e.clientX, sy: e.clientY, dx: 0, vx: 0, lx: e.clientX, lt: e.timeStamp });
      try { app.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }, opt);
    app.addEventListener('pointermove', (e) => {
      if (!drag.on || e.pointerId !== drag.pid || !dragEl) return;
      if (!dragEl.isConnected) { reset(); return; }
      const dx = (drag.dx = e.clientX - drag.sx), dy = e.clientY - drag.sy;
      if (!drag.locked) {
        if (Math.abs(dy) > 1.5 * Math.abs(dx) && Math.abs(dy) > 12) { reset(); return; } // vertical intent: let the page scroll
        if (Math.abs(dx) < 6) return;
        drag.locked = true;
        dragEl.classList.add('drag');
      }
      const dt = e.timeStamp - drag.lt;
      if (dt > 0) { drag.vx = (e.clientX - drag.lx) / dt; drag.lx = e.clientX; drag.lt = e.timeStamp; }
      // follows the finger, tilts with it, tints toward the answer; the stamp sits on the trailing side so it stays visible
      dragEl.style.transform = `translate(${dx}px, ${dy * 0.15}px) rotate(${dx / 18}deg)`;
      const p = Math.min(1, Math.abs(dx) / threshold());
      const escl = dx > 0, on_ = escl ? $('#se') : $('#sc'), off = escl ? $('#sc') : $('#se');
      on_.style.opacity = String(p);
      off.style.opacity = '0';
      on_.textContent = stampText(escl);
      dragEl.style.boxShadow = `0 0 ${10 + 30 * p}px ${escl ? `rgba(255,77,94,${0.65 * p})` : `rgba(62,230,138,${0.65 * p})`}${sure ? ', 0 0 0 2px #fbbf24' : ''}`;
      const now = p >= 1;
      if (now && !drag.past) { drag.past = true; buzz(12); sfx('tick'); }
      if (!now) drag.past = false;
    }, opt);
    app.addEventListener('pointerup', (e) => {
      if (!drag.on || e.pointerId !== drag.pid) return;
      // a flick needs fresh speed: holding still before release is a deliberate stop, not a throw
      const x = drag.dx, flick = Math.abs(drag.vx) > 0.6 && Math.abs(x) > 40 && Math.sign(drag.vx) === Math.sign(x) && e.timeStamp - drag.lt < 80;
      if (drag.locked && (Math.abs(x) >= threshold() || flick)) {
        drag.on = false; drag.locked = false; drag.pid = -1;
        commit(x > 0);
      } else reset(); // not far enough: spring back
    }, opt);
    app.addEventListener('pointercancel', (e) => { if (e.pointerId === drag.pid) reset(); }, opt);
  }

  function decide(escl: boolean, sure: boolean): void {
    if (phase !== 'call' || !$o('#card')) return;
    phase = 'pick'; call = escl; conf = sure ? 1 : 0;
    const a = Q[i], ok = escl === !!a.v, card = $('#card');
    card.classList.remove('calling');
    const st = escl ? $('#se') : $('#sc');
    st.textContent = stampText(escl);
    st.style.opacity = '1';
    st.style.transition = 'opacity .5s';
    setTimeout(() => (st.style.opacity = '0'), 700);
    unmountActs();
    if (ok && a.k && a.k.length && !isBoss) {
      card.classList.add('pickable');
      $('#fb').innerHTML = `<div class="ask">${sure ? 'Sure call. ' : ''}Now tap the line that gave it away 👆<span class="kbd"> · keys 1-9, h, Esc to skip</span></div><button class="skip" id="sk">skip</button>`;
      $$('[data-k]', card).forEach((n) => {
        n.onclick = (e) => { e.stopPropagation(); if (phase === 'pick') resolve(n.dataset.k!); };
        n.tabIndex = 0;
        n.setAttribute('role', 'button');
        n.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); n.click(); } };
      });
      $('#sk').onclick = (e) => { e.stopPropagation(); resolve(null); };
      sfx(sure ? 'sure' : 'tick');
    } else resolve(undefined);
  }

  /** pk: the tapped line ('h' or index), null = skipped, undefined = no pick phase (wrong call / boss) */
  function resolve(pk: string | null | undefined): void {
    phase = 'fb';
    const a = Q[i], ok = call === !!a.v, card = $('#card');
    card.classList.remove('pickable');
    $$('[data-k]', card).forEach((n) => { n.removeAttribute('tabindex'); n.removeAttribute('role'); n.onkeydown = null; });
    const keys = (a.k || []).map(String);
    let eye: boolean | null = null;
    if (pk !== undefined && pk !== null) {
      eye = keys.includes(String(pk));
      if (!eye) card.querySelector(`[data-k="${pk}"]`)?.classList.add('wrongpick');
    }
    keys.forEach((k) => card.querySelector(`[data-k="${k}"]`)?.classList.add('key'));
    // grade 0..3
    let g = ok ? (conf ? 3 : 2) : conf ? 0 : 1;
    if (ok && eye === false) g = 1;
    if (ok && pk === null) g = Math.min(g, 2);
    const c = a.c || a.id;
    if (!isTut) { gradeConcept(a, g); pushRolling(a, ok); }
    logEv({ id: a.id, c, v: a.v, call: call!, conf, ok, eye, mode: cfg.mode, rv: !!a.review, gap: a.review && S.cs[c] ? GAPS[Math.max(0, (S.cs[c].b || 1) - 1)] : 0, d: a.d, x: a.x, diff: a.diff || 2 });
    if (ok) { right++; combo++; S.dayGoal[today()] = (S.dayGoal[today()] || 0) + 1; } else combo = 0;
    let gain: number;
    if (ok) gain = (conf ? 15 : 8) + (eye ? 5 : 0) + Math.min(Math.max(combo - 1, 0), 5) * 2;
    else gain = conf ? -10 : -2;
    if (ok && eye === false) gain = Math.round(gain / 2);
    if (isTut) gain = Math.max(gain, 0);
    grid.push(ok ? (eye ? '🟩' : '🟨') : '🟥');
    if (ok) { sfx('ok', 1 + Math.min(combo, 8) * 0.06); buzz(15); } else { sfx('no'); buzz([60, 40, 60]); card.classList.remove('reenter'); card.classList.add('shake'); }
    // incident & boss bookkeeping
    if (isInc) { if (!ok) lives--; if (a.v && ok) chain.push(i); }
    if (isBoss) {
      if (ok) { hp = Math.max(0, hp - dmg); sfx('hit'); } else lives--;
      $('#hpb').style.width = hp + '%';
      $('#hpn').textContent = hp + '/100';
      $('#tn').textContent = '"' + line(ok ? TAUNT.hit : TAUNT.miss) + '"';
    }
    // dale
    let dale = '';
    if (!isInc && !isBoss) {
      if (combo === 5) dale = line(DALE.combo5);
      else if (combo === 8) dale = line(DALE.combo8);
    }
    // intel
    const intel = ok && a.v && !isTut ? gainIntel(a) : null;
    // retry + twin injection (shift modes only, capped at 3 extra per shift)
    let retryQueued = false;
    if (!isTut && !isBoss && !isInc) {
      if (!ok && conf && !a.retry && extra < 3) {
        extra++;
        retryQueued = true;
        const v = (conceptAlerts[a.c] || []).find((b) => b.id !== a.id && !Q.some((q) => q.id === b.id)) || a;
        Q.push({ ...v, retry: true });
      }
      if (!ok && a.pair && byId[a.pair] && extra < 3 && !a.twin && !Q.some((q) => q.id === a.pair)) {
        extra++;
        Q.splice(Math.min(i + 3, Q.length), 0, { ...byId[a.pair], twin: true });
      }
    }
    const kind: RoastKind = a.v ? (ok ? 'tp' : 'miss') : ok ? 'fp' : 'fesc';
    const tt = D.tech[a.x] || [a.x, ''];
    const rule = ruleOf(a);
    const twin = a.pair ? byId[a.pair] : undefined;
    const tk = twin && twin.k && twin.k[0] !== undefined ? (twin.k[0] === 'h' ? twin.h : twin.l[twin.k[0]]) : null;
    const eyeTxt = eye === true ? ' · 🎯 sharp eye' : eye === false ? ' · 🍀 lucky (wrong line)' : '';
    const showQ = a.q && !isTut && !isBoss && (isInc ? false : rnd() < 0.5 || a.review);
    if (showQ) a._q = shufQ(a.q!);
    $('#fb').innerHTML = `<div class="verdict ${ok ? (eye === false ? 'mid' : 'ok') : 'no'}"><div class="vt"><span>${ok ? '✔' : '✘'} ${a.v ? 'True positive' : 'Benign'}</span><small>${gain > 0 ? '+' : ''}${gain} XP${eyeTxt}</small></div>
   ${ok && eye === false ? '<div class="sub">Right call, wrong reason. The highlighted line is what mattered. This one comes back soon.</div>' : ''}
   ${!ok && conf ? `<div class="sub">Big miss: you were sure. That's the most valuable kind of mistake.${retryQueued ? ' It comes back at the end of this shift.' : isTut ? '' : ' It comes back as a callback next shift.'}</div>` : ''}</div>
   ${rule ? `<div class="rule"><b>RULE</b><p>${esc(rule)}</p></div>` : ''}
   <div class="tell">${esc(a.tell)}</div>
   ${reportHtml({ alert: a, call: call!, sure: !!conf, ok, mode: cfg.mode })}
   ${!ok && tk && twin ? `<div class="cmp"><b>THE TWIN · ${twin.v ? 'ESCALATE' : 'CLOSE'}</b>Same title, other verdict. Its deciding detail:<span class="mono">${esc(tk)}</span></div>` : ''}
   <div class="roast">${esc(line(kind, a))}</div>
   ${intel ? `<div class="intel">🕵 Intel on ${esc(intel.c.n)} +1 (${intel.n}/3)${intel.cap ? ' · <b>CAPTURED!</b>' : ''}</div>` : ''}
   ${dale ? `<div class="dale"><div class="av">☕</div><div><b>DALE</b><p>${esc(dale)}</p></div></div>` : ''}
   <div class="tq"><a class="tag tech" href="${tUrl(a.x)}" target="_blank" rel="noopener">${esc(a.x)} · ${esc(tt[0])} ↗</a>${tt[1] ? tt[1].split(', ').map((t) => `<span class="tag tac">${esc(t)}</span>`).join('') : ''}</div>
   ${showQ ? followup(a._q!) : ''}`;
    if (gain) { xp += gain; addXP(gain, $o('#fb .verdict .vt small'), true); }
    if (intel && intel.cap) setTimeout(() => { toast('🕵 Captured ' + intel.c.n + '!'); sfx('drop'); }, 700);
    const cb = $o('#cb');
    if (cb) {
      cb.textContent = combo > 1 ? 'x' + combo + (combo >= 5 ? ' 🔥' : '') : '';
      cb.classList.add('pop');
      setTimeout(() => cb.classList.remove('pop'), 200);
    }
    $$('.fq [data-o]').forEach((b) => (b.onclick = () => answerQ(a._q || a.q!, b)));
    const contain = isInc && !!cfg.inc!.contain && cfg.inc!.contain.at === i && ok;
    const label = (isInc || isBoss) && lives <= 0 ? 'Uh oh…' : isBoss && hp <= 0 ? 'Finish them →' : contain ? 'Make the call →' : i < Q.length - 1 ? 'Next →' : isInc ? 'See how it ends →' : 'Clock out →';
    dock(label, () => {
      if (isBoss) {
        if (hp <= 0) return cfg.finish(result(true));
        if (lives <= 0 || i >= Q.length - 1) return cfg.finish(result(false));
      }
      if (isInc && lives <= 0) return cfg.finish(result(false));
      if (contain) return containStep();
      i++;
      if (i < Q.length) frame();
      else cfg.finish(result(true));
    });
    $o('.dock button')?.focus({ preventScroll: true }); // the answer buttons were removed: keep keyboard focus somewhere useful
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      const v = $o('#fb .verdict');
      if (v && v.getBoundingClientRect().top > innerHeight * 0.55) v.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    }, 450);
    save();
  }

  function containStep(): void {
    const C: Containment = shufQ(cfg.inc!.contain!);
    stopDock();
    unmountActs();
    app.innerHTML = `<div class="scr">${header()}<div class="intro"><div style="font-size:11px;letter-spacing:.12em;color:var(--red);font-weight:700">CONTAINMENT DECISION</div><p style="font-weight:700">${esc(C.ask)}</p></div>
  <div class="fq" style="margin-top:12px">${C.o.map((o, k) => `<button data-o="${k}">${esc(o)}</button>`).join('')}<div id="cw"></div></div></div>`;
    $('#quit').onclick = () => history.back();
    $$('[data-o]').forEach((b) => (b.onclick = () => {
      const box = b.parentElement as HTMLElement;
      if (box.dataset.done) return;
      box.dataset.done = '1';
      const k = +b.dataset.o!, ok = k === C.a;
      $$('[data-o]').forEach((x, j) => x.classList.add(j === C.a ? 'r' : j === k ? 'w' : 'z'));
      if (ok) { addXP(20, b); sfx('ok'); } else { lives--; sfx('no'); buzz([60, 40, 60]); }
      $('#cw').innerHTML = `<div class="why">${ok ? '✔ ' : '✘ '}${esc(C.why)}</div>`;
      dock(lives <= 0 ? 'Uh oh…' : 'Back to the queue →', () => {
        if (lives <= 0) return cfg.finish(result(false));
        i++;
        if (i < Q.length) frame();
        else cfg.finish(result(true));
      });
    }));
  }

  window.onkeydown = (e) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone
    if (phase === 'call') {
      const fresh = performance.now() - frameAt < 350; // a held or double-tapped key must not answer a card you have not read
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (!e.repeat && !fresh) commit(false); }
      if (e.key === 'ArrowRight') { e.preventDefault(); if (!e.repeat && !fresh) commit(true); }
      if ((e.key === 's' || e.key === 'S') && !e.repeat) setSure(!sure);
    } else if (phase === 'pick') {
      const n = +e.key;
      if (n >= 1 && n <= 9) $o(`#log [data-k="${n - 1}"]`)?.click();
      if (e.key === 'h') $o('.h[data-k]')?.click();
      if (e.key === 'Escape') $o('#sk')?.click();
    } else if (phase === 'fb' && !e.repeat) {
      const onDock = !!t.closest('.dock');
      // Enter/Space on a focused control (follow-up option, link, Next) must do what that control does
      if (e.key === 'ArrowRight' && (t === document.body || onDock)) { e.preventDefault(); $o('.dock button')?.click(); }
      else if ((e.key === 'Enter' || e.key === ' ') && t === document.body) { e.preventDefault(); $o('.dock button')?.click(); }
    }
  };
  installSwipe();
  frame();
}
