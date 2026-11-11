/**
 * Human-review report for the content QA pass (not part of the build).
 *   npm run qa              twin table: each multi-alert concept's rule next to its members' deciding lines
 *   npm run qa -- --src     every log source / event id with example alerts, for technical spot-checks
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const dir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'content');
const load = (re: RegExp) => readdirSync(dir).filter((f) => re.test(f)).sort().flatMap((f) => (parse(readFileSync(join(dir, f), 'utf8')) ?? []) as any[]);
const alerts = load(/^alerts.*\.yaml$/);
const concepts = Object.fromEntries(load(/^concepts_.*\.yaml$/).map((c) => [c.id, c.rule]));
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

if (process.argv.includes('--src')) {
  const bySrc = new Map<string, string[]>();
  for (const a of alerts) bySrc.set(a.src, [...(bySrc.get(a.src) ?? []), a.id]);
  for (const [s, ids] of [...bySrc].sort()) console.log(`${String(ids.length).padStart(3)}  ${s}   [${ids.slice(0, 6).join(' ')}${ids.length > 6 ? ' …' : ''}]`);
  console.log('\n--- numeric event ids quoted in log lines');
  for (const a of alerts) for (const l of a.l as string[]) {
    const m = l.match(/\b(?:event(?: ?id)?|eid)[: ]+(\d{3,5})\b|\b(\d{4})\b(?= (?:logon|failed|created|service|audit|process))/i);
    if (m) console.log(`${a.id}: ${cut(l, 140)}`);
  }
} else {
  const by = new Map<string, any[]>();
  for (const a of alerts) by.set(a.c, [...(by.get(a.c) ?? []), a]);
  for (const [c, list] of [...by].filter(([, l]) => l.length > 1)) {
    console.log(`\n# ${c}: ${concepts[c]}`);
    for (const a of list) {
      const key = (a.k as (number | 'h')[]).map((k) => (k === 'h' ? a.h : a.l[k])).join(' || ');
      console.log(`  ${a.id.padEnd(4)} ${a.v ? 'TP' : 'FP'} ${cut(a.t, 34).padEnd(34)} ${cut(key, 150)}`);
    }
  }
}
