/**
 * Authoring helper: print alerts compactly by id or concept (reads the YAML directly).
 *   npm run show -- lsass-access e01 z12
 *   npm run show -- --lines 1        alerts with exactly 1 log line
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const dir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'content');
const load = (re: RegExp) => readdirSync(dir).filter((f) => re.test(f)).sort().flatMap((f) => (parse(readFileSync(join(dir, f), 'utf8')) ?? []) as any[]);
const alerts = load(/^alerts.*\.yaml$/);
const incidents = parse(readFileSync(join(dir, 'incidents.yaml'), 'utf8')) as any[];
for (const i of incidents) i.a.forEach((a: any, n: number) => { a.id = `${i.id}_${n}`; alerts.push(a); });
const concepts = Object.fromEntries(load(/^concepts_.*\.yaml$/).map((c) => [c.id, c.rule]));

const args = process.argv.slice(2);
let pick: any[] = [];
if (args[0] === '--lines') pick = alerts.filter((a) => a.l.length === Number(args[1]));
else for (const q of args) pick.push(...alerts.filter((a) => a.id === q || a.c === q));

for (const a of pick) {
  console.log(`\n[${a.id}] v=${a.v} d=${a.d} diff=${a.diff} c=${a.c} x=${a.x} k=${JSON.stringify(a.k)}${a.trap ? ' trap=' + a.trap : ''}${a.pair ? ' pair=' + a.pair : ''}`);
  console.log(`  rule: ${concepts[a.c] ?? '(none)'}`);
  console.log(`  title: ${a.t}   host: ${a.h}   src: ${a.src}`);
  a.l.forEach((l: unknown, n: number) => console.log(`   ${n}: ${l}`));
  console.log(`  tell: ${a.tell}`);
  console.log(`  say: ${a.say}`);
  if (a.q) console.log(`  q(${a.q.kind}): ${a.q.ask} | ${a.q.o.join(' / ')} | a=${a.q.a} | ${a.q.why}`);
}
