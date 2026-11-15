// One save per shift: a single object persisted to localStorage under the shift's own key. No UI imports here.
import { today } from './time';

/** What every shift's save has in common (the engine's XP, rank and streak code works on these). */
export interface BaseSave {
  ver: number;
  xp: number;
  wk: { id: number; xp: number };
  streak: number;
  best: number;
  lastPlay: number | null;
  freeze: number;
  sound: boolean;
  hat: string;
  log: { day: number }[];
}

/** [xp needed, title, flavour] */
export type Rank = [number, string, string];

export interface Store<T extends BaseSave> {
  S: T;
  save: () => void;
  rankOf: (xp: number) => number;
  liveStreak: () => number;
  logEv: (e: Omit<T['log'][number], 'day'>) => void;
}

export function createStore<T extends BaseSave>(o: {
  key: string;
  version: number;
  defaults: T;
  ranks: Rank[];
  /** how many log events to keep */
  logMax: number;
  /** used when there is no save under `key` (carry-over from an older format) */
  legacy?: () => Partial<T> | null;
  /** fill in nested defaults / migrate; runs on every load */
  fix?: (s: T) => void;
}): Store<T> {
  let saved: Partial<T> | null = null;
  try { saved = JSON.parse(localStorage.getItem(o.key) ?? 'null'); } catch { /* corrupt save: start fresh */ }
  if (!saved && o.legacy) { try { saved = o.legacy(); } catch { /* ignore */ } }
  const S = Object.assign({}, o.defaults, saved ?? {}) as T;
  S.wk = { ...o.defaults.wk, ...(S.wk ?? {}) };
  o.fix?.(S);
  S.ver = o.version;

  const save = () => {
    try { localStorage.setItem(o.key, JSON.stringify(S)); } catch { /* storage full or blocked */ }
  };
  const rankOf = (xp: number): number => {
    let i = 0;
    o.ranks.forEach((r, j) => { if (xp >= r[0]) i = j; });
    return i;
  };
  const liveStreak = (): number => {
    const t = today();
    return (S.lastPlay ?? -1) >= t - 1 || (S.lastPlay === t - 2 && S.freeze > 0) ? S.streak : 0;
  };
  const logEv = (e: Omit<T['log'][number], 'day'>): void => {
    S.log.push({ day: today(), ...e });
    if (S.log.length > o.logMax) S.log.splice(0, S.log.length - o.logMax);
  };
  return { S, save, rankOf, liveStreak, logEv };
}
