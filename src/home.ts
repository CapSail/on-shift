// The home screen (the "SOC").
import { D, crewById } from './content';
import { RANKS, S, liveStreak, rankOf, save } from './state';
import { dailyNumber, today } from './time';
import { dueConcepts, missedDue } from './srs';
import { RAR } from './crews';
import { app, go, toast } from './ui';
import { $, $$, esc } from './util';
import { startDaily, startShift } from './shift';
import { dailyResult } from './daily';
import { bossIntro, bossKey, weeklyBoss } from './boss';
import { dex } from './dex';
import { ride } from './ride';
import { catchStats, skill } from './skill';
import { incIntro } from './incidents';
import { tutorial } from './tutorial';

// TODO(Phase 1.5): this points at a claude.ai artifact friends cannot open. Remove it or host the page.
const LIB = 'https://claude.ai/artifact/AqcUYuaFvU1wjbqGycSH7z';

function goalRing(): string {
  const g = S.dayGoal[today()] || 0, G = 20, p = Math.min(1, g / G), r = 18, C = 2 * Math.PI * r;
  return `<div class="ring"><svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="${r}" fill="none" stroke="#151c27" stroke-width="6"/><circle cx="23" cy="23" r="${r}" fill="none" stroke="${p >= 1 ? '#3ee68a' : '#22d3ee'}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}" transform="rotate(-90 23 23)"/></svg>
 <div><b>${p >= 1 ? 'Daily goal hit ✓' : g + ' / ' + G + ' correct calls today'}</b><span>🔥 ${liveStreak()}-day streak${S.freeze ? ' · 🧊×' + S.freeze : ''} · streak counts when you finish a shift</span></div></div>`;
}

export function home(): void {
  if (!S.onb) return tutorial();
  const ri = rankOf(S.xp), r = RANKS[ri], nx = RANKS[ri + 1];
  const pct = nx ? Math.round((100 * (S.xp - r[0])) / (nx[0] - r[0])) : 100;
  const due = dueConcepts().length, miss = missedDue();
  const boss = weeklyBoss(), bs = S.boss[bossKey()] || {};
  const dly = S.daily[today()];
  const played = S.shifts > 0;
  app.innerHTML = `<div class="scr">
 <div class="hdr"><div class="logo px">ON<b>·</b>SHIFT</div><div style="margin-left:auto;display:flex;gap:6px">
 <button class="chip" id="snd" aria-label="Sound">${S.sound ? '🔊' : '🔇'}</button></div></div>
 <div class="rank"><div class="t">RANK ${ri + 1}/${RANKS.length}</div><div class="n">${r[1]}</div>
 <div class="xpb"><i style="width:${pct}%"></i></div><div class="t" style="margin-top:6px">${S.xp} XP${nx ? ' · ' + (nx[0] - S.xp) + ' to ' + nx[1] : ' · max rank'} · <i>${r[2]}</i></div></div>
 ${goalRing()}
 <button class="big" id="go"><span class="px">CLOCK IN</span><small>10 alerts · ${due ? `${Math.min(due, 5)} callback${due > 1 ? 's' : ''}${miss ? ` (${Math.min(miss, 5)} missed)` : ''} + fresh` : 'all fresh'} · ~5 min</small></button>
 <button class="big alt" id="daily"><span class="px" style="font-size:12px">DAILY SHIFT #${dailyNumber()}</span><small>${dly ? `Done: ${dly.score}/10 · tap to see your grid` : 'Same 10 alerts for everyone today · shareable result'}</small></button>
 <div class="grid">
  <button class="tile ${played ? '' : 'lock'}" id="boss" style="--c:var(--red)"><span class="k">Weekly boss</span><span class="v">${played ? esc(boss.n) : '🔒 Locked'}</span><small>${!played ? 'finish 1 shift' : bs.won ? 'Defeated ✓' : bs.day === today() ? 'Tried today · back tomorrow' : RAR[boss.r][0] + ' · ' + boss.t.length + ' TTPs'}</small></button>
  <button class="tile" id="dexb" style="--c:var(--yl)"><span class="k">Crew dex</span><span class="v">${Object.keys(S.dex).length} / ${D.crews.length}</span><small>catch attacks → earn intel</small></button>
  <button class="tile" id="ride" style="--c:var(--cy)"><span class="k">Ride mode</span><span class="v">Ears only</span><small>earbud buttons answer</small></button>
  <button class="tile" id="skill" style="--c:var(--grn)"><span class="k">Skill report</span><span class="v">${S.log.length ? catchStats().line : 'No data yet'}</span><small>weak spots + drills</small></button>
 </div>
 <div class="sec">Incidents · story mode</div>
 ${D.inc.map((i, ix) => {
    const c = crewById[i.g], st = S.inc[i.id];
    const lk = !played;
    return `<button class="inc" data-inc="${i.id}" ${lk ? 'style="opacity:.45"' : ''}><div class="ic">${['🕷️', '🐻', '⚡', '💀', '🦊', '🐉'][ix] || '☠️'}</div><div><b>${lk ? '🔒 ' : ''}${esc(i.title)}</b><span>vs ${esc(c.n)} · ${'💀'.repeat(i.diff)}</span></div>${st && st.won ? '<span class="done">CLEARED</span>' : ''}</button>`;
  }).join('')}
 <a class="inc" href="${LIB}" target="_blank" rel="noopener" style="text-decoration:none"><div class="ic">📚</div><div><b>Intel library ↗</b><span>SOC Scroll · 7k searchable cards</span></div></a>
 <p class="tiny">Every alert maps to a real MITRE ATT&CK v${esc(D.meta.attack)} technique; tap the tag after a call to check it. Callbacks bring back the <i>rule</i> with a different alert, so you learn the pattern instead of memorizing the card. Progress lives on this device.</p>
 </div>`;
  $('#go').onclick = () => go(startShift);
  $('#daily').onclick = () => go(() => (dly ? dailyResult() : startDaily()));
  $('#boss').onclick = () => (played ? go(bossIntro) : toast('Finish one shift to unlock the boss'));
  $('#dexb').onclick = () => go(() => dex());
  $('#ride').onclick = () => go(ride);
  $('#skill').onclick = () => go(skill);
  $('#snd').onclick = () => { S.sound = !S.sound; save(); home(); };
  $$('[data-inc]').forEach((b) => (b.onclick = () => (played ? go(() => incIntro(D.inc.find((i) => i.id === b.dataset.inc)!)) : toast('Finish one shift to unlock incidents'))));
}
