/**
 * Validate content/ai/*.yaml (SHIFTY-1, the AI cert school) and write src/generated/ai.json.
 *   npm run content        validate + write
 *   npm run validate       validate only (--check)
 * Errors fail the build. Warnings are editorial lints a human should look at.
 */
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import type { Card, Concept, Content, Domain, Fact, Kind } from '../src/ai/types.ts';

const CHECK = process.argv.includes('--check');
const errors: string[] = [];
const warns: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warns.push(m);
const words = (s: unknown) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;
const isStr = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const KINDS: Kind[] = ['mcq', 'multi', 'hallu', 'tf', 'order', 'match', 'duel'];
const BANNED = /\b(all|none) of the above\b|\bboth (a|b) and\b/i;

const meta = parse(readFileSync('content/ai/meta.yaml', 'utf8')) as {
  content_version: string; exam: Content['exam']; domains: Domain[]; tasks: string[];
};
if (meta.domains.reduce((s, d) => s + d.w, 0) !== 100) err('meta: domain weights do not sum to 100');

const concepts: Concept[] = [];
const cards: Card[] = [];
const facts: Fact[] = [];
for (const dom of meta.domains) {
  // d3.yaml is the base file; d3-<anything>.yaml are content drops for the same domain
  const files = readdirSync('content/ai').filter((f) => f === `d${dom.n}.yaml` || (f.startsWith(`d${dom.n}-`) && f.endsWith('.yaml'))).sort();
  if (!files.includes(`d${dom.n}.yaml`)) err(`content/ai/d${dom.n}.yaml: missing`);
  for (const f of files) {
    const file = 'content/ai/' + f;
    let doc: { concepts?: Concept[]; cards?: Card[]; facts?: Fact[] };
    try { doc = parse(readFileSync(file, 'utf8')) ?? {}; } catch (e) { err(`${file}: invalid YAML: ${(e as Error).message}`); continue; }
    for (const c of doc.concepts ?? []) concepts.push({ ...c, d: dom.n });
    for (const k of doc.cards ?? []) cards.push({ ...k, d: dom.n });
    for (const x of doc.facts ?? []) facts.push({ ...x, d: dom.n });
  }
}

// ---------------------------------------------------------------- concepts
const cById = new Map<string, Concept>();
for (const c of concepts) {
  const at = `concept ${c.id ?? '?'}`;
  if (!isStr(c.id) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) err(`${at}: id must be kebab-case`);
  if (cById.has(c.id)) err(`${at}: duplicate id`);
  cById.set(c.id, c);
  if (!meta.tasks.includes(String(c.task))) err(`${at}: unknown task '${c.task}'`);
  else if (Number(String(c.task)[0]) !== c.d) err(`${at}: task ${c.task} is not in domain ${c.d}`);
  c.task = String(c.task);
  for (const f of ['name', 'rule', 'soc', 'say'] as const) if (!isStr(c[f])) err(`${at}: missing ${f}`);
  if (String(c.name ?? '').length > 40) warn(`${at}: name over 40 chars`);
  if (words(c.rule) > 15) err(`${at}: rule is ${words(c.rule)} words (max 15)`);
  if (!Array.isArray(c.learn) || c.learn.length !== 3 || !c.learn.every(isStr)) err(`${at}: learn must be exactly 3 bullets`);
  else c.learn.forEach((b, i) => { if (words(b) > 25) warn(`${at}: learn[${i}] is ${words(b)} words (aim ≤25)`); });
  if (words(c.soc) > 25) warn(`${at}: soc is ${words(c.soc)} words (aim ≤25)`);
  if (words(c.say) > 60) warn(`${at}: say is ${words(c.say)} words (aim ≤60)`);
}

// ---------------------------------------------------------------- cards
const seen = new Set<string>();
let rightLongest = 0, mcqN = 0;
for (const k of cards) {
  const at = `card ${k.id ?? '?'}`;
  if (!isStr(k.id) || !new RegExp(`^d${k.d}-\\d{3}$`).test(k.id)) err(`${at}: id must be d${k.d}-NNN`);
  if (seen.has(k.id)) err(`${at}: duplicate id`);
  seen.add(k.id);
  if (!cById.has(k.c)) err(`${at}: unknown concept '${k.c}'`);
  else if (cById.get(k.c)!.d !== k.d) err(`${at}: concept ${k.c} lives in another domain`);
  if (!KINDS.includes(k.kind)) { err(`${at}: unknown kind '${k.kind}'`); continue; }
  if (![1, 2, 3].includes(k.diff)) err(`${at}: diff must be 1-3`);
  if (!isStr(k.why)) err(`${at}: missing why`);
  else if (words(k.why) > 40) warn(`${at}: why is ${words(k.why)} words (aim ≤40)`);
  const opts = (n: number[], label = 'o') => {
    if (!Array.isArray(k.o) || !n.includes(k.o.length) || !k.o.every(isStr)) { err(`${at}: ${label} must have ${n.join(' or ')} options`); return false; }
    if (new Set(k.o.map((s) => s.trim().toLowerCase())).size !== k.o.length) err(`${at}: duplicate options`);
    k.o.forEach((s) => { if (BANNED.test(s)) err(`${at}: banned option wording "${s}"`); });
    return true;
  };
  switch (k.kind) {
    case 'mcq':
      if (!isStr(k.q)) err(`${at}: missing q`);
      if (opts([4]) && (typeof k.a !== 'number' || k.a < 0 || k.a > 3)) err(`${at}: a must be 0-3`);
      else if (k.o) {
        mcqN++;
        const lens = k.o.map((s) => s.length), r = lens[k.a as number];
        if (r === Math.max(...lens) && lens.filter((l) => l === r).length === 1) rightLongest++;
      }
      break;
    case 'multi': {
      if (!isStr(k.q)) { err(`${at}: missing q`); break; }
      const m = /\(Choose (TWO|THREE)\.\)\s*$/.exec(k.q);
      if (!m) err(`${at}: q must end with "(Choose TWO.)" or "(Choose THREE.)"`);
      if (opts([5, 6])) {
        const need = m?.[1] === 'THREE' ? 3 : 2;
        if (!Array.isArray(k.a) || k.a.length !== need || new Set(k.a).size !== need || k.a.some((i) => typeof i !== 'number' || i < 0 || i >= k.o!.length)) err(`${at}: a must list ${need} distinct valid indexes`);
      }
      break;
    }
    case 'hallu':
      if (!Array.isArray(k.s) || k.s.length < 3 || k.s.length > 4 || !k.s.every(isStr)) { err(`${at}: s must be 3-4 lines`); break; }
      k.s.forEach((l, i) => { if (words(l) > 22) warn(`${at}: s[${i}] is ${words(l)} words (aim ≤20)`); });
      if (typeof k.bad !== 'number' || k.bad < 0 || k.bad >= k.s.length) err(`${at}: bad must index s`);
      if (opts([3]) && (typeof k.a !== 'number' || k.a < 0 || k.a > 2)) err(`${at}: a must be 0-2`);
      break;
    case 'tf':
      if (!isStr(k.s)) err(`${at}: s must be one claim`);
      else if (words(k.s) > 28) warn(`${at}: claim is ${words(k.s)} words (aim ≤25, it is read aloud)`);
      if (typeof k.v !== 'boolean') err(`${at}: v must be true/false`);
      break;
    case 'order':
      if (!isStr(k.q)) err(`${at}: missing q`);
      if (!Array.isArray(k.steps) || k.steps.length < 3 || k.steps.length > 6 || !k.steps.every(isStr)) err(`${at}: steps must be 3-6 items`);
      else if (new Set(k.steps).size !== k.steps.length) err(`${at}: duplicate steps`);
      break;
    case 'match':
      if (!isStr(k.q)) err(`${at}: missing q`);
      if (!Array.isArray(k.pairs) || k.pairs.length < 3 || k.pairs.length > 4 || !k.pairs.every((p) => Array.isArray(p) && p.length === 2 && isStr(p[0]) && isStr(p[1]))) err(`${at}: pairs must be 3-4 [left, right] pairs`);
      else if (new Set(k.pairs.map((p) => p[1])).size !== k.pairs.length || new Set(k.pairs.map((p) => p[0])).size !== k.pairs.length) err(`${at}: duplicate pair sides`);
      break;
    case 'duel':
      if (!isStr(k.q) || !isStr(k.A) || !isStr(k.B)) err(`${at}: duel needs q, A, B`);
      if (k.a !== 0 && k.a !== 1) err(`${at}: a must be 0 (A) or 1 (B)`);
      if (words(k.A) > 45 || words(k.B) > 45) warn(`${at}: duel side over 45 words`);
      break;
  }
}

// ---------------------------------------------------------------- facts (the generator's raw material)
const fIds = new Set<string>();
const groups = new Map<string, Fact[]>();
for (const f of facts) {
  const at = `fact ${f.id ?? '?'}`;
  if (!isStr(f.id) || !new RegExp(`^f${f.d}-\\d{3}$`).test(f.id)) err(`${at}: id must be f${f.d}-NNN`);
  if (fIds.has(f.id)) err(`${at}: duplicate id`);
  fIds.add(f.id);
  if (!cById.has(f.c)) err(`${at}: unknown concept '${f.c}'`);
  if (!isStr(f.g) || !/^[a-z0-9-]+$/.test(f.g)) err(`${at}: g must be a kebab-case group`);
  if (!isStr(f.term) || !isStr(f.def)) { err(`${at}: needs term and def`); continue; }
  if (words(f.def) > 16) warn(`${at}: def is ${words(f.def)} words (aim ≤14)`);
  const t = f.term.toLowerCase().replace(/^(amazon|aws)\s+/, '');
  if (t.length > 3 && f.def.toLowerCase().includes(t)) err(`${at}: def gives away the term ("${f.term}")`);
  const key = `${f.d}:${f.g}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key)!.push(f);
}
for (const [key, fs] of groups) {
  if (fs.length < 4) err(`fact group ${key}: has ${fs.length} facts (min 4, so distractors exist)`);
  const dup = (xs: string[]) => xs.find((x, i) => xs.indexOf(x) !== i);
  const dt = dup(fs.map((f) => f.term.toLowerCase())), dd = dup(fs.map((f) => f.def.toLowerCase()));
  if (dt) err(`fact group ${key}: duplicate term "${dt}"`);
  if (dd) err(`fact group ${key}: duplicate def "${dd}"`);
}

// ---------------------------------------------------------------- coverage
for (const c of concepts) {
  const ks = cards.filter((k) => k.c === c.id);
  const at = `concept ${c.id}`;
  if (ks.length < 4) err(`${at}: has ${ks.length} cards (min 4)`);
  if (!ks.some((k) => k.kind === 'tf')) err(`${at}: needs a tf card (earbud mode)`);
  if (!ks.some((k) => k.kind === 'mcq' || k.kind === 'multi')) err(`${at}: needs an mcq or multi card`);
  if (!ks.some((k) => k.kind === 'hallu')) err(`${at}: needs a hallu card`);
  if (!ks.some((k) => k.pre)) warn(`${at}: no pre:true card (the first card is used as the pretest)`);
}
for (const t of meta.tasks) if (!concepts.some((c) => c.task === t)) err(`task ${t}: no concept covers it`);

// ---------------------------------------------------------------- editorial stats
const tf = cards.filter((k) => k.kind === 'tf');
const tfTrue = tf.filter((k) => k.v).length;
if (tf.length && (tfTrue / tf.length < 0.35 || tfTrue / tf.length > 0.65)) warn(`tf balance: ${tfTrue}/${tf.length} true (aim 40-60%)`);
if (mcqN && rightLongest / mcqN > 0.3) warn(`mcq: the right answer is the single longest option in ${rightLongest}/${mcqN} cards (a test-wise guesser would exploit this; aim < 30%)`);
const aPos = [0, 0, 0, 0];
cards.filter((k) => k.kind === 'mcq' && typeof k.a === 'number').forEach((k) => aPos[k.a as number]++);
const byKind = Object.fromEntries(KINDS.map((x) => [x, cards.filter((k) => k.kind === x).length]));
const byDom = meta.domains.map((d) => `D${d.n} ${concepts.filter((c) => c.d === d.n).length}c/${cards.filter((k) => k.d === d.n).length}k`);

console.log(`concepts ${concepts.length}, cards ${cards.length}, facts ${facts.length} in ${groups.size} groups  [${byDom.join(' · ')}]`);
console.log(`kinds ${JSON.stringify(byKind)}  tf true ${tfTrue}/${tf.length}  mcq right-is-longest ${rightLongest}/${mcqN}  (options are shuffled at runtime; authored a positions ${aPos.join('/')})`);
for (const w of warns) console.warn('warn: ' + w);
if (errors.length) {
  for (const e of errors) console.error('ERROR: ' + e);
  console.error(`\n${errors.length} error(s), ${warns.length} warning(s)`);
  process.exit(1);
}
console.log(`ok: 0 errors, ${warns.length} warning(s)`);
if (!CHECK) {
  const out: Content = { version: meta.content_version, exam: meta.exam, domains: meta.domains, concepts, cards, facts };
  mkdirSync('src/generated', { recursive: true });
  writeFileSync('src/generated/ai.json', JSON.stringify(out));
  console.log('wrote src/generated/ai.json');
}
