// The shell: one app, two shifts. It decides which shift is on, shows the install gate, and loads that shift's code.
//   soc = the SOC alert-triage game        ai = SHIFTY-1, the AI cert school
// Each shift is its own lazy chunk (a SOC friend never parses the AI card bank); the service worker precaches both.
import './engine/style.css';
import { app, initNavigation, routes, toast } from './engine/ui';
import { initPwa, requestPersist } from './engine/pwa';
import { initShifty } from './engine/shifty-live';
import { installGate, needsInstallGate } from './engine/install';
import { getShift, setShift, type ShiftId } from './engine/shift';

interface Pack {
  /** make this shift the live one: its save drives sound and Shifty's hat, its runner is "start a round" */
  activate(): void;
  home(): void;
}

const loaders: Record<ShiftId, () => Promise<Pack>> = { soc: () => import('./soc/index'), ai: () => import('./ai/index') };
const loaded: Partial<Record<ShiftId, Promise<Pack>>> = {};
/** A failed load (offline before the first full visit, a stale chunk) is not remembered, so the next try can work. */
const pack = (s: ShiftId): Promise<Pack> => (loaded[s] ??= loaders[s]().catch((e) => { delete loaded[s]; throw e; }));
let active: ShiftId | null = null;

// Deep links. #shifty-1 (where the old SHIFTY-1 link forwards to) and #soc pick a shift, then leave the address clean.
const pickFromHash = (): void => {
  const want: ShiftId | null = /^#shifty-?1$/i.test(location.hash) ? 'ai' : location.hash === '#soc' ? 'soc' : null;
  if (!want) return;
  setShift(want);
  try { history.replaceState(history.state, '', location.pathname + location.search); } catch { /* ignore */ }
};

/** Where every "go home" lands: the install gate for phone visitors who have not installed yet, else the shift's home.
 *  #card=<id> opens one SHIFTY-1 card on its own (QA, and "look at card d3-014" links); it changes no progress. */
function entry(): void {
  pickFromHash();
  const card = /^#card=(.+)$/.exec(location.hash);
  const s: ShiftId = card ? 'ai' : getShift();
  void pack(s).then(async (p) => {
    if (!card && s !== getShift()) return; // the player flipped the switch again while this shift was loading
    const switched = active !== null && active !== s;
    if (active !== s) { p.activate(); active = s; }
    document.body.dataset.shift = s; // a few styles differ per shift (style.css)
    if (card) return (await import('./ai/preview')).previewCard(decodeURIComponent(card[1]));
    if (needsInstallGate()) installGate(p.home); else p.home();
    if (switched) app.scrollTop = 0; // a different home: start at its top
  }).catch(() => toast('Could not load that. Check your connection and try again.'));
}

routes.home = entry;
// a deep link followed inside the app (e.g. ✕ on a card preview) only changes the hash: act on it without a reload
addEventListener('hashchange', () => { if (/^#(shifty-?1|soc|card=.+)$/i.test(location.hash)) entry(); });
initShifty();
initNavigation();
initPwa();
requestPersist();
entry();
