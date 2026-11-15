// Concept-level spaced repetition. A card's grade moves its CONCEPT; reviews serve a different card for that concept.
import type { Card, CState } from './types';
import { CONCEPTS, DOMAINS, cardsOf } from './content';
import { S } from './state';
import { today } from './time';
import { pick, shuffle } from '../engine/util';

export const GAPS = [1, 3, 7, 16, 35, 90];

/** 3 = sure + right, 2 = lean + right, 1 = lean + wrong, 0 = sure + wrong. */
export const gradeOf = (ok: boolean, sure: boolean): number => (ok ? (sure ? 3 : 2) : sure ? 0 : 1);

export function cs(cid: string): CState {
  return (S.cs[cid] ??= { box: -1, due: today(), lapses: 0, last: today(), seen: [], n: 0, ok: 0 });
}

export const introduced = (cid: string): boolean => !!S.cs[cid];

/**
 * Move a concept's schedule. Rules (from the learning review):
 *  - a brand-new concept always comes back tomorrow, however well the first day went;
 *  - only the FIRST right answer on a day promotes (more practice the same day is massed, not spaced);
 *  - a wrong answer always counts: lean-wrong steps back one box, sure-wrong resets to box 0 (a lapse).
 */
export function grade(cid: string, g: number): { gap: number } {
  const st = cs(cid), t = today();
  const gap = t - st.last;
  const sameDay = st.n > 0 && st.last === t;
  st.n++;
  if (g >= 2) st.ok++;
  if (st.box < 0) st.box = 0;
  else if (g >= 2) { if (!sameDay && st.due <= t) st.box = Math.min(st.box + 1, GAPS.length - 1); }
  else if (g === 1) st.box = Math.max(0, st.box - 1);
  else { st.box = 0; st.lapses++; }
  st.due = Math.max(st.due > t && g >= 2 ? st.due : 0, t + GAPS[st.box]);
  st.last = t;
  return { gap };
}

export function markSeen(cid: string, cardId: string): void {
  const st = cs(cid);
  st.seen = [...st.seen.filter((x) => x !== cardId), cardId].slice(-12);
}

export const dueConcepts = (): string[] =>
  Object.entries(S.cs).filter(([id, s]) => s.box >= 0 && s.due <= today() && CONCEPTS.some((c) => c.id === id))
    .sort((a, b) => a[1].due - b[1].due || a[1].box - b[1].box).map(([id]) => id);

/** A card for this concept the player has seen least recently (never the last one), optionally excluding kinds. */
export function cardFor(cid: string, opts: { exclude?: string[]; kinds?: string[] } = {}): Card {
  let ks = cardsOf(cid).filter((k) => !(opts.exclude ?? []).includes(k.id));
  if (opts.kinds) { const f = ks.filter((k) => opts.kinds!.includes(k.kind)); if (f.length) ks = f; }
  if (!ks.length) ks = cardsOf(cid);
  const seen = S.cs[cid]?.seen ?? [];
  const fresh = ks.filter((k) => !seen.includes(k.id));
  if (fresh.length) return pick(fresh);
  return ks.slice().sort((a, b) => seen.indexOf(a.id) - seen.indexOf(b.id))[0];
}

/** 0..1 strength of a concept (what the model card and readiness use). */
export function strength(cid: string): number {
  const st = S.cs[cid];
  if (!st || st.box < 0) return 0;
  const base = [0.3, 0.45, 0.6, 0.75, 0.88, 0.95][st.box];
  const recent = S.log.filter((e) => e.c === cid && e.mode !== 'pre' && e.mode !== 'speed').slice(-6);
  const acc = recent.length ? recent.filter((e) => e.ok).length / recent.length : 0.5;
  const overdue = Math.max(0, today() - st.due);
  return Math.max(0, Math.min(1, base * (0.6 + 0.4 * acc) - overdue * 0.01));
}

export function readiness(): { dom: number[]; score: number } {
  const dom = DOMAINS.map((d) => {
    const cc = CONCEPTS.filter((c) => c.d === d.n);
    return cc.length ? cc.reduce((s, c) => s + strength(c.id), 0) / cc.length : 0;
  });
  const total = DOMAINS.reduce((s, d, i) => s + (d.w / 100) * dom[i], 0);
  return { dom, score: Math.round(100 + 900 * total) };
}

/** New concepts in study order: the domain furthest behind its exam weight first, then task order within a domain. */
export function nextNewConcepts(n: number): string[] {
  const out: string[] = [];
  const intro = new Set(Object.keys(S.cs));
  for (let i = 0; i < n; i++) {
    const cand = DOMAINS.map((d) => {
      const cc = CONCEPTS.filter((c) => c.d === d.n);
      const left = cc.filter((c) => !intro.has(c.id) && !out.includes(c.id));
      const done = cc.length - left.length;
      return { d, left, ratio: cc.length ? done / cc.length / (d.w / 100) : 99 };
    }).filter((x) => x.left.length).sort((a, b) => a.ratio - b.ratio);
    if (!cand.length) break;
    const c = cand[0].left.slice().sort((a, b) => a.task.localeCompare(b.task))[0];
    out.push(c.id);
  }
  return out;
}

export const newLeft = (): number => CONCEPTS.filter((c) => !S.cs[c.id]).length;

/** Weakest introduced concepts (for "drill my weak spots"). */
export function weakest(n: number): string[] {
  return shuffle(Object.keys(S.cs).filter((id) => CONCEPTS.some((c) => c.id === id)))
    .map((id) => ({ id, s: strength(id) - (S.cs[id].lapses * 0.05) }))
    .sort((a, b) => a.s - b.s).slice(0, n).map((x) => x.id);
}
