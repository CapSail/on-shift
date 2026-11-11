# Content QA pass (Phase 0.4)

Finishes the second-pass audit that was cut off by the usage limit. Everything below is in git as content changes; ids were never changed.

## What was found and fixed

**Concept registry**
- 10 concept ids were defined in both `concepts_a.yaml` and `concepts_c.yaml` with *different* rules (the old build silently kept the first). Merged to one canonical rule each, chosen so the rule holds for every alert that uses it: `lsass-access`, `dll-sideload-signer`, `kerberoast-source`, `container-escape`, `mailbox-hide-rule`, `external-forward`, `teams-external-phish`, `internal-scan`, `cron-persist`, `ssh-authkeys`.
- `kerberoast-source` and `lsass-access` rules now cover the malicious *and* the red-team / EDR twins (the old rule only described the benign side).
- `covert-tunnel-egress` said "Servers..." but `e23` is a workstation; reworded.
- 6 rules were 16-17 words (limit 15); shortened.
- Concept `tac` values used "Defense Evasion", which no longer exists in ATT&CK v20.1 (split into Stealth and Defense Impairment); remapped.

**Name consistency after renames** (profile paths and tells naming people who are not in the alert)
- `e04`, `e13`, `e32`, `x01`, `e34`: `C:\Users\<name>` did not match the host-line user.
- `e16`, `i08`: tells named "Ana", who is not in the alert. `c12`: the log line said spam went to "ana"; the victim is `cflores`.
- `l01`: tell said `www-data`; the host-line user is `www-app`.

**`k` points at the line the tell describes**: `z10`, `z33`, `z41`, `z44`, `z45`, `z59`, `z69` retargeted. `e16`, `m01`, `z13` reviewed and left (the tell narrates the scary part; the deciding line is the context).

**`say` must not leak the verdict**: no hard leaks found. `n10` reworded (dropped "exploit attempt ... blocked ... known scanner" framing); `t07`, `t08` trimmed to 25 words.

**Single-line alerts** (`e20`, `e23`, `e31`, `e39`) had only one log line, which made the evidence pick trivial. Each got one neutral context line (signer / parent / ActionType); the deciding line is unchanged.

## Checked, no change needed

- **Twin pairs**: read all 59 multi-alert concepts (rule next to every member's deciding line, `npm run qa`). After the merges above, every rule holds for both sides of every pair.
- **Ticket shortcut**: 16 benign vs 10 malicious alerts mention a ticket/CHG in their log lines (62% benign, against a bank that is 45% benign). A mild lean, and `alerts5.yaml` carries the forged / stale / borrowed-ticket attacks. The build now warns if it passes 75%.
- **Technical accuracy spot-check**: every log source and event id against what its alert shows (Sysmon 1/10/21, Security 1102/4624/4662/4698/4740/4768/4769, System 7045, PowerShell 4104, Defender 1116, Defender XDR table names, Entra/Exchange/Teams/SharePoint audit sources). Read closely about 35 command lines (comsvcs MiniDump syntax, smbexec/wmiexec output paths, Squiblydoo, plink -R, bitsadmin, AMSI `amsiInitFailed`, ProcDump rename, LSASS masks 0x1000/0x1010/0x1410/0x1fffff, RC4 0x17). No inaccuracies found. The ATT&CK mapping fixes from the v1 accuracy review (`docs/reviews/review_accuracy.md`) were already applied in v2.
- **Not done**: a line-by-line technical audit of all 181 alerts and 38 incident alerts. The spot-check above is a sample, not a full audit.

## Known gaps (content to add, not defects)

- One-sided concepts, no twin or callback counterpart: `lolbin-remote-script`, `covert-tunnel-egress`, `log-clearing`, `mimikatz-present`, `password-spray-brute`, `helpdesk-mfa-reset`, `cloud-principal-abuse`, `container-escape` (all malicious only) and `internet-bg-noise` (benign only). The accuracy review's suggestion to add a benign `regsvr32` pair for `e20` belongs here.
- 44 of 103 shift concepts have a single alert, so a miss on them has no different alert to come back as.
- The bank is 45% benign; the brief's target for new drops is 55-60%.

## Tooling added so this stays fixed

`npm run validate` runs all of the above on every build (see README). `npm run qa` prints the twin table for human review on each content drop.
