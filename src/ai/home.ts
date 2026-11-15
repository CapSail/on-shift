// Home: Shifty, his tier, the big "train" button, the temperature dial and the mode tiles.
import { RANKS, S, liveStreak, params, rankOf, save } from './state';
import { CONCEPTS, C } from './content';
import { readiness, weakest } from './srs';
import { runPreview, startBench, startBoss, startDaily, startDrill, startRun } from './run';
import { speed } from './speed';
import { app, go } from '../engine/ui';
import { shiftyHtml } from '../engine/shifty-live';
import { sh, dale } from './lines';
import { today, week, dailyNumber } from './time';
import { $, esc } from '../engine/util';
import { modelCard } from './modelcard';
import { syllabus } from './syllabus';
import { earbud } from './earbud';
import { about } from './about';
import { onboarding } from './onboarding';
import { closetHtml, wireCloset } from './closet';
import { canInstall, isIosSafari, isStandalone, promptInstall } from '../engine/pwa';
import { switchHtml, wireSwitch } from '../engine/switcher';

export function home(): void {
  if (!S.onb) return onboarding();
  const r = rankOf(S.xp), cur = RANKS[r], nxt = RANKS[r + 1];
  const pct = nxt ? Math.round((100 * (S.xp - cur[0])) / (nxt[0] - cur[0])) : 100;
  const pv = runPreview();
  const seenN = Object.keys(S.cs).length;
  const rd = readiness();
  const daily = S.daily[today()];
  const boss = S.boss[week()];
  const bossLocked = boss?.lastTry === today() || boss?.won;
  const days = S.examDay ? S.examDay - today() : null;
  const st = liveStreak();

  app.innerHTML = `<div class="scr">
<div class="hdr"><span class="logo px">SHIFTY<b>-1</b></span><span class="chip" style="margin-left:auto" title="Uptime: days in a row you finished something">🔥 ${st}</span><span class="chip">${S.xp} XP</span></div>
${switchHtml()}
<button class="corner" id="poke">${shiftyHtml('dead', 64, '', false)}<div class="bubble sm" id="shline">${esc(sh('home'))}</div></button>
<div class="rank"><div class="t">MODEL TIER ${r + 1}/10 · ${params(S.xp)} params (allegedly)</div><div class="n">${esc(cur[1])} <small class="flav">${esc(cur[2])}</small></div><div class="xpb"><i style="width:${pct}%"></i></div>
<div class="t" style="margin-top:6px">${nxt ? `${nxt[0] - S.xp} XP to ${esc(nxt[1])}` : 'Max tier. Dale wants a demo.'}</div></div>
<button class="big" id="go"><span class="px">START TRAINING RUN</span><small>${pv.due ? `${pv.due} review${pv.due > 1 ? 's' : ''} due` : 'No reviews due'}${pv.fresh ? ` · ${pv.fresh} new concept${pv.fresh > 1 ? 's' : ''}` : ''} · about 5 min</small></button>
<div class="temp"><span class="tl">TEMPERATURE</span><button class="tb ${S.temp === 0 ? 'on' : ''}" data-t="0">0.2 <small>careful</small></button><button class="tb hot ${S.temp === 1 ? 'on' : ''}" data-t="1">1.0 <small>spicy</small></button></div>
<p class="tiny tl2">${S.temp === 0 ? 'Low temperature: you choose when you are sure. Lean answers are safe.' : 'High temperature: every answer counts as SURE. +20 right, −20 wrong. Only pays off if you are right about 2 times in 3.'}</p>
<div class="grid">
 <button class="tile" id="daily" style="--c:var(--cy)"><span class="k">Daily eval #${dailyNumber()}</span><span class="v">${daily ? `${daily.score}/${daily.n} ${daily.grid}` : '10 cards, same for everyone'}</span><small>${daily ? 'Done. Tap to share.' : 'Shareable grid'}</small></button>
 <button class="tile" id="bench" style="--c:var(--grn)"><span class="k">Benchmark</span><span class="v">Mock exam</span><small>${S.bench.length ? `last ${S.bench[S.bench.length - 1].score}/1000` : '20 Q, exam-weighted, no hints'}</small></button>
 <button class="tile ${bossLocked ? 'locked' : ''}" id="boss" style="--c:var(--red)"><span class="k">Red team</span><span class="v">DALE-GPT</span><small>${boss?.won ? 'Beaten this week 👑' : bossLocked ? 'One try a day. Back tomorrow.' : 'He tries to jailbreak Shifty'}</small></button>
 <button class="tile" id="ear" style="--c:var(--pu)"><span class="k">Earbud mode</span><span class="v">Hands-free</span><small>Listen, answer with ⏮ / ⏭</small></button>
 <button class="tile" id="card" style="--c:var(--yl)"><span class="k">Model card</span><span class="v">${seenN ? `≈${rd.score}/1000` : 'No data yet'}</span><small>${seenN}/${CONCEPTS.length} trained · ${days !== null ? (days >= 0 ? `Exam in ${days} day${days === 1 ? '' : 's'}` : 'Exam date passed: update it') : 'Readiness · set exam date'}</small></button>
 <button class="tile" id="spd" style="--c:var(--or)"><span class="k">Speed round</span><span class="v">60 seconds</span><small>${S.puzBest ? `best ${S.puzBest} (right − wrong)` : 'Right minus wrong. No mashing.'}</small></button>
 <button class="tile" id="weak" style="--c:var(--r1)"><span class="k">Weak spots</span><span class="v">Drill</span><small>${seenN ? 'Your 5 weakest concepts' : 'After your first run'}</small></button>
 <button class="tile" id="syl" style="--c:var(--pk)"><span class="k">Syllabus</span><span class="v">${seenN}/${CONCEPTS.length} concepts</span><small>Every exam objective</small></button>
</div>
${!isStandalone() && (canInstall() || isIosSafari()) ? `<button class="next ghost" id="inst">${canInstall() ? '📲 Install the app' : '📲 Add to Home Screen (Share → Add to Home Screen)'}</button>` : ''}
<div class="sec">Model upgrades</div>${closetHtml()}
<p class="tiny">${esc(C.exam.name)} (${esc(C.exam.code)}) · ${esc(C.exam.guide)} · content ${esc(C.version)}<br><button class="linkbtn" id="about">About, credits, free study links</button> · <button class="linkbtn" id="snd">${S.sound ? '🔊 sound on' : '🔇 sound off'}</button></p>
</div>`;

  $('#go').onclick = () => go(startRun);
  $('#daily').onclick = () => go(startDaily);
  $('#bench').onclick = () => go(benchPick);
  $('#boss').onclick = () => (bossLocked ? void 0 : go(bossIntro));
  $('#ear').onclick = () => go(earbud);
  $('#card').onclick = () => go(modelCard);
  $('#syl').onclick = () => go(syllabus);
  $('#spd').onclick = () => go(speed);
  $('#weak').onclick = () => { if (seenN) go(() => startDrill(weakest(5))); };
  $('#about').onclick = () => go(about);
  $('#snd').onclick = () => { S.sound = !S.sound; save(); home(); };
  const inst = document.getElementById('inst');
  if (inst) inst.onclick = () => { if (canInstall()) void promptInstall(); };
  document.querySelectorAll<HTMLButtonElement>('.tb').forEach((b) => b.onclick = () => { S.temp = +b.dataset.t! as 0 | 1; save(); home(); });
  $('#poke').onclick = () => { $('#shline').textContent = sh('home'); };
  wireCloset(app, home);
  wireSwitch(app);
}

function benchPick(): void {
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="quit">✕</button><b>Benchmark</b></div>
<div class="intro"><p>Exam conditions: questions weighted like the real AIF-C01, only exam-style formats (multiple choice, multiple response, ordering, matching), <b>no feedback until the end</b>. Scored 100–1000; the pass line is 700.</p><p class="note">The real exam is 65 questions in 90 minutes (about 83 seconds each). The clock shows your pace.</p></div>
<button class="big" id="b20"><span class="px">QUICK · 20 Q</span><small>About 15 minutes</small></button>
<button class="big alt" id="b40"><span class="px">HALF · 40 Q</span><small>About 30 minutes.</small></button>
<button class="big alt" id="b65"><span class="px">EXAM SIM · 65 Q</span><small>The real length: 65 questions, aim for under 90 minutes. Dress rehearsal.</small></button>
${S.bench.length ? `<div class="sec">History</div><div class="sk">${S.bench.slice(-8).reverse().map((b) => `<div class="weak"><b>${b.score}/1000</b><span>${b.score >= 700 ? 'pass' : 'not yet'} · day ${b.day - S.bench[0].day + 1}</span></div>`).join('')}</div>` : ''}
</div>`;
  $('#quit').onclick = () => history.back();
  $('#b20').onclick = () => go(() => startBench(20));
  $('#b40').onclick = () => go(() => startBench(40));
  $('#b65').onclick = () => go(() => startBench(65));
}

function bossIntro(): void {
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="quit">✕</button><b>Red team</b></div>
<div class="boss"><div class="bn"><span>DALE-GPT</span><span>100/100</span></div><div class="hp"><i style="width:100%"></i></div><div class="taunt">“${esc(dale('boss'))}”</div></div>
<div class="intro"><p>Dale read one blog post about prompt injection and now he is the threat actor. Every card is a defense: security, governance, responsible AI and prompt risks.</p><p><b>Rules:</b> every answer counts as SURE. 6 right answers knock him out. 3 wrong and Shifty is jailbroken. One try per day, and the attack deck changes daily.</p></div>
<button class="big" id="fight" style="background:var(--red)"><span class="px">DEFEND SHIFTY</span><small>About 2 minutes. New cards every day.</small></button></div>`;
  $('#quit').onclick = () => history.back();
  $('#fight').onclick = () => go(startBoss);
}
