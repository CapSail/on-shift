// Installable, offline, self-updating. Registers the service worker, shows "update available",
// exposes the install prompt, and asks the browser not to evict our storage.
import { routes } from './ui';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
let installedNow = false;
export const justInstalled = (): boolean => installedNow;

export const isStandalone = (): boolean =>
  matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export const isIosSafari = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** On an iPhone/iPad: is this real Safari? Chrome, Firefox, Edge and in-app browsers (Gmail, Instagram, Messages previews) do not offer Add to Home Screen reliably. */
export const isRealIosSafari = (): boolean => {
  const ua = navigator.userAgent;
  return /safari\//i.test(ua) && /version\//i.test(ua) && !/crios|fxios|edgios|opios|gsa\/|fban|fbav|instagram|line\/|twitter|linkedin|snapchat|musical_ly/i.test(ua);
};

/** True when Chrome/Edge offered an install prompt we can trigger from a button. */
export const canInstall = (): boolean => deferred !== null && !isStandalone();

export async function promptInstall(): Promise<void> {
  if (!deferred) return;
  const d = deferred;
  deferred = null;
  await d.prompt();
  const choice = await d.userChoice.catch(() => undefined);
  if (choice?.outcome === 'accepted') installedNow = true;
  routes.home();
}

/** Ask for durable storage: progress lives in localStorage and Safari may wipe it for sites it thinks are unused. */
export function requestPersist(): void {
  try { void navigator.storage?.persist?.(); } catch { /* not supported */ }
}

function showUpdate(reg: ServiceWorkerRegistration): void {
  if (document.getElementById('upd')) return;
  const bar = document.createElement('div');
  bar.id = 'upd';
  bar.className = 'upd';
  bar.setAttribute('role', 'status');
  bar.innerHTML = '<span>New version ready.</span><button type="button">Tap to reload</button>';
  (bar.querySelector('button') as HTMLButtonElement).onclick = () => {
    wantReload = true;
    reg.waiting?.postMessage('SKIP_WAITING');
    setTimeout(() => location.reload(), 1500); // safety net if controllerchange never fires
  };
  document.body.appendChild(bar);
}

let wantReload = false;

export function initPwa(): void {
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    if (document.querySelector('.rank, .gate')) routes.home(); // the home or install screen is showing: add the install button
  });
  addEventListener('appinstalled', () => { deferred = null; installedNow = true; if (document.querySelector('.gate')) routes.home(); });

  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const check = () => { if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg); };
    check();
    reg.addEventListener('updatefound', () => reg.installing?.addEventListener('statechange', check));
    const poll = () => { reg.update().catch(() => undefined); };
    setInterval(poll, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  }).catch(() => undefined);
  // only reload because the player tapped the toast (the first-ever install also fires controllerchange)
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (wantReload) location.reload(); });
}
