// Model upgrades (cosmetic): hats unlocked by milestones. Shifty's pixel hats come from shifty.ts.
import { HAT_NAMES, setEquipped, type HatId } from '../engine/shifty';
import { S, save } from './state';
import { toast } from '../engine/ui';
import { shiftySvg } from '../engine/shifty';
import { esc } from '../engine/util';

/** Same pixel hats as the SOC closet; here the crown is won from the red team. */
const NAMES = { ...HAT_NAMES, crown: 'Red team crown' };

type Hat = Exclude<HatId, ''>;
export const HATS: { id: Hat; how: string; got: () => boolean }[] = [
  { id: 'beanie', how: 'Finish your first training run', got: () => S.runs >= 1 },
  { id: 'cap', how: '3 days of uptime', got: () => S.best >= 3 },
  { id: 'party', how: 'A perfect daily eval', got: () => Object.values(S.daily).some((d) => d.n > 0 && d.score === d.n) },
  { id: 'sunglasses', how: 'Finish 10 training runs', got: () => S.runs >= 10 },
  { id: 'grad', how: 'Score 700+ on a benchmark', got: () => S.bench.some((b) => b.score >= 700) },
  { id: 'halo', how: 'Master 10 concepts (box 3+)', got: () => Object.values(S.cs).filter((c) => c.box >= 3).length >= 10 },
  { id: 'crown', how: 'Beat the red team', got: () => Object.values(S.boss).some((b) => b.won) },
];

export function checkHats(): void {
  for (const h of HATS) if (h.got() && !S.hatsSeen.includes(h.id)) {
    S.hatsSeen.push(h.id);
    setTimeout(() => toast(`🎩 Unlocked: ${NAMES[h.id]}`), 1800);
  }
  save();
}

export function closetHtml(): string {
  return `<div class="closet">${[{ id: '' as HatId, how: 'Default', got: () => true }, ...HATS].map((h) => {
    const ok = h.got();
    return `<button class="item ${S.hat === h.id ? 'on' : ''} ${ok ? '' : 'locked'}" data-hat="${h.id}" ${ok ? '' : 'disabled'}>${shiftySvg({ pose: 'happy', hat: h.id }, 44)}<b>${esc(h.id ? NAMES[h.id as Hat] : 'No hat')}</b><small>${esc(ok ? (S.hat === h.id ? 'wearing' : 'tap to wear') : h.how)}</small></button>`;
  }).join('')}</div>`;
}

export function wireCloset(root: HTMLElement, after: () => void): void {
  root.querySelectorAll<HTMLButtonElement>('[data-hat]').forEach((b) => b.onclick = () => {
    S.hat = b.dataset.hat as HatId;
    setEquipped(S.hat as HatId);
    save();
    after();
  });
}
