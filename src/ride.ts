// Ride mode: hands-free. Speaks each alert, then you answer with earbud/steering-wheel prev/next (Media Session)
// or the on-screen halves. A silent looping audio element holds media focus so the buttons keep working.
import type { QueueAlert } from './types';
import { ruleOf, hostOf } from './content';
import { S, logEv, save } from './state';
import { today } from './time';
import { gradeConcept } from './srs';
import { addXP, earnStreak } from './progress';
import { app, go, setLeaving, sfx } from './ui';
import { buildShift } from './shift-builder';
import { DOM } from './runner';
import { $, esc } from './util';
import { routes } from './ui';

let rideOn = false;
let rideTimer: number | undefined;
let silent: HTMLAudioElement | null = null;
let answerFn: ((v: boolean) => void) | null = null;

const speakable = (s: string) =>
  String(s).replace(/\\\\/g, ' ').replace(/\\/g, ' ').replace(/[_|^`]/g, ' ').replace(/https?:\/\/\S+/g, 'a web address').replace(/\b[A-Za-z]:(?=\s)/g, '').replace(/\.exe\b/gi, ' exe').replace(/\s+/g, ' ').slice(0, 180);

function say(t: string): Promise<void> {
  return new Promise((res) => {
    try {
      if (!('speechSynthesis' in window)) return res();
      const u = new SpeechSynthesisUtterance(t);
      u.rate = 1.05;
      u.onend = () => res();
      u.onerror = () => res();
      speechSynthesis.speak(u);
      setTimeout(res, Math.min(20000, 600 + t.length * 75));
    } catch { res(); }
  });
}

const wait = (ms: number) => new Promise<void>((r) => { rideTimer = window.setTimeout(r, ms); });

function silentAudio(): HTMLAudioElement {
  const sr = 8000, n = sr * 2, b = new ArrayBuffer(44 + n), v = new DataView(b);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  const a = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' })));
  a.loop = true;
  return a;
}

function setMedia(on: boolean): void {
  try {
    const ms = navigator.mediaSession;
    if (!ms) return;
    if (on) {
      ms.metadata = new MediaMetadata({ title: 'ON SHIFT · Ride mode', artist: '⏮ close · ⏭ escalate' });
      ms.setActionHandler('previoustrack', () => answerFn?.(false));
      ms.setActionHandler('nexttrack', () => answerFn?.(true));
      ms.setActionHandler('pause', () => {});
      ms.setActionHandler('play', () => {});
    } else {
      (['previoustrack', 'nexttrack', 'pause', 'play'] as MediaSessionAction[]).forEach((k) => { try { ms.setActionHandler(k, null); } catch { /* ignore */ } });
    }
  } catch { /* Media Session unavailable */ }
}

function stopRide(): void {
  rideOn = false;
  clearTimeout(rideTimer);
  answerFn = null;
  try { speechSynthesis.cancel(); } catch { /* ignore */ }
  if (silent) { silent.pause(); silent = null; }
  setMedia(false);
}

export function ride(): void {
  const Q: QueueAlert[] = buildShift(10);
  let k = 0, score = 0;
  setLeaving(stopRide);
  const can = 'speechSynthesis' in window;

  function draw(phase?: 'read' | 'think' | 'ans', res?: boolean): void {
    const a = Q[k];
    app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="q">✕</button><b>Ride mode</b><span class="chip" style="margin-left:auto">${k + 1}/${Q.length} · ${score}✓</span></div>
  <div class="ride"><div class="sec" style="margin:0">${(DOM[a.d] || ['Alert'])[0]}</div><div class="rt">${esc(a.t)}</div><div class="rh">${esc(a.h)}</div>
  <div class="rl">${a.l.map((x, j) => `<div style="${(a.k || []).includes(j) && phase === 'ans' ? 'color:var(--yl)' : ''}">${esc(x)}</div>`).join('')}</div>
  <div class="rs">${phase === 'think' ? 'Your call. ⏮ close · ⏭ escalate (earbuds or wheel), or tap below' : phase === 'ans' ? '' : !rideOn ? (can ? 'Tap ▶. Phone can lock; earbud ⏮/⏭ answers.' : 'No speech here. Read and tap.') : 'Listening…'}</div>
  ${phase === 'ans' ? `<div class="ans"><b style="color:${res ? 'var(--grn)' : 'var(--red)'}">${res ? '✔ Right' : '✘ Wrong'} · ${a.v ? 'ESCALATE' : 'CLOSE'}</b><br>${esc(ruleOf(a) || a.tell)}</div>` : ''}
  <div class="halves"><button class="b-cls" id="hc">⏮ Close</button><button class="b-esc" id="he">Escalate ⏭</button></div>
  <div class="ctrl"><button class="main" id="pp">${rideOn ? '⏸' : '▶'}</button><button id="sk" aria-label="Skip">⏭︎</button></div></div></div>`;
    $('#q').onclick = () => history.back();
    $('#pp').onclick = () => { if (rideOn) { stopRide(); draw(); } else start(); };
    $('#sk').onclick = () => { stopRide(); k = (k + 1) % Q.length; draw(); };
    $('#hc').onclick = () => (answerFn ? answerFn(false) : start());
    $('#he').onclick = () => (answerFn ? answerFn(true) : start());
  }

  function start(): void {
    rideOn = true;
    try { silent = silentAudio(); silent.play().catch(() => {}); } catch { /* ignore */ }
    setMedia(true);
    void loop();
  }

  async function loop(): Promise<void> {
    while (rideOn && k < Q.length) {
      const a = Q[k];
      draw('read');
      const ev = (a.k || []).filter((x) => x !== 'h').map((j) => a.l[j as number]).filter(Boolean);
      const script = a.say || `${a.t}. ${speakable(hostOf(a))}. ${ev.concat(a.l.filter((x) => !ev.includes(x))).slice(0, 3).map(speakable).join('. ')}.`;
      await say('Alert. ' + script);
      if (!rideOn) return;
      draw('think');
      await say('Escalate, or close?');
      if (!rideOn) return;
      const ans = await new Promise<boolean | null>((res) => {
        answerFn = (v) => { answerFn = null; res(v); };
        rideTimer = window.setTimeout(() => { answerFn = null; res(null); }, 12000);
      });
      if (!rideOn) return;
      if (ans === null) {
        await say(`Time. It was ${a.v ? 'escalate' : 'close'}. ${ruleOf(a) || ''}`);
        draw('ans', false);
      } else {
        const ok = ans === !!a.v;
        if (ok) { score++; sfx('ok'); addXP(8); } else { sfx('no'); addXP(-2); }
        gradeConcept(a, ok ? 2 : 1);
        logEv({ id: a.id, c: a.c || a.id, v: a.v, call: ans, conf: 0, ok, mode: 'ride', d: a.d, x: a.x, diff: a.diff || 2 });
        if (ok) S.dayGoal[today()] = (S.dayGoal[today()] || 0) + 1;
        save();
        draw('ans', ok);
        await say(`${ok ? 'Correct.' : 'Wrong.'} ${a.v ? 'Escalate.' : 'Close it.'} ${ruleOf(a) || a.tell}`);
      }
      if (!rideOn) return;
      await wait(1200);
      k++;
    }
    if (k >= Q.length) {
      earnStreak();
      await say(`Shift over. ${score} out of ${Q.length}.`);
      stopRide();
      app.innerHTML = `<div class="scr center"><div class="sec">RIDE SHIFT DONE</div><div class="grade">${score}/${Q.length}</div><button class="next" id="h">Back to the SOC</button><button class="next ghost" id="a">Another ride</button></div>`;
      $('#h').onclick = () => go(routes.home);
      $('#a').onclick = () => go(ride);
    }
  }
  draw();
}
