// The SOC shift's save: one object in localStorage (key onshift.v2). No UI imports here.
import type { SaveData } from './types';
import { createStore, type Rank } from '../engine/store';

export const KEY = 'onshift.v2';
export const SAVE_VERSION = 2;

/** [xp needed, title, flavour] */
export const RANKS: Rank[] = [
  [0, 'Fresh Spook', 'just woke up dead'],
  [150, 'Haunter', 'rattling the right chains'],
  [450, 'Poltergeist', 'moves things that matter'],
  [900, 'Specter', 'sees through every pretext'],
  [1600, 'Phantom', 'calm in the chaos'],
  [2600, 'Wraith', 'walks through the noise'],
  [4000, 'Banshee', 'screams before it happens'],
  [6000, 'Night Warden', 'the dark answers to you'],
  [8500, 'Grim Archivist', 'remembers every technique'],
  [12000, 'Legendary Ghost', 'attackers whisper your name'],
];

const DEFAULTS: SaveData = {
  ver: SAVE_VERSION, name: '', hat: '', hatsSeen: [], puz: { twin: 0, name: 0, speed: 0 }, best: 0, wk: { id: 0, xp: 0 }, lb: { joined: false, dailySent: [] }, xp: 0, streak: 0, lastPlay: null, freeze: 0, cs: {}, seen: {}, log: [], dex: {}, intel: {}, inc: {}, boss: {},
  daily: {}, onb: false, sound: true, rolling: { 1: [], 2: [], 3: [] }, shifts: 0, dayGoal: {},
};

export const store = createStore<SaveData>({
  key: KEY, version: SAVE_VERSION, defaults: DEFAULTS, ranks: RANKS, logMax: 2500,
  // one-time carry-over from the v1 prototype
  legacy: () => {
    const o = JSON.parse(localStorage.getItem('onshift.v1') ?? 'null');
    return o ? { xp: o.xp || 0, dex: o.dex || {}, sound: o.sound !== false } : null;
  },
  // migrations go here, keyed on s.ver, e.g. if (s.ver < 3) { ...reshape...; }
  fix: (s) => {
    s.lb = { ...DEFAULTS.lb, ...(s.lb ?? {}) };
    s.puz = { ...DEFAULTS.puz, ...(s.puz ?? {}) };
  },
});

export const { S, save, rankOf, liveStreak, logEv } = store;
