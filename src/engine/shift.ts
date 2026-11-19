// Which shift is on: the SOC game ('soc'), SHIFTY-1 the AI cert school ('ai'), or the Ghost CISO ('cissp'). One app.
export type ShiftId = 'soc' | 'ai' | 'cissp';
export const SHIFTS: ShiftId[] = ['soc', 'ai', 'cissp'];

const KEY = 'onshift.shift';
const has = (k: string): boolean => { try { return localStorage.getItem(k) !== null; } catch { return false; } };

/** The shift used last. First visit: SOC, unless this browser only has a SHIFTY-1 save (it came from the old app). */
export function getShift(): ShiftId {
  let v: string | null = null;
  try { v = localStorage.getItem(KEY); } catch { /* ignore */ }
  if (v && (SHIFTS as string[]).includes(v)) return v as ShiftId;
  return has('shifty1.v1') && !has('onshift.v2') ? 'ai' : 'soc';
}

export function setShift(s: ShiftId): void {
  try { localStorage.setItem(KEY, s); } catch { /* ignore */ }
}
