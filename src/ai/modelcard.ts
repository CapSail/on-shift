// Shifty's Model Card: the skill report, styled like a real model card (which is itself an exam topic, task 4.2).
import { CONCEPTS, DOMAINS, conceptById } from './content';
import { RANKS, S, params, rankOf, save } from './state';
import { readiness, strength, weakest, newLeft } from './srs';
import { daysForNew, plannedNew, startDrill } from './run';
import { app, go } from '../engine/ui';
import { shiftyHtml } from '../engine/shifty-live';
import { today, DAY } from './time';
import { $, esc } from '../engine/util';

const pctS = (n: number, d: number) => (d ? Math.round((100 * n) / d) + '%' : '—');

export function modelCard(): void {
  const L = S.log.filter((e) => e.mode !== 'pre' && e.mode !== 'speed');
  // calibration only counts answers where YOU chose sure or lean (not temperature 1.0, red team or earbud)
  const CL = L.filter((e) => !e.forced && e.mode !== 'earbud' && e.mode !== 'boss');
  const sureL = CL.filter((e) => e.sure), leanL = CL.filter((e) => !e.sure);
  const sureAcc = sureL.length ? sureL.filter((e) => e.ok).length / sureL.length : 0;
  const leanAcc = leanL.length ? leanL.filter((e) => e.ok).length / leanL.length : 0;
  const halluRate = sureL.length ? sureL.filter((e) => !e.ok).length / sureL.length : 0;
  const ret = L.filter((e) => (e.gap ?? 0) >= 7);
  const rd = readiness();
  const mastered = Object.values(S.cs).filter((c) => c.box >= 3).length;
  const seen = Object.keys(S.cs).length;
  const weak = weakest(5).filter((id) => conceptById.has(id));
  const r = rankOf(S.xp);
  const days = S.examDay ? S.examDay - today() : null;
  const kinds = ['mcq', 'multi', 'hallu', 'tf', 'order', 'match', 'duel'].map((k) => { const x = L.filter((e) => e.kind === k); return { k, n: x.length, a: x.length ? x.filter((e) => e.ok).length / x.length : 0 }; }).filter((x) => x.n);
  const calib = sureL.length >= 10 && leanL.length >= 10
    ? sureAcc - leanAcc < 0.1 ? 'Your "sure" is not more accurate than your "lean" yet, so your confidence is not telling you much. Only tap Sure when you could explain why.' : 'Calibrated: your sure answers really are more accurate. Trust that signal on exam day (flag lean ones for review).'
    : 'Needs 10+ sure and 10+ lean answers.';
  const isoDay = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);

  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="quit">✕</button><b>Model card</b></div>
<div class="mc-head">${shiftyHtml('happy', 56, '')}<div><div class="px" style="font-size:12px;color:var(--grn)">SHIFTY-1</div><div class="note mono">tier ${r + 1}: ${esc(RANKS[r][1])} · ${params(S.xp)} params · ${S.runs} runs</div></div></div>

<div class="sk"><h3>Intended use</h3><p class="note">Passing the AWS Certified AI Practitioner exam (AIF-C01). Not intended for: replacing the SOC (sorry, Dale).</p></div>

<div class="sk"><h3>Evaluation · readiness by domain</h3>
<div class="big2">≈ ${rd.score}<small style="font-size:13px;color:var(--dim)"> / 1000 estimated (pass 700)</small></div>
${DOMAINS.map((d, j) => `<div class="meter"><div class="row"><span>D${d.n} ${esc(d.short)} <small>(${d.w}% of exam)</small></span><b>${Math.round(rd.dom[j] * 100)}%</b></div><div class="bb"><i style="width:${rd.dom[j] * 100}%;background:${d.color}"></i></div></div>`).join('')}
<p class="note">An estimate from concept strength and recall, weighted like the exam. Concepts you have not trained yet count as zero, so this starts low and climbs as you cover the syllabus; a benchmark measures what you can already do. ${S.bench.length ? `Last benchmark: <b>${S.bench[S.bench.length - 1].score}</b>.` : 'Take a benchmark to check it against exam-style questions.'} Book the exam when benchmarks are 750+ two runs in a row.</p></div>

<div class="sk"><h3>Exam date</h3>
<div class="row2"><input type="date" id="exd" min="${isoDay(today())}" value="${S.examDay ? isoDay(S.examDay) : ''}"><button class="next ghost" id="exs" style="margin:0;width:auto;padding:12px 16px">Save</button></div>
<p class="note">${days !== null && days >= 0 ? `${days} day${days === 1 ? '' : 's'} left. ${newLeft()} concepts not started yet, so each run teaches ${plannedNew()} new concept${plannedNew() === 1 ? '' : 's'} (the last 3 days are kept for review and benchmarks).${newLeft() && Math.ceil(newLeft() / daysForNew()) > 5 ? ' <b style="color:var(--yl)">Tight: that is more than 5 new concepts a day. Do two runs a day, or move the date.</b>' : ''}` :'Set a date and every run paces new concepts so you finish the syllabus in time.'}</p></div>

<div class="sk"><h3>Training data</h3>
<div class="meter"><div class="row"><span>Concepts seen</span><b>${seen}/${CONCEPTS.length}</b></div><div class="bb"><i style="width:${(100 * seen) / CONCEPTS.length}%;background:var(--cy)"></i></div></div>
<div class="meter"><div class="row"><span>Mastered (16+ day interval)</span><b>${mastered}/${CONCEPTS.length}</b></div><div class="bb"><i style="width:${(100 * mastered) / CONCEPTS.length}%;background:var(--grn)"></i></div></div></div>

<div class="sk"><h3>Known limitations</h3>
<div class="weak"><b>Hallucination rate</b><span>${sureL.length ? pctS(sureL.filter((e) => !e.ok).length, sureL.length) : '—'} of SURE answers wrong</span></div>
<div class="weak"><b>Calibration</b><span>sure ${pctS(sureL.filter((e) => e.ok).length, sureL.length)} · lean ${pctS(leanL.filter((e) => e.ok).length, leanL.length)}</span></div>
<p class="note">${esc(calib)}</p>
<div class="weak"><b>Retention (7+ day gaps)</b><span>${ret.length >= 5 ? pctS(ret.filter((e) => e.ok).length, ret.length) : `needs 5+ (${ret.length})`}</span></div>
<p class="note">Retention is the number that proves learning: accuracy on concepts you hadn't seen for a week or more.</p>
${kinds.map((x) => `<div class="weak"><b>${x.k}</b><span>${Math.round(x.a * 100)}% of ${x.n}</span></div>`).join('')}
${halluRate > 0.25 && sureL.length >= 10 ? '<p class="note" style="color:var(--yl)">Over a quarter of your sure answers are wrong. On the real exam, a confident wrong answer costs the same as a guess: slow down on those.</p>' : ''}</div>

<div class="sk"><h3>Weakest concepts</h3>${weak.length ? weak.map((id) => { const c = conceptById.get(id)!; return `<div class="weak"><b>${esc(c.name)}</b><span>${Math.round(strength(id) * 100)}% · ${esc(c.task)}</span></div>`; }).join('') + '<button class="next" id="drill">Drill my weak spots</button>' : '<p class="note">No data yet. Do a training run.</p>'}</div>
</div>`;
  $('#quit').onclick = () => history.back();
  const dr = document.getElementById('drill');
  if (dr) dr.onclick = () => go(() => startDrill(weak));
  $('#exs').onclick = () => {
    const v = ($('#exd') as HTMLInputElement).value;
    if (!v) { S.examDay = null; save(); modelCard(); return; }
    const [y, m, d] = v.split('-').map(Number);
    S.examDay = Math.floor(Date.UTC(y, m - 1, d) / DAY);
    save();
    modelCard();
  };
}
