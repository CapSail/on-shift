// The CISSP shift's save: one object in localStorage (key cissp.v1). No UI imports here.
import type { SaveData } from './types';
import { createStore, type Rank } from '../engine/store';
import { today } from './time';

export const KEY = 'cissp.v1';
export const SAVE_VERSION = 1;

/** The ghost CISO's standing with the board. [xp needed, title, flavour] */
export const RANKS: Rank[] = [
  [0, 'Acting CISO (Deceased)', 'the board is nervous'],
  [150, 'Policy Poltergeist', 'haunts the handbook'],
  [450, 'Risk Wraith', 'speaks fluent ALE'],
  [900, 'Compliance Specter', 'auditors feel a cold spot'],
  [1600, 'Governance Ghoul', 'sustains it, too'],
  [2600, 'Boardroom Phantom', 'has a seat at the table'],
  [4000, 'Continuity Revenant', 'always comes back'],
  [6000, 'Zero Trust Shade', 'trusts no one, least of all Dale'],
  [8500, 'Chief Haunting Officer', 'the board asks him first'],
  [12000, 'Certified Specter', 'Dale wants it framed'],
];

const DEFAULTS: SaveData = {
  ver: SAVE_VERSION, name: '', hat: '', xp: 0, wk: { id: 0, xp: 0 }, streak: 0, best: 0, lastPlay: null, freeze: 0,
  cs: {}, log: [], done: {}, daily: {}, exams: [], examDay: null, onb: false, sound: true, hatsSeen: [], cases: 0,
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** A damaged save (half-written, hand-edited, nulls) must never white-screen the shift: reset only the broken parts. */
function fix(s: SaveData): void {
  const t = today();
  if (!isObj(s.cs)) s.cs = {};
  if (!isObj(s.done)) s.done = {};
  if (!isObj(s.daily)) s.daily = {};
  if (!Array.isArray(s.log)) s.log = [];
  if (!Array.isArray(s.exams)) s.exams = [];
  if (!Array.isArray(s.hatsSeen)) s.hatsSeen = [];
  s.xp = Math.max(0, num(s.xp, 0));
  s.streak = num(s.streak, 0); s.best = num(s.best, 0); s.freeze = num(s.freeze, 0); s.cases = num(s.cases, 0);
  s.wk = { id: num(s.wk.id, 0), xp: num(s.wk.xp, 0) };
  if (s.lastPlay !== null && !Number.isFinite(s.lastPlay)) s.lastPlay = null;
  // a day number a Date can still show (|day| ≤ 1e8), else no exam date
  if (s.examDay !== null && !(Number.isFinite(s.examDay) && Math.abs(s.examDay) <= 1e8)) s.examDay = null;
  if (typeof s.hat !== 'string') s.hat = '';
  for (const [id, c] of Object.entries(s.cs)) {
    if (!isObj(c)) { delete s.cs[id]; continue; }
    c.box = Math.max(-1, Math.min(5, Math.floor(num(c.box, -1))));
    c.due = num(c.due, t); c.last = num(c.last, t);
    c.lapses = num(c.lapses, 0); c.n = num(c.n, 0); c.ok = num(c.ok, 0);
    if (!Array.isArray(c.seen)) c.seen = [];
  }
  s.log = s.log.filter(isObj);
  s.exams = s.exams.filter((e) => isObj(e) && Number.isFinite(e.score) && Array.isArray(e.dom));
  for (const m of [s.done, s.daily] as Record<string, unknown>[]) for (const k of Object.keys(m)) if (!isObj(m[k])) delete m[k];
}

export const store = createStore<SaveData>({ key: KEY, version: SAVE_VERSION, defaults: DEFAULTS, ranks: RANKS, logMax: 3000, fix });

export const { S, save, rankOf, liveStreak, logEv } = store;
