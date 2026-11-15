// Move SHIFTY-1 progress between installs as a pasted code.
//
// Why this exists: on Android and desktop the old standalone SHIFTY-1 and this app share storage (same site), so
// progress is simply here. An iPhone home-screen app keeps its own storage box, so progress made in an installed
// SHIFTY-1 has to be carried over by hand, once. The old link's forwarding page makes the same code (cutover/).
//
// Code format: "S1z:" + base64(gzip(json)) or "S1:" + base64(json), json = { v: 1, save, decks }.
import type { SaveData } from './types';
import { KEY, S } from './state';

const DECKS = 'shifty1.decks';

const toB64 = (u8: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b: string): Uint8Array => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
const pipe = async (u8: Uint8Array, t: CompressionStream | DecompressionStream): Promise<Uint8Array> =>
  new Uint8Array(await new Response(new Blob([u8 as unknown as BlobPart]).stream().pipeThrough(t)).arrayBuffer());

export async function exportCode(): Promise<string> {
  let decks: unknown = {};
  try { decks = JSON.parse(localStorage.getItem(DECKS) || '{}'); } catch { /* ignore */ }
  const raw = new TextEncoder().encode(JSON.stringify({ v: 1, save: S, decks }));
  try { return 'S1z:' + toB64(await pipe(raw, new CompressionStream('gzip'))); } catch { return 'S1:' + toB64(raw); }
}

export interface Incoming { save: SaveData; decks: unknown; concepts: number }

/** Parse and sanity-check a pasted code. Throws an Error with a message fit for the player. */
export async function readCode(code: string): Promise<Incoming> {
  const m = /^(S1z?):([A-Za-z0-9+/=]+)$/.exec(code.replace(/\s+/g, ''));
  if (!m) throw new Error('That is not a SHIFTY-1 progress code. Copy the whole thing, starting with S1.');
  let o: { v?: number; save?: SaveData; decks?: unknown };
  if (m[1] === 'S1z' && typeof DecompressionStream === 'undefined') throw new Error('This browser is too old to read that code. Update it and try again.');
  try {
    const bytes = fromB64(m[2]);
    o = JSON.parse(new TextDecoder().decode(m[1] === 'S1z' ? await pipe(bytes, new DecompressionStream('gzip')) : bytes));
  } catch { throw new Error('The code is damaged or cut short. Copy it again.'); }
  const s = o?.save;
  const ok = o?.v === 1 && !!s && typeof s === 'object' && s.ver === 1 && typeof s.xp === 'number' && Number.isFinite(s.xp)
    && !!s.cs && typeof s.cs === 'object' && Array.isArray(s.log) && Array.isArray(s.bench);
  if (!ok) throw new Error('That code is not a SHIFTY-1 save this version can read.');
  return { save: s!, decks: o.decks ?? {}, concepts: Object.keys(s!.cs).length };
}

/** Replace this device's SHIFTY-1 progress (all or nothing). The caller reloads the page afterwards. */
export function applyIncoming(inc: Incoming): void {
  const before = [localStorage.getItem(KEY), localStorage.getItem(DECKS)];
  try {
    localStorage.setItem(KEY, JSON.stringify(inc.save));
    localStorage.setItem(DECKS, JSON.stringify(inc.decks));
  } catch {
    // storage full or blocked: put back exactly what was there
    [KEY, DECKS].forEach((k, i) => { try { if (before[i] === null) localStorage.removeItem(k); else localStorage.setItem(k, before[i]!); } catch { /* ignore */ } });
    throw new Error('This device could not store the progress (storage full or blocked). Nothing was changed.');
  }
}
