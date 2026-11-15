// Shared types for content (built from YAML) and the app.

export type Domain = 'endpoint' | 'identity' | 'cloud' | 'email' | 'network' | 'linux' | 'edr' | 'macos' | 'home';
export type FollowKind = 'pivot' | 'tune' | 'contain';

export interface Followup {
  kind: FollowKind;
  ask: string;
  o: string[];
  a: number;
  why: string;
  _s?: 1; // runtime: options already shuffled
}

/** Deciding line: index into `l`, or 'h' for the host/user line. */
export type KeyRef = number | 'h';

export interface Alert {
  id: string;
  d: Domain;
  src: string;
  t: string;
  h: string;
  l: string[];
  v: 0 | 1;
  x: string;
  tell: string;
  c: string;
  k: KeyRef[];
  diff: 1 | 2 | 3;
  say: string;
  trap?: 'scary' | 'bland';
  q?: Followup;
  pair?: string;
  /** 'afterhours' = the non-work deck (personal-life cases); omitted = the work deck */
  deck?: 'afterhours';
  /** content drop this alert shipped in (set by the build from content/meta.yaml; default 1) */
  drop?: number;
}

/** An alert as it sits in a running queue. */
export interface QueueAlert extends Alert {
  review?: boolean;
  retry?: boolean;
  twin?: boolean;
  _q?: Followup;
}

export interface Containment {
  at: number;
  ask: string;
  o: string[];
  a: number;
  why: string;
  _s?: 1;
}

export interface Incident {
  id: string;
  g: string; // crew id
  title: string;
  diff: number;
  intro: string;
  win: string;
  lose: string;
  contain?: Containment;
  a: Alert[];
}

export interface Crew {
  id: string;
  n: string;
  a: string[]; // aliases
  b: string; // blurb
  t: string[]; // technique ids
  r: 0 | 1 | 2 | 3; // rarity
  u: string; // ATT&CK url
}

export interface Concept {
  rule: string;
  tac: string;
  d: string;
}

export interface Content {
  alerts: Alert[];
  inc: Incident[];
  crews: Crew[];
  tech: Record<string, [string, string]>; // id -> [name, tactics]
  concepts: Record<string, Concept>;
  tutorial: string[];
  meta: { attack: string; contentVersion: number; dailyPoolDrop: number };
}

// ---- save data (localStorage) ----

export interface ConceptState {
  b: number; // box
  d: number; // due day
  lapses: number;
  n: number;
  last?: number;
  item?: string;
}

export interface LogEvent {
  day: number;
  id?: string;
  c?: string;
  v?: 0 | 1;
  call?: boolean;
  conf?: number;
  ok: boolean;
  eye?: boolean | null;
  mode?: string;
  rv?: boolean;
  gap?: number;
  d?: string;
  x?: string;
  diff?: number;
  q?: 1;
}

export interface DailyResult {
  score: number;
  n: number;
  grid: string;
}

export interface BossState {
  won?: boolean;
  day?: number;
}

export interface SaveData {
  /** save format version, so a later release can migrate saves instead of resetting them */
  ver: number;
  name: string;
  hat: string;
  puz: { twin: number; name: number; speed: number };
  hatsSeen: string[];
  best: number;
  wk: { id: number; xp: number };
  lb: { joined: boolean; dailySent: number[] };
  xp: number;
  streak: number;
  lastPlay: number | null;
  freeze: number;
  cs: Record<string, ConceptState>;
  seen: Record<string, number>;
  log: LogEvent[];
  dex: Record<string, { via: string; d: number }>;
  intel: Record<string, number>;
  inc: Record<string, { won: boolean }>;
  boss: Record<string, BossState>;
  daily: Record<number, DailyResult>;
  onb: boolean;
  sound: boolean;
  rolling: Record<number, number[]>;
  shifts: number;
  dayGoal: Record<number, number>;
}
