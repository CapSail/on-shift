// One card on screen: every kind's interaction, the confidence toggle, and the elaborated feedback.
// The runner owns XP, the queue and the Next button; this module only answers "was it right, and was it sure?".
import type { Card } from './types';
import { conceptById, domainOf } from './content';
import { esc, shuffle, $$ } from '../engine/util';
import { shiftyHtml } from '../engine/shifty-live';
import { buzz, sfx } from '../engine/ui';

export interface Played { ok: boolean; sure: boolean; partial: boolean }
export interface CardOpts {
  mode: 'pre' | 'new' | 'review' | 'retry' | 'practice' | 'daily' | 'bench' | 'boss' | 'drill' | 'speed';
  /** show right/wrong colours but skip the rule/why panel (speed round) */
  lite?: boolean;
  /** true = always counts as sure (temperature 1.0 / boss), false = never (pretest), null = the player chooses */
  sure: boolean | null;
  feedback: boolean;
  stakes?: string;     // e.g. "+15 / −10"
  onAnswer: (p: Played, fb: HTMLElement | null) => void;
}

export const KIND_LABEL: Record<string, string> = {
  mcq: 'EXAM SCENARIO', multi: 'MULTIPLE RESPONSE', hallu: 'CATCH THE HALLUCINATION', tf: 'LEGIT OR HALLUCINATION?',
  order: 'BUILD THE PIPELINE', match: 'MATCH', duel: 'DUEL',
};
const FLAG: Record<string, string> = { pre: '<span class="flag pre">PRETEST · NO PENALTY</span>', review: '<span class="flag cb">REVIEW</span>', retry: '<span class="flag rt">RETRY</span>', new: '<span class="flag nw">NEW</span>', drill: '<span class="flag cb">DRILL</span>' };

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));

export function renderCard(host: HTMLElement, k: Card, o: CardOpts): void {
  const con = conceptById.get(k.c)!;
  const dom = domainOf(k.d);
  let sure = o.sure === true;
  let done = false;

  const head = o.mode === 'bench' ? `<div class="dom"><b>QUESTION</b></div>` : `<div class="dom"><i class="dot" style="--c:${dom.color}"></i>${esc(dom.short)} · ${esc(con.task)} · <b>${k.id.startsWith('g:') ? 'RAPID RECALL' : KIND_LABEL[k.kind]}</b> ${FLAG[o.mode] ?? ''}</div>`;
  const shiftyQ = (lines: string, cls = '') => `<div class="say ${cls}">${shiftyHtml('dead', 40, 'sm')}<div class="sb">${lines}</div></div>`;
  let body = '';
  // option order is shuffled at runtime; data-i keeps the authored index
  const order = (n: number) => shuffle(Array.from({ length: n }, (_, i) => i));
  const optBtns = (opts: string[], ord: number[], cls = 'opt') => ord.map((i) => `<button class="${cls}" data-i="${i}">${esc(opts[i])}</button>`).join('');

  switch (k.kind) {
    case 'mcq': case 'multi':
      body = `<p class="q">${esc(k.q)}</p><div class="opts">${optBtns(k.o!, order(k.o!.length))}</div>${k.kind === 'multi' ? '<button class="lock" id="lock" disabled>Lock in</button>' : ''}`;
      break;
    case 'tf':
      body = `${shiftyQ(`<p>${esc(k.s as string)}</p>`)}<p class="q sm">Is Shifty right?</p><div class="tfb"><button class="opt tf1" data-v="1">✅ Legit</button><button class="opt tf0" data-v="0">🌀 Hallucination</button></div>`;
      break;
    case 'hallu':
      body = `<p class="q sm">One of these lines is confidently wrong. Tap it.</p>${shiftyQ((k.s as string[]).map((l, i) => `<button class="hl" data-l="${i}">${esc(l)}</button>`).join(''), 'multi')}<div id="fix"></div>`;
      break;
    case 'duel':
      body = `<p class="q">${esc(k.q)}</p><div class="duel"><button class="opt dl" data-i="0"><b>A</b>${esc(k.A)}</button><button class="opt dl" data-i="1"><b>B</b>${esc(k.B)}</button></div>`;
      break;
    case 'order':
      body = `<p class="q">${esc(k.q)}</p><p class="hint">Tap the steps in order. Tap a placed step to take it back.</p><ol class="placed" id="placed"></ol><div class="opts" id="pool">${optBtns(k.steps!, order(k.steps!.length), 'opt st')}</div><button class="lock" id="lock" disabled>Lock in</button>`;
      break;
    case 'match':
      body = `<p class="q">${esc(k.q)}</p><p class="hint">Fill the highlighted row: tap its match below. Tap a filled row to clear it.</p><div class="mrows">${k.pairs!.map((p, i) => `<button class="mrow" data-r="${i}"><span>${esc(p[0])}</span><em>…</em></button>`).join('')}</div><div class="opts mpool" id="pool">${optBtns(k.pairs!.map((p) => p[1]), order(k.pairs!.length), 'opt mo')}</div><button class="lock" id="lock" disabled>Lock in</button>`;
      break;
  }

  const sureRow = o.sure === null
    ? `<button class="suretog" id="sure" aria-pressed="false"><span>🎯</span> <b>Sure?</b> <small>${esc(o.stakes ?? 'off: lean')}</small></button><p class="surehint">Tap Sure <i>before</i> you answer, only if you could explain why.</p>`
    : o.sure ? `<div class="surefix">${o.mode === 'boss' ? '🛡 RED TEAM' : '🌶 TEMP 1.0'}: every answer counts as SURE</div>` : '';

  host.innerHTML = `<div class="card qc">${head}${sureRow}${body}<div class="cid">${esc(k.id)}</div></div><div id="fb"></div>`;
  const card = host.querySelector('.card') as HTMLElement;
  const sureBtn = host.querySelector<HTMLButtonElement>('#sure');
  if (sureBtn) sureBtn.onclick = () => {
    if (done) return;
    sure = !sure;
    sureBtn.classList.toggle('on', sure);
    sureBtn.setAttribute('aria-pressed', String(sure));
    sfx('tick'); buzz(8);
  };

  const finish = (ok: boolean, partial = false) => {
    if (done) return;
    done = true;
    card.classList.add('answered');
    sureBtn?.setAttribute('disabled', '');
    $$('button', card).forEach((b) => { if (b !== sureBtn) b.setAttribute('disabled', ''); });
    if (o.feedback) { sfx(ok ? 'ok' : 'no'); buzz(ok ? 15 : [30, 40, 30]); if (!ok) card.classList.add('shake'); }
    const fb = o.feedback && !o.lite ? feedback(host.querySelector('#fb') as HTMLElement, k, ok, partial) : null;
    o.onAnswer({ ok, sure: o.sure === false ? false : sure, partial }, fb);
  };

  const mark = (btn: Element | null | undefined, cls: string) => { if (btn && o.feedback) btn.classList.add(cls); else if (btn) btn.classList.add('chosen'); };

  switch (k.kind) {
    case 'mcq':
      $$('.opt', card).forEach((b) => b.onclick = () => {
        const i = +b.dataset.i!;
        const ok = i === k.a;
        mark(b, ok ? 'r' : 'w');
        if (!ok && o.feedback) card.querySelector(`.opt[data-i="${k.a}"]`)?.classList.add('r');
        finish(ok);
      });
      break;
    case 'multi': {
      const need = (k.a as number[]).length, sel: number[] = [];
      const lock = card.querySelector('#lock') as HTMLButtonElement;
      const upd = () => { lock.disabled = sel.length !== need; lock.textContent = `Lock in (${sel.length}/${need})`; };
      upd();
      $$('.opt', card).forEach((b) => b.onclick = () => {
        const i = +b.dataset.i!;
        const at = sel.indexOf(i);
        if (at >= 0) sel.splice(at, 1); else if (sel.length < need) sel.push(i); else return;
        b.classList.toggle('sel', at < 0);
        sfx('tick'); upd();
      });
      lock.onclick = () => {
        const ok = sameSet(sel, k.a as number[]);
        if (o.feedback) $$('.opt', card).forEach((b) => { const i = +b.dataset.i!; if ((k.a as number[]).includes(i)) b.classList.add('r'); else if (sel.includes(i)) b.classList.add('w'); });
        else sel.forEach((i) => card.querySelector(`.opt[data-i="${i}"]`)?.classList.add('chosen'));
        finish(ok, !ok && sel.some((i) => (k.a as number[]).includes(i)));
      };
      break;
    }
    case 'tf':
      $$('.opt', card).forEach((b) => b.onclick = () => {
        const v = b.dataset.v === '1';
        const ok = v === k.v;
        mark(b, ok ? 'r' : 'w');
        finish(ok);
      });
      break;
    case 'duel':
      $$('.opt', card).forEach((b) => b.onclick = () => {
        const ok = +b.dataset.i! === k.a;
        mark(b, ok ? 'r' : 'w');
        if (!ok && o.feedback) card.querySelector(`.opt[data-i="${k.a}"]`)?.classList.add('r');
        finish(ok);
      });
      break;
    case 'hallu': {
      const fix = card.querySelector('#fix') as HTMLElement;
      $$('.hl', card).forEach((b) => b.onclick = () => {
        if (card.dataset.picked) return;
        card.dataset.picked = '1';
        const i = +b.dataset.l!;
        $$('.hl', card).forEach((x) => x.setAttribute('disabled', ''));
        if (i !== k.bad) {
          mark(b, 'w');
          if (o.feedback) card.querySelector(`.hl[data-l="${k.bad}"]`)?.classList.add('r');
          if (o.feedback) fix.innerHTML = `<p class="hint">The wrong line was the highlighted one. The fix: <b>${esc(k.o![k.a as number])}</b></p>`;
          finish(false);
          return;
        }
        b.classList.add(o.feedback ? 'r' : 'chosen');
        sfx('tick');
        fix.innerHTML = `<p class="q sm">Found it. Now pick the correction:</p><div class="opts">${optBtns(k.o!, order(k.o!.length))}</div>`;
        $$('.opt', fix).forEach((f) => f.onclick = () => {
          const ok = +f.dataset.i! === k.a;
          mark(f, ok ? 'r' : 'w');
          if (!ok && o.feedback) fix.querySelector(`.opt[data-i="${k.a}"]`)?.classList.add('r');
          finish(ok, !ok);
        });
      });
      break;
    }
    case 'order': {
      const placed: number[] = [];
      const list = card.querySelector('#placed') as HTMLElement, lock = card.querySelector('#lock') as HTMLButtonElement;
      const draw = () => {
        list.innerHTML = placed.map((i) => `<li><button class="pl" data-i="${i}">${esc(k.steps![i])}</button></li>`).join('');
        $$('.st', card).forEach((b) => b.classList.toggle('used', placed.includes(+b.dataset.i!)));
        lock.disabled = placed.length !== k.steps!.length;
        $$('.pl', list).forEach((p) => p.onclick = () => { if (done) return; placed.splice(placed.indexOf(+p.dataset.i!), 1); draw(); });
      };
      $$('.st', card).forEach((b) => b.onclick = () => { const i = +b.dataset.i!; if (placed.includes(i)) return; placed.push(i); sfx('tick'); draw(); });
      lock.onclick = () => {
        const ok = placed.every((x, j) => x === j);
        if (o.feedback) {
          $$('.pl', list).forEach((p, j) => p.classList.add(+p.dataset.i! === j ? 'r' : 'w'));
          if (!ok) list.insertAdjacentHTML('afterend', `<div class="right-order"><b>Correct order</b><ol>${k.steps!.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>`);
        }
        finish(ok, !ok && placed.filter((x, j) => x === j).length >= Math.ceil(k.steps!.length / 2));
      };
      draw();
      break;
    }
    case 'match': {
      const fill: (number | null)[] = k.pairs!.map(() => null);
      const lock = card.querySelector('#lock') as HTMLButtonElement;
      const rows = $$('.mrow', card), pool = $$('.mo', card);
      const draw = () => {
        const cur = fill.indexOf(null);
        rows.forEach((r, i) => {
          r.classList.toggle('cur', i === cur);
          (r.querySelector('em') as HTMLElement).textContent = fill[i] === null ? '…' : k.pairs![fill[i]!][1];
          r.classList.toggle('full', fill[i] !== null);
        });
        pool.forEach((b) => b.classList.toggle('used', fill.includes(+b.dataset.i!)));
        lock.disabled = fill.includes(null);
      };
      pool.forEach((b) => b.onclick = () => { const i = +b.dataset.i!; const cur = fill.indexOf(null); if (cur < 0 || fill.includes(i)) return; fill[cur] = i; sfx('tick'); draw(); });
      rows.forEach((r, i) => r.onclick = () => { if (done) return; fill[i] = null; draw(); });
      lock.onclick = () => {
        const good = fill.map((x, i) => x === i);
        const ok = good.every(Boolean);
        if (o.feedback) rows.forEach((r, i) => {
          r.classList.add(good[i] ? 'r' : 'w');
          if (!good[i]) (r.querySelector('em') as HTMLElement).innerHTML = `<s>${esc(k.pairs![fill[i]!][1])}</s> → ${esc(k.pairs![i][1])}`;
        });
        finish(ok, !ok && good.filter(Boolean).length >= 2);
      };
      draw();
      break;
    }
  }
}

/** The right answer as text (for miss panels and reviews). */
export function answerText(k: Card): string {
  return k.kind === 'mcq' ? k.o![k.a as number] : k.kind === 'duel' ? (k.a === 0 ? 'A: ' + k.A : 'B: ' + k.B)
    : k.kind === 'multi' ? (k.a as number[]).map((x) => k.o![x]).join(' + ')
      : k.kind === 'order' ? k.steps!.join(' → ') : k.kind === 'match' ? k.pairs!.map((p) => `${p[0]} = ${p[1]}`).join(' · ')
        : k.kind === 'tf' ? (k.v ? 'Legit' : 'Hallucination') : `Wrong line: "${(k.s as string[])[k.bad!]}". Fix: ${k.o![k.a as number]}`;
}

/** Rule first, then why, then (on a miss) the SOC analogy. Returns the verdict element so the runner can pulse XP on it. */
export function feedback(el: HTMLElement, k: Card, ok: boolean, partial: boolean): HTMLElement {
  const con = conceptById.get(k.c)!;
  el.innerHTML = `<div class="verdict ${ok ? 'ok' : partial ? 'mid' : 'no'}"><div class="vt"><span>${ok ? '✔ Right' : partial ? '◐ Close' : '✘ Not quite'}</span><small id="xpl"></small></div><div class="sub" id="shl"></div>${ok ? '' : `<div class="ansline">✔ ${esc(answerText(k))}</div>`}</div>
${k.id.startsWith('g:') ? `<div class="rule"><b>FACT</b><p>${esc(k.why)}</p></div>` : `<div class="rule"><b>RULE · ${esc(con.name.toUpperCase())}</b><p>${esc(con.rule)}</p></div>
<div class="tell">${esc(k.why)}</div>`}
${ok ? '' : `<div class="cmp"><b>SOC BRAIN</b>${esc(con.soc)}</div>`}`;
  return el.querySelector('.verdict') as HTMLElement;
}
