// Weekly boss: a group with >=30 techniques and >=6 matching alerts, rotating weekly.
// Phase 1 = triage alerts built from techniques they really use plus benign noise. Phase 2 = intel round (3 multiple-choice).
import type { Alert, Crew, QueueAlert } from './types';
import { D, INC_ALERTS, POOL, tUrl } from './content';
import { S, save } from './state';
import { today, week } from './time';
import { capture, crewCard } from './crews';
import { addXP, earnStreak } from './progress';
import { app, confetti, dock, go, routes, sfx, stopDock } from './ui';
import { runAlerts, type RunResult } from './runner';
import { $, $$, esc, mulberry, resetRng, setRng, shuffle } from './util';

const allPool: Alert[] = POOL.concat(INC_ALERTS);

const bossPoolFor = (b: Crew): Alert[] => {
  const set = new Set(b.t), par = new Set(b.t.map((t) => t.split('.')[0]));
  return allPool.filter((a) => a.v && (set.has(a.x) || par.has(a.x) || set.has(a.x.split('.')[0])));
};

const bosses = D.crews.filter((c) => c.t.length >= 30 && bossPoolFor(c).length >= 6).sort((a, b) => (a.id < b.id ? -1 : 1));
export const weeklyBoss = (): Crew => bosses[week() % bosses.length];
export const bossKey = (): string => weeklyBoss().id + '@' + week();

export function bossIntro(): void {
  const b = weeklyBoss(), st = S.boss[bossKey()] || {};
  const tried = st.day === today() && !st.won;
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="q">✕</button></div>
 <div class="sec" style="margin-top:0">WEEKLY BOSS · new boss every Monday</div>${crewCard(b)}
 <div class="intro" style="margin-top:14px"><p style="margin:0;font-size:15px"><b>${esc(b.n)}</b> is hitting your network. Phase 1: triage alerts built from techniques they really use, mixed with benign noise. Phase 2: intel round. Right calls deal damage. Wrong calls cost a heart. One attempt per day.</p></div>
 ${tried ? '<p class="tiny">You already fought today. Come back tomorrow, and read their ATT&CK page in the meantime 👇</p>' : ''}
 <div class="tq" style="justify-content:center"><a class="tag" href="${b.u}" target="_blank" rel="noopener">${esc(b.n)} on ATT&CK ↗</a></div>
 ${tried ? '' : `<button class="next red" id="s">${st.won ? 'Rematch (for fun)' : 'Fight'}</button>`}</div>`;
  $('#q').onclick = () => history.back();
  const s = document.getElementById('s');
  if (s) s.onclick = () => { S.boss[bossKey()] = Object.assign(st, { day: today() }); save(); go(() => bossFight(b)); };
}

function bossFight(b: Crew): void {
  setRng(mulberry(week() * 31 + b.t.length));
  const tp = shuffle(bossPoolFor(b)).slice(0, 6);
  const ben = shuffle(POOL.filter((a) => !a.v && a.trap === 'scary').concat(POOL.filter((a) => !a.v))).filter((a, i, arr) => arr.indexOf(a) === i).slice(0, 3);
  const queue: QueueAlert[] = shuffle(tp.concat(ben)).map((a) => ({ ...a }));
  resetRng();
  runAlerts({ mode: 'boss', boss: b, queue, finish: (r) => bossEnd(b, queue, r) });
}

function bossEnd(b: Crew, queue: QueueAlert[], r: RunResult): void {
  stopDock();
  if (r.won) return bossIntel(b);
  sfx('no');
  const miss = queue.filter((a) => a.v);
  app.innerHTML = `<div class="scr center"><div class="sec">YOU GOT COOKED</div><div class="grade" style="font-size:40px;color:var(--red)">L</div>
 <p style="color:var(--dim)">${esc(b.n)} laughs in living-off-the-land. Here's what they threw at you. Study up, rematch tomorrow.</p>
 <div class="tq" style="justify-content:center">${miss.map((a) => `<a class="tag" href="${tUrl(a.x)}" target="_blank" rel="noopener">${esc(a.x)} ${esc((D.tech[a.x] || [''])[0])} ↗</a>`).join('')}</div>
 <button class="next" id="h">Back to the SOC</button></div>`;
  $('#h').onclick = () => go(routes.home);
}

function bossIntel(b: Crew): void {
  const set = new Set(b.t);
  const rel = (t: string) => set.has(t) || set.has(t.split('.')[0]) || b.t.some((x) => x.split('.')[0] === t);
  const tac = (t: string) => (D.tech[t] || ['', ''])[1].split(', ')[0];
  setRng(mulberry(week() * 17));
  const corr = shuffle(b.t.filter((t) => D.tech[t])).slice(0, 3);
  const qs = corr.map((t) => {
    const same = Object.keys(D.tech).filter((x) => !rel(x) && tac(x) === tac(t));
    const d = shuffle(same).slice(0, 3);
    const o = shuffle(d.concat([t]));
    return { t, o, a: o.indexOf(t) };
  });
  resetRng();
  let k = 0, score = 0;

  function q(): void {
    const Q = qs[k];
    app.innerHTML = `<div class="scr"><div class="boss"><div class="bn"><span>${esc(b.n.toUpperCase())} · PHASE 2</span><span>INTEL ${k + 1}/3</span></div><div class="hp"><i style="width:${Math.max(4, 30 - k * 10)}%"></i></div><div class="taunt">"You'll never figure out my playbook."</div></div>
  <div class="intro"><div class="qh" style="font-size:11px;letter-spacing:.12em;color:var(--cy);font-weight:700">FINISHER · ${esc(tac(Q.t)).toUpperCase()}</div><p style="font-weight:700">Which of these has ${esc(b.n)} actually been documented using?</p></div>
  <div class="fq">${Q.o.map((t, j) => `<button data-o="${j}"><span class="mcq"><span class="qid">${esc(t)}</span><br>${esc((D.tech[t] || [t])[0])}</span></button>`).join('')}<div class="qw"></div></div></div>`;
    $$('[data-o]').forEach((btn) => (btn.onclick = () => {
      const box = btn.closest('.fq') as HTMLElement;
      if (box.dataset.done) return;
      box.dataset.done = '1';
      const j = +btn.dataset.o!, ok = j === Q.a;
      $$('[data-o]', box).forEach((x, m) => {
        if (m === Q.a) x.classList.add('r');
        else if (m === j) x.classList.add('w');
      });
      if (ok) { score++; sfx('hit'); } else sfx('no');
      box.querySelector('.qw')!.innerHTML = `<div class="why">${ok ? '✔ ' : '✘ '}${esc(b.n)} → ${esc(Q.t)} is on their ATT&CK page. The others share the tactic but aren't recorded for them.</div>`;
      dock(k < 2 ? 'Next →' : 'Finish →', () => { k++; if (k < 3) q(); else fin(); });
    }));
  }

  function fin(): void {
    const key = bossKey(), first = !(S.boss[key] || {}).won;
    S.boss[key] = Object.assign(S.boss[key] || {}, { won: true, day: today() });
    capture(b.id, 'boss');
    S.intel[b.id] = (S.intel[b.id] || 0) + score * 2;
    const x = first ? 100 + score * 25 : 20;
    addXP(x);
    sfx('rank');
    confetti(80);
    earnStreak();
    save();
    app.innerHTML = `<div class="scr center"><div class="sec">BOSS DEFEATED</div><div class="grade" style="font-size:44px;color:var(--grn)">KO</div>
  <p style="color:var(--dim)">Intel round ${score}/3 · +${x} XP${first ? ' · crew captured' : ''}</p>${crewCard(b, 'boss')}<button class="next" id="h">Back to the SOC</button></div>`;
    $('#h').onclick = () => go(routes.home);
  }
  q();
}

