// Crews: collectible ATT&CK groups. Catching true positives earns intel; shift drops and bosses give cards.
import type { Alert, Crew } from './types';
import { D, byTech } from './content';
import { S, save } from './state';
import { today } from './time';
import { esc, pick, rnd } from './util';

export const RAR: [string, string][] = [['Common', 'var(--r0)'], ['Rare', 'var(--r1)'], ['Epic', 'var(--r2)'], ['Legendary', 'var(--r3)']];

export const mono = (n: string): string =>
  n.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 3).toUpperCase() || n.slice(0, 2).toUpperCase();

export function crewCard(c: Crew, via?: string): string {
  const [rn, rc] = RAR[c.r];
  const lv = Math.min(10, Math.ceil(c.t.length / 12));
  const iv = S.intel[c.id] || 0;
  const foil = iv >= 10;
  return `<div class="crew flip ${foil ? 'foil' : ''}" style="--rc:${rc}"><div class="in"><div class="rr">${rn.toUpperCase()}${foil ? ' · FOIL' : ''}</div><div class="mg">${esc(mono(c.n))}</div><div class="nm">${esc(c.n)}</div>
 <div class="al">${c.a.length ? 'aka ' + c.a.slice(0, 2).map(esc).join(' · ') : esc(c.id)}</div>
 <div class="tl">THREAT LEVEL<br>${'<i class="on"></i>'.repeat(lv)}${'<i></i>'.repeat(10 - lv)}<br>${c.t.length} techniques on record · intel ${iv}${via ? '<br>' + esc(via) : ''}</div></div></div>`;
}

/** Add a crew to the dex. Returns true if it is new. */
export function capture(id: string, via: string): boolean {
  const isNew = !S.dex[id];
  if (isNew) S.dex[id] = { via, d: today() };
  save();
  return isNew;
}

/** +1 intel to a crew that uses the technique (prefers uncaptured). 3 intel = captured. */
export function gainIntel(a: Alert): { c: Crew; cap: boolean; n: number } | null {
  const cands = (byTech[a.x] || []).filter((c, i, arr) => arr.indexOf(c) === i);
  if (!cands.length) return null;
  const un = cands.filter((c) => !S.dex[c.id]);
  const c = pick(un.length && rnd() < 0.75 ? un : cands);
  S.intel[c.id] = (S.intel[c.id] || 0) + 1;
  let cap = false;
  if (S.intel[c.id] >= 3 && !S.dex[c.id]) { capture(c.id, 'intel from your catches'); cap = true; }
  save();
  return { c, cap, n: S.intel[c.id] };
}

/** One face-down drop, rarity-weighted (boosted by a perfect shift). */
export function rollCrew(boost: boolean): Crew {
  const w = boost ? [38, 32, 21, 9] : [60, 28, 10, 2];
  let r = rnd() * 100, k = 0;
  while (k < 3 && r > w[k]) { r -= w[k]; k++; }
  let pool = D.crews.filter((c) => c.r === k && !S.dex[c.id]);
  if (!pool.length) pool = D.crews.filter((c) => c.r === k);
  return pick(pool);
}
