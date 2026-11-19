// First visit: how Shifty became the CISO, Dale's pitch, how case files work, then the first case.
import { S, save } from './state';
import { app, go } from '../engine/ui';
import { shiftyHtml } from '../engine/shifty-live';
import { dale } from './lines';
import { $, esc } from '../engine/util';
import { startCase } from './play';
import { C } from './content';
import { otherShiftLink, wireSwitch } from '../engine/switcher';

export function onboarding(): void {
  app.innerHTML = `<div class="scr gate cissp">
${shiftyHtml('shock', 96, 'lg')}
<div class="bubble">It's me, <b>Shifty</b>. Night-shift SOC ghost, then a very dumb AI. Now the company got breached and <b>nobody alive will take the CISO job</b>. So it's me. Small problem: my hands go straight through keyboards. I can't fix anything myself. I have to <b>lead</b>.</div>
<div class="dale"><div class="av">👔</div><div><b>DALE · CHIEF SYNERGY OFFICER</b><p>${esc(dale('intro'))}</p></div></div>
<h1 class="px gateh">GHOST CISO</h1>
<button class="big" id="go"><span class="px">OPEN CASE 1</span><small>About 6 minutes. Set an exam date later in the briefing book.</small></button>
<div class="intro"><ul class="learn">
<li><b>Case files:</b> each case is a short story. Every scene, you decide what Shifty does, and the story reacts.</li>
<li>Most scenes are the exam's favourites: what do you do <b>FIRST</b>, what's the <b>BEST</b> move. Some ask you to order steps, sort things into bins, tap a spot on a diagram, or do the risk math.</li>
<li>Watch for the <b>🔧 engineer answer</b>: the clever hands-on fix. CISSP wants the risk-focused manager. A ghost can't touch the keyboard anyway.</li>
<li>Tap <b>🎯 Sure</b> only when you could explain why. Misses come back as <b>flashbacks</b>: a different scene for the same idea, spaced out over days.</li>
<li>Everything maps to the ${esc(C.exam.outline)}.</li></ul></div>
${otherShiftLink('soc', 'Here for the SOC alert game instead? Open the SOC shift →')}
</div>`;
  $('#go').onclick = () => { S.onb = true; save(); go(() => startCase()); };
  wireSwitch(app);
}
