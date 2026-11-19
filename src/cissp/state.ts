// The CISSP shift's save: one object in localStorage (key cissp.v1). No UI imports here.
import type { SaveData } from './types';
import { createStore, type Rank } from '../engine/store';

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

export const store = createStore<SaveData>({
  key: KEY, version: SAVE_VERSION, defaults: DEFAULTS, ranks: RANKS, logMax: 3000,
  fix: (s) => { s.done ??= {}; s.exams ??= []; },
});

export const { S, save, rankOf, liveStreak, logEv } = store;
