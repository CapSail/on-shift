// Content and save-data shapes for the CISSP shift ("Ghost CISO").
// Content comes from content/cissp/*.yaml via scripts/build-content-cissp.ts (see docs/cissp/DESIGN.md).

export type SceneKind = 'first' | 'best' | 'rank' | 'sort' | 'spot' | 'calc';

export interface Concept {
  id: string;
  obj: string;            // 2027 outline objective, e.g. '3.6'
  d: number;              // domain 1-8 (from the file)
  name: string;
  rule: string;           // the takeaway, ≤ 15 words
  learn: string[];        // exactly 3 bullets
  ghost?: string;         // Shifty's manager-mindset angle, ≤ 30 words
  src: string;            // the authority this rests on
}

/** A diagram for `spot` scenes: boxes on a 100 x 100 grid, optionally joined by lines. */
export interface MapNode { id: string; label: string; x: number; y: number; w?: number; h?: number; zone?: boolean }
export interface SceneMap { nodes: MapNode[]; links?: [string, string][]; caption?: string }

export interface Scene {
  id: string;             // global: <case id>.<n>, e.g. k3-02.4 (set by the build)
  c: string;              // concept id
  kind: SceneKind;
  text: string;           // the situation; must make sense on its own (flashbacks and the board exam serve it alone)
  ask: string;            // the question
  why: string;            // the explanation (≤ 45 words)
  src: string;            // the authority the answer rests on
  diff: 1 | 2 | 3;
  // first / best / calc
  o?: string[];           // exactly 4 options
  a?: number | string;    // index of the right option (first/best/calc) or node id (spot)
  r?: string[];           // first/best/calc: what happens in the story for each option
  rr?: [string, string];  // rank/sort/spot: what happens in the story if right, if wrong
  trap?: number;          // the "engineer answer" option, if one is there
  // rank: items in the CORRECT order (shuffled at runtime)
  items?: string[];
  // sort: bins and [text, bin index] pairs
  bins?: string[];
  pairs?: [string, number][];
  // spot
  map?: SceneMap;
  d: number;              // domain (from the case)
  case: string;           // case id
}

export interface Case {
  id: string;             // k<domain>-NN
  d: number;
  title: string;
  where: string;          // place and time, shown as a dateline
  open: string;           // how the case starts (story)
  close: string;          // how it ends (story)
  diff: 1 | 2 | 3;
  scenes: Scene[];
}

export interface Domain { n: number; name: string; short: string; w: number; color: string }

export interface Content {
  version: string;
  exam: { code: string; name: string; outline: string; url: string; refs: string; items: string; hours: number; pass: number };
  domains: Domain[];
  objectives: Record<string, string>;
  concepts: Concept[];
  cases: Case[];
}

// ---- save data (localStorage key cissp.v1) ----

/** Per-concept spaced repetition state (the SHIFTY-1 rules). */
export interface CState {
  box: number;            // index into GAPS; -1 = introduced, not yet graded
  due: number;            // day number
  lapses: number;
  last: number;           // day last seen
  seen: string[];         // scene ids served, most recent last
  n: number;              // graded answers
  ok: number;             // correct answers
}

export interface LogEvent {
  id: string;             // scene id
  c: string;
  d: number;
  kind: SceneKind;
  ok: boolean;
  sure: boolean;
  eng?: boolean;          // picked the engineer answer
  day: number;
  mode: string;           // case | flash | daily | exam | drill
  gap?: number;
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
  done: Record<string, { grade: string; day: number }>;   // cases closed, by case id
  daily: Record<number, { score: number; n: number; grid: string }>;
  exams: { day: number; score: number; n: number; dom: number[] }[];
  examDay: number | null;
  onb: boolean;
  sound: boolean;
  hatsSeen: string[];
  cases: number;          // cases finished
}
