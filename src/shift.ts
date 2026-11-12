// A standard shift (and drills) plus its end-of-shift report: grade, crew drop, share grid.
import type { QueueAlert } from './types';
import { S, liveStreak, save } from './state';
import { dailyNumber, today } from './time';
import { crewCard, capture, rollCrew } from './crews';
import { DALE, line } from './voice';
import { addXP, earnStreak } from './progress';
import { app, confetti, go, routes, sfx, stopDock } from './ui';
import { buildDaily, buildShift } from './shift-builder';
import { runAlerts, type Mode, type RunResult } from './runner';
import { copyShare } from './daily';
import { syncSoon } from './leaderboard';
import { $, $$, esc } from './util';
import { shiftySvg, type Pose } from './shifty';

export function startShift(): void {
  runAlerts({ mode: 'shift', queue: buildShift(), finish: (r) => shiftEnd('shift', r) });
}

export function startDaily(): void {
  runAlerts({ mode: 'daily', queue: buildDaily(), finish: (r) => shiftEnd('daily', r) });
}

export function startDrill(queue: QueueAlert[]): void {
  runAlerts({ mode: 'drill', queue, finish: (r) => shiftEnd('drill', r) });
}

export function shiftEnd(mode: Mode, r: RunResult): void {
  stopDock();
  S.shifts++;
  const { right, n, xp, grid, queue } = r;
  const perfect = right === n, acc = right / n;
  const bonus = perfect ? 50 : acc >= 0.8 ? 25 : 10;
  addXP(bonus);
  const g: [string, string] = perfect ? ['S', line(DALE.perfect)] : acc >= 0.8 ? ['A', 'Solid shift. Dale nodded at you. Dale never nods.'] : acc >= 0.6 ? ['B', 'Respectable. A few callbacks headed your way.'] : acc >= 0.4 ? ['C', 'Tier 1 with potential. Read those tells.'] : acc >= 0.2 ? ['D', line(DALE.bad)] : ['F', 'Please stop closing ransomware.'];
  const newDay = earnStreak();
  if (mode === 'daily') { S.daily[today()] = { score: right, n, grid: grid.join('') }; save(); }
  if (perfect) confetti(70);
  syncSoon();
  const fps = queue.filter((a) => !a.v).length;
  const pose: Pose = acc >= 0.8 ? 'happy' : acc >= 0.4 ? 'dead' : 'shock'; // Shifty reacts to your shift
  app.innerHTML = `<div class="scr center"><div class="sec" style="margin-top:6px">${mode === 'daily' ? 'DAILY SHIFT #' + dailyNumber() : mode === 'drill' ? 'DRILL REPORT' : 'SHIFT REPORT'}</div>
  <div class="grade" style="color:${acc >= 0.8 ? 'var(--grn)' : acc >= 0.5 ? 'var(--yl)' : 'var(--red)'}">${g[0]}</div>
  <div class="mascot big">${shiftySvg(pose, 64)}</div>
  <div style="font-size:18px;font-weight:700">${right}/${n} correct · +${Math.max(0, xp) + bonus} XP</div>
  <div class="share">${grid.join('')}</div>
  <div class="dale"><div class="av">☕</div><div><b>DALE</b><p>${esc(g[1])}</p></div></div>
  ${newDay && liveStreak() > 1 ? `<p class="tiny">🔥 ${liveStreak()}-day streak</p>` : ''}
  <div class="sec" style="margin-top:22px">PICK YOUR CREW DROP</div><div class="packs" id="packs">${[0, 1, 2].map((k) => `<button class="pack" data-p="${k}">?</button>`).join('')}</div><div id="drop"></div>
  <div style="font-size:12px;color:var(--dim);margin-top:12px">${n} alerts · ${fps} were benign · 🟩 right + sharp eye · 🟨 right · 🟥 wrong</div>
  ${mode === 'daily' ? '<button class="next ghost" id="cp">Copy result to share</button>' : ''}
  <button class="next" id="h">Back to the SOC</button><button class="next ghost" id="again">Another shift</button></div>`;
  const opts = [rollCrew(perfect), rollCrew(perfect), rollCrew(perfect)];
  $$('[data-p]').forEach((b) => (b.onclick = () => {
    const c = opts[+b.dataset.p!];
    $('#packs').remove();
    const isNew = capture(c.id, 'shift drop');
    if (!isNew) { S.intel[c.id] = (S.intel[c.id] || 0) + 2; save(); }
    sfx('drop');
    $('#drop').innerHTML = `<div class="sec">${isNew ? 'NEW CREW CAPTURED' : 'DUPE → +2 INTEL'}</div>${crewCard(c)}`;
  }));
  $('#h').onclick = () => go(routes.home);
  $('#again').onclick = () => go(routes.startShift);
  const cp = document.getElementById('cp');
  if (cp) cp.onclick = () => copyShare();
}
