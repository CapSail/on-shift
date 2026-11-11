/**
 * Content build: YAML + pinned ATT&CK STIX -> src/generated/content.json
 *
 *   npm run content     validate, then write src/generated/content.json
 *   npm run validate    validate only (also what CI runs before deploy)
 *
 * Hard errors fail the build (exit 1). Warnings are printed but do not.
 * The editorial lints live in scripts/lint-content.ts and are run from here.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Alert, Concept, Content, Crew, Incident } from '../src/types.ts';
import { lintContent } from './lint-content.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content');
const CACHE_DIR = join(ROOT, '.cache');
const OUT = join(ROOT, 'src', 'generated', 'content.json');
const CHECK_ONLY = process.argv.includes('--check');

const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

// ---------------------------------------------------------------- yaml loading

function loadYaml(file: string): unknown {
  try {
    return parse(readFileSync(join(CONTENT_DIR, file), 'utf8'));
  } catch (e) {
    err(file, `invalid YAML: ${(e as Error).message.split('\n')[0]}`);
    return null;
  }
}
const filesMatching = (re: RegExp) => readdirSync(CONTENT_DIR).filter((f) => re.test(f)).sort();

interface Meta { content_version: number; attack_version: string; tutorial: string[]; daily_pool_drop: number; drops?: Record<string, number> }
const meta = loadYaml('meta.yaml') as Meta;
if (!meta || !meta.attack_version || !Number.isInteger(meta.content_version)) {
  console.error('content/meta.yaml must define content_version (int) and attack_version');
  process.exit(1);
}

// ---------------------------------------------------------------- ATT&CK STIX

interface StixObj {
  type: string;
  id: string;
  name?: string;
  revoked?: boolean;
  x_mitre_deprecated?: boolean;
  x_mitre_shortname?: string;
  x_mitre_version?: string;
  description?: string;
  aliases?: string[];
  external_references?: { source_name: string; external_id?: string; url?: string }[];
  kill_chain_phases?: { kill_chain_name: string; phase_name: string }[];
  relationship_type?: string;
  source_ref?: string;
  target_ref?: string;
}

async function loadAttack(version: string): Promise<StixObj[]> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const cache = join(CACHE_DIR, `enterprise-attack-${version}.json`);
  if (!existsSync(cache)) {
    const url = `https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-${version}.json`;
    console.log(`fetching ATT&CK ${version} (one-time, cached in .cache/) ...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ATT&CK download failed: ${res.status} ${url}`);
    writeFileSync(cache, Buffer.from(await res.arrayBuffer()));
  }
  return (JSON.parse(readFileSync(cache, 'utf8')) as { objects: StixObj[] }).objects;
}

const live = (o: StixObj) => !o.revoked && !o.x_mitre_deprecated;
const extRef = (o: StixObj) => o.external_references?.find((r) => r.source_name === 'mitre-attack');

function clean(s: string): string {
  s = s.replace(/\(Citation:[^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  s = s.replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ');
  return s.replace(/\s+([.,;:])/g, '$1').trim();
}
function trim(s: string, n: number): string {
  s = clean(s).split('\n\n')[0];
  if (s.length <= n) return s;
  const c = s.slice(0, n);
  const p = c.lastIndexOf('. ');
  return p > n * 0.5 ? c.slice(0, p + 1) : c.trimEnd() + '…';
}

function buildAttackIndex(objs: StixObj[]) {
  const tacticName: Record<string, string> = {};
  const tacticShort = new Set<string>();
  for (const o of objs) if (o.type === 'x-mitre-tactic' && o.x_mitre_shortname) {
    tacticName[o.x_mitre_shortname] = o.name!;
    tacticShort.add(o.x_mitre_shortname);
  }
  const tech: Record<string, [string, string]> = {};
  const key2tid: Record<string, string> = {};
  const revoked = new Set<string>();
  for (const o of objs) {
    if (o.type !== 'attack-pattern') continue;
    const tid = extRef(o)?.external_id;
    if (!tid) continue;
    if (!live(o)) { revoked.add(tid); continue; }
    key2tid[o.id] = tid;
    tech[tid] = [
      o.name!,
      (o.kill_chain_phases ?? [])
        .filter((p) => p.kill_chain_name === 'mitre-attack')
        .map((p) => tacticName[p.phase_name] ?? p.phase_name)
        .join(', '),
    ];
  }
  for (const [tid, v] of Object.entries(tech)) {
    const parent = tid.split('.')[0];
    if (tid.includes('.') && tech[parent]) v[0] = `${tech[parent][0]}: ${v[0]}`;
  }
  const groupTech = new Map<string, Set<string>>();
  for (const r of objs) {
    if (r.type === 'relationship' && live(r) && r.relationship_type === 'uses' &&
        r.source_ref?.startsWith('intrusion-set') && key2tid[r.target_ref ?? '']) {
      if (!groupTech.has(r.source_ref)) groupTech.set(r.source_ref, new Set());
      groupTech.get(r.source_ref)!.add(key2tid[r.target_ref!]);
    }
  }
  const crews: Crew[] = [];
  for (const o of objs) {
    if (o.type !== 'intrusion-set' || !live(o)) continue;
    const ref = extRef(o);
    const t = [...(groupTech.get(o.id) ?? [])].sort();
    const n = t.length;
    crews.push({
      id: ref!.external_id!, n: o.name!, a: (o.aliases ?? []).filter((x) => x !== o.name).slice(0, 4),
      b: trim(o.description ?? '', 330), t, r: n >= 80 ? 3 : n >= 40 ? 2 : n >= 15 ? 1 : 0, u: ref!.url!,
    });
  }
  crews.sort((a, b) => a.n.toLowerCase().localeCompare(b.n.toLowerCase()));
  const version = objs.find((o) => o.type === 'x-mitre-collection')?.x_mitre_version ?? '?';
  return { tech, crews, revoked, tacticShort, tacticNames: new Set(Object.values(tacticName)), version };
}

// ---------------------------------------------------------------- schema checks

const DOMAINS = new Set(['endpoint', 'identity', 'cloud', 'email', 'network', 'linux', 'edr', 'macos']);
const FOLLOW = new Set(['pivot', 'tune', 'contain']);
const isStr = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;
const wordCount = (s: string) => s.trim().split(/\s+/).length;

function checkQuestion(where: string, id: string, q: Record<string, unknown> | undefined, kind: 'follow' | 'contain') {
  if (!q || typeof q !== 'object') return err(where, `${id}: ${kind} block is not an object`);
  if (!isStr(q.ask)) err(where, `${id}: ${kind}.ask missing`);
  if (!isStr(q.why)) err(where, `${id}: ${kind}.why missing`);
  const o = q.o;
  if (!Array.isArray(o) || o.length !== 3 || !o.every(isStr)) err(where, `${id}: ${kind}.o must be exactly 3 non-empty strings`);
  else if (!Number.isInteger(q.a) || (q.a as number) < 0 || (q.a as number) >= o.length) err(where, `${id}: ${kind}.a out of range`);
  if (kind === 'follow' && !FOLLOW.has(q.kind as string)) err(where, `${id}: q.kind must be pivot|tune|contain`);
}

function checkAlert(a: Record<string, any>, where: string, techIds: Set<string>, revoked: Set<string>, concepts: Record<string, Concept>) {
  const id = String(a.id ?? '?');
  for (const f of ['id', 'src', 't', 'h', 'tell', 'say', 'c', 'x']) if (!isStr(a[f])) err(where, `${id}: missing or empty "${f}"`);
  if (!DOMAINS.has(a.d)) err(where, `${id}: bad domain "${a.d}"`);
  if (a.v !== 0 && a.v !== 1) err(where, `${id}: v must be 0 or 1`);
  if (![1, 2, 3].includes(a.diff)) err(where, `${id}: diff must be 1-3`);
  if (a.trap !== undefined && a.trap !== 'scary' && a.trap !== 'bland') err(where, `${id}: trap must be scary|bland`);
  if (a.trap === 'scary' && a.v !== 0) err(where, `${id}: trap "scary" must be a benign (v:0)`);
  if (a.trap === 'bland' && a.v !== 1) err(where, `${id}: trap "bland" must be malicious (v:1)`);
  if (!Array.isArray(a.l) || a.l.length < 2 || a.l.length > 4) err(where, `${id}: l needs 2-4 log lines`);
  if (isStr(a.x)) {
    if (!/^T\d{4}(\.\d{3})?$/.test(a.x)) err(where, `${id}: malformed technique id "${a.x}"`);
    else if (!techIds.has(a.x)) err(where, `${id}: technique ${a.x} is ${revoked.has(a.x) ? 'revoked/deprecated' : 'unknown'} in ATT&CK ${meta.attack_version}`);
  }
  if (isStr(a.c) && !concepts[a.c]) err(where, `${id}: concept "${a.c}" is not registered in any concepts_*.yaml`);
  if (!Array.isArray(a.k) || a.k.length === 0) err(where, `${id}: k needs at least one deciding line`);
  else for (const kk of a.k) {
    const n = typeof kk === 'string' && /^\d+$/.test(kk) ? Number(kk) : kk;
    if (!(n === 'h' || (Number.isInteger(n) && n >= 0 && n < (a.l?.length ?? 0)))) err(where, `${id}: bad k index ${JSON.stringify(kk)}`);
  }
  if (a.q !== undefined) checkQuestion(where, id, a.q, 'follow');
  // normalise
  if (Array.isArray(a.l)) a.l = a.l.map(String);
  if (Array.isArray(a.k)) a.k = a.k.map((x: unknown) => (x === 'h' ? 'h' : Number(x)));
}

// ---------------------------------------------------------------- main

async function main() {
  const objs = await loadAttack(meta.attack_version);
  const atk = buildAttackIndex(objs);
  const techIds = new Set(Object.keys(atk.tech));
  if (atk.version !== meta.attack_version) warn('meta.yaml', `attack_version ${meta.attack_version} but dataset reports ${atk.version}`);

  // concepts: one canonical definition per id
  const concepts: Record<string, Concept> = {};
  const conceptFile: Record<string, string> = {};
  for (const f of filesMatching(/^concepts_.*\.yaml$/)) {
    const list = loadYaml(f);
    if (!Array.isArray(list)) { err(f, 'must be a YAML list'); continue; }
    for (const c of list as Record<string, any>[]) {
      if (!isStr(c.id) || !isStr(c.rule) || !isStr(c.tac) || !isStr(c.d)) { err(f, `concept ${JSON.stringify(c.id)}: needs id, rule, tac, d`); continue; }
      if (wordCount(c.rule) > 15) err(f, `${c.id}: rule is ${wordCount(c.rule)} words (max 15)`);
      if (!atk.tacticShort.has(c.tac) && !atk.tacticNames.has(c.tac)) warn(f, `${c.id}: tac "${c.tac}" is not an ATT&CK tactic name`);
      if (concepts[c.id]) {
        if (concepts[c.id].rule !== c.rule) err(f, `${c.id}: defined again with a DIFFERENT rule (first in ${conceptFile[c.id]}); keep one canonical rule`);
        else warn(f, `${c.id}: duplicate of the definition in ${conceptFile[c.id]}`);
        continue;
      }
      concepts[c.id] = { rule: c.rule, tac: c.tac, d: c.d };
      conceptFile[c.id] = f;
    }
  }

  // alerts
  const alerts: Alert[] = [];
  for (const f of filesMatching(/^alerts.*\.yaml$/)) {
    const list = loadYaml(f);
    if (!Array.isArray(list)) { err(f, 'must be a YAML list'); continue; }
    for (const a of list as Record<string, any>[]) { checkAlert(a, f, techIds, atk.revoked, concepts); a.drop = meta.drops?.[f] ?? 1; alerts.push(a as Alert); }
  }

  // incidents
  const incList = loadYaml('incidents.yaml');
  const inc: Incident[] = Array.isArray(incList) ? (incList as Incident[]) : [];
  if (!Array.isArray(incList)) err('incidents.yaml', 'must be a YAML list');
  const crewIds = new Set(atk.crews.map((c) => c.id));
  for (const i of inc as unknown as Record<string, any>[]) {
    for (const f of ['id', 'title', 'intro', 'win', 'lose']) if (!isStr(i[f])) err('incidents.yaml', `${i.id}: missing "${f}"`);
    if (!crewIds.has(i.g)) err('incidents.yaml', `${i.id}: group ${i.g} is not a live ATT&CK group`);
    if (![1, 2, 3].includes(i.diff)) err('incidents.yaml', `${i.id}: diff must be 1-3`);
    if (!Array.isArray(i.a) || i.a.length < 6) { err('incidents.yaml', `${i.id}: needs a list of alerts`); continue; }
    i.a.forEach((a: Record<string, any>, n: number) => { a.id = `${i.id}_${n}`; checkAlert(a, i.id, techIds, atk.revoked, concepts); });
    const ct = i.contain;
    if (!ct) err('incidents.yaml', `${i.id}: missing containment decision`);
    else {
      checkQuestion('incidents.yaml', i.id, ct, 'contain');
      if (!(Number.isInteger(ct.at) && ct.at >= 0 && ct.at < i.a.length && i.a[ct.at].v === 1)) err('incidents.yaml', `${i.id}: contain.at must index a true-positive alert`);
    }
  }

  // uniqueness
  const seen = new Set<string>();
  for (const a of [...alerts, ...inc.flatMap((i) => i.a)]) {
    if (seen.has(a.id)) err('ids', `duplicate id ${a.id}`);
    seen.add(a.id);
  }
  const byId = new Map(alerts.map((a) => [a.id, a]));

  // tutorial + explicit pair references
  for (const t of meta.tutorial ?? []) if (!byId.has(t)) err('meta.yaml', `tutorial alert ${t} does not exist`);
  for (const a of alerts) if (a.pair) {
    const p = byId.get(a.pair);
    if (!p) err('pair', `${a.id}: pair ${a.pair} does not exist`);
    else if (p.v === a.v) err('pair', `${a.id}: pair ${a.pair} has the same verdict`);
  }
  const usedConcepts = new Set([...alerts, ...inc.flatMap((i) => i.a)].map((a) => a.c));
  for (const c of Object.keys(concepts)) if (!usedConcepts.has(c)) warn(conceptFile[c], `${c}: concept is not used by any alert`);

  if (!Number.isInteger(meta.daily_pool_drop) || meta.daily_pool_drop < 1) err('meta.yaml', 'daily_pool_drop must be an integer >= 1');
  for (const f of Object.keys(meta.drops ?? {})) if (!existsSync(join(CONTENT_DIR, f))) err('meta.yaml', `drops lists ${f}, which does not exist`);
  if (errors.length) return finish();

  // infer twin pairs: same concept, opposite verdict; prefer same title
  const byConcept = new Map<string, Alert[]>();
  for (const a of alerts) byConcept.set(a.c, [...(byConcept.get(a.c) ?? []), a]);
  for (const list of byConcept.values()) for (const a of list) {
    if (a.pair) continue;
    const opp = list.filter((b) => b.v !== a.v).sort((x, y) => Number(x.t !== a.t) - Number(y.t !== a.t) || x.id.localeCompare(y.id));
    if (opp.length) a.pair = opp[0].id;
  }

  // editorial lints (warnings + the strict say-leak check)
  const lint = lintContent({ alerts, inc });
  for (const e of lint.errors) errors.push(e);
  for (const w of lint.warnings) warnings.push(w);
  for (const i of lint.info) console.log('info  ' + i);
  if (errors.length) return finish();

  const used = new Set<string>([...alerts, ...inc.flatMap((i) => i.a)].map((a) => a.x));
  for (const c of atk.crews) c.t.forEach((t) => used.add(t));
  const content: Content = {
    alerts, inc, crews: atk.crews,
    tech: Object.fromEntries(Object.entries(atk.tech).filter(([k]) => used.has(k))),
    concepts, tutorial: meta.tutorial,
    meta: { attack: atk.version, contentVersion: meta.content_version, dailyPoolDrop: meta.daily_pool_drop },
  };

  const tp = alerts.filter((a) => a.v).length;
  console.log(`alerts ${alerts.length} (TP ${tp}, ${Math.round((100 * (alerts.length - tp)) / alerts.length)}% benign) · incidents ${inc.length} (${inc.map((i) => i.a.length).join('/')} alerts)`);
  console.log(`concepts ${Object.keys(concepts).length} · twin pairs ${alerts.filter((a) => a.pair).length} · crews ${atk.crews.length} · ATT&CK ${atk.version} · content v${meta.content_version}`);
  if (!CHECK_ONLY) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify(content));
    console.log(`wrote ${OUT.replace(ROOT, '.')} (${Math.round(readFileSync(OUT).length / 1024)} KB)`);
  }
  finish();
}

function finish() {
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.warn('  warn  ' + w);
  }
  if (errors.length) {
    console.error(`\n${errors.length} ERROR(s), build failed:`);
    for (const e of errors) console.error('  ERROR ' + e);
    process.exit(1);
  }
  console.log(warnings.length ? '\nvalidation passed (with warnings)' : '\nvalidation passed');
}

main().catch((e) => { console.error(e); process.exit(1); });
