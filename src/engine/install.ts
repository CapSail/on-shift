// First-visit install gate: on a phone, before anything else, a full-screen "make this an app" page.
// A website cannot force an install, so this is the next best thing: it is the only thing a new visitor sees
// until they install, with exact steps for their device, and a small, honest "play in the browser anyway".
import { app, toast } from './ui';
import { $, esc } from './util';
import { shiftyHtml } from './shifty-live';
import { canInstall, isIosSafari, isRealIosSafari, isStandalone, justInstalled, promptInstall } from './pwa';

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
    ? ['Open this page in <b>Safari</b>. Only Safari can add to the Home Screen; Chrome and in-app browsers (Gmail, Messages, Slack, Instagram) cannot. Copy the link below and paste it into Safari.',
       'In Safari, tap the <b>Share</b> button (the square with an arrow). On the newer compact Safari bar it hides behind <b>⋯</b> at the bottom right: tap <b>⋯</b>, then <b>Share</b>.',
       '<b>Scroll down</b> the Share sheet and tap <b>Add to Home Screen</b>. Not there? Scroll to the very bottom, tap <b>Edit Actions</b>, and add it, or make sure you are not in a Private tab.',
       'Leave <b>Open as Web App</b> on, tap <b>Add</b>, then open <b>ON SHIFT</b> from your Home Screen. That is the app.']
    : ['Open this page in <b>Chrome</b>. Inside another app (Gmail, Slack, a chat)? Tap <b>⋮</b> at the top right, then <b>Open in Chrome</b>.',
       'In Chrome, tap the <b>⋮</b> menu at the top right.',
       'Tap <b>Install app</b> (or <b>Add to Home screen</b>), then <b>Install</b>.',
       'Open <b>ON SHIFT</b> from your home screen. That is the app.'];

  app.innerHTML = `<div class="scr gate">
 ${shiftyHtml(justInstalled() ? 'happy' : 'dead', 96, 'lg')}
 <div class="bubble">${justInstalled() ? 'Installed! Close this tab and open <b>ON SHIFT</b> from your home screen.' : "I'm Shifty. Put me on your home screen so I work offline, run full screen, and <b>keep your progress safe</b>."}</div>
 <h1 class="px gateh">MAKE IT AN APP</h1>
 <p class="note center">Takes 30 seconds. Do this first, then play.</p>
 ${ios && !isRealIosSafari() ? '<div class="intro" style="border-color:var(--yl)"><b style="color:var(--yl)">You are not in Safari.</b><p style="font-size:14px;margin:6px 0 0">This browser will not show Add to Home Screen. Tap <b>Copy the link</b> below, open <b>Safari</b>, and paste it into the address bar.</p></div>' : ''}
 ${canInstall() ? '<button class="big" id="inst"><span class="px">INSTALL ON SHIFT</span><small>One tap. Then open it from your home screen.</small></button>' : ''}
 <div class="intro"><div style="font-size:11px;letter-spacing:.12em;color:var(--cy);font-weight:700">${ios ? 'ON IPHONE / IPAD' : 'ON ANDROID'}</div>
  <ol class="steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>
  ${ios ? '<div class="tipbox"><b>No “Add to Home Screen” in the list?</b> Scroll to the very bottom of the Share sheet, tap <b>Edit Actions</b>, tap the green <b>+</b> next to <b>Add to Home Screen</b>, then <b>Done</b>. It shows up in the list from then on.</div>' : ''}</div>
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
