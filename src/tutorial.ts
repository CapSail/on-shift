// First-run training: 3 alerts, then your first crew card.
import { D, byId } from './content';
import { S, save } from './state';
import { DALE } from './voice';
import { addXP } from './progress';
import { capture, crewCard } from './crews';
import { app, confetti, go, routes, stopDock } from './ui';
import { runAlerts } from './runner';
import type { QueueAlert } from './types';
import { $, esc } from './util';

export function tutorial(): void {
  app.innerHTML = `<div class="scr center" style="padding-top:8vh"><div class="logo px" style="font-size:22px">ON<b>·</b>SHIFT</div>
 <div class="dale" style="margin-top:28px"><div class="av">☕</div><div><b>DALE · NIGHT SHIFT SOC MANAGER</b><p>${esc(DALE.first[0])}</p></div></div>
 <div class="intro" style="text-align:left;margin-top:12px"><p style="margin:0">Alerts come in. You make the call:</p>
 <p>👉 <b style="color:var(--red)">Escalate</b> (swipe right) if it's a real attack.<br>👈 <b style="color:var(--grn)">Close</b> (swipe left) if it's benign.<br>⚡ Tap <b>SURE</b> before you swipe when you're certain: +15 if right, −10 if wrong. Otherwise it's a lean: +8 / −2.</p>
 <p>Then point at the line that gave it away. That's the skill.</p></div>
 <button class="next" id="t">Start training (3 alerts)</button></div>`;
  $('#t').onclick = () => go(() => {
    const queue: QueueAlert[] = (D.tutorial || []).map((id) => byId[id]).filter(Boolean).map((a) => ({ ...a }));
    runAlerts({ mode: 'tut', queue, finish: tutEnd });
  });
}

function tutEnd(): void {
  stopDock();
  S.onb = true;
  const rare = D.crews.filter((c) => c.r === 1);
  const c = rare[Math.floor(Math.random() * rare.length)];
  capture(c.id, 'training');
  addXP(30);
  save();
  confetti(40);
  app.innerHTML = `<div class="scr center"><div class="sec">TRAINING COMPLETE</div><div class="grade" style="font-size:40px;color:var(--grn)">✓</div>
 <div class="dale"><div class="av">☕</div><div><b>DALE</b><p>Not bad. Here's your first threat crew card. Catch real attacks to earn intel on more crews. Now clock in for real.</p></div></div>${crewCard(c, 'training')}
 <button class="next" id="h">Enter the SOC</button></div>`;
  $('#h').onclick = () => go(routes.home);
}
