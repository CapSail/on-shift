# Answer-shape cue pass: D7 and D8 (2026-11-19)

Scope: `content/cissp/d7.yaml` and `content/cissp/d8.yaml` only. Measured with
`scripts/check-cues-cissp.mjs` on the FIRST/BEST scenes (D7: 61, D8: 24). Chance is 25%. "Before" is git HEAD `7af4d9a`.

## Cue table

| Cue | D7 before | D7 after | D8 before | D8 after |
|---|---|---|---|---|
| Longest option | 20.5% | 24.6% | 13.9% | 16.0% |
| Shortest option | 3.3% | 11.5% | 16.7% | 16.7% |
| Most words | 17.3% | 18.9% | 11.5% | 12.8% |
| Most hedge/process words | 32.4% | 23.8% | 28.1% | 24.0% |
| Most clauses | 57.0% | 24.2% | 38.5% | 21.9% |

How: the most tempting distractor was made multi-part in many scenes (commas, "then", "with", and process words such
as "per policy" or "normal process"), and some keys were made short and plain. A first pass overshot (D7 longest,
words and clauses all fell to 0-3%, a reverse cue: "never pick the longest"), so about 25 scenes were rebalanced so the
key is again the longest, wordiest or most multi-part in roughly one scene in five. A few D7 options went back to
their HEAD wording in that step. They are not listed below because they did not change in the end.

## Scenes changed (54: 47 in D7, 7 in D8; no key index, item order or option order changed)

"key" marks the correct option. Every key keeps its meaning. Every distractor is still wrong for the reason the
scene's `why` gives, per the scene `src` (listed). Only the r[] reaction of k7-10.3 option 0 needed an update.

| Scene | Changed option(s), new text | Source that keeps key right / distractor wrong |
|---|---|---|
| k7-01.1 | [0] "Wait for the CIO to land, then follow the normal approval process"; key [1] "Isolate the routing VLAN now: the SOC lead has that authority" | Outline 7.6 (mitigation); OSG ch. 17. The scene's IR plan gives the SOC lead the authority, so waiting stays wrong |
| k7-01.6 | [0] "...until the investigation process is complete"; key [2] "Brief Ines so she can start any required notices"; [3] "...from the SOC, with full details" | GDPR Art. 33; outline 7.6 (reporting) |
| k7-01.7 | [0] "Patch the VPN appliance, rescan it, and close the case" (still the engineer trap); key [2] "Fix asset inventory and patching for every device" | NIST SP 800-40 Rev. 4; outline 7.6 (remediation = root cause) |
| k7-02.2 | [2] "Fire Viktor today, per HR policy, to limit the damage"; key [3] "Let legal direct the next steps" | OSG ch. 19; outline 7.1 |
| k7-02.3 | key [0] "A live capture of system memory"; [1] "A full forensic image of the laptop's disk, with hashes" | RFC 3227 sec. 2.1 (memory before disk) |
| k7-02.4 | key [2] "Analyze hashed images taken through a write blocker" | NIST SP 800-86 sec. 3.1.2 |
| k7-03.1 | key [2] "Keep tuning rules to the environment"; [3] "Raise every alert to high severity, and page the team for each" | NIST SP 800-137, 800-92 |
| k7-03.2 | [1] "A second SIEM to collect and store more email logs" | Outline 7.2 (SOAR) |
| k7-03.4 | [0] "Wait until the SIEM raises an alert"; [1] "Block all traffic from the group's home country"; key [3] "Run a threat hunt, guided by that group's known techniques" | Outline 7.2 (threat hunting) |
| k7-03.5 | [3] "Large downloads by any user, from any intranet site, at any hour" | SP 800-53 AC-6(9), AU-6 |
| k7-03.7 | [0] "The MSSP becomes legally responsible for any breach, and any fines" | Outline 7.7, 1.8; SP 800-35 (accountability stays with Halvorsen) |
| k7-04.1 | key [2] "Activate the scrubbing service per the runbook" | Outline 7.7 (DDoS scrubbing) |
| k7-04.2 | [2] "An IDS on a SPAN port that alerts on SQL injection strings" | SP 800-41 Rev. 1 (a passive IDS does not block) |
| k7-04.3 | [0] "Add a second RAID array, mirrored, to the dispatch server" | Outline 7.10 (QoS); OSG ch. 18 |
| k7-04.5 | [2] "The firewall keeps the data safe at rest" | Outline 7.5; SP 800-53 SC-28 |
| k7-04.6 | [1] "Email it to the claims team, and ask whether they expected the invoice" | Outline 7.7 (sandboxing) |
| k7-04.7 | [1] "Close the ticket, per the process, so the count looks better"; key [3] "Improve how Halvorsen responds next time" | Outline 7.6; SP 800-61 Rev. 3 (improvement) |
| k7-05.2 | [0] "Wait for Thursday's change board, as the normal policy and process require"; key [3] "Use the emergency change procedure" | OSG ch. 16; SP 800-53 CM-3. The scene's policy has an emergency path, so waiting stays wrong |
| k7-05.4 | key [1] "An automated secure baseline, monitored for drift"; [3] "Ask each admin to document, step by step, how they built their servers" | SP 800-128; CM-2, CM-6 |
| k7-05.5 | [0] "Upgrade the OS anyway, accept losing vendor support, and retest"; key [2] "Isolate it, allowlist its software, monitor it" | SP 800-40 Rev. 4 (compensating controls) |
| k7-05.7 | key [2] "No separation of duties, so one person can make and hide a change" | SP 800-53 AC-5 |
| k7-06.6 | [3] "Wait another hour at the assembly point" | Outline 7.15 |
| k7-07.3 | [0] "A full-scale exercise at the warm site, with live failover" | SP 800-84 (tabletop first) |
| k7-07.4 | [2] "Post every technical detail online, hourly" | Outline 7.11, 7.12 |
| k7-07.5 | [1] "50,000 hours is the MTTR; 2 and 8 hours are the MTBF" | Outline 7.11 (MTTR, MTBF) |
| k7-07.7 | [2] "Reciprocal agreements are illegal for logistics firms" | SP 800-34 Rev. 1 sec. 3.4.3 |
| k7-08.3 | [0] "Retrieve the backup drives, then leave before the gas discharges" | Outline 7.15; OSG ch. 10 (life safety) |
| k7-08.4 | [0] "A fence twice as tall, with barbed wire, around the whole site and nothing else" (one perimeter layer) | Outline 7.4; SP 800-53 PL-8 |
| k7-08.5 | [3] "Remind staff by email to be careful with tapes" | SP 800-53 MP-3 to MP-5 |
| k7-09.2 | [0] "Scan it with antivirus on the office network" | SP 800-86 sec. 3.1.2 |
| k7-09.3 | [3] "Forbid couriers to open vans at night, under any condition, even if threatened" | Outline 7.15 (duress) |
| k7-09.5 | [0] "Delete all users' files, empty the recycle bin, and then reboot"; key [2] "Sanitize them to NIST SP 800-88, then verify"; [3] "Reinstall the OS over the existing data, per the build process" | SP 800-88 |
| k7-09.6 | key [0] "Block the email and alert the SOC"; [1] "Allow it, since the salesperson is an employee with access" | Outline 7.2 (DLP); 45 CFR 164.312(e) |
| k7-10.1 | [0] "Ask Bas directly, tonight on his shift, why logging keeps stopping every Friday" | SP 800-53 AU-9(2), AU-9(4) |
| k7-10.2 | key [1] "Set all of the systems to sync to one authoritative time source"; [2] "Ignore the firewall logs, use the server's"; [3] "Collect fewer logs to make comparing easier" | SP 800-92; AU-8 |
| k7-10.3 | [0] "A longer password, MFA, and a lockout policy for his account" (r[0] updated: an insider's own account) | SP 800-53 AC-5 |
| k7-10.4 | [3] "Collecting as much data as possible" | OSG ch. 19; RFC 3227 sec. 4.1 |
| k7-10.5 | [2] "Running a full external penetration test, with a report, every three years" | SP 800-128; CM-2, CM-3, CM-6 |
| k7-10.6 | [0] "Approve it retroactively and close the ticket, since it has run fine for a year"; key [1] "Treat it as an incident and remove it via the change process" | OSG ch. 16; CM-3 |
| k7-10.7 | [2] "Rely on the yearly external audit and its payment sampling" | Outline 7.4; PL-8 |
| k7-11.1 | [2] "Use it to trace the intruders, then launch attacks back at them"; key [3] "Make it available but not inviting, cleared by Ines" (Ines = General Counsel) | OSG ch. 17 (enticement vs entrapment) |
| k7-11.2 | key [2] "The vetted logistics sector feed" | SP 800-150 |
| k7-11.4 | [2] "Let the playbook decide, case by case, which business systems to shut down" | Outline 7.2; SP 800-61 Rev. 3 |
| k7-11.5 | [1] "Turn it off, and keep it off until the vendor stops all false positives" | Outline 7.2, 7.7 |
| k7-11.6 | [1] "Encrypted backups cannot be stored in any cloud object storage"; key [2] "Losing the server also loses or exposes the key" | SP 800-57 Pt 1 Rev. 5 (key backup) |
| k7-12.2 | key [0] "Staff trained on routes and wardens; visitors in the headcount" | Outline 7.15 |
| k7-12.4 | key [1] "Write an after-action report, then update each plan"; [2] "Run a full interruption test, with real power cuts, to see if it is worse" | SP 800-84 (after-action report); SP 800-34 sec. 3.5 |
| k8-01.2 | [0] "Hire a bigger test team, with more tools, for an intensive final week" | Outline 8.1 (shift left); SSDF PO.1, PW.1 |
| k8-02.2 | [0] "Delete the build logs, and any cached copies, so nobody sees the key" | SP 800-57 Pt 1 sec. 5.5; SSDF RV.1, RV.2 |
| k8-02.3 | [2] "Hold the fix until Tuesday's board, per the normal process" | OSG ch. 16; CM-3 (emergency change path exists) |
| k8-02.4 | [3] "Faster build servers, and a shorter window for tampering" | Outline 8.3; AU-9, IA-2 |
| k8-03.3 | [1] "Decompile, scan and audit the binaries, without telling the vendor" (still the engineer trap) | Outline 8.4 (COTS); SP 800-161 Rev. 1 |
| k8-03.6 | [0] "Rewrite the whole engine in Rust by summer" | CISA, The Case for Memory Safe Roadmaps (2023) |
| k8-04.5 | [3] "Only if a partner asks, and then only for the riskiest parts" | SSDF PW.1.1; outline 8.1 |

## Story reactions added: 25 scenes

- `r` (4 reactions, calc): k7-01.5, k7-04.4, k7-06.3, k7-06.4 (4 scenes, 16 strings). Each wrong number names its
  mistake (differential logic, forgot the full, wrong availability denominator, forgot testing, RPO mistaken for loss).
- `rr` (right, wrong): k7-01.3, k7-01.4, k7-02.5, k7-02.7, k7-03.3, k7-03.6, k7-05.3, k7-06.5, k7-07.1, k7-07.6, k7-08.1,
  k7-08.2, k7-09.4, k7-11.7, k8-01.4, k8-02.1, k8-03.2, k8-04.1, k8-04.6, k8-05.1, k8-05.3 (21 scenes, 42 strings).
- The reactions follow each case's open and close (for example the object-locked restore by Monday evening, backups
  moved to every 4 hours, "Defined" aiming for "Managed"). They add no technical claims beyond the scene's `why`.

## Check

`build-content-cissp.ts --check`: 0 errors and 0 warnings for D7 and D8. The remaining errors are missing reactions in
other domains.
