// Player state: one object persisted to localStorage. No UI imports here.
import type { LogEvent, SaveData } from './types';
import { today } from './time';

export const KEY = 'onshift.v2';
export const SAVE_VERSION = 2;

/** [xp needed, title, flavour] */
export const RANKS: [number, string, string][] = [
  [0, 'Intern', 'still looking for the coffee'],
  [150, 'Tier 1 Analyst', 'closing tickets, opening eyes'],
  [450, 'Tier 2 Analyst', 'the one who actually reads the logs'],
  [900, 'Tier 3 Analyst', 'pivots in their sleep'],
  [1600, 'Incident Responder', 'calm in the chaos'],
  [2600, 'Detection Engineer', 'writes the rules everyone else trips'],
  [4000, 'Threat Hunter', 'finds what the rules missed'],
  [6000, 'SOC Lead', 'the pager fears you'],
  [8500, "CISO's Favorite", 'mentioned in the board deck'],
  [12000, "APT's Worst Nightmare", 'nation-states have a file on you'],
];

const DEFAULTS: SaveData = {
  ver: SAVE_VERSION, name: '', best: 0, wk: { id: 0, xp: 0 }, lb: { joined: false, dailySent: [] }, xp: 0, streak: 0, lastPlay: null, freeze: 0, cs: {}, seen: {}, log: [], dex: {}, intel: {}, inc: {}, boss: {},
  daily: {}, onb: false, sound: true, rolling: { 1: [], 2: [], 3: [] }, shifts: 0, dayGoal: {},
};

function load(): SaveData {
  let saved: Partial<SaveData> | null = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { /* corrupt save: start fresh */ }
  if (!saved) {
    // one-time carry-over from the v1 prototype
    try {
      const o = JSON.parse(localStorage.getItem('onshift.v1') ?? 'null');
      if (o) saved = { xp: o.xp || 0, dex: o.dex || {}, sound: o.sound !== false };
    } catch { /* ignore */ }
  }
  const s = Object.assign({}, DEFAULTS, saved ?? {});
  // migrations go here, keyed on s.ver, e.g. if (s.ver < 3) { ...reshape...; }
  s.lb = { ...DEFAULTS.lb, ...(s.lb ?? {}) };
  s.wk = { ...DEFAULTS.wk, ...(s.wk ?? {}) };
  s.ver = SAVE_VERSION;
  return s;
}

export const S: SaveData = load();

export const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full or blocked */ }
};

export const rankOf = (xp: number): number => {
  let i = 0;
  RANKS.forEach((r, j) => { if (xp >= r[0]) i = j; });
  return i;
};

export const liveStreak = (): number => {
  const t = today();
  return (S.lastPlay ?? -1) >= t - 1 || (S.lastPlay === t - 2 && S.freeze > 0) ? S.streak : 0;
};

export function logEv(e: Omit<LogEvent, 'day'>): void {
  S.log.push({ day: today(), ...e });
  if (S.log.length > 2500) S.log.splice(0, S.log.length - 2500);
}
