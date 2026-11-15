// Content and save-data shapes. Content comes from content/*.yaml via scripts/build-content.ts.

export type Kind = 'mcq' | 'multi' | 'hallu' | 'tf' | 'order' | 'match' | 'duel';

export interface Concept {
  id: string;
  task: string;          // '3.1'
  d: number;             // domain 1-5 (from the file)
  name: string;
  rule: string;
  learn: string[];
  soc: string;
  say: string;
}

export interface Card {
  id: string;
  c: string;
  kind: Kind;
  diff: 1 | 2 | 3;
  pre?: boolean;
  why: string;
  d: number;             // domain (from the file)
  q?: string;
  o?: string[];
  a?: number | number[];
  s?: string | string[];
  bad?: number;
  v?: boolean;
  steps?: string[];
  pairs?: [string, string][];
  A?: string;
  B?: string;
}

/** A term ↔ definition fact. Facts in one group are mutually confusable; the app generates cards from them. */
export interface Fact { id: string; c: string; g: string; term: string; def: string; d: number }

export interface Domain { n: number; name: string; short: string; w: number; color: string }

export interface Content {
  version: string;
  exam: { code: string; name: string; guide: string; url: string; prep: string };
  domains: Domain[];
  concepts: Concept[];
  cards: Card[];
  facts: Fact[];
}

/** Per-concept spaced repetition state. */
export interface CState {
  box: number;           // index into GAPS; -1 = introduced, not yet graded
  due: number;           // day number
  lapses: number;
  last: number;          // day last seen
  seen: string[];        // card ids served, most recent last
  n: number;             // graded answers
  ok: number;            // correct answers
}

export interface LogEvent {
  id: string;            // card id
  c: string;
  d: number;
  kind: Kind;
  ok: boolean;
  sure: boolean;
  forced?: boolean;      // sure was forced (temperature 1.0 / red team): excluded from calibration
  day: number;
  mode: string;
  gap?: number;          // days since the concept was last seen (retention)
}

export interface SaveData {
  ver: number;
  name: string;
  hat: string;
  xp: number;
  wk: { id: number; xp: number };
  streak: number;
  best: number;
  lastPlay: number | null;
  freeze: number;
  cs: Record<string, CState>;
  log: LogEvent[];
  daily: Record<number, { score: number; n: number; grid: string }>;
  boss: Record<number, { won: boolean; tries: number; lastTry: number }>;
  bench: { day: number; score: number; dom: number[] }[];
  examDay: number | null;
  temp: 0 | 1;           // 0 = 0.2 (careful), 1 = 1.0 (spicy)
  onb: boolean;
  sound: boolean;
  voice: boolean;
  runs: number;
  hatsSeen: string[];
  shLine: number;
  puzBest?: number;
}
