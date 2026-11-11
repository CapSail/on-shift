/**
 * Editorial lints for the alert bank. Called from build-content.ts after the
 * schema checks pass. Returns hard errors (fail the build), warnings (review
 * them) and info lines (stats worth glancing at on every content drop).
 */
import type { Alert, Incident } from '../src/types.ts';

export interface LintResult { errors: string[]; warnings: string[]; info: string[] }

// `say` is read aloud in ride mode and must never give the verdict away.
const SAY_LEAK_HARD = /\b(malicious|attackers?|benign|legit|legitimate|suspicious|safe|normal)\b/i;
const SAY_LEAK_SOFT = /\b(attack(?:s|ed|ing)?|(?<!anti-)malware|compromis\w*|exploit\w*|ransom\w*|phish\w*|backdoor\w*|hostile|evil|innocent|harmless|routine|authori[sz]ed(?![ _-]keys)|unauthori[sz]ed|false positive|true positive|adversar\w*|threat actor|c2)\b/i;

const STOP = new Set(('that this with from have they them then than into your only just does doesn will would could should about there their what when where which while also over more most some such been being were able same like make every each other these those because without within against after before again still even much many very real here good need needs both none line lines alert alerts').split(' '));
// Capitalised words that are not people (product, protocol and tool names). Extend as the bank grows.
const NAME_STOP = new Set(('Microsoft Windows Office Word Excel Outlook Teams Defender Azure Entra Okta Exchange Online SharePoint OneDrive Google Gmail Chrome Edge Firefox Safari Linux Ubuntu Debian Kubernetes Docker Jenkins Ansible Puppet Terraform Splunk Sentinel Tenable Nessus Qualys Fortinet Cisco Palo Alto Zscaler Cloudflare Amazon Github GitHub GitLab Atlassian Jira Slack Zoom Citrix Tor Kerberos NTLM Mimikatz Rubeus Impacket Cobalt Strike Sliver Metasploit PowerShell Python Perl Bash Java Ruby Sysinternals Sysmon ProcDump PsExec AdFind Rclone Mega Akira Scattered Spider Volt Typhoon Black Basta Storm DarkGate Lazarus Sandworm Active Directory Domain Controller Group Policy Intune Autopilot ConfigMgr Kusto Graph Authenticator Conditional Access Privileged Identity Management Global Administrator Squiblydoo Kerberoasting Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April June July August September October November December Telegram LinkedIn Nginx Apache Postgres Redis Kali Veeam Vault Key Bitlocker Cloud Trail CloudTrail Lambda Fargate Duo Yubikey Webex Photoshop Illustrator Monero Visual Studio Error Reporting Temp Kerberoast Argo Atomic Gatekeeper Beijing Admin Update Patch Your Own Host').split(' '));
const GENERIC_ID = /^(system|root|admin|administrator|corp|local|service|network|user|users|guest|domain|windows|linux|prod|backup|accounting|default|test)$/i;
// Threat-actor and campaign names look like identifiers (storm-0324, apt29) but are not hosts or users.
const ACTOR_ID = /^(storm|apt|fin|ta|unc|dev|g|s)-?\d+$/i;

const tokens = (s: string) => (s.toLowerCase().match(/[a-z0-9][a-z0-9_.@\\-]*[a-z0-9]|[a-z0-9]/g) ?? []);
const words = (s: string) => tokens(s).filter((t) => t.length >= 4 && !STOP.has(t) && /[a-z]/.test(t));
const segments = (a: Alert): string[] => [a.tell, a.say, a.q?.ask, ...(a.q?.o ?? []), a.q?.why].filter((x): x is string => Boolean(x));
const narrative = (a: Alert) => segments(a).join(' \n ');
const ownText = (a: Alert) => [a.h, ...a.l, a.t, a.src].join(' \n ').toLowerCase();

// Alerts whose tell narrates the scary part but whose deciding line is the context; reviewed by hand in the Phase 0 QA pass.
const K_REVIEWED = new Set(['e16', 'm01', 'z13']);

const TICKET = /\b(ticket|chg\w*|inc-?\d{3,}|rfc\b|change (?:request|record|ticket|board|window)|cr-?\d{3,}|sctask\w*)/i;

export function lintContent({ alerts, inc }: { alerts: Alert[]; inc: Incident[] }): LintResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];
  const all = [...alerts, ...inc.flatMap((i) => i.a)];

  // --- say: never reveal the verdict; keep it short for TTS
  for (const a of all) {
    const hard = a.say.match(SAY_LEAK_HARD);
    if (hard) errors.push(`${a.id}: "say" leaks the verdict with "${hard[0]}"`);
    const soft = a.say.match(SAY_LEAK_SOFT);
    if (soft) warnings.push(`${a.id}: "say" may hint at the verdict with "${soft[0]}"`);
    const n = a.say.trim().split(/\s+/).length;
    if (n > 25) warnings.push(`${a.id}: "say" is ${n} words (max 25)`);
  }

  // --- name consistency: tell/say/q must only name things that are in this alert
  const hostCount = new Map<string, number>();
  for (const a of all) for (const t of new Set(tokens(a.h))) hostCount.set(t, (hostCount.get(t) ?? 0) + 1);
  // identifiers only: host names (a digit, dash or underscore) and the user part of the host line
  const userTokens = new Set(all.flatMap((a) => tokens((a.h.split(' · ')[1] ?? '').split('\\').pop() ?? '')));
  const hostVocab = new Set(
    [...hostCount]
      .filter(([t, n]) => t.length >= 3 && n <= 3 && !GENERIC_ID.test(t) && !/^[\d.]+$/.test(t) && (/[\d_-]/.test(t) || userTokens.has(t)))
      .map(([t]) => t),
  );
  for (const a of all) {
    const own = ownText(a);
    const bad = new Set<string>();
    for (const t of new Set(tokens(narrative(a)))) {
      const hostLike = /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)+$/.test(t) && /\d/.test(t);
      if ((hostVocab.has(t) || hostLike) && !ACTOR_ID.test(t) && !own.includes(t)) bad.add(t);
    }
    if (bad.size) warnings.push(`${a.id}: tell/say/q mention ${[...bad].map((b) => `"${b}"`).join(', ')} which is not in the alert's host/log lines`);
  }

  // --- proper names in the narrative (e.g. "Ana's account") must exist in the alert
  for (const a of all) {
    const own = ownText(a);
    const bad = new Set<string>();
    for (const seg of segments(a)) {
      for (const m of seg.matchAll(/\b([A-Z][a-z]{2,})\b/g)) {
        const before = seg.slice(0, m.index).trimEnd();
        if (before === '' || /[.!?:"'(—-]$/.test(before)) continue; // sentence start
        const w = m[1];
        if (!NAME_STOP.has(w) && !own.includes(w.toLowerCase())) bad.add(w);
      }
    }
    if (bad.size) warnings.push(`${a.id}: tell/say/q name ${[...bad].map((b) => `"${b}"`).join(', ')} who is not in the alert`);
  }

  // --- a Windows/Linux profile path must belong to the user in the host line (rename leftovers)
  for (const a of all) {
    const parts = a.h.split(' · ');
    if (parts.length < 2) continue;
    const user = parts[1].split('\\').pop()!.toLowerCase();
    const named = new Set((a.l.join(' ') + ' ' + a.h).toLowerCase().match(/[a-z][a-z0-9._-]{1,}/g) ?? []);
    for (const m of a.l.join('\n').matchAll(/(?:Users\\|\/home\/)([A-Za-z][A-Za-z0-9._-]*)/g)) {
      const p = m[1].toLowerCase();
      if (['public', 'default', 'all'].includes(p) || p === user) continue;
      if (a.l.some((l) => /^(account|user|actor|signed in as|logon|owner)\b/i.test(l) && l.toLowerCase().includes(p))) continue;
      warnings.push(`${a.id}: profile path "${m[1]}" does not match the host-line user "${parts[1]}"${named.has(p) ? '' : ''}`);
    }
  }

  // --- k must point at the line the tell describes
  for (const a of all) {
    if (K_REVIEWED.has(a.id)) continue;
    const tw = new Set(words(a.tell));
    const lines: [string, string][] = [['h', a.h], ...a.l.map((l, i): [string, string] => [String(i), l])];
    const score = (text: string) => words(text).filter((w) => tw.has(w)).length;
    const scored = lines.map(([k, text]) => ({ k, s: score(text) }));
    const keyScore = Math.max(0, ...scored.filter((x) => a.k.map(String).includes(x.k)).map((x) => x.s));
    const best = scored.reduce((m, x) => (x.s > m.s ? x : m), { k: '', s: 0 });
    if (best.s >= 3 && best.s >= keyScore + 2 && !a.k.map(String).includes(best.k)) {
      warnings.push(`${a.id}: tell overlaps line ${best.k} (${best.s} shared words) far more than k=[${a.k.join(',')}] (${keyScore})`);
    }
  }

  // --- ticket / change-number shortcut: it must not predict the verdict
  const tk = { benign: 0, malicious: 0 };
  for (const a of alerts) if ([a.h, ...a.l].some((s) => TICKET.test(s))) tk[a.v ? 'malicious' : 'benign']++;
  const tkTotal = tk.benign + tk.malicious;
  info.push(`ticket/CHG in log lines: ${tk.benign} benign vs ${tk.malicious} malicious alerts (${Math.round((100 * tk.benign) / Math.max(1, tkTotal))}% benign; bank is ${Math.round((100 * alerts.filter((a) => !a.v).length) / alerts.length)}% benign)`);
  if (tkTotal >= 10 && Math.max(tk.benign, tk.malicious) / tkTotal > 0.75) {
    warnings.push(`ticket shortcut: ${tk.benign}/${tkTotal} alerts that mention a ticket are benign. Add forged/stale/borrowed-ticket attacks and ticket-less benigns.`);
  }

  // --- cue leak: a host/user token that predicts the verdict
  const tok = new Map<string, [number, number]>();
  for (const a of alerts) for (const t of new Set(a.h.toLowerCase().match(/[a-z_][\w.-]{3,}/g) ?? [])) {
    const c = tok.get(t) ?? [0, 0];
    c[a.v]++;
    tok.set(t, c);
  }
  for (const [t, [b, m]] of tok) {
    const n = b + m;
    if (n >= 3 && Math.max(b, m) / n >= 0.85 && !GENERIC_ID.test(t)) warnings.push(`cue leak: host/user token "${t}" is ${m ? 'malicious' : 'benign'} in ${Math.max(b, m)}/${n} alerts`);
  }

  // --- concept coverage
  const byConcept = new Map<string, Alert[]>();
  for (const a of alerts) byConcept.set(a.c, [...(byConcept.get(a.c) ?? []), a]);
  const solo = [...byConcept].filter(([, l]) => l.length === 1).length;
  info.push(`concepts with 2+ alerts: ${byConcept.size - solo}/${byConcept.size}; single-alert concepts: ${solo} (no twin or callback variant available)`);
  const oneSided = [...byConcept].filter(([, l]) => l.length > 1 && l.every((a) => a.v === l[0].v));
  if (oneSided.length) info.push(`concepts with only one verdict (content gaps, need a twin): ${oneSided.map(([c, l]) => `${c}[${l[0].v ? 'TP' : 'FP'}]`).join(', ')}`);
  return { errors, warnings, info };
}
