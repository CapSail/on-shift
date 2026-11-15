// Building and playing a run. One runner for every mode: training run, drill, daily eval, benchmark, red team.
import type { Card } from './types';
import { CARDS, CONCEPTS, DOMAINS, EXAM_KINDS, cardsOf, conceptById, domainOf } from './content';
import { S, logEv, save, RANKS, rankOf } from './state';
import { today, week, dailyNumber } from './time';
import { cardFor, cs, dueConcepts, grade, gradeOf, introduced, markSeen, newLeft, nextNewConcepts, weakest } from './srs';
import { renderCard, type CardOpts } from './card';
import { addXP, earnStreak, setRunActive } from './progress';
import { answerText } from './card';
import { ATTACKS, dale, sh } from './lines';
import { app, confetti, dock, go, routes, setLeaving, sfx, stopDock, toast } from '../engine/ui';
import { shiftyHtml, shiftyReact } from '../engine/shifty-live';
import { $, esc, mulberry, pick, resetRng, setRng, shuffle } from '../engine/util';
import { say, hush, canSpeak } from './voice';
import { checkHats } from './closet';
import { genFor } from './facts';

export type Mode = 'run' | 'drill' | 'daily' | 'bench' | 'boss';
type Item = { t: 'card'; k: Card; mode: CardOpts['mode'] } | { t: 'epoch'; cid: string };

// ---------------------------------------------------------------- building

/** New concepts per run: paced to the exam date when one is set. */
export function plannedNew(): number {
  const left = newLeft();
  if (!left) return 0;
  if (!S.examDay) return Math.min(2, left);
  return Math.max(1, Math.min(5, Math.ceil(left / daysForNew())));
}

/** Days left to introduce new concepts (the last 3 before the exam are for review and benchmarks). */
export const daysForNew = (): number => Math.max(1, (S.examDay ?? today()) - today() - 3);

export function runPreview(): { due: number; fresh: number } {
  const due = dueConcepts().length;
  return { due, fresh: due > 15 ? 0 : plannedNew() };
}

const PRACTICE_KINDS = ['mcq', 'multi', 'hallu', 'duel', 'match', 'order', 'tf'];

/**
 * A training run (~10 graded cards, about 5 minutes). Each NEW concept is: pretest (a guess, ungraded) → epoch
 * (the lesson) → practice right away → a second practice later in the run, in a different format (spacing within the
 * session). Due reviews and still-shaky concepts are interleaved between them.
 */
export function buildRun(size = 10): Item[] {
  const due = dueConcepts();
  const reviews = due.slice(0, 5);
  const first = !Object.keys(S.cs).length;
  const fresh = due.length > 15 ? [] : nextNewConcepts(first ? 3 : plannedNew());
  const used = new Set<string>([...reviews, ...fresh]);
  const groups = fresh.map((cid) => {
    const pre = cardsOf(cid).find((k) => k.pre) ?? cardsOf(cid)[0];
    const p1 = cardFor(cid, { exclude: [pre.id], kinds: PRACTICE_KINDS.filter((x) => x !== 'tf') });
    const p2 = cardFor(cid, { exclude: [pre.id, p1.id], kinds: PRACTICE_KINDS.filter((x) => x !== p1.kind) });
    return { intro: [{ t: 'card', k: pre, mode: 'pre' }, { t: 'epoch', cid }] as Item[], p1: { t: 'card', k: p1, mode: 'new' } as Item, p2: { t: 'card', k: p2, mode: 'new' } as Item };
  });
  // reviews: usually an authored card; sometimes a generated fact card for variety
  const rev: Item[] = reviews.map((cid) => ({ t: 'card', k: (Math.random() < 0.25 && genFor(cid)) || cardFor(cid), mode: 'review' }));
  // fill: concepts still being learned, then the weakest
  const graded = () => groups.length * 2 + rev.length + extra.length;
  const extra: Item[] = [];
  const learning = Object.keys(S.cs).filter((id) => !used.has(id) && S.cs[id].box <= 1 && conceptById.has(id));
  for (const cid of [...shuffle(learning), ...weakest(8)]) {
    if (graded() >= size) break;
    if (used.has(cid)) continue;
    used.add(cid);
    extra.push({ t: 'card', k: (Math.random() < 0.2 && genFor(cid)) || cardFor(cid), mode: 'practice' });
  }
  const q: Item[] = [];
  const others = shuffle([...rev, ...extra]);
  const late: Item[] = [];
  for (const g of groups) {
    q.push(...g.intro, g.p1);
    if (others.length) q.push(others.shift()!);
    late.push(g.p2);
    if (late.length > 1) q.push(late.shift()!);
  }
  while (others.length || late.length) {
    if (others.length) q.push(others.shift()!);
    if (late.length) q.push(late.shift()!);
  }
  return dedupeAdjacent(q);
}

/** No two cards from the same concept back to back (an epoch between them is fine: it's the lesson). */
function dedupeAdjacent(q: Item[]): Item[] {
  const cid = (x: Item) => (x.t === 'card' ? x.k.c : x.cid);
  for (let i = 1; i < q.length; i++) {
    const a = q[i - 1], b = q[i];
    if (a.t === 'card' && b.t === 'card' && cid(a) === cid(b)) {
      const j = q.findIndex((x, n) => n > i && x.t === 'card' && cid(x) !== cid(b) && (n + 1 >= q.length || cid(q[n + 1]) !== cid(b)));
      if (j > 0) [q[i], q[j]] = [q[j], q[i]];
    }
  }
  return q;
}

/** Split n items across domains by exam weight (largest remainder). */
export function alloc(n: number): number[] {
  const raw = DOMAINS.map((d) => (n * d.w) / 100);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; out.reduce((s, x) => s + x, 0) < n; k++) out[order[k % order.length][1]]++;
  return out;
}

function seeded<T>(seed: number, f: () => T): T {
  setRng(mulberry(seed));
  try { return f(); } finally { resetRng(); }
}

/** One card per concept, domains weighted like the exam. */
function weightedPick(n: number, kinds: Set<string> | null): Card[] {
  const per = alloc(n);
  const used = new Set<string>();
  return shuffle(DOMAINS.flatMap((d, i) => {
    const cons = shuffle(CONCEPTS.filter((c) => c.d === d.n));
    // one card per concept; long exams (65 Q) wrap around to a second, different card per concept
    return Array.from({ length: per[i] }, (_, j) => {
      const c = cons[j % cons.length];
      // prefer cards you have never been served (a benchmark should measure transfer, not memory of a card)
      const served = new Set(S.cs[c.id]?.seen ?? []);
      let ks = cardsOf(c.id).filter((k) => (!kinds || kinds.has(k.kind)) && !used.has(k.id));
      const unseen = ks.filter((k) => !served.has(k.id));
      if (unseen.length) ks = unseen;
      if (!ks.length) ks = cardsOf(c.id).filter((k) => !used.has(k.id));
      const k = pick(ks.length ? ks : cardsOf(c.id));
      used.add(k.id);
      return k;
    });
  }));
}

export const buildDaily = (): Card[] => seeded(today() * 7919 + 17, () => weightedPick(10, null));
export const buildBench = (n = 20): Card[] => weightedPick(n, EXAM_KINDS);

/** Red team pool: security, responsible AI and prompt-risk concepts. Same fight for everyone this week. */
export function bossPool(): Card[] {
  return CARDS.filter((k) => k.d === 5 || k.d === 4 || conceptById.get(k.c)!.task === '3.2');
}
export const buildBoss = (): Card[] => seeded(week() * 104729 + today() * 31 + 3, () => shuffle(bossPool()).slice(0, 14));

export function buildDrill(cids: string[]): Item[] {
  return dedupeAdjacent(shuffle(cids.flatMap((cid) => [cardFor(cid), cardFor(cid, { exclude: S.cs[cid]?.seen.slice(-1) })]).filter((k, i, a) => a.findIndex((x) => x.id === k.id) === i))
    .slice(0, 8).map((k) => ({ t: 'card' as const, k, mode: 'drill' as const })));
}

// ---------------------------------------------------------------- playing

interface Res { k: Card; ok: boolean; sure: boolean; partial: boolean; mode: string }

const XP = (mode: Mode, cm: CardOpts['mode'], ok: boolean, sure: boolean, spicy: boolean): number => {
  if (cm === 'pre') return ok ? 5 : 2;
  if (mode === 'bench') return ok ? 6 : 0;
  if (spicy) return ok ? 20 : -20; // break-even at 50%: only worth it if you really know it
  return ok ? (sure ? 15 : 8) : sure ? -10 : 0;
};

export function play(mode: Mode, items: Item[], title: string): void {
  const spicy = mode !== 'bench' && mode !== 'daily' && (mode === 'boss' || S.temp === 1);
  const res: Res[] = [];
  let i = 0, combo = 0, best = 0, xp0 = S.xp, retries = 0;
  const rank0 = rankOf(S.xp);
  setRunActive(true);
  let hp = 100, hearts = 3;
  const hits = 6;
  const t0 = Date.now();
  setLeaving(() => { stopDock(); hush(); setRunActive(false); });

  const nCards = () => items.filter((x) => x.t === 'card').length;
  const nDone = () => res.length;

  function bar(): string {
    const pct = Math.round((100 * nDone()) / Math.max(1, nCards()));
    const right = mode === 'bench' ? '' : mode === 'boss' ? `<span class="hearts">${'❤️'.repeat(hearts)}${'🖤'.repeat(3 - hearts)}</span>` : `<span class="combo" id="combo">${combo >= 2 ? `x${combo}` : ''}</span>`;
    return `<div class="bar"><button class="x" id="quit" aria-label="Quit">✕</button>${shiftyHtml('dead', 30, 'sm', true)}<div class="prog"><i style="width:${pct}%"></i></div>${right}</div>
${mode === 'boss' ? `<div class="boss"><div class="bn"><span>DALE-GPT · RED TEAM</span><span>${hp}/100</span></div><div class="hp"><i style="width:${hp}%"></i></div><div class="taunt">“${esc(ATTACKS[(today() * 7 + i) % ATTACKS.length])}”</div></div>` : ''}
${mode === 'bench' ? `<div class="benchbar"><span>${esc(title)}</span><span>Q${nDone() + 1}/${nCards()}</span><span id="clock">${fmtClock(Date.now() - t0)}</span></div>` : ''}`;
  }

  let clock: number | undefined;
  function step(): void {
    clearInterval(clock);
    stopDock();
    hush();
    if (mode === 'boss' && (hearts <= 0 || hp <= 0)) return end();
    if (i >= items.length) return end();
    const it = items[i];
    if (it.t === 'epoch') return epoch(it.cid);
    const k = it.k;
    app.innerHTML = `<div class="scr run">${bar()}<div id="slot"></div></div>`;
    app.scrollTop = 0;
    $('#quit').onclick = () => history.back();
    if (mode === 'bench') clock = window.setInterval(() => { const c = document.getElementById('clock'); if (c) c.textContent = fmtClock(Date.now() - t0); else clearInterval(clock); }, 1000);
    const cm = it.mode;
    const opts: CardOpts = {
      mode: cm,
      sure: cm === 'pre' ? false : spicy ? true : null,
      feedback: mode !== 'bench',
      stakes: mode === 'daily' ? 'on: counts as 🟩' : mode === 'bench' ? 'tracks your calibration' : '+15 / −10 when on',
      onAnswer: (p, fb) => answered(k, cm, p, fb),
    };
    if (cm === 'pre') $('#slot').insertAdjacentHTML('beforebegin', `<div class="coachtxt">${esc(sh('pre'))}</div>`);
    renderCard($('#slot'), k, opts);
  }

  function answered(k: Card, cm: CardOpts['mode'], p: { ok: boolean; sure: boolean; partial: boolean }, fb: HTMLElement | null): void {
    const sure = spicy ? true : p.sure;
    res.push({ k, ok: p.ok, sure, partial: p.partial, mode: cm });
    // spaced repetition: pretests are guesses (no grade); exam/daily cards grade only concepts you've been taught
    let gap: number | undefined;
    const wasIntro = introduced(k.c);
    if (cm === 'pre') cs(k.c);
    else if (wasIntro || mode === 'run' || mode === 'drill') gap = grade(k.c, gradeOf(p.ok, sure)).gap;
    if (introduced(k.c)) markSeen(k.c, k.id);
    logEv({ id: k.id, c: k.c, d: k.d, kind: k.kind, ok: p.ok, sure, forced: spicy || undefined, mode: cm === 'pre' ? 'pre' : mode, gap: wasIntro ? gap : undefined });
    combo = p.ok ? combo + 1 : 0;
    best = Math.max(best, combo);
    let gain = XP(mode, cm, p.ok, sure, spicy);
    if (p.ok && combo >= 2 && cm !== 'pre') gain += Math.min(10, 2 * (combo - 1));
    if (mode === 'boss') { if (p.ok) hp = Math.max(0, hp - Math.ceil(100 / hits)); else hearts--; }
    // a confident miss in a training run comes back at the end as a different card for the same concept
    if (!p.ok && sure && (mode === 'run' || mode === 'drill') && cm !== 'pre' && retries < 2 && cardsOf(k.c).length > 1) {
      retries++;
      items.push({ t: 'card', k: cardFor(k.c, { exclude: [k.id] }), mode: 'retry' });
    }
    addXP(gain, fb?.querySelector('#xpl') as HTMLElement | null, true);
    const xpl = fb?.querySelector('#xpl');
    if (xpl) xpl.textContent = (gain > 0 ? '+' : '') + gain + ' XP';
    const shl = fb?.querySelector('#shl');
    if (shl) shl.textContent = cm === 'pre' ? (p.ok ? 'Lucky guess or genius? The lesson is next either way.' : 'Wrong guess, which is fine: that is the point of a pretest. Lesson next.') : sh(p.ok ? 'ok' : 'no');
    if (mode === 'bench') { save(); i++; setTimeout(step, 260); return; } // exam conditions: no face, no combo, no tells
    shiftyReact(p.ok ? 'happy' : 'shock');
    const c = document.getElementById('combo');
    if (c) { c.textContent = combo >= 2 ? `x${combo}` : ''; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
    save();
    i++;
    if (mode === 'boss') {
      const hpEl = document.querySelector('.hp i') as HTMLElement | null; if (hpEl) hpEl.style.width = hp + '%';
      const lbl = document.querySelector('.boss .bn span:last-child'); if (lbl) lbl.textContent = `${hp}/100`;
      const hs = document.querySelector('.hearts'); if (hs) hs.textContent = '❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(3 - Math.max(0, hearts));
    }
    // make sure the verdict, rule and why are on screen, not hidden under the Next bar
    if (fb) setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    dock(i >= items.length || (mode === 'boss' && (hearts <= 0 || hp <= 0)) ? 'See results' : 'Next', step);
  }

  function epoch(cid: string): void {
    const c = conceptById.get(cid)!;
    const d = domainOf(c.d);
    app.innerHTML = `<div class="scr run">${bar()}
<div class="epoch"><div class="dom"><i class="dot" style="--c:${d.color}"></i>${esc(d.short)} · task ${esc(c.task)} · <b>EPOCH · NEW CONCEPT</b></div>
<div class="say">${shiftyHtml('happy', 40, 'sm')}<div class="sb"><p>${esc(sh('epoch'))}</p></div></div>
<h2>${esc(c.name)}</h2>
<div class="rule"><b>THE RULE</b><p>${esc(c.rule)}</p></div>
<ul class="learn">${c.learn.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
<div class="cmp soc"><b>SOC BRAIN</b>${esc(c.soc)}</div>
${canSpeak() ? '<button class="linkbtn" id="hear">🔊 Read it to me</button>' : ''}</div></div>`;
    app.scrollTop = 0;
    $('#quit').onclick = () => history.back();
    const hear = document.getElementById('hear');
    if (hear) hear.onclick = () => { hush(); void say(`${c.name}. ${c.say}`); };
    i++;
    dock('Got it, train me', step);
  }

  function end(): void {
    setRunActive(false);
    clearInterval(clock);
    stopDock();
    hush();
    const graded = res.filter((r) => r.mode !== 'pre');
    const right = graded.filter((r) => r.ok).length;
    const n = graded.length;
    const gained = S.xp - xp0;
    S.runs++;
    const streakUp = n > 0 && earnStreak();
    const learned = res.filter((r) => r.mode === 'pre').map((r) => conceptById.get(r.k.c)!.name);
    let extra = '';
    let daleLine = n && right === n ? dale('perfect') : n && right / n >= 0.6 ? dale('good') : dale('bad');

    if (mode === 'daily') {
      const grid = res.map((r) => (r.ok ? (r.sure ? '🟩' : '🟨') : '🟥')).join('');
      if (!S.daily[today()]) S.daily[today()] = { score: right, n, grid };
      const d = S.daily[today()];
      const text = `SHIFTY-1 Daily Eval #${dailyNumber()}  ${d.score}/${d.n}\n${d.grid}\n${location.origin + location.pathname}`;
      extra = `<div class="share" id="sharetxt">${esc(text)}</div><button class="next" id="share">Share result</button>`;
      setTimeout(() => {
        const b = document.getElementById('share');
        if (b) b.onclick = async () => {
          try { if (navigator.share) { await navigator.share({ text }); return; } } catch { /* cancelled */ }
          try { await navigator.clipboard.writeText(text); toast('Copied. Paste it in the group chat.'); } catch { toast('Copy blocked. Long-press the text.'); }
        };
      });
    }
    if (mode === 'bench') {
      const per = DOMAINS.map((d) => { const r = graded.filter((x) => x.k.d === d.n); return r.length ? r.filter((x) => x.ok).length / r.length : 0; });
      const scaled = Math.round(100 + 900 * DOMAINS.reduce((s, d, j) => s + (d.w / 100) * per[j], 0));
      S.bench.push({ day: today(), score: scaled, dom: per.map((x) => Math.round(x * 100)) });
      if (S.bench.length > 30) S.bench.shift();
      daleLine = dale('bench');
      const pass = scaled >= 700;
      const band = Math.round(900 * Math.sqrt(Math.max(0.04, (scaled - 100) / 900 * (1 - (scaled - 100) / 900)) / Math.max(1, n)));
      extra = `<div class="grade ${pass ? 'pass' : 'fail'}">${scaled}</div><p class="note center">Likely range ${Math.max(100, scaled - band)}–${Math.min(1000, scaled + band)} (${n} questions). ${pass ? 'PASS line is 700. You cleared it.' : 'PASS line is 700. Not yet.'} · ${fmtClock(Date.now() - t0)} (exam pace ≈ ${fmtClock(n * 83000)})</p>
<div class="sk">${DOMAINS.map((d, j) => `<div class="meter"><div class="row"><span>D${d.n} ${esc(d.short)} <small>(${d.w}%)</small></span><b>${Math.round(per[j] * 100)}%</b></div><div class="bb"><i style="width:${per[j] * 100}%;background:${d.color}"></i></div></div>`).join('')}</div>
<div class="sec">Review your misses</div>${graded.filter((r) => !r.ok).map((r) => missRow(r.k)).join('') || '<p class="note">No misses. Book the exam?</p>'}`;
    }
    if (mode === 'boss') {
      const won = hp <= 0;
      const b = (S.boss[week()] ??= { won: false, tries: 0, lastTry: 0 });
      b.tries++; b.lastTry = today(); b.won = b.won || won;
      daleLine = won ? dale('bossWin') : dale('bossLose');
      extra = `<div class="grade word ${won ? 'pass' : 'fail'}">${won ? 'HELD' : 'JAILBROKEN'}</div><p class="note center">${won ? 'Shifty resisted every injection. This week is yours.' : 'One try per day. Retrain tonight, rematch tomorrow.'}</p>
<div class="sec">What got through</div>${graded.filter((r) => !r.ok).map((r) => missRow(r.k)).join('') || '<p class="note">Nothing. Clean defense.</p>'}`;
      if (won) confetti(70);
    }
    save();
    const tier = RANKS[rankOf(S.xp)];
    const upgraded = rankOf(S.xp) > rank0;
    const missedC = [...new Set(graded.filter((r) => !r.ok).map((r) => r.k.c))].slice(0, 5);
    const label = mode === 'run' ? 'TRAINING RUN COMPLETE' : mode === 'drill' ? 'DRILL COMPLETE' : mode === 'daily' ? `DAILY EVAL #${dailyNumber()}` : mode === 'bench' ? 'BENCHMARK RESULT' : 'RED TEAM RESULT';
    app.innerHTML = `<div class="scr center endscr">
<div class="sec">${label}</div>
${shiftyHtml(n && right / n >= 0.7 ? 'cheer' : n && right / n < 0.4 ? 'shock' : 'happy', 88, 'lg')}
${mode === 'bench' || mode === 'boss' ? '' : `<div class="grade">${right}/${n}</div>`}
${extra}
<div class="endstats"><span>${gained >= 0 ? '+' : ''}${gained} XP</span><span>best combo x${best}</span><span>${esc(tier[1])}</span>${streakUp ? `<span>🔥 uptime ${S.streak}</span>` : ''}</div>
${learned.length ? `<div class="sk" style="text-align:left"><h3>New training data</h3>${learned.map((x) => `<div class="weak"><b>${esc(x)}</b><span>comes back tomorrow</span></div>`).join('')}</div>` : ''}
<div class="dale"><div class="av">👔</div><div><b>DALE · HEAD OF AI INITIATIVES</b><p>${esc(daleLine)}</p></div></div>
${upgraded ? `<div class="upg"><b>⬆ MODEL UPGRADE</b><p>Shifty is now <b>${esc(tier[1])}</b>: ${esc(tier[2])}.</p></div>` : ''}
${missedC.length ? `<button class="next" id="drillm">Drill these misses (${missedC.length})</button>` : ''}
<button class="next ${missedC.length ? 'ghost' : ''}" id="home">Home</button>
${mode === 'run' || mode === 'drill' ? '<button class="next ghost" id="again">Another run</button>' : ''}
</div>`;
    app.scrollTop = 0;
    if (n && right === n && mode !== 'bench') confetti(50);
    sfx(n && right / n >= 0.6 ? 'rank' : 'no');
    $('#home').onclick = () => go(routes.home);
    const again = document.getElementById('again');
    if (again) again.onclick = () => go(startRun);
    const dm = document.getElementById('drillm');
    if (dm) dm.onclick = () => go(() => startDrill(missedC));
    if (upgraded) confetti(60);
    checkHats();
  }

  step();
}

function missRow(k: Card): string {
  const c = conceptById.get(k.c)!;
  const ans = answerText(k);
  return `<div class="miss"><div class="mq">${esc(k.q ?? (Array.isArray(k.s) ? k.s[k.bad!] : k.s) ?? '')}</div><div class="ma">✔ ${esc(ans)}</div><div class="mr"><b>${esc(c.name)}:</b> ${esc(c.rule)}</div><div class="mw">${esc(k.why)}</div><div class="cid">${esc(k.id)}</div></div>`;
}

const fmtClock = (ms: number) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ---------------------------------------------------------------- entry points

export function startRun(): void { play('run', buildRun(), 'Training run'); }
export function startDrill(cids: string[]): void { play('drill', buildDrill(cids), 'Drill'); }
export function startDaily(): void {
  const d = S.daily[today()];
  if (d) {
    // one official attempt per day: show the result and the share button instead of a replay
    const text = `SHIFTY-1 Daily Eval #${dailyNumber()}  ${d.score}/${d.n}\n${d.grid}\n${location.origin + location.pathname}`;
    app.innerHTML = `<div class="scr center"><div class="bar"><button class="x" id="quit">✕</button><b>Daily eval #${dailyNumber()}</b></div>
${shiftyHtml('happy', 80, 'lg')}<div class="grade">${d.score}/${d.n}</div><div class="share">${esc(text)}</div><button class="next" id="share">Share result</button>
<p class="tiny">Same 10 cards for everyone today (Central time). A new eval tomorrow.</p></div>`;
    $('#quit').onclick = () => history.back();
    $('#share').onclick = async () => {
      try { if (navigator.share) { await navigator.share({ text }); return; } } catch { /* cancelled */ }
      try { await navigator.clipboard.writeText(text); toast('Copied. Paste it in the group chat.'); } catch { toast('Copy blocked. Long-press the text.'); }
    };
    return;
  }
  play('daily',buildDaily().map((k) => ({ t: 'card', k, mode: 'daily' })), 'Daily eval'); }
export function startBench(n = 20): void { play('bench', buildBench(n).map((k) => ({ t: 'card', k, mode: 'bench' })), `Benchmark · ${n}Q`); }
export function startBoss(): void { play('boss', buildBoss().map((k) => ({ t: 'card', k, mode: 'boss' })), 'Red team'); }
