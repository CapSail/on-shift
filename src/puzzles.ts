// Puzzles: three quick, low-stakes games on the same alerts. No spaced repetition, no penalties, small XP, best scores kept.
import type { Alert } from './types';
import { ALERTS, D, byId, tUrl } from './content';
import { S, save } from './state';
import { addXP, earnStreak } from './progress';
import { app, confetti, go, routes, setLeaving, sfx } from './ui';
import { $, $$, esc, shuffle } from './util';
import { shiftyHtml } from './shifty-live';
import { syncSoon } from './leaderboard';

type Kind = 'twin' | 'name' | 'speed';
const best = (k: Kind): number => (S.puz && S.puz[k]) || 0;

function logHtml(a: Alert): string {
  return `<div class="log">${a.l.map((x) => { const p = x.indexOf(': '); return `<div class="ln">${p > 0 && p < 24 ? `<span class="k">${esc(x.slice(0, p))}:</span> ${esc(x.slice(p + 2))}` : esc(x)}</div>`; }).join('')}</div>`;
}
const cardHtml = (a: Alert, extra = ''): string =>
  `<div class="card pz" style="--c:var(--cy)"><div class="dom"><span class="dot"></span>${esc(a.src)}${extra}</div><h2>${esc(a.t)}</h2><div class="h">${esc(a.h)}</div>${logHtml(a)}</div>`;

function finish(kind: Kind, score: number, max: number, xp: number, title: string, note: string): void {
  const prev = best(kind);
  const isBest = score > prev;
  if (isBest) { S.puz = { ...S.puz, [kind]: score }; }
  S.shifts = Math.max(S.shifts, 1); // a puzzle counts as playing, so the boss and incidents unlock
  save();
  addXP(xp);
  earnStreak();
  syncSoon();
  const great = max ? score >= max * 0.8 : score >= 15;
  if (great) confetti(45);
  app.innerHTML = `<div class="scr center"><div class="sec" style="margin-top:6px">${esc(title)}</div>
  <div class="grade" style="color:var(--${great ? 'grn' : 'yl'})">${score}${kind === 'speed' ? '' : '/' + max}</div>
  ${shiftyHtml(great ? 'cheer' : 'happy', 72, 'lg')}
  <div style="font-size:18px;font-weight:700">+${xp} XP${isBest && prev > 0 ? ' · new best!' : isBest ? ' · first score saved' : ` · best ${prev}${kind === 'speed' ? '' : '/' + max}`}</div>
  <p class="note">${esc(note)}</p>
  <button class="next" id="again">Play again</button><button class="next ghost" id="hub">Puzzles</button><button class="next ghost" id="h">Back home</button></div>`;
  $('#again').onclick = () => go(() => start(kind));
  $('#hub').onclick = () => go(puzzles);
  $('#h').onclick = () => go(routes.home);
}

const topBar = (label: string, right = ''): string =>
  `<div class="bar"><button class="x" id="q" aria-label="Leave puzzle">✕</button><b style="font-size:16px">${esc(label)}</b><span class="pzr">${right}</span></div>`;

// ---------------------------------------------------------------- Twin Spotter
function twinSpotter(): void {
  const pairs = shuffle(ALERTS.filter((a) => a.v && a.pair && byId[a.pair] && !byId[a.pair].v)).slice(0, 6);
  let i = 0, right = 0;
  const next = (): void => {
    if (i >= pairs.length) return finish('twin', right, pairs.length, right * 3 + (right === pairs.length ? 5 : 0), 'TWIN SPOTTER', right === pairs.length ? 'Not one fooled. Twins hide in the details.' : 'Same story, different detail. That detail is the whole job.');
    const real = pairs[i], fake = byId[real.pair!];
    const order = shuffle([real, fake]);
    app.innerHTML = `<div class="scr">${topBar('Twin Spotter', `${i + 1}/${pairs.length} · ${right} ✓`)}
    <p class="note">Same story, two alerts. One is a real attack. Tap it.</p>
    ${order.map((a, k) => `<button class="twin" data-id="${a.id}" aria-label="Alert ${'AB'[k]}"><span class="ab">${'AB'[k]}</span>${cardHtml(a)}</button>`).join('')}
    <div id="out"></div></div>`;
    $('#q').onclick = () => history.back();
    $$('.twin').forEach((b) => (b.onclick = () => {
      const ok = b.dataset.id === real.id;
      if (ok) right++;
      sfx(ok ? 'ok' : 'no');
      $$('.twin').forEach((t) => { (t as HTMLButtonElement).disabled = true; t.classList.add(t.dataset.id === real.id ? 'r' : t === b ? 'w' : 'dim'); });
      $('#out').innerHTML = `<div class="fq"><div class="qh">${ok ? 'GOT IT' : 'NOT THIS TIME'}</div><div class="why">${esc(real.tell)}</div></div><button class="next" id="n">${i < pairs.length - 1 ? 'Next →' : 'Finish →'}</button>`;
      $('#n').onclick = () => { i++; next(); };
      $('#out').scrollIntoView({ behavior: 'smooth', block: 'end' });
    }));
  };
  next();
}

// ---------------------------------------------------------------- Name That Technique
function nameThat(): void {
  const rounds = shuffle(ALERTS.filter((a) => a.v && D.tech[a.x])).filter((a, k, arr) => arr.findIndex((b) => b.x === a.x) === k).slice(0, 5);
  let i = 0, right = 0;
  const tactic = (t: string): string => (D.tech[t]?.[1] || '').split(', ')[0];
  const next = (): void => {
    if (i >= rounds.length) return finish('name', right, rounds.length, right * 4 + (right === rounds.length ? 5 : 0), 'NAME THAT TECHNIQUE', right >= 4 ? 'You can name the move from the evidence. That is the skill.' : 'Check the ATT&CK links as you go and they start to stick.');
    const a = rounds[i], parent = a.x.split('.')[0];
    const all = Object.keys(D.tech).filter((t) => t.split('.')[0] !== parent);
    const same = shuffle(all.filter((t) => tactic(t) === tactic(a.x)));
    const rest = shuffle(all.filter((t) => tactic(t) !== tactic(a.x)));
    const seen = new Set<string>([parent]);
    const wrong: string[] = [];
    for (const t of same.concat(rest)) { const p = t.split('.')[0]; if (!seen.has(p)) { seen.add(p); wrong.push(t); } if (wrong.length === 3) break; }
    const opts = shuffle([a.x, ...wrong]);
    app.innerHTML = `<div class="scr">${topBar('Name That Technique', `${i + 1}/${rounds.length} · ${right} ✓`)}
    ${cardHtml(a)}
    <div class="fq" id="opts"><div class="qh">WHICH ATT&amp;CK TECHNIQUE IS THIS?</div>${opts.map((t) => `<button data-t="${t}">${esc(D.tech[t][0])}</button>`).join('')}<div class="qw"></div></div>
    <div id="out"></div></div>`;
    $('#q').onclick = () => history.back();
    $$('#opts button').forEach((b) => (b.onclick = () => {
      const ok = b.dataset.t === a.x;
      if (ok) right++;
      sfx(ok ? 'ok' : 'no');
      $$('#opts button').forEach((o) => { (o as HTMLButtonElement).disabled = true; if (o.dataset.t === a.x) o.classList.add('r'); else if (o === b) o.classList.add('w'); });
      $('#out').innerHTML = `<div class="fq"><div class="qh">${ok ? 'YES' : 'IT WAS ' + esc(a.x)}</div><div class="why">${esc(a.tell)}</div><div class="tq"><a class="tag" href="${tUrl(a.x)}" target="_blank" rel="noopener">${esc(a.x)} ${esc(D.tech[a.x][0])} ↗</a></div></div><button class="next" id="n">${i < rounds.length - 1 ? 'Next →' : 'Finish →'}</button>`;
      $('#n').onclick = () => { i++; next(); };
      $('#out').scrollIntoView({ behavior: 'smooth', block: 'end' });
    }));
  };
  next();
}

// ---------------------------------------------------------------- Speed Round
function speed(): void {
  const Q = shuffle(ALERTS);
  const LEN = 60_000;
  let i = 0, right = 0, tried = 0, over = false;
  const t0 = performance.now();
  let tm = 0;
  const stop = (): void => { over = true; clearInterval(tm); setLeaving(null); };
  const end = (): void => {
    if (over) return;
    stop();
    finish('speed', right, 0, Math.min(20, Math.floor(right / 2)), 'SPEED ROUND', `${right} right out of ${tried}. Wrong answers cost nothing here. Speed is the point.`);
  };
  const frame = (): void => {
    const a = Q[i % Q.length];
    app.innerHTML = `<div class="scr">${topBar('Speed Round', `<span id="sc">${right} ✓</span>`)}<div class="prog"><i id="tb" style="width:${Math.max(0, 100 - (100 * (performance.now() - t0)) / LEN)}%"></i></div>${cardHtml(a)}
    <div class="acts pzacts"><button class="b-cls" data-c="0" aria-label="Close: benign">✕<span>Close</span></button><button class="b-esc" data-c="1" aria-label="Escalate: true positive">✓<span>Escalate</span></button></div></div>`;
    $('#q').onclick = () => { stop(); history.back(); };
    $$('.pzacts button').forEach((b) => (b.onclick = () => {
      if (over) return;
      const ok = (b.dataset.c === '1') === !!a.v;
      tried++;
      if (ok) { right++; sfx('ok'); }
      else sfx('no');
      i++;
      frame();
    }));
  };
  setLeaving(stop);
  tm = window.setInterval(() => {
    const left = LEN - (performance.now() - t0);
    const tb = document.getElementById('tb');
    if (tb) tb.style.width = Math.max(0, (100 * left) / LEN) + '%';
    if (left <= 0) end();
  }, 100);
  frame();
}

function start(k: Kind): void {
  window.onkeydown = null;
  if (k === 'twin') twinSpotter(); else if (k === 'name') nameThat(); else speed();
}

export function puzzles(): void {
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="q" aria-label="Back">✕</button><b style="font-size:18px">Puzzles</b></div>
  <div class="sk" style="text-align:center">${shiftyHtml('happy', 72, 'lg')}<p class="note">Quick brain snacks. No penalties, no streak pressure, best scores kept.</p></div>
  <button class="big alt" data-k="twin"><span class="px" style="font-size:12px">TWIN SPOTTER</span><small>Two near-identical alerts. Tap the real attack · best ${best('twin')}/6</small></button>
  <button class="big alt" data-k="name"><span class="px" style="font-size:12px">NAME THAT TECHNIQUE</span><small>Read the evidence, name the ATT&amp;CK move · best ${best('name')}/5</small></button>
  <button class="big alt" data-k="speed"><span class="px" style="font-size:12px">SPEED ROUND</span><small>60 seconds. Escalate or close, as many as you can · best ${best('speed')}</small></button></div>`;
  $('#q').onclick = () => history.back();
  $$('[data-k]').forEach((b) => (b.onclick = () => go(() => start(b.dataset.k as Kind))));
}
