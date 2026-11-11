# Content drop 2 (content_version 2)

100 new alerts (`y01`-`y100`, `alerts6-10.yaml`) and 43 new concepts (`concepts_d.yaml`). Bank: 281 alerts, 168 concepts, 239 twin pairs.

| | |
|---|---|
| Verdicts | 45 true positives, 55 benign (bank is now 49% benign; the target for drops is 55-60%) |
| Difficulty | 34 at diff 2, 66 at diff 3 |
| Domains | identity 23, cloud/SaaS 21, linux/k8s 19, endpoint 16, macOS 8 (new), network + OT/ICS 8, email 4, edr 1 |
| Traps | 55 `scary` benigns; the malicious twins are plain on purpose |

## What it covers

- **Twins for every one-sided concept** from the Phase 0 gap list (regsvr32 and tunnels, log clearing, Mimikatz, password spray, help-desk MFA reset, cloud principal abuse, container escape, internet noise).
- **Windows endpoint/AD pairs:** msiexec, wmic XSL, remote scheduled tasks, local admin creation, IFEO debuggers, RDP session hijack vs consented shadowing, ADCS ESC1 vs NDES, GPO immediate tasks, SID history vs ADMT, service-account interactive logons, PIM, named locations, app owners, guest invites.
- **Linux / Kubernetes / cloud IaaS:** prod pod exec, runtime socket mounts, `ld.so.preload`, secret listing, AWS cross-account AssumeRole, GCP node identity vs Workload Identity, setuid, kernel modules, auditd blinding, strace harvesting.
- **SaaS:** Okta, Google Workspace, GitHub, Slack, Salesforce, Snowflake.
- **macOS, email, network, OT/ICS:** LaunchAgents, TCC, quarantine, keychain; calendar-invite phish, mailbox delegation; SMTP fan-out, internet RDP; Modbus writes and vendor access into an OT DMZ.

Every malicious alert has a benign twin sharing its concept (and the reverse), and each concept rule was written to hold for both sides.

## How the daily and the boss are protected from content drops

`content/meta.yaml` has `daily_pool_drop: 1`. The shared daily shift and the weekly boss draw only from alerts whose drop is `<=` that number, so adding a drop does not change today's daily or this week's boss for people on different versions. **Personal shifts use every alert.** To bring drop 2 into the shared pool, set `daily_pool_drop: 2` at a quiet moment and tell the group. (Day boundaries are also fixed to America/Chicago now, so time zones no longer change the daily.)

## Review status

Validation, the editorial lints and the end-to-end tests all pass, so the content is mechanically sound: schema, ATT&CK ids live in v20.1, rules hold for both twins, no verdict leaks in `say`, names consistent.

**Not yet reviewed by a human SOC expert.** I drafted the technical content (log fields, event names, command lines, product behaviour) and checked it against my own knowledge, not a second source. Skim these before sharing the link, in this order of risk:
1. Product-specific claims: Okta event types, Google Workspace `AUTHORIZE_API_CLIENT_ACCESS`, Salesforce `ReportExport`, Snowflake history views, GitHub audit actions, Modbus function codes and register ranges.
2. macOS behaviour (TCC writes needing Full Disk Access, `xattr`, Jamf paths, the Microsoft AutoUpdate agent path).
3. Anything where a benign twin depends on a subtle discriminator (`y08`, `y24`, `y44`, `y58`, `y94`, `y99`).

Fixes keep the alert `id`.
