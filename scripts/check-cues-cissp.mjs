// Test-wiseness check for the Ghost CISO FIRST/BEST scenes: how often a guesser who always taps the option with the
// most of some surface feature gets the key. Chance is 25%. Ties for the max count 1/k when the key is among k tied.
//   node scripts/check-cues-cissp.mjs                 table for all domains
//   node scripts/check-cues-cissp.mjs --d 7           also list domain 7 scenes where any cue points at the key
//   add --pool to measure the board-exam pool (content/cissp/exam) instead of the case scenes
import { readFileSync } from 'node:fs';
const c = JSON.parse(readFileSync('src/generated/cissp.json', 'utf8'));
const dArg = process.argv.indexOf('--d'); const D = dArg > 0 ? Number(process.argv[dArg + 1]) : null;
const POOL = process.argv.includes('--pool');
const sc = (POOL ? c.pool ?? [] : c.cases.flatMap((k) => k.scenes)).filter((s) => s.kind === 'first' || s.kind === 'best');
const HEDGE = /\b(per|policy|plan|approved|owner|legal|procedure|process|risk|management|agreed|documented)\b/gi;
export const cues = {
  longest: (o) => o.length,
  shortest: (o) => -o.length,
  words: (o) => o.trim().split(/\s+/).length,
  hedge: (o) => (o.match(HEDGE) || []).length,
  clauses: (o) => (o.match(/[,;:]|\band\b|\bthen\b|\bwith\b/gi) || []).length,
};
const hitOf = (s, f) => { const v = s.o.map(f), m = Math.max(...v); const t = v.map((x, i) => (x === m ? i : -1)).filter((i) => i >= 0); return t.includes(s.a) ? 1 / t.length : 0; };
const rows = {};
for (const [name, f] of Object.entries(cues)) {
  let tot = 0; const per = {};
  for (const s of sc) { const h = hitOf(s, f); tot += h; (per[s.d] ??= [0, 0]); per[s.d][0] += h; per[s.d][1]++; }
  rows[name] = { all: (100 * tot / sc.length).toFixed(1), ...Object.fromEntries(Object.entries(per).map(([d, [h, n]]) => ['D' + d, (100 * h / n).toFixed(1)])) };
}
console.log(`${POOL ? 'Exam pool' : 'Case'} FIRST/BEST items: ${sc.length} (chance 25%)`);
console.table(rows);
if (D) for (const s of sc.filter((x) => x.d === D)) {
  const hits = Object.entries(cues).map(([n, f]) => [n, hitOf(s, f)]).filter(([, h]) => h > 0).map(([n, h]) => (h < 1 ? `${n}(${h.toFixed(2)})` : n));
  if (hits.length) console.log(s.id.padEnd(9), hits.join(' '));
}
const noStory = c.cases.flatMap((k) => k.scenes).filter((s) => !s.r && !s.rr);
console.log('scenes with no story reaction:', noStory.length);
