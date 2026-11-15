// One card on its own, outside any run: for QA and "check card d3-014" links. Never touches progress.
import { cardById } from './content';
import { renderCard } from './card';
import { app } from '../engine/ui';
import { esc } from '../engine/util';

export function previewCard(id: string): void {
  const k = cardById.get(id);
  app.innerHTML = `<div class="scr"><div class="bar"><a class="x" href="./#shifty-1" style="display:grid;place-items:center;text-decoration:none">✕</a><b>Card ${esc(id)}</b></div><div id="slot"></div></div>`;
  const slot = document.getElementById('slot')!;
  if (!k) { slot.innerHTML = `<p class="note">No card with id ${esc(id)}.</p>`; return; }
  renderCard(slot, k, { mode: 'drill', sure: null, feedback: true, onAnswer: (p) => { slot.dataset.result = p.ok ? 'ok' : 'no'; } });
}
