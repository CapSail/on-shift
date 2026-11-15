// The generated content (validated at build time) plus lookups.
import raw from '../generated/ai.json';
import type { Card, Concept, Content, Domain } from './types';

export const C = raw as unknown as Content;
export const CONCEPTS: Concept[] = C.concepts;
export const CARDS: Card[] = C.cards;
export const DOMAINS: Domain[] = C.domains;
export const conceptById = new Map(CONCEPTS.map((c) => [c.id, c]));
export const cardById = new Map(CARDS.map((k) => [k.id, k]));
export const cardsOf = (cid: string): Card[] => CARDS.filter((k) => k.c === cid);
export const domainOf = (n: number): Domain => DOMAINS.find((d) => d.n === n)!;

/** Exam-format cards (the real exam has multiple choice, multiple response, ordering and matching). */
export const EXAM_KINDS = new Set(['mcq', 'multi', 'order', 'match']);
