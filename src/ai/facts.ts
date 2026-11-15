// Generated cards from the fact bank: endless, always-accurate variations built from validated term/definition facts.
// Every group's facts are the same kind of thing and mutually confusable (the validator checks size and uniqueness),
// so a distractor or a swapped definition is always plausible and always wrong.
import type { Card, Fact } from './types';
import { C } from './content';
import { pick, rnd, shuffle } from '../engine/util';

export const FACTS: Fact[] = C.facts ?? [];
const byGroup = new Map<string, Fact[]>();
for (const f of FACTS) { const k = `${f.d}:${f.g}`; if (!byGroup.has(k)) byGroup.set(k, []); byGroup.get(k)!.push(f); }
const groupOf = (f: Fact) => byGroup.get(`${f.d}:${f.g}`)!;
export const factsOf = (cid: string) => FACTS.filter((f) => f.c === cid);
export const isGen = (id: string) => id.startsWith('g:');

const why = (f: Fact) => `${f.term}: ${f.def}.`.replace(/\.\.$/, '.');

export type GenKind = 'def' | 'term' | 'tf' | 'match';

export function genCard(f: Fact, kind: GenKind = pick(['def', 'term', 'tf', 'tf', 'match'] as GenKind[])): Card {
  const g = groupOf(f);
  const others = shuffle(g.filter((x) => x.id !== f.id));
  const base = { c: f.c, d: f.d, diff: 1 as const, why: why(f) };
  const short = (x: Fact) => x.def.split(/\s+/).length <= 9;
  const shortOthers = others.filter(short);
  // match-4 only with short definitions, so the whole card fits on a phone screen
  if (kind === 'match' && short(f) && shortOthers.length >= 3) {
    const set = shuffle([f, ...shortOthers.slice(0, 3)]);
    return { ...base, id: `g:${f.id}:m`, kind: 'match', q: 'Match each one to what it is.', pairs: set.map((x) => [x.term, x.def] as [string, string]), why: set.map(why).join(' ') };
  }
  if (kind === 'tf') {
    const real = rnd() < 0.5;
    const shown = real ? f : others[0];
    return { ...base, id: `g:${f.id}:t${real ? 1 : 0}`, kind: 'tf', s: `${f.term}: ${shown.def.replace(/\.$/, '')}.`, v: real, why: real ? why(f) : `That describes ${shown.term}. ${why(f)}` };
  }
  const opts = shuffle([f, ...others.slice(0, 3)]);
  if (kind === 'term') return { ...base, id: `g:${f.id}:n`, kind: 'mcq', q: `Which one is this? “${f.def.replace(/\.$/, '')}”`, o: opts.map((x) => x.term), a: opts.indexOf(f) };
  return { ...base, id: `g:${f.id}:d`, kind: 'mcq', q: `What is ${f.term}?`, o: opts.map((x) => x.def), a: opts.indexOf(f) };
}

/** A generated card for this concept, or null if it has no facts. */
export function genFor(cid: string): Card | null {
  const fs = factsOf(cid);
  return fs.length ? genCard(pick(fs)) : null;
}

/** For the speed round: quick kinds only, from introduced concepts first. */
export function speedDeck(n: number, prefer: Set<string>): Card[] {
  const pool = FACTS.filter((f) => prefer.has(f.c));
  const src = pool.length >= 12 ? pool : FACTS;
  return Array.from({ length: n }, () => genCard(pick(src), pick(['def', 'term', 'tf'] as GenKind[])));
}
