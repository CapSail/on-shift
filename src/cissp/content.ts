// The generated CISSP content (validated at build time by scripts/build-content-cissp.ts) plus lookups.
import raw from '../generated/cissp.json';
import type { Case, Concept, Content, Domain, Scene } from './types';

export const C = raw as unknown as Content;
export const CONCEPTS: Concept[] = C.concepts;
export const CASES: Case[] = C.cases;
export const DOMAINS: Domain[] = C.domains;
export const SCENES: Scene[] = CASES.flatMap((k) => k.scenes);
export const conceptById = new Map(CONCEPTS.map((c) => [c.id, c]));
export const caseById = new Map(CASES.map((k) => [k.id, k]));
export const sceneById = new Map(SCENES.map((s) => [s.id, s]));
export const scenesOf = (cid: string): Scene[] => SCENES.filter((s) => s.c === cid);
export const domainOf = (n: number): Domain => DOMAINS.find((d) => d.n === n)!;
export const objOf = (s: Scene): string => conceptById.get(s.c)?.obj ?? '';
