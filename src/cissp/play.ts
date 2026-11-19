// Playing the CISSP shift. One runner for every mode: a case (with flashbacks first), the daily case, a drill and the
// adaptive board exam. A case reads like a story: the dateline and opening, one decision per scene with the story
// reacting, then the ending and the board's verdict.
import type { Case, Scene } from './types';
import { CASES, DOMAINS, POOL, SCENES, caseById, conceptById, domainOf, sceneById } from './content';
import { S, logEv, save, RANKS, rankOf } from './state';
import { today, dailyNumber } from './time';
import { cs, dueConcepts, grade, gradeOf, introduced, markSeen, nextCase, sceneFor } from './srs';
import { answerText, renderScene, type SceneOpts } from './scene';
import { addXP, earnStreak, setRunActive } from './progress';
import { closeBad, dale, flash, sh } from './lines';
import { app, confetti, dock, go, routes, setLeaving, sfx, stopDock, toast } from '../engine/ui';
import { shiftyHtml, shiftyReact } from '../engine/shifty-live';
import { $, esc, mulberry, resetRng, setRng, shuffle } from '../engine/util';
import { checkHats } from './closet';

export type Mode = 'case' | 'daily' | 'drill' | 'exam';
type Item = { t: 'scene'; s: Scene; mode: SceneOpts['mode'] } | { t: 'open'; k: Case } | { t: 'flashhead' };

function seeded<T>(seed: number, f: () => T): T {
  setRng(mulberry(seed));
  try { return f(); } finally { resetRng(); }
}

// ---------------------------------------------------------------- building

/** Up to 3 flashbacks (due concepts, a scene from a different case), then the case itself. */
export function buildCase(k: Case): Item[] {
  const inCase = new Set(k.scenes.map((s) => s.c));
  const due = dueConcepts().filter((c) => !inCase.has(c)).slice(0, 3);
  const fb: Item[] = due.map((c) => ({ t: 'scene', s: sceneFor(c, { notCase: k.id }), mode: 'flash' }));
  return [...(fb.length ? [{ t: 'flashhead' } as Item, ...fb] : []), { t: 'open', k }, ...k.scenes.map((s) => ({ t: 'scene' as const, s, mode: 'case' as const }))];
}

/** The daily case: the same case for everyone today (America/Chicago). */
export const dailyCase = (): Case => seeded(today() * 7919 + 101, () => shuffle(CASES)[0]);

export function buildDrill(cids: string[]): Item[] {
  const out: Scene[] = [];
  for (const c of cids) {
    const a = sceneFor(c);
    out.push(a);
    const b = sceneFor(c, { notCase: a.case, exclude: [a.id] });
    if (b.id !== a.id) out.push(b);
  }
  return shuffle(out).slice(0, 8).map((s) => ({ t: 'scene', s, mode: 'drill' }));
}

/** Split n items across domains by exam weight (largest remainder). */
export function alloc(n: number): number[] {
  const raw = DOMAINS.map((d) => (n * d.w) / 100);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; out.reduce((s, x) => s + x, 0) < n; k++) out[order[k % order.length][1]]++;
  return out;
}

/** How many times each board-exam item has been served in past exams (from the log). */
export function examServed(): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of S.log) if (e.mode === 'exam') m.set(e.id, (m.get(e.id) ?? 0) + 1);
  return m;
}

/**
 * The adaptive board exam, like CAT in spirit: domain quotas follow the exam weights; the next item's difficulty
 * goes up after a right answer and down after a miss. Items come from the exam-only pool (never seen while
 * studying), least-served first; only if a domain's pool runs dry does it borrow case scenes.
 */
export function examPicker(n: number): (lastOk: boolean | null) => Scene | null {
  const quota = alloc(n);
  const used = new Set<string>();
  const served = examServed();
  let target = 2, given = 0;
  return (lastOk) => {
    if (given >= n) return null;
    if (lastOk !== null) target = Math.max(1, Math.min(3, target + (lastOk ? 1 : -1)));
    const doms = DOMAINS.map((d, i) => ({ d, left: quota[i] })).filter((x) => x.left > 0);
    const dom = doms.length ? doms[Math.floor(Math.random() * doms.length)].d : DOMAINS[0];
    const fromPool = POOL.filter((s) => s.d === dom.n && !used.has(s.id));
    const pool = fromPool.length ? fromPool : SCENES.filter((s) => s.d === dom.n && !used.has(s.id));
    // least-served first: a fresh exam item beats one met in an earlier sitting; case scenes: unseen first
    const unseen = (ss: Scene[]) => {
      if (!ss.length) return ss;
      if (!ss[0].case) { const min = Math.min(...ss.map((s) => served.get(s.id) ?? 0)); return ss.filter((s) => (served.get(s.id) ?? 0) === min); }
      const u = ss.filter((s) => !(S.cs[s.c]?.seen ?? []).includes(s.id)); return u.length ? u : ss;
    };
    let cand = unseen(pool.filter((s) => s.diff === target));
    if (!cand.length) cand = unseen(pool.filter((s) => Math.abs(s.diff - target) === 1));
    if (!cand.length) cand = unseen(pool);
    if (!cand.length) cand = [...POOL, ...SCENES].filter((s) => !used.has(s.id));
    if (!cand.length) return null;
    const s = cand[Math.floor(Math.random() * cand.length)];
    used.add(s.id);
    quota[DOMAINS.findIndex((d) => d.n === s.d)]--;
    given++;
    return s;
  };
}

// ---------------------------------------------------------------- playing

interface Res { s: Scene; ok: boolean; sure: boolean; partial: boolean; eng: boolean; mode: string }

const GRADES: [number, string][] = [[85, 'A'], [70, 'B'], [55, 'C'], [40, 'D'], [0, 'F']];
const letter = (conf: number) => GRADES.find(([min]) => conf >= min)![1];

export function play(mode: Mode, items: Item[], title: string, examN = 0): void {
  const res: Res[] = [];
  let i = 0, combo = 0, best = 0, conf = 100;
  const xp0 = S.xp, rank0 = rankOf(S.xp), t0 = Date.now();
  const kase = items.find((x): x is Extract<Item, { t: 'open' }> => x.t === 'open')?.k;
  const pickExam = mode === 'exam' ? examPicker(examN) : null;
  if (pickExam) { const s = pickExam(null); if (s) items.push({ t: 'scene', s, mode: 'exam' }); }
  // `live` goes false when the player leaves (✕, back, a deep link): a pending timer must not draw this run over home
  let live = true;
  setRunActive(true);
  setLeaving(() => { live = false; stopDock(); setRunActive(false); });

  const flashN = () => items.filter((x) => x.t === 'scene' && x.mode === 'flash').length;
  let examXp = 0; // the board exam shows nothing until the end, not even an XP float
  const total = () => (mode === 'exam' ? examN : items.filter((x) => x.t === 'scene').length);
  function bar(): string {
    const pct = Math.round((100 * res.length) / Math.max(1, total()));
    const right = mode === 'exam' ? `<span class="benchq">Q${Math.min(res.length + 1, examN)}/${examN}</span>`
      : mode === 'case' || mode === 'daily' ? `<span class="bconf" title="Board confidence">🏛 ${conf}</span>` : `<span class="combo" id="combo">${combo >= 2 ? `x${combo}` : ''}</span>`;
    return `<div class="bar"><button class="x" id="quit" aria-label="Quit">✕</button>${shiftyHtml('dead', 30, 'sm', true)}<div class="prog"><i style="width:${pct}%"></i></div>${right}</div>`;
  }

  function step(): void {
    if (!live) return;
    stopDock();
    if (i >= items.length) return end();
    const it = items[i];
    if (it.t === 'flashhead') return interlude(`<div class="sec">FLASHBACKS</div>${shiftyHtml('sleepy', 72, 'lg')}<div class="bubble">${esc(flash())}</div><p class="note">Before the new case: ${flashN()} scene${flashN() === 1 ? '' : 's'} for concepts that are due today, each from a different case than before.</p>`, 'Show me');
    if (it.t === 'open') return interlude(`<div class="dateline lead">${esc(it.k.where)}</div><h2 class="casetitle">${esc(it.k.title)}</h2>${shiftyHtml('happy', 72, 'lg')}<p class="story-open">${esc(it.k.open)}</p><div class="dom center"><i class="dot" style="--c:${domainOf(it.k.d).color}"></i>D${it.k.d} ${esc(domainOf(it.k.d).short)} · ${it.k.scenes.length} scenes · ${'★'.repeat(it.k.diff)}${'☆'.repeat(3 - it.k.diff)}</div>`, 'Take the case');
    const s = it.s;
    app.innerHTML = `<div class="scr run cissp">${bar()}<div id="slot"></div></div>`;
    app.scrollTop = 0;
    $('#quit').onclick = quit;
    // never graded = first real meeting (a concept first seen in the board exam got no feedback there)
    const fresh = (S.cs[s.c]?.n ?? 0) === 0;
    renderScene($('#slot'), s, {
      mode: it.mode,
      sure: null,
      feedback: mode !== 'exam',
      fresh,
      stakes: mode === 'daily' ? 'on: counts as 🟩' : mode === 'exam' ? 'tracks your calibration' : '+15 / −10 when on',
      onAnswer: (p, fb) => answered(s, it.mode, p, fb),
    });
  }

  function quit(): void {
    if (res.length && kase && !confirm('Leave the case? Your answers so far still count for flashbacks, but the case stays open.')) return;
    history.back();
  }

  function interlude(html: string, btn: string): void {
    app.innerHTML = `<div class="scr run cissp">${bar()}<div class="interlude center">${html}</div></div>`;
    app.scrollTop = 0;
    $('#quit').onclick = () => history.back();
    i++;
    dock(btn, step);
  }

  function answered(s: Scene, sm: SceneOpts['mode'], p: { ok: boolean; sure: boolean; partial: boolean; eng: boolean }, fb: HTMLElement | null): void {
    res.push({ s, ok: p.ok, sure: p.sure, partial: p.partial, eng: p.eng, mode: sm });
    const wasIntro = introduced(s.c);
    // the board exam only grades concepts you have already met; everything else teaches and grades
    let gap: number | undefined;
    if (mode !== 'exam' || wasIntro) gap = grade(s.c, gradeOf(p.ok, p.sure)).gap;
    if (introduced(s.c)) markSeen(s.c, s.id); else cs(s.c);
    logEv({ id: s.id, c: s.c, d: s.d, kind: s.kind, ok: p.ok, sure: p.sure, eng: p.eng || undefined, mode: sm, gap: wasIntro ? gap : undefined });
    combo = p.ok ? combo + 1 : 0;
    best = Math.max(best, combo);
    if (sm === 'case' || mode === 'daily') conf = Math.max(0, conf - (p.ok ? 0 : p.partial ? 8 : p.sure ? 25 : 15));
    let gain = mode === 'exam' ? (p.ok ? 6 : 0) : p.ok ? (p.sure ? 15 : 8) : p.sure ? -10 : 0;
    if (mode !== 'exam' && p.ok && combo >= 2) gain += Math.min(10, 2 * (combo - 1));
    if (mode === 'exam') examXp += gain; else addXP(gain, fb?.querySelector('#xpl') as HTMLElement | null, true);
    const xpl = fb?.querySelector('#xpl');
    if (xpl) xpl.textContent = (gain > 0 ? '+' : '') + gain + ' XP';
    const shl = fb?.querySelector('#shl');
    if (shl) shl.textContent = sh(p.ok ? 'ok' : 'no');
    save();
    i++;
    if (pickExam) {
      const nx = pickExam(p.ok);
      if (nx) items.push({ t: 'scene', s: nx, mode: 'exam' });
      setTimeout(step, 260); // exam conditions: no feedback, straight on
      return;
    }
    shiftyReact(p.ok ? 'happy' : 'shock');
    const cf = document.querySelector('.bconf');
    if (cf) cf.textContent = `🏛 ${conf}`;
    if (fb) setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    dock(i >= items.length ? (kase ? 'Close the case' : 'See results') : 'Next', step);
  }

  function end(): void {
    setRunActive(false);
    stopDock();
    const n = res.length;
    const right = res.filter((r) => r.ok).length;
    const caseRes = res.filter((r) => r.mode === 'case' || r.mode === 'daily');
    let extra = '';
    let daleLine = n && right === n ? dale('perfect') : n && right / n >= 0.6 ? dale('good') : dale('bad');
    let head = mode === 'drill' ? `${title.toUpperCase()} COMPLETE` : 'RESULTS';
    if (mode === 'drill') daleLine = dale('drill');
    if (kase) {
      const g = letter(conf);
      head = mode === 'daily' ? `DAILY CASE #${dailyNumber()}` : 'CASE CLOSED';
      const prev = S.done[kase.id];
      if (!prev || prev.grade > g) S.done[kase.id] = { grade: g, day: today() };
      S.cases++;
      const bonus = g === 'A' ? 25 : g === 'B' ? 10 : 0;
      if (bonus) addXP(bonus);
      extra = `<div class="casetitle">${esc(kase.title)}</div><p class="story-open">${esc(g === 'D' || g === 'F' ? closeBad() : kase.close)}</p><div class="grade">${g}</div><p class="note center">Board confidence ${conf}/100 · ${caseRes.filter((r) => r.ok).length}/${caseRes.length} calls right${bonus ? ` · +${bonus} XP case bonus` : ''}</p>`;
      if (mode === 'daily') {
        const grid = caseRes.map((r) => (r.ok ? (r.sure ? '🟩' : '🟨') : '🟥')).join('');
        if (!S.daily[today()]) S.daily[today()] = { score: caseRes.filter((r) => r.ok).length, n: caseRes.length, grid };
        daleLine = dale('daily');
        extra += shareBlock();
      }
    }
    if (mode === 'exam') {
      const per = DOMAINS.map((d) => { const r = res.filter((x) => x.s.d === d.n); return r.length ? r.filter((x) => x.ok).length / r.length : 0; });
      // harder scenes count more, like an adaptive exam rewards ability rather than raw count
      const wsum = res.reduce((t, r) => t + r.s.diff, 0);
      const wok = res.reduce((t, r) => t + (r.ok ? r.s.diff : 0), 0);
      const scaled = Math.round(1000 * (wsum ? wok / wsum : 0));
      S.exams.push({ day: today(), score: scaled, n, dom: per.map((x) => Math.round(x * 100)) });
      if (examXp) addXP(examXp);
      if (S.exams.length > 30) S.exams.shift();
      daleLine = dale('exam');
      const pass = scaled >= 700;
      const band = Math.round(1000 * Math.sqrt(Math.max(0.04, (scaled / 1000) * (1 - scaled / 1000)) / Math.max(1, n)));
      extra = `<div class="grade ${pass ? 'pass' : 'fail'}">${scaled}</div><p class="note center">A difficulty-weighted score, not an official scale: harder scenes count more. Likely ${Math.max(0, scaled - band)}–${Math.min(1000, scaled + band)} (${n} scenes). Pass line on the real exam: 700. ${pass ? 'Above it.' : 'Not yet.'} · ${fmtClock(Date.now() - t0)} (exam pace ≈ ${fmtClock(n * 72000)})</p>
<div class="sk">${DOMAINS.map((d, j) => `<div class="meter"><div class="row"><span>D${d.n} ${esc(d.short)} <small>(${d.w}%)</small></span><b>${Math.round(per[j] * 100)}%</b></div><div class="bb"><i style="width:${per[j] * 100}%;background:${d.color}"></i></div></div>`).join('')}</div>
<div class="sec">Review your misses</div>${res.filter((r) => !r.ok).map((r) => missRow(r.s, r.eng)).join('') || '<p class="note">No misses.</p>'}`;
    }
    const streakUp = n > 0 && earnStreak();
    save();
    const tier = RANKS[rankOf(S.xp)];
    const promoted = rankOf(S.xp) > rank0;
    const met = [...new Set(res.filter((r) => S.cs[r.s.c]?.n === 1).map((r) => conceptById.get(r.s.c)!.name))];
    const missedC = [...new Set(res.filter((r) => !r.ok).map((r) => r.s.c))].slice(0, 5);
    const engN = res.filter((r) => r.eng).length;
    const nxt = mode === 'case' ? nextCase() : null;
    app.innerHTML = `<div class="scr center endscr cissp">
<div class="sec">${head}</div>
${shiftyHtml(n && right / n >= 0.7 ? 'cheer' : n && right / n < 0.4 ? 'shock' : 'happy', 88, 'lg')}
${kase || mode === 'exam' ? '' : `<div class="grade">${right}/${n}</div>`}
${extra}
<div class="endstats"><span>${S.xp - xp0 >= 0 ? '+' : ''}${S.xp - xp0} XP</span><span>best combo x${best}</span><span>${esc(tier[1])}</span>${streakUp ? `<span>🔥 tenure ${S.streak}</span>` : ''}${engN ? `<span>🔧 ${engN} engineer answer${engN > 1 ? 's' : ''}</span>` : ''}</div>
${met.length ? `<div class="sk" style="text-align:left"><h3>New in your briefing book</h3>${met.slice(0, 6).map((x) => `<div class="weak"><b>${esc(x)}</b><span>flashback tomorrow</span></div>`).join('')}</div>` : ''}
<div class="dale"><div class="av">👔</div><div><b>DALE · CHIEF SYNERGY OFFICER</b><p>${esc(daleLine)}</p></div></div>
${promoted ? `<div class="upg"><b>⬆ PROMOTED</b><p>Shifty is now <b>${esc(tier[1])}</b>: ${esc(tier[2])}.</p></div>` : ''}
${nxt ? '<button class="next" id="again">Next case</button>' : ''}
${missedC.length ? `<button class="next ${nxt ? 'ghost' : ''}" id="drillm">Drill these misses (${missedC.length})</button>` : ''}
<button class="next ghost" id="home">Home</button>
</div>`;
    app.scrollTop = 0;
    if (n && right === n && mode !== 'exam') confetti(50);
    if (promoted) confetti(60);
    sfx(n && right / n >= 0.6 ? 'rank' : 'no');
    $('#home').onclick = () => go(routes.home);
    const again = document.getElementById('again');
    if (again && nxt) again.onclick = () => go(() => startCase(nxt));
    const dm = document.getElementById('drillm');
    if (dm) dm.onclick = () => go(() => startDrill(missedC));
    wireShare();
    checkHats();
  }

  step();
}

function shareText(): string {
  const d = S.daily[today()];
  return `ON SHIFT · Ghost CISO daily case #${dailyNumber()}\n${d.score}/${d.n} ${d.grid}\n${location.origin + location.pathname}#cissp`;
}
const shareBlock = () => `<div class="share" id="sharetxt">${esc(shareText())}</div><button class="next" id="share">Share result</button>`;
function wireShare(): void {
  const b = document.getElementById('share');
  if (!b) return;
  b.onclick = async () => {
    const text = shareText();
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { /* cancelled */ }
    try { await navigator.clipboard.writeText(text); toast('Copied. Paste it in the group chat.'); } catch { toast('Copy blocked. Long-press the text.'); }
  };
}

function missRow(s: Scene, eng: boolean): string {
  const c = conceptById.get(s.c)!;
  return `<div class="miss"><details class="mctx"><summary>The scenario</summary><p>${esc(s.text)}</p></details><div class="mq">${esc(s.ask)}</div><div class="ma">✔ ${esc(answerText(s))}</div>${eng ? '<div class="mw">🔧 You picked the engineer answer.</div>' : ''}<div class="mr"><b>${esc(c.name)}:</b> ${esc(c.rule)}</div><div class="mw">${esc(s.why)}</div><div class="cid">${esc(s.id)}</div></div>`;
}

const fmtClock = (ms: number) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ---------------------------------------------------------------- entry points

export function startCase(id?: string): void {
  const k = caseById.get(id ?? nextCase() ?? CASES[0].id)!;
  play('case', buildCase(k), k.title);
}
export function startDrill(cids: string[]): void { play('drill', buildDrill(cids), 'Drill'); }
/** Flashbacks on demand: up to 8 due concepts, each a scene from a case other than the last one seen. */
export function startFlashbacks(): void {
  const items: Item[] = dueConcepts().slice(0, 8).map((c) => ({ t: 'scene', s: sceneFor(c, { notCase: S.cs[c]?.seen.length ? sceneById.get(S.cs[c].seen[S.cs[c].seen.length - 1])?.case : undefined }), mode: 'flash' }));
  play('drill', items, 'Flashbacks');
}
export function startExam(n: number): void { play('exam', [], `Board exam · ${n}`, n); }
export function startDaily(): void {
  if (S.daily[today()]) {
    // one official attempt per day: show the result and the share button instead of a replay
    const d = S.daily[today()];
    app.innerHTML = `<div class="scr center cissp"><div class="bar"><button class="x" id="quit" aria-label="Back">✕</button><b>Daily case #${dailyNumber()}</b></div>
${shiftyHtml('happy', 80, 'lg')}<div class="grade">${d.score}/${d.n}</div>${shareBlock()}
<p class="tiny">Same case for everyone today (Central time). A new one tomorrow.</p></div>`;
    $('#quit').onclick = () => history.back();
    wireShare();
    return;
  }
  const k = dailyCase();
  play('daily', [{ t: 'open', k }, ...k.scenes.map((s) => ({ t: 'scene' as const, s, mode: 'daily' as const }))], 'Daily case');
}
