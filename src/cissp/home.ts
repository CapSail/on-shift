// Home for the Ghost CISO: Shifty's standing, the big "next case" button and the mode tiles.
import { RANKS, S, liveStreak, rankOf, save } from './state';
import { C, CASES, CONCEPTS, caseById } from './content';
import { dueConcepts, nextCase, readiness, weakest } from './srs';
import { startCase, startDaily, startDrill, startExam, startFlashbacks } from './play';
import { app, go, toast } from '../engine/ui';
import { shiftyHtml } from '../engine/shifty-live';
import { sh } from './lines';
import { today, dailyNumber } from './time';
import { $, esc } from '../engine/util';
import { briefing, caseBoard } from './briefing';
import { about } from './about';
import { onboarding } from './onboarding';
import { closetHtml, wireCloset } from './closet';
import { canInstall, isIosSafari, isStandalone, promptInstall } from '../engine/pwa';
import { switchHtml, wireSwitch } from '../engine/switcher';

export function home(): void {
  if (!S.onb) return onboarding();
  const r = rankOf(S.xp), cur = RANKS[r], nxt = RANKS[r + 1];
  const pct = nxt ? Math.round((100 * (S.xp - cur[0])) / (nxt[0] - cur[0])) : 100;
  const nk = nextCase();
  const k = nk ? caseById.get(nk)! : null;
  const due = dueConcepts().length;
  const done = Object.keys(S.done).length;
  const daily = S.daily[today()];
  const met = Object.keys(S.cs).length;
  const rd = readiness();
  const days = S.examDay ? S.examDay - today() : null;
  const early = Math.ceil(CONCEPTS.length * 0.2);
  app.innerHTML = `<div class="scr cissp">
<div class="hdr"><span class="logo px">GHOST<b>·</b>CISO</span><span class="chip" style="margin-left:auto" title="Tenure: days in a row you finished something">🔥 ${liveStreak()}</span><span class="chip">${S.xp} XP</span></div>
${switchHtml()}
<button class="corner" id="poke">${shiftyHtml('happy', 64, '', false)}<div class="bubble sm" id="shline">${esc(sh('home'))}</div></button>
<div class="rank"><div class="t">STANDING ${r + 1}/${RANKS.length} · CISO, Halvorsen Freight</div><div class="n">${esc(cur[1])} <small class="flav">${esc(cur[2])}</small></div><div class="xpb"><i style="width:${pct}%"></i></div>
<div class="t" style="margin-top:6px">${nxt ? `${nxt[0] - S.xp} XP to ${esc(nxt[1])}` : 'Top of the org chart. Dale wants it framed.'}</div></div>
<button class="big" id="go"><span class="px">${k ? 'NEXT CASE' : 'REPLAY A CASE'}</span><small>${k ? `${esc(k.title)} · ${k.scenes.length} scenes` : 'Every case closed. Replay any from the case board.'}${due ? ` · ${Math.min(due, 3)} flashback${due > 1 ? 's' : ''} first` : ''}</small></button>
<div class="grid">
 <button class="tile" id="daily" style="--c:var(--cy)"><span class="k">Daily case #${dailyNumber()}</span><span class="v">${daily ? `${daily.score}/${daily.n} ${daily.grid}` : 'Same case for everyone'}</span><small>${daily ? 'Done. Tap to share.' : 'Shareable grid'}</small></button>
 <button class="tile" id="exam" style="--c:var(--grn)"><span class="k">Board exam</span><span class="v">Mock CAT</span><small>${S.exams.length ? `last ${S.exams[S.exams.length - 1].score}/1000` : 'Adaptive, no hints'}</small></button>
 <button class="tile" id="board" style="--c:var(--yl)"><span class="k">Case board</span><span class="v">${done}/${CASES.length} closed</span><small>Pick or replay any case</small></button>
 <button class="tile" id="book" style="--c:var(--pu)"><span class="k">Briefing book</span><span class="v">${met >= early ? `Retention ≈${rd.score}` : `${met}/${CONCEPTS.length} met`}</span><small>${met}/${CONCEPTS.length} concepts · ${days !== null ? (days >= 0 ? `exam in ${days} day${days === 1 ? '' : 's'}` : 'exam date passed') : 'readiness'}</small></button>
 <button class="tile" id="weak" style="--c:var(--r1)"><span class="k">Weak spots</span><span class="v">Drill</span><small>${met ? 'Your 5 weakest concepts' : 'After your first case'}</small></button>
 <button class="tile" id="flash" style="--c:var(--pk)"><span class="k">Flashbacks</span><span class="v">${due ? `${due} due` : 'All caught up'}</span><small>${due ? 'Spaced review, up to 8' : 'Come back tomorrow'}</small></button>
</div>
${!isStandalone() && (canInstall() || isIosSafari()) ? `<button class="next ghost" id="inst">${canInstall() ? '📲 Install the app' : '📲 Add to Home Screen (Share → Add to Home Screen)'}</button>` : ''}
<div class="sec">The CISO's wardrobe</div>${closetHtml()}
<p class="tiny">${esc(C.exam.outline)} · content ${esc(C.version)}<br><button class="linkbtn" id="about">About, sources, not affiliated with ISC2</button> · <button class="linkbtn" id="snd">${S.sound ? '🔊 sound on' : '🔇 sound off'}</button></p>
</div>`;
  $('#go').onclick = () => go(() => startCase(nk ?? undefined));
  $('#daily').onclick = () => go(startDaily);
  $('#exam').onclick = () => go(examPick);
  $('#board').onclick = () => go(caseBoard);
  $('#book').onclick = () => go(briefing);
  $('#weak').onclick = () => { if (met) go(() => startDrill(weakest(5))); else toast('Close a case first: weak spots come from your answers'); };
  $('#flash').onclick = () => { if (due) go(startFlashbacks); else toast('Nothing due today. Flashbacks come back on a schedule.'); };
  $('#about').onclick = () => go(about);
  $('#snd').onclick = () => { S.sound = !S.sound; save(); home(); };
  const inst = document.getElementById('inst');
  if (inst) inst.onclick = () => { if (canInstall()) void promptInstall(); };
  $('#poke').onclick = () => { $('#shline').textContent = sh('home'); };
  wireCloset(app, home);
  wireSwitch(app);
}

function examPick(): void {
  app.innerHTML = `<div class="scr cissp"><div class="bar"><button class="x" id="quit" aria-label="Back">✕</button><b>Board exam</b></div>
<div class="intro"><p>Exam conditions: single scenes from every case, weighted like the 2027 outline, <b>no feedback until the end</b>. It adapts like the real CAT: right answers bring harder scenes, misses bring easier ones. The score is an estimate on a 0 to 1000 scale; the real pass line is 700.</p><p class="note">The real exam: ${esc(C.exam.items)} items in ${C.exam.hours} hours (about 72 to 108 seconds each).</p></div>
<button class="big" id="e25"><span class="px">QUICK · 25</span><small>About 20 minutes</small></button>
<button class="big alt" id="e50"><span class="px">HALF · 50</span><small>About 45 minutes</small></button>
<button class="big alt" id="e125"><span class="px">FULL · 125</span><small>A full sitting. Do this a few times before the real one.</small></button>
${S.exams.length ? `<div class="sec">History</div><div class="sk">${S.exams.slice(-8).reverse().map((b) => `<div class="weak"><b>${b.score}/1000</b><span>${b.n} scenes · ${b.score >= 700 ? 'above the line' : 'not yet'}</span></div>`).join('')}</div>` : ''}
</div>`;
  $('#quit').onclick = () => history.back();
  $('#e25').onclick = () => go(() => startExam(25));
  $('#e50').onclick = () => go(() => startExam(50));
  $('#e125').onclick = () => go(() => startExam(125));
}
