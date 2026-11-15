// Speed round: 60 seconds of generated fact cards. Fast recall of terms and services, best score kept.
import { S, logEv, save } from './state';
import { speedDeck, FACTS } from './facts';
import { renderCard } from './card';
import { addXP, earnStreak } from './progress';
import { app, go, routes, setLeaving } from '../engine/ui';
import { shiftyHtml, shiftyReact } from '../engine/shifty-live';
import { $, esc } from '../engine/util';

const SECS = 60;

export function speed(): void {
  if (FACTS.length < 8) { app.innerHTML = '<div class="scr"><div class="bar"><button class="x" onclick="history.back()">✕</button></div><p class="note">The fact bank is empty in this build.</p></div>'; return; }
  const deck = speedDeck(80, new Set(Object.keys(S.cs)));
  let i = 0, right = 0, wrong = 0, left = SECS, over = false;
  const misses: string[] = [];
  let tick: number | undefined;
  setLeaving(() => clearInterval(tick));

  const frame = () => `<div class="bar"><button class="x" id="quit">✕</button>${shiftyHtml('dead', 30, 'sm', true)}<div class="prog"><i id="tbar" style="width:${(100 * left) / SECS}%;background:var(--or)"></i></div><span class="combo" id="sc">${right}✓</span></div>`;

  function next(): void {
    if (over) return;
    app.innerHTML = `<div class="scr run">${frame()}<div id="slot"></div></div>`;
    app.scrollTop = 0;
    $('#quit').onclick = () => history.back();
    const k = deck[i++ % deck.length];
    renderCard($('#slot'), k, {
      mode: 'speed', sure: false, feedback: true, lite: true,
      onAnswer: (p) => {
        if (over) return;
        if (p.ok) right++; else { wrong++; misses.push(k.why); }
        logEv({ id: k.id, c: k.c, d: k.d, kind: k.kind, ok: p.ok, sure: false, mode: 'speed' });
        shiftyReact(p.ok ? 'happy' : 'shock', 500);
        setTimeout(next, p.ok ? 350 : 1100);
      },
    });
  }

  function end(): void {
    over = true;
    clearInterval(tick);
    // score = right minus wrong, so tapping blindly scores ~nothing
    const score = Math.max(0, right - wrong);
    const best = S.puzBest ?? 0;
    const rec = score > best;
    if (rec) S.puzBest = score;
    addXP(score * 3);
    if (score >= 5) earnStreak();
    save();
    app.innerHTML = `<div class="scr center endscr"><div class="sec">SPEED ROUND</div>${shiftyHtml(right >= 15 ? 'cheer' : 'happy', 80, 'lg')}
<div class="grade">${score}</div><p class="note center">${right} right − ${wrong} wrong in ${SECS} seconds${rec ? ' · NEW BEST 🏆' : ` · best ${best}`}</p>
${misses.length ? `<div class="sec">Fix these</div>${misses.slice(0, 8).map((m) => `<div class="miss"><div class="mw">${esc(m)}</div></div>`).join('')}` : ''}
<button class="next" id="again">Again</button><button class="next ghost" id="home">Home</button></div>`;
    $('#again').onclick = () => go(speed);
    $('#home').onclick = () => go(routes.home);
  }

  next();
  tick = window.setInterval(() => {
    left--;
    const b = document.getElementById('tbar');
    if (b) b.style.width = (100 * left) / SECS + '%';
    const sc = document.getElementById('sc');
    if (sc) sc.textContent = `${right}✓`;
    if (left <= 0) end();
  }, 1000);
}
