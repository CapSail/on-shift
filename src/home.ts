// The home screen (the "SOC").
import { D, crewById } from './content';
import { RANKS, S, liveStreak, rankOf, save } from './state';
import { dailyNumber, today } from './time';
import { dueConcepts, missedDue } from './srs';
import { RAR } from './crews';
import { app, go, toast } from './ui';
import { $, $$, esc } from './util';
import { puzzles } from './puzzles';
import { startAfterHours, startDaily, startShift } from './shift';
import { dailyResult } from './daily';
import { bossIntro, bossKey, weeklyBoss } from './boss';
import { dex } from './dex';
import { ride } from './ride';
import { catchStats, skill } from './skill';
import { incIntro } from './incidents';
import { tutorial } from './tutorial';
import { about } from './about';
import { friends } from './friends';
import { lbJoined } from './leaderboard';
import { SHIFTY_LINES } from './shifty';
import { shiftyHtml } from './shifty-live';
import { announceUnlocks, closet } from './closet';
import { pick } from './util';
import { APP_VERSION } from './config';
import { canInstall, isIosSafari, isStandalone, promptInstall } from './pwa';

function goalRing(): string {
  const g = S.dayGoal[today()] || 0, G = 20, p = Math.min(1, g / G), r = 18, C = 2 * Math.PI * r;
  return `<div class="ring"><svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="${r}" fill="none" stroke="#151c27" stroke-width="6"/><circle cx="23" cy="23" r="${r}" fill="none" stroke="${p >= 1 ? '#3ee68a' : '#22d3ee'}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}" transform="rotate(-90 23 23)"/></svg>
 <div><b>${p >= 1 ? 'Daily goal hit ✓' : g + ' / ' + G + ' correct calls today'}</b><span>🔥 ${liveStreak()}-day streak${S.freeze ? ' · 🧊×' + S.freeze : ''} · streak counts when you finish a round</span></div></div>`;
}

function installCard(): string {
  if (isStandalone()) return '';
  if (canInstall()) return '<button class="big alt" id="install"><span class="px" style="font-size:12px">INSTALL THE APP</span><small>Full screen, works offline in the car, keeps your progress safe</small></button>';
  if (isIosSafari()) return '<div class="intro" style="margin-top:12px"><b style="font-size:13px">Keep your progress: add to Home Screen</b><p style="font-size:14px">Tap <b>Share</b>, then <b>Add to Home Screen</b>, and open ON SHIFT from the new icon. Safari can erase a website\'s saved data after a week of not using it; an installed app is exempt.</p></div>';
  return '';
}

function shiftyLine(due: number, dailyDone: boolean): string {
  const h = new Date().getHours();
  if (due >= 3) return `${due} rematches are waiting. They missed you.`;
  if (liveStreak() >= 3) return `🔥 ${liveStreak()} days in a row. Even the dead respect that.`;
  if (!dailyDone) return "Today's daily is up. I'll hold your coat.";
  if (h >= 22 || h < 5) return 'Late again. Perfect ghost hours.';
  return pick(SHIFTY_LINES);
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
 <button class="chip" id="namechip">${S.name ? '👤 ' + esc(S.name) : 'set your name'}</button>
 <button class="chip" id="closetchip" aria-label="Shifty's closet">👒</button>
 <button class="chip" id="snd" aria-label="Sound">${S.sound ? '🔊' : '🔇'}</button></div></div>
 <button class="corner" id="shifty" aria-label="Shifty. Tap for a new line">${shiftyHtml('dead', 64)}<span class="bubble sm" id="shline">${esc(shiftyLine(due, !!dly))}</span></button>
 <div class="rank"><div class="t">RANK ${ri + 1}/${RANKS.length}</div><div class="n">${r[1]}</div>
 <div class="xpb"><i style="width:${pct}%"></i></div><div class="t" style="margin-top:6px">${S.xp} XP${nx ? ' · ' + (nx[0] - S.xp) + ' to ' + nx[1] : ' · max rank'} · <i>${r[2]}</i></div></div>
 ${installCard()}
 ${goalRing()}
 <button class="big" id="go"><span class="px">NEW ROUND</span><small>10 alerts · ${due ? `${Math.min(due, 5)} rematch${due > 1 ? 'es' : ''}${miss ? ` (${Math.min(miss, 5)} missed)` : ''} + fresh` : 'all fresh'} · ~5 min</small></button>
 <button class="big alt" id="daily"><span class="px" style="font-size:12px">DAILY HAUNT #${dailyNumber()}</span><small>${dly ? `Done: ${dly.score}/10 · tap to see your grid` : 'Same 10 alerts for everyone today · shareable result'}</small></button>
 <div class="grid">
  <button class="tile ${played ? '' : 'lock'}" id="boss" style="--c:var(--red)"><span class="k">Weekly boss</span><span class="v">${played ? esc(boss.n) : '🔒 Locked'}</span><small>${!played ? 'finish 1 round' : bs.won ? 'Defeated ✓' : bs.day === today() ? 'Tried today · back tomorrow' : RAR[boss.r][0] + ' · ' + boss.t.length + ' TTPs'}</small></button>
  <button class="tile" id="dexb" style="--c:var(--yl)"><span class="k">Crew dex</span><span class="v">${Object.keys(S.dex).length} / ${D.crews.length}</span><small>catch attacks → earn intel</small></button>
  <button class="tile" id="ride" style="--c:var(--cy)"><span class="k">Ride mode</span><span class="v">Ears only</span><small>earbud buttons answer</small></button>
  <button class="tile" id="skill" style="--c:var(--grn)"><span class="k">Skill report</span><span class="v">${S.log.length ? catchStats().line : 'No data yet'}</span><small>weak spots + drills</small></button>
 </div>
 <button class="big alt" id="puz"><span class="px" style="font-size:12px">PUZZLES</span><small>Twin Spotter · Name That Technique · 60-second Speed Round</small></button>
 <button class="big alt" id="afterh"><span class="px" style="font-size:12px">AFTER HOURS</span><small>Scams, accounts &amp; gadgets from real life · no work talk</small></button>
 <button class="big alt" id="friends"><span class="px" style="font-size:12px">FRIENDS</span><small>${lbJoined() ? 'Leaderboard · everyone\'s stats' : 'Set your name · the leaderboard'}</small></button>
 <div class="sec">Incidents · story mode</div>
 ${D.inc.map((i, ix) => {
    const c = crewById[i.g], st = S.inc[i.id];
    const lk = !played;
    return `<button class="inc" data-inc="${i.id}" ${lk ? 'style="opacity:.45"' : ''}><div class="ic">${['🕷️', '🐻', '⚡', '💀', '🦊', '🐉'][ix] || '☠️'}</div><div><b>${lk ? '🔒 ' : ''}${esc(i.title)}</b><span>vs ${esc(c.n)} · ${'💀'.repeat(i.diff)}</span></div>${st && st.won ? '<span class="done">CLEARED</span>' : ''}</button>`;
  }).join('')}
 <p class="tiny">Every alert maps to a real MITRE ATT&CK v${esc(D.meta.attack)} technique; tap the tag after a call to check it. Rematches bring back the <i>rule</i> with a different alert, so you learn the pattern instead of memorizing the card. Progress lives on this device.</p>
 <p class="tiny"><button class="linkbtn" id="about">About, credits &amp; report a problem</button> · v${esc(APP_VERSION)}</p>
 </div>`;
  $('#go').onclick = () => go(startShift);
  $('#daily').onclick = () => go(() => (dly ? dailyResult() : startDaily()));
  $('#boss').onclick = () => (played ? go(bossIntro) : toast('Finish one round to unlock the boss'));
  $('#dexb').onclick = () => go(() => dex());
  $('#ride').onclick = () => go(ride);
  $('#skill').onclick = () => go(skill);
  $('#about').onclick = () => go(about);
  $('#friends').onclick = () => go(friends);
  $('#afterh').onclick = () => go(startAfterHours);
  $('#puz').onclick = () => go(puzzles);
  $('#namechip').onclick = () => go(friends);
  $('#shifty').onclick = () => { $('#shline').textContent = pick(SHIFTY_LINES); };
  $('#closetchip').onclick = () => go(closet);
  announceUnlocks();
  const inst = document.getElementById('install');
  if (inst) inst.onclick = () => void promptInstall();
  $('#snd').onclick = () => { S.sound = !S.sound; save(); home(); };
  $$('[data-inc]').forEach((b) => (b.onclick = () => (played ? go(() => incIntro(D.inc.find((i) => i.id === b.dataset.inc)!)) : toast('Finish one round to unlock incidents'))));
}
