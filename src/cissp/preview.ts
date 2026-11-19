// One scene on its own, outside any case: for QA and "check scene k3-02.4" links. Never touches progress.
import { sceneById } from './content';
import { renderScene } from './scene';
import { app } from '../engine/ui';
import { esc } from '../engine/util';

export function previewScene(id: string): void {
  const s = sceneById.get(id);
  app.innerHTML = `<div class="scr cissp"><div class="bar"><a class="x" href="./#cissp" style="display:grid;place-items:center;text-decoration:none" aria-label="Back">✕</a><b>Scene ${esc(id)}</b></div><div id="slot"></div></div>`;
  const slot = document.getElementById('slot')!;
  app.scrollTop = 0;
  if (!s) { slot.innerHTML = `<p class="note">No scene with id ${esc(id)}.</p>`; return; }
  renderScene(slot, s, { mode: 'preview', sure: null, feedback: true, fresh: true, onAnswer: () => {} });
}
