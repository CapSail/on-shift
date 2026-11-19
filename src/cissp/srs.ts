// Concept-level spaced repetition (the SHIFTY-1 rules). A scene's grade moves its CONCEPT; flashbacks serve a
// different scene for that concept, ideally from a different case.
import type { CState, Scene } from './types';
import { CASES, CONCEPTS, DOMAINS, scenesOf } from './content';
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
 * Move a concept's schedule: a brand-new concept always comes back tomorrow; only the FIRST right answer on a day
 * promotes; lean-wrong steps back one box; sure-wrong resets to box 0 (a lapse).
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

export function markSeen(cid: string, sceneId: string): void {
  const st = cs(cid);
  st.seen = [...st.seen.filter((x) => x !== sceneId), sceneId].slice(-12);
}

export const dueConcepts = (): string[] =>
  Object.entries(S.cs).filter(([id, s]) => s.box >= 0 && s.due <= today() && CONCEPTS.some((c) => c.id === id))
    .sort((a, b) => a[1].due - b[1].due || a[1].box - b[1].box).map(([id]) => id);

/** A scene for this concept: unseen first, never from an excluded case, least recently seen otherwise. */
export function sceneFor(cid: string, o: { notCase?: string; exclude?: string[] } = {}): Scene {
  let ss = scenesOf(cid).filter((s) => !(o.exclude ?? []).includes(s.id));
  const other = ss.filter((s) => s.case !== o.notCase);
  if (other.length) ss = other;
  if (!ss.length) ss = scenesOf(cid);
  const seen = S.cs[cid]?.seen ?? [];
  const fresh = ss.filter((s) => !seen.includes(s.id));
  if (fresh.length) return pick(fresh);
  return ss.slice().sort((a, b) => seen.indexOf(a.id) - seen.indexOf(b.id))[0];
}

/** 0..1 strength of a concept (readiness and the weak-spot list). */
export function strength(cid: string): number {
  const st = S.cs[cid];
  if (!st || st.box < 0) return 0;
  const base = [0.3, 0.45, 0.6, 0.75, 0.88, 0.95][st.box];
  const recent = S.log.filter((e) => e.c === cid).slice(-6);
  const acc = recent.length ? recent.filter((e) => e.ok).length / recent.length : 0.5;
  const overdue = Math.max(0, today() - st.due);
  return Math.max(0, Math.min(1, base * (0.6 + 0.4 * acc) - overdue * 0.01));
}

/** Readiness by domain (mean concept strength) and an estimated score on the 0-1000 scale, weighted like the exam. */
export function readiness(): { dom: number[]; score: number } {
  const dom = DOMAINS.map((d) => {
    const cc = CONCEPTS.filter((c) => c.d === d.n);
    return cc.length ? cc.reduce((s, c) => s + strength(c.id), 0) / cc.length : 0;
  });
  const total = DOMAINS.reduce((s, d, i) => s + (d.w / 100) * dom[i], 0);
  return { dom, score: Math.round(1000 * total) };
}

/** How often a miss was the engineer answer (the hands-on fix CISSP doesn't want). */
export function engineerRate(): { eng: number; misses: number } {
  const misses = S.log.filter((e) => !e.ok && (e.kind === 'first' || e.kind === 'best'));
  return { eng: misses.filter((e) => e.eng).length, misses: misses.length };
}

/** Weakest introduced concepts (for the drill). */
export function weakest(n: number): string[] {
  return shuffle(Object.keys(S.cs).filter((id) => CONCEPTS.some((c) => c.id === id)))
    .map((id) => ({ id, s: strength(id) - S.cs[id].lapses * 0.05 }))
    .sort((a, b) => a.s - b.s).slice(0, n).map((x) => x.id);
}

/** The next case to open: unfinished, from the domain furthest behind its exam weight, easiest first. */
export function nextCase(): string | null {
  const open = CASES.filter((k) => !S.done[k.id]);
  if (!open.length) return null;
  const share = (d: number) => {
    const all = CASES.filter((k) => k.d === d).length;
    const done = CASES.filter((k) => k.d === d && S.done[k.id]).length;
    const w = DOMAINS.find((x) => x.n === d)!.w;
    return all ? done / all / w : 99;
  };
  return open.slice().sort((a, b) => share(a.d) - share(b.d) || a.diff - b.diff || a.id.localeCompare(b.id))[0].id;
}
