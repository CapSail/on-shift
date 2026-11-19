// The CISO's wardrobe (cosmetic): hats unlocked by milestones. Shifty's pixel hats come from engine/shifty.ts.
import { HAT_NAMES, setEquipped, shiftySvg, type HatId } from '../engine/shifty';
import { S, save } from './state';
import { toast } from '../engine/ui';
import { esc } from '../engine/util';

type Hat = Exclude<HatId, ''>;
export const HATS: { id: Hat; how: string; got: () => boolean }[] = [
  { id: 'tophat', how: 'Close your first case', got: () => S.cases >= 1 },
  { id: 'beanie', how: '3 days of tenure', got: () => S.best >= 3 },
  { id: 'party', how: 'A perfect daily case', got: () => Object.values(S.daily).some((d) => d.n > 0 && d.score === d.n) },
  { id: 'sunglasses', how: 'Close 10 cases', got: () => S.cases >= 10 },
  { id: 'halo', how: 'Hold 15 concepts (box 3+)', got: () => Object.values(S.cs).filter((c) => c.box >= 3).length >= 15 },
  { id: 'crown', how: 'Score 700+ on a 50+ board exam', got: () => S.exams.some((e) => e.n >= 50 && e.score >= 700) },
];

export function checkHats(): void {
  for (const h of HATS) if (h.got() && !S.hatsSeen.includes(h.id)) {
    S.hatsSeen.push(h.id);
    setTimeout(() => toast(`🎩 Unlocked: ${HAT_NAMES[h.id]}`), 400);
  }
  save();
}

export function closetHtml(): string {
  return `<div class="closet">${[{ id: '' as HatId, how: 'Default', got: () => true }, ...HATS].map((h) => {
    const ok = h.got();
    return `<button class="item ${S.hat === h.id ? 'on' : ''} ${ok ? '' : 'locked'}" data-hat="${h.id}" ${ok ? '' : 'disabled'}>${shiftySvg({ pose: 'happy', hat: h.id }, 44)}<b>${esc(h.id ? HAT_NAMES[h.id as Hat] : 'No hat')}</b><small>${esc(ok ? (S.hat === h.id ? 'wearing' : 'tap to wear') : h.how)}</small></button>`;
  }).join('')}</div>`;
}

export function wireCloset(root: HTMLElement, after: () => void): void {
  root.querySelectorAll<HTMLButtonElement>('[data-hat]').forEach((b) => (b.onclick = () => {
    S.hat = b.dataset.hat as HatId;
    setEquipped(S.hat as HatId);
    save();
    after();
  }));
}
