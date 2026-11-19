// About the Ghost CISO: the exam, how it teaches, where the content comes from, settings, notices.
import { APP_VERSION } from '../engine/config';
import { C, CASES, CONCEPTS, SCENES } from './content';
import { KEY, S } from './state';
import { app } from '../engine/ui';
import { shiftyHtml } from '../engine/shifty-live';
import { $, esc } from '../engine/util';

export function about(): void {
  app.innerHTML = `<div class="scr cissp"><div class="bar"><button class="x" id="quit" aria-label="Back">✕</button><b>About the Ghost CISO</b></div>
<div class="sk">${shiftyHtml('happy', 72, 'lg')}<h3 class="center">The exam</h3><p class="note">${esc(C.exam.name)} (${esc(C.exam.code)}). This shift teaches the <b>${esc(C.exam.outline)}</b>. The exam is computerized adaptive: ${esc(C.exam.items)} items, ${C.exam.hours} hours, pass at ${C.exam.pass} of 1000, multiple choice plus advanced items (drag and drop, hotspot). Every scene shows its id (like <span class="mono">k3-02.4</span>): if one looks wrong, send the id.</p></div>
<div class="sk"><h3>How it teaches</h3><p class="note">Case files train the judgement CISSP actually tests: what to do FIRST, what's BEST, who decides. Every wrong option shows what would happen; the "engineer answer" (the hands-on fix the exam marks wrong) is flagged and tracked. Concepts come back as flashbacks on a spaced schedule, as a different scene from a different case. The board exam adapts its difficulty like the real CAT. ${CASES.length} cases, ${SCENES.length} scenes, ${CONCEPTS.length} concepts.</p></div>
<div class="sk"><h3>Where the content comes from</h3><p class="note">Written for this app and checked against primary sources: the ISC2 exam outline and Code of Ethics, NIST special publications and FIPS, RFCs, ISO titles, the laws themselves, FIDO/W3C, OWASP and CISA. Every scene names its source under the explanation. Third-party prep material was used only to look for gaps.</p>
<div class="weak"><a href="${esc(C.exam.url)}" target="_blank" rel="noopener">Official CISSP exam outline ↗</a><span>ISC2</span></div>
<div class="weak"><a href="${esc(C.exam.refs)}" target="_blank" rel="noopener">ISC2 supplementary references ↗</a><span>ISC2</span></div>
<div class="weak"><a href="https://www.isc2.org/ethics" target="_blank" rel="noopener">ISC2 Code of Ethics ↗</a><span>ISC2</span></div></div>
<div class="sk"><h3>Settings</h3><button class="next ghost" id="reset" style="color:var(--red)">Reset Ghost CISO progress</button></div>
<div class="sk"><h3>Notices</h3><p class="note">Not affiliated with, endorsed by, or sponsored by ISC2. CISSP and ISC2 are registered marks of ISC2, Inc. Objectives are paraphrased from ISC2's public exam outline; the official outline is the authority. No real exam questions are used. Halvorsen Freight and everyone in it are fictional. Scores here are estimates, not a prediction of an exam result.</p>
<p class="note">Fonts: Press Start 2P, Space Grotesk, JetBrains Mono (SIL Open Font License).</p>
<p class="note mono">app ${esc(APP_VERSION)} · content ${esc(C.version)}</p></div></div>`;
  $('#quit').onclick = () => history.back();
  $('#reset').onclick = () => {
    if (!confirm('Erase all Ghost CISO progress on this device? This cannot be undone. (The other shifts are not touched.)')) return;
    [KEY, 'cissp.decks'].forEach((k) => localStorage.removeItem(k));
    void S;
    location.reload();
  };
}
