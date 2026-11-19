// The briefing book (readiness + every objective and concept, with the lesson and a drill) and the case board.
import { C, CASES, CONCEPTS, DOMAINS, conceptById } from './content';
import { S, save } from './state';
import { engineerRate, readiness, strength, weakest } from './srs';
import { startCase, startDrill } from './play';
import { app, go, setLeaving } from '../engine/ui';
import { shiftyHtml } from '../engine/shifty-live';
import { today, DAY } from './time';
import { $, $$, esc } from '../engine/util';

export function briefing(): void {
  const rd = readiness();
  const met = Object.keys(S.cs).filter((id) => conceptById.has(id)).length;
  const eng = engineerRate();
  const sureN = S.log.filter((e) => e.sure && e.mode !== 'exam');
  const sureWrong = sureN.filter((e) => !e.ok).length;
  const days = S.examDay ? S.examDay - today() : null;
  const weak = weakest(5).filter((id) => S.cs[id]);
  const iso = S.examDay ? new Date(S.examDay * DAY).toISOString().slice(0, 10) : '';
  app.innerHTML = `<div class="scr cissp"><div class="bar"><button class="x" id="quit" aria-label="Back">✕</button><b>Briefing book</b></div>
<div class="sk">${shiftyHtml('happy', 56, 'sm')}<h3>Readiness</h3>
${met < Math.ceil(CONCEPTS.length * 0.2) ? `<p class="note"><b>Too early for a number:</b> ${met} of ${CONCEPTS.length} concepts met. Close a few more cases.</p>` : `<div class="grade ${rd.score >= 700 ? 'pass' : ''}" style="font-size:40px">≈${rd.score}<small style="font-size:16px">/1000</small></div>`}
<p class="note"><b>Retention</b>: how well the concepts you've met are holding up in spaced review, weighted like the exam. It grows as you cover more of the outline. It is not an exam score: the board exam is the better check, and the real exam the only true one.</p>
${DOMAINS.map((d, j) => `<div class="meter"><div class="row"><span>D${d.n} ${esc(d.short)} <small>(${d.w}%)</small></span><b>${Math.round(rd.dom[j] * 100)}%</b></div><div class="bb"><i style="width:${rd.dom[j] * 100}%;background:${d.color}"></i></div></div>`).join('')}
<div class="weak"><b>🔧 Engineer answers</b><span>${eng.misses ? `picked in ${eng.eng} of ${eng.misses} scenes that had one (${Math.round((100 * eng.eng) / eng.misses)}%)` : 'none met yet'}</span></div>
<div class="weak"><b>🎯 Sure but wrong</b><span>${sureN.length ? `${sureWrong} of ${sureN.length} sure answers` : 'no sure answers yet'}</span></div>
<p class="note">Engineer answers are the hands-on fixes CISSP marks wrong. If that number is high, slow down and ask "who decides, and what does the plan say?"</p></div>
<div class="sk"><h3>Exam date</h3><p class="note">${days !== null ? (days >= 0 ? `${days} day${days === 1 ? '' : 's'} to go.` : 'That date has passed.') : 'Set it to see the countdown.'} The 2027 outline applies from April 15, 2027.</p>
<div class="exrow"><input type="date" id="exd" value="${iso}" aria-label="Exam date"><button class="tb" id="exs">Save</button></div></div>
${weak.length ? `<button class="next" id="drill">Drill my 5 weakest</button>` : ''}
<div class="sec">Every objective</div>
${DOMAINS.map((d) => `<details class="dombook"><summary><i class="dot" style="--c:${d.color}"></i>D${d.n} ${esc(d.name)} <small>${d.w}%</small></summary>
${Object.entries(C.objectives).filter(([o]) => o.startsWith(d.n + '.')).map(([o, t]) => `<div class="objrow"><b>${esc(o)}</b> ${esc(t)}<div class="concepts">${CONCEPTS.filter((c) => c.obj === o).map((c) => `<button class="syl ${strength(c.id) >= 0.75 ? 'mast' : ''}" data-c="${esc(c.id)}">${S.cs[c.id] ? '●' : '○'} ${esc(c.name)}</button>`).join('')}</div></div>`).join('')}</details>`).join('')}
</div>`;
  $('#quit').onclick = () => history.back();
  $('#exs').onclick = () => {
    const v = ($('#exd') as HTMLInputElement).value;
    S.examDay = v ? Math.floor(Date.parse(v + 'T12:00:00Z') / DAY) : null;
    save();
    briefing();
  };
  const dr = document.getElementById('drill');
  if (dr) dr.onclick = () => go(() => startDrill(weak));
  $$('[data-c]').forEach((b) => (b.onclick = () => lesson(b.dataset.c!)));
}

function lesson(cid: string): void {
  const c = conceptById.get(cid)!;
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="box" role="dialog" aria-label="${esc(c.name)}"><div class="dom">${esc(c.obj)} · <b>BRIEFING</b></div><h2>${esc(c.name)}</h2>
<div class="rule"><b>THE RULE</b><p>${esc(c.rule)}</p></div><ul class="learn">${c.learn.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
${c.ghost ? `<p class="note ghostline">👻 ${esc(c.ghost)}</p>` : ''}<p class="srcline">Source: ${esc(c.src)}</p>
<button class="next" id="md">Drill this concept</button><button class="next ghost" id="mx">Close</button></div>`;
  document.body.appendChild(m);
  const close = () => { m.remove(); setLeaving(null); };
  setLeaving(close); // browser back closes the card too (it lives on <body>, outside the screen it covers)
  m.onclick = (e) => { if (e.target === m) close(); };
  (m.querySelector('#mx') as HTMLElement).onclick = close;
  (m.querySelector('#md') as HTMLElement).onclick = () => { close(); go(() => startDrill([cid])); };
}

export function caseBoard(): void {
  app.innerHTML = `<div class="scr cissp"><div class="bar"><button class="x" id="quit" aria-label="Back">✕</button><b>Case board</b></div>
<p class="note">Every case Shifty has worked at Halvorsen Freight. Replays count for practice and flashbacks; the board keeps your best grade.</p>
${DOMAINS.map((d) => `<div class="sec"><i class="dot" style="--c:${d.color}"></i> D${d.n} ${esc(d.short)}</div>${CASES.filter((k) => k.d === d.n).map((k) => {
    const g = S.done[k.id]?.grade;
    return `<button class="inc" data-k="${esc(k.id)}"><div class="ic">${g ? esc(g) : '📁'}</div><div><b>${esc(k.title)}</b><span>${esc(k.where)} · ${k.scenes.length} scenes · ${'★'.repeat(k.diff)}${'☆'.repeat(3 - k.diff)}</span></div>${g ? '<span class="done">CLOSED</span>' : ''}</button>`;
  }).join('')}`).join('')}
</div>`;
  $('#quit').onclick = () => history.back();
  $$('[data-k]').forEach((b) => (b.onclick = () => go(() => startCase(b.dataset.k!))));
}
