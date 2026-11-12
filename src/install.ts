// First-visit install gate: on a phone, before anything else, a full-screen "make this an app" page.
// A website cannot force an install, so this is the next best thing: it is the only thing a new visitor sees
// until they install, with exact steps for their device, and a small, honest "play in the browser anyway".
import { app, toast } from './ui';
import { $, esc } from './util';
import { shiftySvg } from './shifty';
import { canInstall, isIosSafari, isStandalone, justInstalled, promptInstall } from './pwa';

const SKIP = 'onshift.gateSkip';

export const isPhone = (): boolean =>
  /android|iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const needsInstallGate = (): boolean => {
  let skipped = false;
  try { skipped = sessionStorage.getItem(SKIP) === '1'; } catch { /* private mode */ }
  return import.meta.env.PROD && isPhone() && !isStandalone() && !skipped;
};

export function installGate(onContinue: () => void): void {
  const ios = isIosSafari();
  const steps = ios
    ? ['Open this page in <b>Safari</b>. Inside another app (Messages, Mail, Slack)? Tap <b>⋯</b> or the compass, then <b>Open in Safari</b>.',
       'Tap the <b>Share</b> button (the square with an arrow, at the bottom).',
       'Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.',
       'Open <b>ON SHIFT</b> from your Home Screen. That is the app.']
    : ['Open this page in <b>Chrome</b>. Inside another app (Gmail, Slack, a chat)? Tap <b>⋮</b> at the top right, then <b>Open in Chrome</b>.',
       'In Chrome, tap the <b>⋮</b> menu at the top right.',
       'Tap <b>Install app</b> (or <b>Add to Home screen</b>), then <b>Install</b>.',
       'Open <b>ON SHIFT</b> from your home screen. That is the app.'];

  app.innerHTML = `<div class="scr gate">
 <div class="mascot big">${shiftySvg(justInstalled() ? 'happy' : 'dead', 96)}</div>
 <div class="bubble">${justInstalled() ? 'Installed! Close this tab and open <b>ON SHIFT</b> from your home screen.' : "I'm Shifty. Put me on your home screen so I work offline, run full screen, and <b>keep your progress safe</b>."}</div>
 <h1 class="px gateh">MAKE IT AN APP</h1>
 <p class="note center">Takes 30 seconds. Do this first, then play.</p>
 ${canInstall() ? '<button class="big" id="inst"><span class="px">INSTALL ON SHIFT</span><small>One tap. Then open it from your home screen.</small></button>' : ''}
 <div class="intro"><div style="font-size:11px;letter-spacing:.12em;color:var(--cy);font-weight:700">${ios ? 'ON IPHONE / IPAD' : 'ON ANDROID'}</div>
  <ol class="steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>
 <button class="next ghost" id="copy">Copy the link (to paste into ${ios ? 'Safari' : 'Chrome'})</button>
 <p class="tiny">Why: an installed app works in airplane mode, has no browser bars, and ${ios ? "Safari can't erase its saved progress" : 'keeps your progress safe'}.</p>
 <button class="linkbtn" id="skip">Play in the browser anyway (progress may be lost)</button>
</div>`;
  const inst = document.getElementById('inst');
  if (inst) inst.onclick = () => void promptInstall();
  $('#copy').onclick = async () => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); toast('Link copied. Paste it into ' + (ios ? 'Safari' : 'Chrome') + '.'); } catch { toast('Copy blocked. Long-press the address bar instead.'); }
  };
  $('#skip').onclick = () => {
    try { sessionStorage.setItem(SKIP, '1'); } catch { /* ignore */ }
    onContinue();
  };
  void esc; // (kept for future dynamic copy)
}
