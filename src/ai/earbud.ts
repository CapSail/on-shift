// Earbud mode: hands-free. Shifty reads a lesson, then makes claims; answer ⏭ legit / ⏮ hallucination
// (earbuds, steering wheel, or the big on-screen halves). Answers feed spaced repetition like any run.
import type { Card } from './types';
import { CONCEPTS, cardsOf, conceptById } from './content';
import { S, logEv, save } from './state';
import { cardFor, cs, dueConcepts, grade, introduced, markSeen, nextNewConcepts } from './srs';
import { addXP, earnStreak } from './progress';
import { app, go, routes, setLeaving, sfx } from '../engine/ui';
import { canSpeak, hush, say, setMedia, silentAudio } from './voice';
import { $, esc, shuffle } from '../engine/util';

type Step = { t: 'lesson'; cid: string } | { t: 'claim'; k: Card };

function build(): Step[] {
  const out: Step[] = [];
  const tfOf = (cid: string, n: number) => shuffle(cardsOf(cid).filter((k) => k.kind === 'tf' && !(S.cs[cid]?.seen ?? []).slice(-2).includes(k.id))).slice(0, n);
  for (const cid of dueConcepts().slice(0, 4)) {
    const k = tfOf(cid, 1)[0] ?? cardFor(cid, { kinds: ['tf'] });
    if (k.kind === 'tf') out.push({ t: 'claim', k });
  }
  for (const cid of dueConcepts().length > 8 ? [] : nextNewConcepts(dueConcepts().length > 4 ? 1 : 2)) {
    out.push({ t: 'lesson', cid });
    tfOf(cid, 2).forEach((k) => out.push({ t: 'claim', k }));
  }
  // top up with learning concepts
  for (const cid of shuffle(Object.keys(S.cs).filter((id) => conceptById.has(id)))) {
    if (out.filter((s) => s.t === 'claim').length >= 10) break;
    if (out.some((s) => (s.t === 'claim' ? s.k.c : s.cid) === cid)) continue;
    const k = tfOf(cid, 1)[0];
    if (k) out.push({ t: 'claim', k });
  }
  if (!out.length) { const c = CONCEPTS[0].id; out.push({ t: 'lesson', cid: c }, ...tfOf(c, 2).map((k) => ({ t: 'claim' as const, k }))); }
  return out;
}

let on = false;
let timer: number | undefined;
let silent: HTMLAudioElement | null = null;
let answer: ((v: boolean) => void) | null = null;

function stop(): void {
  on = false;
  clearTimeout(timer);
  answer = null;
  hush();
  if (silent) { silent.pause(); silent = null; }
  setMedia(false);
}

export function earbud(): void {
  const Q = build();
  let k = 0, score = 0, asked = 0;
  setLeaving(stop);

  function draw(phase: 'idle' | 'lesson' | 'claim' | 'think' | 'ans' = 'idle', ok?: boolean): void {
    const s = Q[Math.min(k, Q.length - 1)];
    const top = s.t === 'lesson' ? conceptById.get(s.cid)! : conceptById.get(s.k.c)!;
    app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="quit">✕</button><b>Earbud mode</b><span class="chip" style="margin-left:auto">${Math.min(k + 1, Q.length)}/${Q.length} · ${score}✓</span></div>
<div class="ride"><div class="sec" style="margin:0">${s.t === 'lesson' ? 'LESSON' : 'LEGIT OR HALLUCINATION?'} · ${esc(top.name)}</div>
<div class="rt">${s.t === 'lesson' ? esc(top.rule) : `“${esc(s.k.s as string)}”`}</div>
<div class="rs">${!canSpeak() ? 'No speech on this browser: read and tap.' : phase === 'idle' ? 'Tap ▶. The phone can lock; earbud ⏭ = legit, ⏮ = hallucination.' : phase === 'think' ? 'Your call: ⏭ legit · ⏮ hallucination' : phase === 'lesson' ? 'Listening…' : ''}</div>
${phase === 'ans' && s.t === 'claim' ? `<div class="ans"><b style="color:${ok ? 'var(--grn)' : 'var(--red)'}">${ok ? '✔ Right' : '✘ Wrong'} · ${s.k.v ? 'LEGIT' : 'HALLUCINATION'}</b><br>${esc(s.k.why)}</div>` : ''}
<div class="halves"><button class="b-esc" id="hn">⏮ Hallucination</button><button class="b-cls" id="hy">Legit ⏭</button></div>
<div class="ctrl"><button class="main" id="pp">${on ? '⏸' : '▶'}</button><button id="sk" aria-label="Skip">⏭︎</button></div></div></div>`;
    $('#quit').onclick = () => history.back();
    $('#pp').onclick = () => { if (on) { stop(); draw(); } else start(); };
    $('#sk').onclick = () => { stop(); k = Math.min(k + 1, Q.length - 1); draw(); };
    $('#hn').onclick = () => (answer ? answer(false) : on ? undefined : start());
    $('#hy').onclick = () => (answer ? answer(true) : on ? undefined : start());
  }

  function start(): void {
    on = true;
    try { silent = silentAudio(); silent.play().catch(() => {}); } catch { /* ignore */ }
    setMedia(true, () => answer?.(false), () => answer?.(true));
    void loop();
  }

  async function loop(): Promise<void> {
    while (on && k < Q.length) {
      const s = Q[k];
      if (s.t === 'lesson') {
        const c = conceptById.get(s.cid)!;
        draw('lesson');
        await say(`New concept: ${c.name}. ${c.say} The rule: ${c.rule}`);
        cs(s.cid);
        save();
      } else {
        draw('claim');
        await say(`Shifty claims: ${s.k.s}. Legit, or hallucination?`);
        if (!on) return;
        draw('think');
        const v = await new Promise<boolean | null>((res) => {
          answer = (x) => { answer = null; clearTimeout(timer); res(x); };
          timer = window.setTimeout(() => { answer = null; res(null); }, 12000);
        });
        if (!on) return;
        if (v === null) {
          draw('ans', false);
          await say(`Time. It was ${s.k.v ? 'legit' : 'a hallucination'}. ${s.k.why}`);
        } else {
          const ok = v === s.k.v;
          asked++;
          if (ok) { score++; sfx('ok'); addXP(8); } else sfx('no');
          const was = introduced(s.k.c);
          const g = grade(s.k.c, ok ? 2 : 1);
          markSeen(s.k.c, s.k.id);
          logEv({ id: s.k.id, c: s.k.c, d: s.k.d, kind: 'tf', ok, sure: false, mode: 'earbud', gap: was ? g.gap : undefined });
          save();
          draw('ans', ok);
          await say(`${ok ? 'Correct.' : 'Nope.'} ${s.k.v ? 'Legit.' : 'Hallucination.'} ${s.k.why}`);
        }
      }
      if (!on) return;
      await new Promise<void>((r) => { timer = window.setTimeout(r, 900); });
      k++;
    }
    if (k >= Q.length) {
      if (asked) earnStreak();
      await say(`Session done. ${score} out of ${asked}. Shifty is slightly less dumb now.`);
      stop();
      app.innerHTML = `<div class="scr center"><div class="sec">EARBUD SESSION DONE</div><div class="grade">${score}/${asked}</div><button class="next" id="h">Home</button><button class="next ghost" id="a">Another session</button></div>`;
      $('#h').onclick = () => go(routes.home);
      $('#a').onclick = () => go(earbud);
    }
  }
  draw();
}
