// First launch: the premise, Dale's pitch, the methods in one screen, then the first run.
import { S, save } from './state';
import { app, go } from '../engine/ui';
import { shiftyHtml } from '../engine/shifty-live';
import { dale } from './lines';
import { $, esc } from '../engine/util';
import { startRun } from './run';
import { C } from './content';
import { otherShiftLink, wireSwitch } from '../engine/switcher';

export function onboarding(): void {
  app.innerHTML = `<div class="scr gate">
${shiftyHtml('shock', 96, 'lg')}
<div class="bubble">Hi. I'm <b>Shifty</b>. I used to watch alerts on the night shift. Then an AI took my job. Then they turned <b>me</b> into the AI. I am… not good at it.</div>
<div class="dale"><div class="av">👔</div><div><b>DALE · HEAD OF AI INITIATIVES</b><p>${esc(dale('intro'))}</p></div></div>
<h1 class="px gateh">TRAIN SHIFTY-1</h1>
<button class="big" id="go"><span class="px">START EPOCH 1</span><small>About 5 minutes. Set an exam date later on the Model card.</small></button>
<div class="intro"><ul class="learn">
<li><b>Pretest:</b> you guess before each lesson. Wrong guesses are free and make the lesson stick.</li>
<li><b>Catch the hallucination:</b> Shifty explains things and gets one line confidently wrong. Find it, fix it.</li>
<li><b>Tap 🎯 Sure</b> only when you could explain why. Sure answers win more XP and lose more when wrong.</li>
<li>Misses come back as a <b>different</b> card for the same idea, on a schedule that spaces them out.</li>
<li>Everything maps to the ${esc(C.exam.name)} exam (${esc(C.exam.code)}).</li></ul></div>
${otherShiftLink('soc', 'Here for the SOC alert game instead? Open the SOC shift →')}
</div>`;
  wireSwitch(app);
  $('#go').onclick = () => { S.onb = true; save(); go(startRun); };
}
