// Which shift is on: the SOC game ('soc'), SHIFTY-1 the AI cert school ('ai'), or the Ghost CISO ('cissp'). One app.
export type ShiftId = 'soc' | 'ai' | 'cissp';
export const SHIFTS: ShiftId[] = ['soc', 'ai', 'cissp'];

const KEY = 'onshift.shift';
/** The pick made this session, so the switch and deep links still work when storage is blocked (setItem throws). */
let picked: ShiftId | null = null;
const has = (k: string): boolean => { try { return localStorage.getItem(k) !== null; } catch { return false; } };

/** The shift used last. First visit: SOC, unless this browser only has a SHIFTY-1 save (it came from the old app). */
export function getShift(): ShiftId {
  if (picked) return picked;
  let v: string | null = null;
  try { v = localStorage.getItem(KEY); } catch { /* ignore */ }
  if (v && (SHIFTS as string[]).includes(v)) return v as ShiftId;
  return has('shifty1.v1') && !has('onshift.v2') ? 'ai' : 'soc';
}

export function setShift(s: ShiftId): void {
  picked = s;
  try { localStorage.setItem(KEY, s); } catch { /* ignore */ }
}
