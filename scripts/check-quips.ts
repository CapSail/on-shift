// Lints every line Shifty and Dale say, in both shifts. Fails the build on errors. Prints totals.
//   SHIFTY-1 (content/ai/quips/*.json): shape, minimum pool sizes, length caps, duplicates, near-duplicates, banned phrases.
//   SOC shift (src/soc/shifty-lines.ts): 200+ home-screen lines, all distinct, all bubble-sized.
import { readFileSync } from 'node:fs';
import { SHIFTY_LINES } from '../src/soc/shifty-lines.ts';

const read = (f: string) => JSON.parse(readFileSync(new URL(`../content/ai/quips/${f}`, import.meta.url), 'utf8'));
const home = read('home.json'), fb = read('feedback.json'), misc = read('misc.json');
const errs: string[] = [], warns: string[] = [];
const all: [string, string][] = [];

function pool(name: string, arr: unknown, min: number, max: number, needs?: string) {
  if (!Array.isArray(arr) || arr.some((x) => typeof x !== 'string')) return errs.push(`${name}: not a string array`);
  if (arr.length < min) errs.push(`${name}: ${arr.length} lines, need ${min}+`);
  for (const s of arr as string[]) {
    if (!s.trim()) errs.push(`${name}: empty line`);
    if (s.length > max) errs.push(`${name}: ${s.length} chars (max ${max}): ${s}`);
    if (needs && !s.includes(needs)) errs.push(`${name}: missing ${needs}: ${s}`);
    if (/nova (canvas|reel)|great job|all of the above/i.test(s)) errs.push(`${name}: banned phrase: ${s}`);
    all.push([name, s]);
  }
}
const tiers = (name: string, t: unknown, mins: number[], max: number) => {
  if (!Array.isArray(t) || t.length !== 3) return errs.push(`${name}: needs 3 tiers`);
  t.forEach((p, i) => pool(`${name}[${i}]`, p, mins[i], max));
};

tiers('home', home.home, [60, 55, 50], 120);
tiers('ok', fb.ok, [35, 30, 25], 100);
tiers('no', fb.no, [35, 30, 25], 100);
tiers('epoch', misc.epoch, [15, 12, 10], 120);
tiers('pre', misc.pre, [10, 10, 8], 120);
const D = misc.dale ?? {};
pool('dale.intro', D.intro, 1, 400);
for (const k of ['perfect', 'good', 'bad', 'bench', 'boss', 'bossWin', 'bossLose']) pool(`dale.${k}`, D[k], 10, 120);
pool('dale.streak', D.streak, 10, 120, '{n}');
pool('attacks', misc.attacks, 30, 100);

// exact and near duplicates (same first 5 normalized words)
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const seen = new Map<string, string>(), heads = new Map<string, string>();
for (const [n, s] of all) {
  const k = norm(s);
  if (seen.has(k)) errs.push(`duplicate (${seen.get(k)} / ${n}): ${s}`); else seen.set(k, n);
  const h = k.split(' ').slice(0, 5).join(' ');
  if (h.split(' ').length === 5) { if (heads.has(h)) warns.push(`same opening (${heads.get(h)} / ${n}): ${s}`); else heads.set(h, n); }
}

// ---- the SOC shift's home-screen lines
const socSeen = new Set<string>();
if (SHIFTY_LINES.length < 200) errs.push(`soc home: ${SHIFTY_LINES.length} lines, need 200+`);
for (const s of SHIFTY_LINES) {
  if (s.length > 120) errs.push(`soc home: ${s.length} chars (max 120): ${s}`);
  if (s.length <= 15) errs.push(`soc home: too short: ${s}`);
  if (socSeen.has(norm(s))) errs.push(`soc home: duplicate: ${s}`); else socSeen.add(norm(s));
}
console.log(`quips: SOC shift ${SHIFTY_LINES.length} home lines`);

const shifty = all.filter(([n]) => !n.startsWith('dale') && n !== 'attacks').length;
console.log(`quips: SHIFTY-1 ${all.length} lines (Shifty ${shifty}, Dale ${all.filter(([n]) => n.startsWith('dale')).length}, attacks ${misc.attacks?.length ?? 0})`);

// ---- the Ghost CISO shift (content/cissp/quips/*.json): same rules, its own pools and duplicate check
{
  const rc = (f: string) => JSON.parse(readFileSync(new URL(`../content/cissp/quips/${f}`, import.meta.url), 'utf8'));
  const ch = rc('home.json'), cf = rc('feedback.json'), cm = rc('misc.json');
  const before = all.length;
  tiers('ciso.home', ch.home, [18, 16, 14], 120);
  tiers('ciso.ok', cf.ok, [10, 10, 10], 100);
  tiers('ciso.no', cf.no, [10, 10, 10], 100);
  pool('ciso.flash', cm.flash, 10, 120);
  const CD = cm.dale ?? {};
  pool('ciso.dale.intro', CD.intro, 1, 400);
  for (const k of ['perfect', 'good', 'bad', 'exam', 'daily', 'drill']) pool(`ciso.dale.${k}`, CD[k], 8, 120);
  pool('ciso.closeBad', cm.closeBad, 6, 140);
  pool('ciso.dale.streak', CD.streak, 8, 120, '{n}');
  const mine = all.slice(before), seenC = new Map<string, string>();
  for (const [n, t] of mine) { const k = norm(t); if (seenC.has(k)) errs.push(`duplicate (${seenC.get(k)} / ${n}): ${t}`); else seenC.set(k, n); }
  all.splice(before);
  console.log(`quips: Ghost CISO ${mine.length} lines (Shifty ${mine.filter(([n]) => !n.startsWith('ciso.dale')).length}, Dale ${mine.filter(([n]) => n.startsWith('ciso.dale')).length})`);
}
warns.forEach((w) => console.warn('WARN ' + w));
if (errs.length) { errs.forEach((e) => console.error('ERROR ' + e)); process.exit(1); }
