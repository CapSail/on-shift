// About, credits, licences and the "fictional" disclaimer.
import { D } from './content';
import { APP_VERSION } from './config';
import { app } from './ui';
import { $, esc } from './util';
import { shiftySvg } from './shifty';

export function about(): void {
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="q" aria-label="Back">✕</button><b style="font-size:18px">About ON SHIFT</b></div>
 <div class="sk"><div class="mascot lg">${shiftySvg('dead', 72)}</div><h3 class="center">Meet Shifty</h3>
  <p class="note center">The night-shift cyber-ghost. Died at 2am, still got paged. He is on every shift with you.</p></div>
 <div class="sk"><h3>What this is</h3>
  <p class="note">A meme-y, expert-level SOC alert triage game. Triage the alert, tap the line that gave it away, learn the rule. Progress lives on this device only.</p>
  <p class="note mono">app ${esc(APP_VERSION)}<br>content v${D.meta.contentVersion} · ${D.alerts.length + D.inc.reduce((n, i) => n + i.a.length, 0)} alerts<br>MITRE ATT&amp;CK v${esc(D.meta.attack)}</p></div>
 <div class="sk"><h3>All fictional</h3>
  <p class="note">Every alert, user, host and company in this game is a fictional training scenario. Nothing here is affiliated with, derived from, or based on any employer or client, and none of it contains real customer data. Hostnames, accounts and addresses are invented; IP ranges are placeholders.</p></div>
 <div class="sk"><h3>MITRE ATT&amp;CK®</h3>
  <p class="note">© The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation.</p>
  <p class="note">MITRE ATT&amp;CK® is a registered trademark of The MITRE Corporation. ON SHIFT is an independent project and is not endorsed by or affiliated with MITRE. Technique and group data come from the public ATT&amp;CK knowledge base.</p>
  <div class="tq"><a class="tag" href="https://attack.mitre.org/" target="_blank" rel="noopener">attack.mitre.org ↗</a><a class="tag" href="https://attack.mitre.org/resources/legal-and-branding/terms-of-use/" target="_blank" rel="noopener">terms of use ↗</a></div></div>
 <div class="sk"><h3>Fonts</h3>
  <p class="note">Press Start 2P (CodeMan38), Space Grotesk (Florian Karsten) and JetBrains Mono (JetBrains), all under the SIL Open Font License 1.1.</p></div>
 <div class="sk"><h3>Something wrong?</h3>
  <p class="note">Every answer shows its alert id (like <span class="mono">y45</span>) under the explanation. If an answer, a log line or a technique mapping looks wrong, tell Jordan the id.</p></div>
 </div>`;
  $('#q').onclick = () => history.back();
}
