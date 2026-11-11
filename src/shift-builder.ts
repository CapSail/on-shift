// Builds the queues: the personal shift (SRS callbacks + fresh alerts) and the shared daily shift.
import type { Alert, QueueAlert } from './types';
import { ALERTS, POOL } from './content';
import { dueConcepts, everSeen, lastSeen, rollingTier, variantFor } from './srs';
import { mulberry, resetRng, rnd, setRng, shuffle } from './util';
import { today } from './time';

const cid = (a: Alert) => a.c || a.id;

export interface ShiftOpts { fresh?: boolean; tp?: number }

/**
 * Up to 5 due concepts (most overdue first), then fresh alerts near the player's rolling difficulty tier.
 * 2-6 true positives (randomised). One `scary` benign and one `bland` malicious when available.
 * No concept twice. Domains interleaved.
 */
export function buildShift(n = 10, opts: ShiftOpts = {}): QueueAlert[] {
  const used = new Set<string>();
  const out: QueueAlert[] = [];
  if (!opts.fresh) {
    for (const c of dueConcepts().slice(0, 5)) {
      const a = variantFor(c);
      if (a && !used.has(a.id)) { used.add(a.id); out.push({ ...a, review: true }); }
    }
  }
  const tier = rollingTier();
  let fresh = ALERTS.filter((a) => !used.has(a.id) && !everSeen(a));
  if (fresh.length < n) {
    fresh = fresh.concat(
      ALERTS.filter((a) => !used.has(a.id) && everSeen(a) && !fresh.includes(a)).sort((x, y) => lastSeen(x) - lastSeen(y)).slice(0, 30),
    );
  }
  const wantTP = opts.tp ?? 2 + Math.floor(rnd() * 5);
  const score = (a: Alert) => {
    const d = a.diff || 2;
    let s = -Math.abs(d - tier) * 2 + rnd() * 2;
    if (d === tier + 1 && rnd() < 0.34) s += 1.5;
    return s;
  };
  const pool = shuffle(fresh).sort((x, y) => score(y) - score(x));
  let tp = out.filter((a) => a.v).length;
  for (const a of pool) {
    if (out.length >= n) break;
    if (used.has(a.id)) continue;
    if (a.v && tp >= wantTP) continue;
    if (!a.v && out.length - tp >= n - wantTP) continue;
    if (out.some((b) => cid(b) === cid(a))) continue;
    used.add(a.id);
    out.push({ ...a });
    if (a.v) tp++;
  }
  for (const a of pool) {
    if (out.length >= n) break;
    if (!used.has(a.id) && !out.some((b) => cid(b) === cid(a))) { used.add(a.id); out.push({ ...a }); }
  }
  // guarantee one scary-benign and one bland-malicious if the bank has them
  for (const [want, v] of [['scary', 0], ['bland', 1]] as const) {
    if (!out.some((a) => a.trap === want)) {
      const cand = pool.find((a) => a.trap === want && !used.has(a.id));
      if (cand) {
        const i = out.findIndex((a) => !a.review && a.v === v && !a.trap);
        if (i >= 0) { out[i] = { ...cand }; used.add(cand.id); }
      }
    }
  }
  // order: interleave, no same domain back to back when avoidable
  const rest = shuffle(out);
  const ord: QueueAlert[] = [];
  while (rest.length) {
    let i = rest.findIndex((a) => !ord.length || a.d !== ord[ord.length - 1].d);
    if (i < 0) i = 0;
    ord.push(rest.splice(i, 1)[0]);
  }
  return ord;
}

/** The daily: 10 alerts seeded from the bank for everyone (ignores personal SRS). */
export function buildDaily(): QueueAlert[] {
  setRng(mulberry(today() * 7919));
  const pool = shuffle(POOL);
  const tp = 2 + Math.floor(rnd() * 5);
  const out: QueueAlert[] = [];
  let ntp = 0;
  for (const a of pool) {
    if (out.length >= 10) break;
    if (a.v && ntp >= tp) continue;
    if (!a.v && out.length - ntp >= 10 - tp) continue;
    if (out.some((b) => cid(b) === cid(a))) continue;
    out.push({ ...a });
    if (a.v) ntp++;
  }
  resetRng();
  return out;
}
