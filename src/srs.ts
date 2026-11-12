// Spaced repetition, per concept (not per card): a miss comes back as a DIFFERENT alert teaching the same rule.
import type { Alert } from './types';
import { afterConcepts, conceptAlerts } from './content';
import { S, save } from './state';
import { today } from './time';

/** Days until the next callback for each Leitner box. */
export const GAPS = [1, 3, 7, 16, 35, 90];

const cid = (a: Alert) => a.c || a.id;

/** grade 3 = sure+right+sharp eye, 2 = lean+right, 1 = lucky or lean+wrong, 0 = sure+wrong */
export function gradeConcept(a: Alert, g: number): void {
  const c = cid(a);
  let r = S.cs[c];
  const isNew = !r;
  r = r || { b: 0, d: 0, lapses: 0, n: 0 };
  if (isNew) r.b = g >= 3 ? 2 : g === 2 ? 1 : 0;
  else if (g >= 2) r.b = Math.min(r.b + 1, GAPS.length - 1);
  else { r.b = 0; r.lapses++; }
  r.d = today() + GAPS[r.b];
  r.n++;
  r.last = today();
  r.item = a.id;
  S.cs[c] = r;
  S.seen[a.id] = (S.seen[a.id] || 0) + 1;
  save();
}

/** Concepts due for a callback, most overdue first. */
export const dueConcepts = (after = false): string[] =>
  Object.keys(S.cs).filter((c) => S.cs[c].d <= today() && conceptAlerts[c] && afterConcepts.has(c) === after).sort((x, y) => S.cs[x].d - S.cs[y].d);

export const missedDue = (): number => dueConcepts().filter((c) => S.cs[c].b === 0).length;

/** A different alert for the concept: the least-seen one that isn't the last one served. */
export function variantFor(c: string): Alert {
  const pool = conceptAlerts[c] || [];
  const last = S.cs[c]?.item;
  const others = pool.filter((a) => a.id !== last);
  return (others.length ? others : pool).slice().sort((x, y) => (S.seen[x.id] || 0) - (S.seen[y.id] || 0))[0];
}

/** Difficulty tier (1-3) fresh alerts are drawn near, from a rolling window of recent results. */
export function rollingTier(): number {
  for (const d of [3, 2]) {
    const r = S.rolling[d] || [];
    if (r.length >= 6 && r.filter(Boolean).length / r.length >= 0.7) return d;
  }
  const r1 = S.rolling[1] || [];
  if (r1.length >= 4 && r1.filter(Boolean).length / r1.length >= 0.7) return 2;
  return 1;
}

export function pushRolling(a: Alert, ok: boolean): void {
  const d = a.diff || 2;
  const r = (S.rolling[d] = S.rolling[d] || []);
  r.push(ok ? 1 : 0);
  if (r.length > 30) r.shift();
}

export const everSeen = (a: Alert): boolean => !!S.cs[cid(a)];
export const lastSeen = (a: Alert): number => S.cs[cid(a)]?.last || 0;
