// Shifty's closet: cosmetic rewards. Hats and shades unlock from things you do (no grind, no penalties).
import { S, save } from './state';
import { HAT_NAMES, setEquipped, shiftySvg, type HatId } from './shifty';
import { mountShifty, shiftyHtml, shiftyReact } from './shifty-live';
import { app, toast } from './ui';
import { $, $$ } from './util';

type Item = Exclude<HatId, ''>;

const UNLOCKS: Record<Item, { need: string; ok: () => boolean }> = {
  beanie: { need: 'Finish a round', ok: () => S.shifts >= 1 },
  cap: { need: 'Make 50 calls', ok: () => S.log.filter((e) => e.id).length >= 50 },
  sunglasses: { need: 'Reach a 3-day streak', ok: () => S.best >= 3 || S.streak >= 3 },
  party: { need: 'Capture 5 crews', ok: () => Object.keys(S.dex).length >= 5 },
  halo: { need: 'Reach 900 XP', ok: () => S.xp >= 900 },
  crown: { need: 'Beat a weekly boss', ok: () => Object.values(S.boss).some((b) => b.won) },
};
const ORDER = Object.keys(UNLOCKS) as Item[];

/** Once unlocked, always yours (XP can drop, so a hat you already saw never re-locks). */
export const owned = (): Item[] => ORDER.filter((h) => S.hatsSeen.includes(h) || UNLOCKS[h].ok());

/** Toast the first newly unlocked item (once). Call when the home screen shows. */
export function announceUnlocks(): void {
  const fresh = owned().filter((h) => !S.hatsSeen.includes(h));
  if (!fresh.length) return;
  S.hatsSeen.push(...fresh);
  save();
  setTimeout(() => toast(`🎩 New for Shifty: ${HAT_NAMES[fresh[0]]}${fresh.length > 1 ? ` (+${fresh.length - 1} more)` : ''}`), 900);
}

export function closet(): void {
  const mine = owned();
  app.innerHTML = `<div class="scr center"><div class="bar"><button class="x" id="q" aria-label="Back">✕</button><b style="font-size:18px">Shifty's closet</b></div>
 <div class="sk">${shiftyHtml('happy', 112, 'lg')}<p class="note">${S.hat ? 'Wearing: ' + HAT_NAMES[S.hat as Item] : 'Wearing: just the headset'}. Poke him.</p></div>
 <div class="closet">
  <button class="item${S.hat ? '' : ' on'}" data-h="">${shiftySvg({ pose: 'dead', hat: '' }, 52)}<b>Headset only</b></button>
  ${ORDER.map((h) => {
    const ok = mine.includes(h);
    return `<button class="item${S.hat === h ? ' on' : ''}${ok ? '' : ' locked'}" data-h="${h}" ${ok ? '' : 'aria-disabled="true"'}>${shiftySvg({ pose: ok ? 'happy' : 'dead', hat: h }, 52)}<b>${HAT_NAMES[h]}</b><small>${ok ? (S.hat === h ? 'wearing' : 'tap to wear') : '🔒 ' + UNLOCKS[h].need}</small></button>`;
  }).join('')}
 </div></div>`;
  $('#q').onclick = () => history.back();
  $$('.item').forEach((b) => (b.onclick = () => {
    const h = b.dataset.h as HatId;
    if (h && !mine.includes(h as Item)) { toast('🔒 ' + UNLOCKS[h as Item].need); return; }
    S.hat = h;
    setEquipped(h);
    save();
    closet();
    const live = document.querySelector<HTMLElement>('.sk .shifty-live');
    if (live) { mountShifty(live); shiftyReact('cheer', 1500, live); }
  }));
}
