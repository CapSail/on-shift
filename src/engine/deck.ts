// Lines are dealt from a shuffled deck, so nothing repeats until every line in the pool has been heard.
import { shuffle } from './util';

/**
 * A dealer keeps one deck per pool key. With a storage key the decks (indexes into the pool) are saved between
 * visits; without one they live for the session.
 */
export function createDealer(storageKey?: string): (pool: string[], key?: string) => string {
  let decks: Record<string, number[]> | null = null;
  const load = (): Record<string, number[]> => {
    if (decks) return decks;
    decks = {};
    if (storageKey) { try { decks = JSON.parse(localStorage.getItem(storageKey) || '{}') ?? {}; } catch { decks = {}; } }
    return decks!;
  };
  return (pool, key = pool[0]) => {
    const all = load();
    let d = (all[key] || []).filter((i) => i < pool.length);
    if (!d.length) d = shuffle(pool.map((_, i) => i));
    const i = d.pop()!;
    all[key] = d;
    if (storageKey) { try { localStorage.setItem(storageKey, JSON.stringify(all)); } catch { /* storage full or blocked: in-memory is fine */ } }
    return pool[i];
  };
}
