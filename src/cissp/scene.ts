// One scene on screen: every kind's interaction, the confidence toggle, and the feedback (what happened in the
// story, the rule, the why, the source). The runner owns XP, the queue and the Next button.
import type { Scene } from './types';
import { caseById, conceptById, domainOf } from './content';
import { esc, shuffle, $$ } from '../engine/util';
import { buzz, sfx } from '../engine/ui';
import { S } from './state';

export interface Played { ok: boolean; sure: boolean; partial: boolean; eng: boolean }
export interface SceneOpts {
  /** case = inside its story; flash = a flashback (alone); daily; exam (no feedback); drill; preview */
  mode: 'case' | 'flash' | 'daily' | 'exam' | 'drill' | 'preview';
  /** null = the player chooses SURE, false = never */
  sure: boolean | null;
  feedback: boolean;
  /** first time this concept is met: the feedback includes the full briefing */
  fresh?: boolean;
  stakes?: string;
  onAnswer: (p: Played, fb: HTMLElement | null) => void;
}

export const KIND_LABEL: Record<string, string> = {
  first: 'WHAT FIRST?', best: 'BEST MOVE', rank: 'PUT IN ORDER', sort: 'SORT IT', spot: 'TAP THE SPOT', calc: 'DO THE MATH',
};
const FLAG: Record<string, string> = { flash: '<span class="flag cb">FLASHBACK</span>', drill: '<span class="flag cb">DRILL</span>' };

export function renderScene(host: HTMLElement, s: Scene, o: SceneOpts): void {
  const con = conceptById.get(s.c)!;
  const dom = domainOf(s.d);
  let sure = false;
  let done = false;
  const head = o.mode === 'exam'
    ? `<div class="dom"><b>QUESTION</b> · ${KIND_LABEL[s.kind]}</div>`
    : `<div class="dom"><i class="dot" style="--c:${dom.color}"></i>D${dom.n} ${esc(dom.short)} · ${esc(con.obj)} · <b>${KIND_LABEL[s.kind]}</b> ${FLAG[o.mode] ?? ''}</div>`;
  const played = !!S.done[s.case] || o.mode === 'preview';
  const where = o.mode === 'flash' || o.mode === 'drill' || o.mode === 'preview' ? `<div class="dateline">${played ? `from case: ${esc(caseById.get(s.case)?.title ?? '')}` : 'from a case still to come'}</div>` : '';
  // option order is shuffled at runtime; data-i keeps the authored index
  const order = (n: number) => shuffle(Array.from({ length: n }, (_, i) => i));
  let body = '';
  switch (s.kind) {
    case 'first': case 'best': case 'calc':
      body = `<div class="opts">${order(4).map((i) => `<button class="opt" data-i="${i}">${esc(s.o![i])}</button>`).join('')}</div>`;
      break;
    case 'rank':
      body = `<p class="hint">Tap them in order. Tap a placed one to take it back.</p><div class="opts" id="pool">${order(s.items!.length).map((i) => `<button class="opt st" data-i="${i}">${esc(s.items![i])}</button>`).join('')}</div><ol class="placed" id="placed"></ol><button class="lock" id="lock" disabled>Lock in</button>`;
      break;
    case 'sort':
      body = `<p class="hint">Tap a bin for each item.</p><div class="sorts">${order(s.pairs!.length).map((i) => `<div class="srow" data-i="${i}"><span>${esc(s.pairs![i][0])}</span><div class="bins">${s.bins!.map((b, j) => `<button class="bin" data-b="${j}">${esc(b)}</button>`).join('')}</div></div>`).join('')}</div><button class="lock" id="lock" disabled>Lock in</button>`;
      break;
    case 'spot':
      body = mapHtml(s);
      break;
  }
  const sureRow = o.sure === null
    ? `<button class="suretog" id="sure" aria-pressed="false"><span>🎯</span> <b>Sure?</b> <small>${esc(o.stakes ?? 'off: lean')}</small></button>`
    : '';
  host.innerHTML = `<div class="card qc scene k-${s.kind}">${head}${where}<p class="stext">${esc(s.text)}</p><p class="q">${esc(s.ask)}</p>${sureRow}${body}<div class="cid">${esc(s.id)}</div></div><div id="fb"></div>`;
  const card = host.querySelector('.card') as HTMLElement;
  card.dataset.kind = s.kind;
  if (s.kind === 'spot') fitNodes(card);
  const sureBtn = host.querySelector<HTMLButtonElement>('#sure');
  if (sureBtn) sureBtn.onclick = () => {
    if (done) return;
    sure = !sure;
    sureBtn.classList.toggle('on', sure);
    sureBtn.setAttribute('aria-pressed', String(sure));
    sfx('tick'); buzz(8);
  };

  const finish = (ok: boolean, partial = false, picked: number | null = null) => {
    if (done) return;
    done = true;
    card.classList.add('answered');
    sureBtn?.setAttribute('disabled', '');
    $$('button', card).forEach((b) => { if (b !== sureBtn) b.setAttribute('disabled', ''); });
    const eng = !ok && picked !== null && s.trap === picked;
    host.dataset.result = ok ? 'ok' : 'no';
    if (o.feedback) { sfx(ok ? 'ok' : 'no'); buzz(ok ? 15 : [30, 40, 30]); if (!ok) card.classList.add('shake'); }
    const fb = o.feedback ? feedback(host.querySelector('#fb') as HTMLElement, s, ok, partial, picked, eng, !!o.fresh) : null;
    o.onAnswer({ ok, sure: o.sure === false ? false : sure, partial, eng }, fb);
  };
  const mark = (b: Element | null | undefined, cls: string) => { if (b) b.classList.add(o.feedback ? cls : 'chosen'); };

  switch (s.kind) {
    case 'first': case 'best': case 'calc':
      $$('.opt', card).forEach((b) => (b.onclick = () => {
        const i = +b.dataset.i!;
        const ok = i === s.a;
        mark(b, ok ? 'r' : 'w');
        if (!ok && o.feedback) card.querySelector(`.opt[data-i="${s.a}"]`)?.classList.add('r');
        finish(ok, false, i);
      }));
      break;
    case 'rank': {
      const placed: number[] = [];
      const list = card.querySelector('#placed') as HTMLElement, lock = card.querySelector('#lock') as HTMLButtonElement;
      const draw = () => {
        list.innerHTML = placed.map((i) => `<li><button class="pl" data-i="${i}">${esc(s.items![i])}</button></li>`).join('');
        $$('.st', card).forEach((b) => b.classList.toggle('used', placed.includes(+b.dataset.i!)));
        lock.disabled = placed.length !== s.items!.length;
        $$('.pl', list).forEach((p) => (p.onclick = () => { if (done) return; placed.splice(placed.indexOf(+p.dataset.i!), 1); draw(); }));
      };
      $$('.st', card).forEach((b) => (b.onclick = () => { const i = +b.dataset.i!; if (placed.includes(i)) return; placed.push(i); sfx('tick'); draw(); }));
      lock.onclick = () => {
        const ok = placed.every((x, j) => x === j);
        if (o.feedback) {
          $$('.pl', list).forEach((p, j) => p.classList.add(+p.dataset.i! === j ? 'r' : 'w'));
          if (!ok) list.insertAdjacentHTML('afterend', `<div class="right-order"><b>Correct order</b><ol>${s.items!.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>`);
        }
        finish(ok, !ok && placed.filter((x, j) => x === j).length >= Math.ceil(s.items!.length / 2));
      };
      draw();
      break;
    }
    case 'sort': {
      const pick: (number | null)[] = s.pairs!.map(() => null);
      const lock = card.querySelector('#lock') as HTMLButtonElement;
      $$('.srow', card).forEach((row) => {
        const i = +row.dataset.i!;
        $$('.bin', row).forEach((b) => (b.onclick = () => {
          pick[i] = +b.dataset.b!;
          $$('.bin', row).forEach((x) => x.classList.toggle('sel', x === b));
          sfx('tick');
          lock.disabled = pick.includes(null);
        }));
      });
      lock.onclick = () => {
        const good = pick.map((b, i) => b === s.pairs![i][1]);
        const ok = good.every(Boolean);
        if (o.feedback) $$('.srow', card).forEach((row) => {
          const i = +row.dataset.i!;
          row.classList.add(good[i] ? 'r' : 'w');
          row.querySelector(`.bin[data-b="${s.pairs![i][1]}"]`)?.classList.add('ans');
        });
        finish(ok, !ok && good.filter(Boolean).length >= Math.ceil(good.length * 0.75));
      };
      break;
    }
    case 'spot':
      $$('.node', card).forEach((b) => (b.onclick = () => {
        const ok = b.dataset.n === s.a;
        mark(b, ok ? 'r' : 'w');
        if (!ok && o.feedback) card.querySelector(`.node[data-n="${CSS.escape(String(s.a))}"]`)?.classList.add('r');
        finish(ok);
      }));
      break;
  }
}

/**
 * A spot diagram: boxes on a 100 x 100 grid joined by lines; every box is a tappable button. The map is cropped to the
 * rows the boxes use (no empty bands), and each label's font shrinks until its longest word fits its box.
 */
function mapHtml(s: Scene): string {
  const m = s.map!;
  const top = Math.max(0, Math.min(...m.nodes.map((n) => n.y)) - 4);
  const bottom = Math.min(100, Math.max(...m.nodes.map((n) => n.y + (n.h ?? 12))) + 4);
  const H = bottom - top;
  const ctr = new Map(m.nodes.map((n) => [n.id, [n.x + (n.w ?? 22) / 2, n.y - top + (n.h ?? 12) / 2]]));
  const lines = (m.links ?? []).map(([p, q]) => { const [x1, y1] = ctr.get(p)!, [x2, y2] = ctr.get(q)!; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }).join('');
  const fit = (label: string, w: number) => {
    const longest = Math.max(...label.split(/\s+/).map((x) => x.length), 4);
    return `clamp(9.5px, ${((1.6 * w) / longest).toFixed(2)}cqw, 11.5px)`;
  };
  return `<div class="map" role="group" aria-label="Diagram: tap the right box" style="aspect-ratio:100/${H.toFixed(1)}"><svg viewBox="0 0 100 ${H.toFixed(1)}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${m.nodes.map((n) => {
    const w = n.w ?? 22, h = n.h ?? 12;
    return `<button class="node${n.zone ? ' zone' : ''}" data-n="${esc(n.id)}" style="left:${n.x}%;top:${(((n.y - top) / H) * 100).toFixed(2)}%;width:${w}%;height:${((h / H) * 100).toFixed(2)}%;font-size:${fit(n.label, w)}">${esc(n.label)}</button>`;
  }).join('')}</div>${m.caption ? `<p class="hint">${esc(m.caption)}</p>` : ''}`;
}

/** After layout: shrink each label (in half pixels, never below 9px) until it fits its box; if it still doesn't, let the box grow. */
function fitNodes(root: HTMLElement): void {
  let done = false;
  const run = () => {
    if (done || !root.isConnected) return;
    done = true;
    for (const n of $$('.node', root)) {
      const over = () => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1;
      let fs = parseFloat(getComputedStyle(n).fontSize);
      while (over() && fs > 9) { fs -= 0.5; n.style.fontSize = fs + 'px'; }
      if (over()) n.style.height = 'auto';
    }
  };
  // after layout; the timer covers pages where animation frames are paused (a background tab)
  requestAnimationFrame(run);
  setTimeout(run, 60);
}

/** The right answer as text (miss panels and the exam review). */
export function answerText(s: Scene): string {
  switch (s.kind) {
    case 'first': case 'best': case 'calc': return s.o![s.a as number];
    case 'rank': return s.items!.join(' → ');
    case 'sort': return s.bins!.map((b, j) => `${b}: ${s.pairs!.filter((p) => p[1] === j).map((p) => p[0]).join(', ')}`).join(' · ');
    case 'spot': return s.map!.nodes.find((n) => n.id === s.a)?.label ?? '';
  }
}

/** Verdict, what happened in the story, the rule, the why, the briefing on a first meeting or a miss, the source. */
export function feedback(el: HTMLElement, s: Scene, ok: boolean, partial: boolean, picked: number | null, eng: boolean, fresh: boolean): HTMLElement {
  const con = conceptById.get(s.c)!;
  const line = s.r && picked !== null ? s.r[picked] : s.rr ? s.rr[ok ? 0 : 1] : '';
  const story = line ? `<div class="story ${ok ? 'ok' : 'no'}"><b>WHAT HAPPENED</b><p>${esc(line)}</p></div>` : '';
  const briefBody = `<ul class="learn">${con.learn.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>${con.ghost ? `<p class="note ghostline">👻 ${esc(con.ghost)}</p>` : ''}`;
  const brief = fresh ? `<div class="sk brief"><h3>New concept · ${esc(con.name)}</h3>${briefBody}</div>`
    : `<details class="sk brief"${ok ? '' : ''}><summary>Briefing · ${esc(con.name)}</summary>${briefBody}</details>`;
  const others = s.r && picked !== null ? [0, 1, 2, 3].filter((j) => j !== picked && j !== s.a).sort((x, y) => (x === s.trap ? -1 : y === s.trap ? 1 : 0)) : [];
  const alt = others.length ? `<details class="others"><summary>What the other choices would have done</summary>${[...(picked !== s.a ? [s.a as number] : []), ...others].map((j) => `<div class="alt${j === s.a ? ' ok' : ''}"><b>${j === s.a ? '✔ ' : j === s.trap ? '🔧 ' : ''}${esc(s.o![j])}</b><p>${esc(s.r![j])}</p></div>`).join('')}</details>` : '';
  el.innerHTML = `<div class="verdict ${ok ? 'ok' : partial ? 'mid' : 'no'}"><div class="vt"><span>${ok ? '✔ Right call' : partial ? '◐ Close' : '✘ Not the CISSP answer'}</span><small id="xpl"></small></div><div class="sub" id="shl"></div>${ok ? '' : s.kind === 'sort' ? '<div class="ansline">The right bin for each item is outlined in green above.</div>' : s.kind === 'rank' ? '<div class="ansline">The correct order is shown above.</div>' : `<div class="ansline">✔ ${esc(answerText(s))}</div>`}</div>
${story}
${eng ? '<div class="enganswer"><b>🔧 ENGINEER ANSWER</b><p>The hands-on fix. Useful, but not the manager\'s move here, and Shifty\'s hands go through the keyboard anyway.</p></div>' : ''}
<div class="rule"><b>RULE · ${esc(con.name.toUpperCase())}</b><p>${esc(con.rule)}</p></div>
<div class="tell">${esc(s.why)}</div>
${alt}
${brief}
<p class="srcline">Source: ${esc(s.src)}</p>`;
  return el.querySelector('.verdict') as HTMLElement;
}
