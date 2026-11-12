// Story-mode incidents: in-order alerts against a real ATT&CK group, 3 hearts, one containment decision.
import type { Incident } from './types';
import { crewById } from './content';
import { S, save } from './state';
import { addXP, earnStreak } from './progress';
import { capture, crewCard } from './crews';
import { app, confetti, go, routes, sfx, stopDock } from './ui';
import { runAlerts, type RunResult } from './runner';
import { $, esc } from './util';
import { shiftySvg } from './shifty';
import { syncSoon } from './leaderboard';

export function incIntro(inc: Incident): void {
  const c = crewById[inc.g];
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="q">✕</button></div>
 <div class="sec" style="margin-top:0">INCIDENT · ${'💀'.repeat(inc.diff)}</div><h1 style="font-size:27px;line-height:1.1">${esc(inc.title)}</h1>
 <div class="intro"><div style="font-size:12px;color:var(--red);font-weight:700;letter-spacing:.12em">THREAT ACTOR: ${esc(c.n.toUpperCase())}</div><p>${esc(inc.intro)}</p>
 <p style="color:var(--dim);font-size:14px">${inc.a.length} alerts in order, plus a containment call. 3 hearts: any wrong call costs one, so don't escalate everything. IR has a budget. Not every alert is part of the attack.</p></div>
 <button class="next red" id="s">Take the case</button></div>`;
  $('#q').onclick = () => history.back();
  $('#s').onclick = () => go(() => runAlerts({ mode: 'inc', inc, queue: inc.a.map((a) => ({ ...a })), finish: (r) => incEnd(inc, r) }));
}

function incEnd(inc: Incident, r: RunResult): void {
  stopDock();
  const won = r.won, c = crewById[inc.g];
  if (won) {
    const isNew = capture(c.id, 'incident');
    S.inc[inc.id] = { won: true };
    addXP(isNew ? 100 : 30);
    sfx('rank');
    confetti(50);
  } else sfx('no');
  earnStreak();
  save();
  syncSoon();
  app.innerHTML = `<div class="scr center"><div class="sec" style="margin-top:6px">${won ? 'INCIDENT CONTAINED' : 'BREACHED'}</div>
  <div class="grade" style="font-size:40px;color:${won ? 'var(--grn)' : 'var(--red)'}">${won ? 'W' : 'L'}</div>
  <div class="mascot lg">${shiftySvg(won ? 'happy' : 'shock', 64)}</div>
  <div class="intro" style="text-align:left"><p style="margin:0">${esc(won ? inc.win : inc.lose)}</p></div>
  <div class="sec">KILL CHAIN YOU CAUGHT</div><div class="chain" style="justify-content:center">${inc.a.map((a, k) => (a.v ? `<span class="${r.chain.includes(k) ? 'on' : ''}">${esc(a.x)}</span>` : '')).join('')}</div>
  ${won ? crewCard(c, 'incident') : ''}
  <button class="next" id="h">Back to the SOC</button>${won ? '' : '<button class="next red" id="rt">Run it back</button>'}</div>`;
  $('#h').onclick = () => go(routes.home);
  if (!won) $('#rt').onclick = () => go(() => incIntro(inc));
}
