// About: how it teaches, free official study links, credits and disclaimers.
import { APP_VERSION } from '../engine/config';
import { C } from './content';
import { BACKUP_KEY, KEY, S, save } from './state';
import { applyIncoming, exportCode, readCode } from './move';
import { app, toast } from '../engine/ui';
import { shiftyHtml } from '../engine/shifty-live';
import { $, esc } from '../engine/util';

export function about(): void {
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="quit">✕</button><b>About</b></div>
<div class="sk">${shiftyHtml('dead', 72, 'lg')}<h3 class="center">SHIFTY-1</h3><p class="note">A free, funny study game for the <b>${esc(C.exam.name)}</b> exam (${esc(C.exam.code)}), built on the official objectives in AWS's ${esc(C.exam.guide)}. Every card shows its id (like <span class="mono">d3-014</span>): if one looks wrong, send the id.</p></div>
<div class="sk"><h3>How it teaches</h3><p class="note">Guess first (pretesting), short lessons tied to SOC work (analogies), finding and fixing errors (Shifty's hallucinations), exam-style scenarios, confidence ratings that reward calibration, and spaced repetition by concept, so a miss comes back as a different card days later. Benchmarks run under exam conditions with no hints.</p></div>
<div class="sk"><h3>Free official study (do these too)</h3>
<div class="weak"><a href="${esc(C.exam.url)}" target="_blank" rel="noopener">AIF-C01 exam guide ↗</a><span>the objectives</span></div>
<div class="weak"><a href="${esc(C.exam.prep)}" target="_blank" rel="noopener">AWS Skill Builder ↗</a><span>free exam prep course + practice questions</span></div>
<div class="weak"><a href="https://aws.amazon.com/certification/certified-ai-practitioner/" target="_blank" rel="noopener">Exam page ↗</a><span>booking, price</span></div></div>
<div class="sk"><h3>Settings</h3>
<button class="next ghost" id="voice">${S.voice ? '🗣 Voice on (earbud mode, read-aloud)' : '🔇 Voice off'}</button>
<button class="next ghost" id="move">📦 Move my progress (another phone or install)</button>
<div id="movebox" hidden><p class="note">Progress lives on this device. To carry it over: copy the code here, open SHIFTY-1 on the other install, paste it in the same box there and load it.</p>
<button class="next ghost" id="mcopy">Copy my progress code</button>
<textarea class="movebox" id="mcode" aria-label="Progress code" placeholder="Paste a progress code here" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
<button class="next ghost" id="mload">Load the pasted code</button></div>
<button class="next ghost" id="reset" style="color:var(--red)">Reset SHIFTY-1 progress</button></div>
<div class="sk"><h3>Credits and notices</h3><p class="note">Not affiliated with, endorsed by, or sponsored by Amazon Web Services or Microsoft. AWS, Amazon Bedrock, Amazon SageMaker and related names are trademarks of Amazon.com, Inc. or its affiliates. Exam objectives are paraphrased from AWS's public exam guide. All companies and scenarios in the cards are fictional. Practice scores are estimates, not a guarantee of an exam result.</p>
<p class="note">Fonts: Press Start 2P, Space Grotesk, JetBrains Mono (SIL Open Font License). Shifty and Dale come from ON SHIFT.</p>
<p class="note mono">app ${esc(APP_VERSION)} · content ${esc(C.version)}</p></div></div>`;
  $('#quit').onclick = () => history.back();
  $('#voice').onclick = () => { S.voice = !S.voice; save(); about(); };
  $('#move').onclick = () => { $('#movebox').hidden = !$('#movebox').hidden; };
  const box = $('#mcode') as HTMLTextAreaElement;
  $('#mcopy').onclick = async () => {
    const code = await exportCode();
    box.value = code;
    try { await navigator.clipboard.writeText(code); toast('Progress code copied'); } catch { box.select(); toast('Copy blocked: the code is in the box, copy it from there'); }
  };
  $('#mload').onclick = async () => {
    try {
      const inc = await readCode(box.value);
      if (!confirm(`Replace SHIFTY-1 progress on this device (${S.xp} XP, ${Object.keys(S.cs).length} concepts) with the pasted progress (${inc.save.xp} XP, ${inc.concepts} concepts)?`)) return;
      applyIncoming(inc);
      location.reload();
    } catch (e) { toast((e as Error).message); }
  };
  $('#reset').onclick = () => {
    if (!confirm('Erase all SHIFTY-1 progress on this device? This cannot be undone. (The SOC shift is not touched.)')) return;
    [KEY, BACKUP_KEY, 'shifty1.decks'].forEach((k) => localStorage.removeItem(k));
    location.reload();
  };
}
