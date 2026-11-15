// SHIFTY-1's save: one object in localStorage. No UI imports here.
//
// The key and the format are EXACTLY the standalone SHIFTY-1 app's (same origin, capsail.github.io), so progress made
// there is simply here: no conversion. Do not change the shape without a migration; SAVE_VERSION stays 1 until then.
import type { SaveData } from './types';
import { createStore, type Rank } from '../engine/store';

export const KEY = 'shifty1.v1';
export const SAVE_VERSION = 1;
/** A one-time copy of the save as the standalone app left it, written the first time the merged app opens it. */
export const BACKUP_KEY = 'shifty1.v1.bak-merge';

/** Shifty's model tier. [xp needed, title, flavour] */
export const RANKS: Rank[] = [
  [0, 'Random Weights', 'outputs: vibes'],
  [150, 'Tokenizer', 'knows words exist'],
  [450, 'Base Model', 'autocompletes with confidence'],
  [900, 'Instruction-Tuned', 'follows directions, mostly'],
  [1600, "RLHF'd", 'polite now, still wrong sometimes'],
  [2600, 'Grounded', 'cites sources like a pro'],
  [4000, 'Tool User', 'calls APIs, sometimes the right ones'],
  [6000, 'Agentic', 'plans, acts, double-checks'],
  [8500, 'Frontier Model', 'benchmarks fear him'],
  [12000, 'AGI (Allegedly)', 'Dale wants a demo'],
];

const DEFAULTS: SaveData = {
  ver: SAVE_VERSION, name: '', hat: '', xp: 0, wk: { id: 0, xp: 0 }, streak: 0, best: 0, lastPlay: null, freeze: 0,
  cs: {}, log: [], daily: {}, boss: {}, bench: [], examDay: null, temp: 0, onb: false, sound: true, voice: true, runs: 0, hatsSeen: [], shLine: 0,
};

try {
  const raw = localStorage.getItem(KEY);
  if (raw && localStorage.getItem(BACKUP_KEY) === null) localStorage.setItem(BACKUP_KEY, raw);
} catch { /* storage blocked or full: the save itself is untouched */ }

export const store = createStore<SaveData>({ key: KEY, version: SAVE_VERSION, defaults: DEFAULTS, ranks: RANKS, logMax: 3000 });

export const { S, save, rankOf, liveStreak, logEv } = store;

/** A fake but monotonic parameter count: grows with XP, purely for the bit. */
export const params = (xp: number): string => {
  const p = 0.0007 * Math.pow(1.0009, xp) * (1 + xp / 40);
  return p < 1 ? `${(p * 1000).toFixed(0)}M` : p < 1000 ? `${p.toFixed(p < 10 ? 1 : 0)}B` : `${(p / 1000).toFixed(1)}T`;
};
