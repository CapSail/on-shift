// The switch at the top of each home screen: SOC shift <-> SHIFTY-1 (the AI cert school).
import { getShift, setShift, type ShiftId } from './shift';
import { routes } from './ui';
import { shiftySvg } from './shifty';

const LABEL: Record<ShiftId, string> = { soc: 'SOC shift', ai: 'AI school' };
/** Shifty as he looks in each shift: the night-shift ghost, and the one in the graduation cap. */
const face = (s: ShiftId): string => shiftySvg(s === 'ai' ? { pose: 'happy', hat: 'grad' } : { pose: 'dead', hat: '' }, 22, '');

export function switchHtml(): string {
  const cur = getShift();
  return `<div class="shsw" role="group" aria-label="Which shift">${(['soc', 'ai'] as ShiftId[]).map((s) =>
    `<button data-shift="${s}" class="${s === cur ? 'on' : ''}" aria-pressed="${s === cur}"><span class="shf" aria-hidden="true">${face(s)}</span>${LABEL[s]}</button>`).join('')}</div>`;
}

/** Call after the screen's HTML is in place. Switching re-enters "home", which loads the other shift. */
export function wireSwitch(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>('[data-shift]').forEach((b) => (b.onclick = () => {
    const s = b.dataset.shift as ShiftId;
    if (s === getShift()) return;
    setShift(s);
    routes.home();
  }));
}

/** A quiet link to the other shift, for the first-run screens (which have no switch yet). */
export const otherShiftLink = (to: ShiftId, text: string): string =>
  `<p class="tiny" style="margin-top:14px"><button class="linkbtn" data-shift="${to}">${text}</button></p>`;
