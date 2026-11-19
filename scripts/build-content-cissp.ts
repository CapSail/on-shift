/**
 * Validate content/cissp/*.yaml (the CISSP shift, "Ghost CISO") and write src/generated/cissp.json.
 *   npm run content        validate + write
 *   npm run validate       validate only (--check)
 * Errors fail the build. Warnings are editorial lints a human should look at. Format: docs/cissp/DESIGN.md.
 */
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import type { Case, Concept, Content, Domain, Scene, SceneKind } from '../src/cissp/types.ts';

const CHECK = process.argv.includes('--check');
const errors: string[] = [];
const warns: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warns.push(m);
const words = (s: unknown) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;
const isStr = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const KINDS: SceneKind[] = ['first', 'best', 'rank', 'sort', 'spot', 'calc'];
const BANNED = /\b(all|none) of the above\b|\bboth (a|b) and\b/i;
const DIR = 'content/cissp';

const meta = parse(readFileSync(`${DIR}/meta.yaml`, 'utf8')) as {
  content_version: string; exam: Content['exam']; domains: Domain[]; objectives: Record<string, string>;
};
if (Math.abs(meta.domains.reduce((s, d) => s + d.w, 0) - 100) > 0.01) err('meta: domain weights do not sum to 100');
const OBJ = Object.keys(meta.objectives);

const concepts: Concept[] = [];
const cases: Case[] = [];
for (const dom of meta.domains) {
  const files = readdirSync(DIR).filter((f) => f === `d${dom.n}.yaml` || (f.startsWith(`d${dom.n}-`) && f.endsWith('.yaml'))).sort();
  if (!files.includes(`d${dom.n}.yaml`)) { err(`${DIR}/d${dom.n}.yaml: missing`); continue; }
  for (const f of files) {
    const file = `${DIR}/${f}`;
    let doc: { concepts?: Concept[]; cases?: Case[] };
    try { doc = parse(readFileSync(file, 'utf8')) ?? {}; } catch (e) { err(`${file}: invalid YAML: ${(e as Error).message}`); continue; }
    for (const c of doc.concepts ?? []) {
      // an unquoted obj: 3.10 parses as the number 3.1 and would silently land on the wrong objective
      if (typeof c.obj !== 'string') err(`${file}: concept ${c.id ?? '?'}: obj must be a quoted string ('${c.obj}'), not a number`);
      concepts.push({ ...c, obj: String(c.obj), d: dom.n });
    }
    for (const k of doc.cases ?? []) cases.push({ ...k, d: dom.n });
  }
}

// ---------------------------------------------------------------- concepts
const cById = new Map<string, Concept>();
for (const c of concepts) {
  const at = `concept ${c.id ?? '?'}`;
  if (!isStr(c.id) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) err(`${at}: id must be kebab-case`);
  if (cById.has(c.id)) err(`${at}: duplicate id`);
  cById.set(c.id, c);
  if (!OBJ.includes(c.obj)) err(`${at}: unknown objective '${c.obj}'`);
  else if (Number(c.obj.split('.')[0]) !== c.d) err(`${at}: objective ${c.obj} is not in domain ${c.d}`);
  for (const f of ['name', 'rule', 'src'] as const) if (!isStr(c[f])) err(`${at}: missing ${f}`);
  if (String(c.name ?? '').length > 40) err(`${at}: name over 40 chars`);
  if (words(c.rule) > 15) err(`${at}: rule is ${words(c.rule)} words (max 15)`);
  if (!Array.isArray(c.learn) || c.learn.length !== 3 || !c.learn.every(isStr)) err(`${at}: learn must be exactly 3 bullets`);
  else c.learn.forEach((b, i) => { if (words(b) > 28) err(`${at}: learn[${i}] is ${words(b)} words (max 28)`); });
  if (c.ghost !== undefined && (!isStr(c.ghost) || words(c.ghost) > 30)) err(`${at}: ghost must be ≤30 words`);
}

// ---------------------------------------------------------------- cases and scenes
const scenes: Scene[] = [];
const caseIds = new Set<string>();
const letters = (s: string) => s.length;
let rightLongest = 0, lenN = 0;
const aPos = [0, 0, 0, 0];
for (const k of cases) {
  const at = `case ${k.id ?? '?'}`;
  if (!isStr(k.id) || !new RegExp(`^k${k.d}-\\d{2}$`).test(k.id)) err(`${at}: id must be k${k.d}-NN`);
  if (caseIds.has(k.id)) err(`${at}: duplicate id`);
  caseIds.add(k.id);
  for (const f of ['title', 'where', 'open', 'close'] as const) if (!isStr(k[f])) err(`${at}: missing ${f}`);
  if (String(k.title ?? '').length > 44) err(`${at}: title over 44 chars`);
  if (String(k.where ?? '').length > 48) err(`${at}: where over 48 chars`);
  if (words(k.open) > 80) err(`${at}: open is ${words(k.open)} words (max 80)`);
  if (words(k.close) > 60) err(`${at}: close is ${words(k.close)} words (max 60)`);
  if (![1, 2, 3].includes(k.diff)) err(`${at}: diff must be 1-3`);
  if (!Array.isArray(k.scenes) || k.scenes.length < 4 || k.scenes.length > 7) { err(`${at}: needs 4-7 scenes`); continue; }
  const kinds = new Set(k.scenes.map((s) => s.kind));
  if (kinds.size < 2) warn(`${at}: every scene is '${[...kinds][0]}' (mix the kinds)`);
  k.scenes.forEach((s, i) => {
    s.id = `${k.id}.${i + 1}`;
    s.d = k.d;
    s.case = k.id;
    s.diff = (s.diff ?? k.diff) as 1 | 2 | 3;
    const sat = `scene ${s.id}`;
    if (!cById.has(s.c)) err(`${sat}: unknown concept '${s.c}'`);
    else if (cById.get(s.c)!.d !== k.d) warn(`${sat}: concept ${s.c} lives in domain ${cById.get(s.c)!.d} (cross-domain scene)`);
    if (!KINDS.includes(s.kind)) { err(`${sat}: unknown kind '${s.kind}'`); return; }
    for (const f of ['text', 'ask', 'why', 'src'] as const) if (!isStr(s[f])) err(`${sat}: missing ${f}`);
    if (words(s.text) > 75) err(`${sat}: text is ${words(s.text)} words (max 75)`);
    if (words(s.ask) > 30) err(`${sat}: ask is ${words(s.ask)} words (max 30)`);
    if (words(s.why) > 50) err(`${sat}: why is ${words(s.why)} words (max 50)`);
    if (![1, 2, 3].includes(s.diff)) err(`${sat}: diff must be 1-3`);
    const ask = String(s.ask ?? '');
    if (s.kind === 'first' && !/\bFIRST\b/.test(ask)) err(`${sat}: a 'first' scene must ask what to do FIRST (in capitals)`);
    if (s.kind === 'best' && !/\b(BEST|MOST|LEAST|PRIMARY|GREATEST|MAIN)\b/.test(ask)) err(`${sat}: a 'best' scene must ask for the BEST/MOST/LEAST/PRIMARY option (in capitals)`);
    if (s.kind !== 'first' && /\bFIRST\b/.test(ask) && s.kind !== 'rank') err(`${sat}: asks FIRST but kind is '${s.kind}' (make it a 'first' scene)`);
    if (s.trap !== undefined && !['first', 'best', 'calc'].includes(s.kind)) err(`${sat}: only first/best scenes have a trap`);

    const opts = () => {
      if (!Array.isArray(s.o) || s.o.length !== 4 || !s.o.every(isStr)) { err(`${sat}: needs exactly 4 options`); return false; }
      if (new Set(s.o.map((x) => x.trim().toLowerCase())).size !== 4) err(`${sat}: duplicate options`);
      s.o.forEach((x) => { if (BANNED.test(x)) err(`${sat}: banned option wording "${x}"`); if (words(x) > 30) err(`${sat}: option over 30 words`); });
      if (typeof s.a !== 'number' || s.a < 0 || s.a > 3) { err(`${sat}: a must be 0-3`); return false; }
      aPos[s.a]++;
      const lens = s.o.map(letters), max = Math.max(...lens);
      lenN++;
      if (lens[s.a] === max && lens.filter((l) => l === max).length === 1 && max > 1.25 * [...lens].sort((x, y) => y - x)[1]) rightLongest++;
      return true;
    };
    switch (s.kind) {
      case 'first': case 'best': {
        if (!opts()) break;
        if (!Array.isArray(s.r) || s.r.length !== 4 || !s.r.every(isStr)) err(`${sat}: r needs a story reaction for each of the 4 options`);
        else s.r.forEach((x, j) => { if (words(x) > 35) err(`${sat}: r[${j}] is ${words(x)} words (max 35)`); });
        if (s.trap !== undefined) {
          if (typeof s.trap !== 'number' || s.trap < 0 || s.trap > 3) err(`${sat}: trap must be 0-3`);
          else if (s.trap === s.a) err(`${sat}: the trap (engineer answer) cannot be the right answer`);
        }
        break;
      }
      case 'calc': {
        if (!opts()) break;
        if (!s.o!.every((x) => /\d/.test(x))) err(`${sat}: calc options must be numbers or contain numbers`);
        if (s.trap !== undefined) err(`${sat}: calc scenes have no trap`);
        break;
      }
      case 'rank': {
        if (!Array.isArray(s.items) || s.items.length < 4 || s.items.length > 5 || !s.items.every(isStr)) err(`${sat}: rank needs 4-5 items in the correct order`);
        else {
          if (new Set(s.items).size !== s.items.length) err(`${sat}: duplicate rank items`);
          s.items.forEach((x) => { if (words(x) > 18) err(`${sat}: rank item over 18 words: ${x}`); });
        }
        break;
      }
      case 'sort': {
        if (!Array.isArray(s.bins) || s.bins.length < 2 || s.bins.length > 3 || !s.bins.every(isStr)) { err(`${sat}: sort needs 2-3 bins`); break; }
        if (!Array.isArray(s.pairs) || s.pairs.length < 4 || s.pairs.length > 8) { err(`${sat}: sort needs 4-8 items`); break; }
        const used = new Set<number>();
        for (const p of s.pairs) {
          if (!Array.isArray(p) || p.length !== 2 || !isStr(p[0]) || typeof p[1] !== 'number' || p[1] < 0 || p[1] >= s.bins.length) { err(`${sat}: each sort item is [text, bin index]`); continue; }
          if (words(p[0]) > 14) err(`${sat}: sort item over 14 words: ${p[0]}`);
          used.add(p[1]);
        }
        if (used.size !== s.bins.length) err(`${sat}: every bin needs at least one item`);
        if (new Set(s.pairs.map((p) => p[0])).size !== s.pairs.length) err(`${sat}: duplicate sort items`);
        break;
      }
      case 'spot': {
        const m = s.map;
        if (!m || !Array.isArray(m.nodes) || m.nodes.length < 4 || m.nodes.length > 12) { err(`${sat}: spot needs a map with 4-12 nodes`); break; }
        const ids = new Set<string>();
        for (const n of m.nodes) {
          if (!isStr(n.id) || !isStr(n.label)) err(`${sat}: map nodes need id and label`);
          if (ids.has(n.id)) err(`${sat}: duplicate map node ${n.id}`);
          ids.add(n.id);
          if (String(n.label).length > 22) err(`${sat}: map label over 22 chars: ${n.label}`);
          for (const v of [n.x, n.y]) if (typeof v !== 'number' || v < 0 || v > 100) err(`${sat}: node ${n.id} x/y must be 0-100`);
          const w = n.w ?? 22, h = n.h ?? 12;
          if (n.x + w > 100 || n.y + h > 100) err(`${sat}: node ${n.id} runs off the map`);
        }
        for (const [p, q] of m.links ?? []) if (!ids.has(p) || !ids.has(q)) err(`${sat}: link ${p}-${q} names an unknown node`);
        // overlapping boxes would make the tap ambiguous
        const box = m.nodes.map((n) => [n.x, n.y, n.x + (n.w ?? 22), n.y + (n.h ?? 12)]);
        for (let i2 = 0; i2 < box.length; i2++) for (let j = i2 + 1; j < box.length; j++) {
          const [a1, b1, c1, d1] = box[i2], [a2, b2, c2, d2] = box[j];
          if (a1 < c2 && a2 < c1 && b1 < d2 && b2 < d1) err(`${sat}: map nodes ${m.nodes[i2].id} and ${m.nodes[j].id} overlap`);
        }
        if (typeof s.a !== 'string' || !ids.has(s.a)) err(`${sat}: a must be the id of a map node`);
        break;
      }
    }
    scenes.push(s);
  });
}

// ---------------------------------------------------------------- coverage
const per = (f: (s: Scene) => string) => scenes.reduce<Record<string, number>>((m, s) => { m[f(s)] = (m[f(s)] ?? 0) + 1; return m; }, {});
const byConcept = per((s) => s.c);
const byObj = per((s) => cById.get(s.c)?.obj ?? '?');
for (const c of concepts) {
  const n = byConcept[c.id] ?? 0;
  if (n < 2) err(`concept ${c.id}: has ${n} scene(s) (min 2, so a flashback can serve a different one)`);
  else if (new Set(scenes.filter((s) => s.c === c.id).map((s) => s.case)).size < 2) warn(`concept ${c.id}: all its scenes are in one case (flashbacks would repeat the same story)`);
}
for (const o of OBJ) if ((byObj[o] ?? 0) < 2) err(`objective ${o}: has ${byObj[o] ?? 0} scene(s) (min 2): ${meta.objectives[o]}`);
for (const d of meta.domains) if (cases.filter((k) => k.d === d.n).length < 4) err(`domain ${d.n}: has ${cases.filter((k) => k.d === d.n).length} case(s) (min 4)`);
if (lenN && rightLongest / lenN > 0.2) warn(`the right answer is clearly the longest option in ${rightLongest}/${lenN} scenes (a test-wise guesser would exploit it; aim ≤20%)`);
const posN = aPos.reduce((x, y) => x + y, 0);
if (posN >= 20 && aPos.some((p) => p / posN > 0.4)) warn(`right-answer positions ${aPos.join('/')} (options are shuffled at runtime, but spread them anyway)`);
const trapN = scenes.filter((s) => s.trap !== undefined).length;

// ---------------------------------------------------------------- report
const kinds = per((s) => s.kind);
console.log(`cissp: concepts ${concepts.length}, cases ${cases.length}, scenes ${scenes.length} · kinds ${JSON.stringify(kinds)} · engineer traps ${trapN}`);
console.log('cissp: per domain ' + meta.domains.map((d) => `D${d.n} ${cases.filter((k) => k.d === d.n).length}k/${scenes.filter((s) => s.d === d.n).length}s`).join(' · '));
for (const w of warns) console.warn('warn: ' + w);
if (errors.length) {
  for (const e of errors) console.error('ERROR ' + e);
  console.error(`\n${errors.length} error(s), ${warns.length} warning(s)`);
  if (process.env.CISSP_DRAFT !== '1') process.exit(1);
  console.error('CISSP_DRAFT=1 (dev only): writing anyway. Never ship this.');
} else console.log(`cissp ok: 0 errors, ${warns.length} warning(s)`);
if (!CHECK) {
  const out: Content = { version: meta.content_version, exam: meta.exam, domains: meta.domains, objectives: meta.objectives, concepts, cases };
  mkdirSync('src/generated', { recursive: true });
  writeFileSync('src/generated/cissp.json', JSON.stringify(out));
  console.log('wrote src/generated/cissp.json');
}
