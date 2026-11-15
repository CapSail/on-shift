// Syllabus: every concept by domain and task, with its state. Tap one to read the lesson or drill it.
import { CONCEPTS, DOMAINS, cardsOf, conceptById } from './content';
import { S } from './state';
import { strength } from './srs';
import { startDrill } from './run';
import { app, go } from '../engine/ui';
import { $, esc } from '../engine/util';
import { canSpeak, hush, say } from './voice';

const stateOf = (id: string) => { const c = S.cs[id]; return !c ? ['new', '○'] : c.box >= 3 ? ['mast', '●'] : ['learn', '◐']; };

export function syllabus(): void {
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="quit">✕</button><b>Syllabus · AIF-C01</b></div>
<p class="note">○ not started · ◐ learning · ● mastered. Tap a concept to read it or drill it. Locked? Nothing is locked: read ahead any time.</p>
${DOMAINS.map((d) => {
    const cc = CONCEPTS.filter((c) => c.d === d.n).sort((a, b) => a.task.localeCompare(b.task));
    return `<div class="sec" style="color:${d.color}">D${d.n} · ${esc(d.name)} · ${d.w}%</div>${cc.map((c) => { const [cls, dot] = stateOf(c.id); return `<button class="inc syl ${cls}" data-c="${c.id}"><span class="ic" style="color:${d.color}">${dot}</span><span><b>${esc(c.name)}</b><span>task ${esc(c.task)} · ${cardsOf(c.id).length} cards${S.cs[c.id] ? ` · ${Math.round(strength(c.id) * 100)}%` : ''}</span></span></button>`; }).join('')}`;
  }).join('')}</div>`;
  $('#quit').onclick = () => history.back();
  app.querySelectorAll<HTMLButtonElement>('[data-c]').forEach((b) => b.onclick = () => open(b.dataset.c!));
}

function open(id: string): void {
  const c = conceptById.get(id)!;
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="box"><div class="sec" style="margin-top:0">task ${esc(c.task)}</div><h2 style="font-size:20px">${esc(c.name)}</h2>
<ul class="learn">${c.learn.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<div class="cmp soc"><b>SOC BRAIN</b>${esc(c.soc)}</div><div class="rule"><b>RULE</b><p>${esc(c.rule)}</p></div>
<button class="next" id="md">Drill this concept</button>${canSpeak() ? '<button class="next ghost" id="mh">🔊 Read it to me</button>' : ''}<button class="next ghost" id="mx">Close</button></div>`;
  document.body.appendChild(m);
  const close = () => { hush(); m.remove(); };
  m.onclick = (e) => { if (e.target === m) close(); };
  (m.querySelector('#mx') as HTMLElement).onclick = close;
  (m.querySelector('#md') as HTMLElement).onclick = () => { close(); go(() => startDrill([id])); };
  const h = m.querySelector('#mh') as HTMLElement | null;
  if (h) h.onclick = () => { hush(); void say(`${c.name}. ${c.say}`); };
}
