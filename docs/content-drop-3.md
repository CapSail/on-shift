# Content drop 3 (content_version 3)

100 new alerts (`y101`-`y200`, `alerts11-15.yaml`) and 45 new concepts (`concepts_e1-e5.yaml`). Bank: 381 alerts, 213 concepts, 339 twin pairs. 45 true positives, 55 benign.

Five themes, each written as TP/benign twins grounded in real incidents and genuinely common benign operations:

| Alerts | Theme | Real-world anchors |
|---|---|---|
| y101-y120 | Windows endpoint and AD tradecraft | PrintNightmare, Zerologon, noPac, ProxyShell export, Log4Shell via Horizon, Veeam credential reads, SharpHound sweeps |
| y121-y140 | Identity and cloud | AiTM token replay, Midnight Blizzard test-tenant path, post-reset MFA enrollment, Azure Run Command, IMDS SSRF, S3 SSE-C overwrite (Codefinger), Golden SAML, SAS-token bulk reads |
| y141-y160 | Network, email, web | Citrix Bleed, Ivanti, ProxyShell follow-up, PrinterBug/ESC8 coercion, ClickFix, Gootloader, encrypted-archive delivery, JA3/JARM context |
| y161-y180 | Linux, macOS, supply chain | xz/sshd, npm postinstall egress, tj-actions secret dump, Docker API (Kinsing), Confluence OGNL, PwnKit, eBPF, ssh-agent hijack, AMOS fake password prompt |
| y181-y200 | Ransomware, insider, edge | Veeam credential store, ESXi VM kill, rclone to MEGA, archive staging, departing-user exports, BadUSB vs token, rogue implant vs scanner, payroll bank change, registrar NS change |

## Status

- Validation, lints and all tests pass. `daily_pool_drop` is 3 (raised 2026-11-12 at the owner's request), so this drop is in the shared daily and the weekly boss as well as personal shifts.
- **Not yet reviewed by a human expert.** The writers were told to stay generic where unsure and to list claims worth a second look. Skim these first:

**Technical claims flagged for an expert check**
- Exchange/ProxyShell: the `autodiscover.json` `@` query shape, the Mailbox Import Export role assignment, the `.aspx` inside a PST; Zerologon event 5830/5829/4742 handling; noPac sequence (SPN clears, rename back, S4U2self 4769).
- Citrix Bleed (CVE-2023-4966 oversized Host header path); Ivanti request path and CGI implant mechanism; PrinterBug to web-enrollment timing; T1204.004 for ClickFix; Gootloader details; JA3 sharing between Go TLS and Sliver.
- Midnight Blizzard (test account, then consent to `full_access_as_app`); Codefinger SSE-C with 7-day lifecycle expiry; the SSE-C bucket-policy condition; AWS Elastic Disaster Recovery launching instances; Golden SAML (DKM read, missing issuance events); SAS token flags and "rotate the account key to kill the SAS".
- xz: Debian 12 ships 5.4.1 and the TP uses 5.6.1-1; Shai-Hulud/ua-parser-js; tj-actions double-base64 dump; Kinsing; Confluence 7.18.0 and the June 2022 fix; PwnKit log wording; `bpf_probe_write_user` kernel warning text; Cilium bpffs paths; Jenkins durable-task path; AMOS (`dscl -authonly`, `security find-generic-password`); Jamf secure-token scripting.
- Veeam: CVE-2023-27532, the `VEEAMSQL2016` instance, `dbo.Credentials`, `.bco`; ESXi: `.akira` behaviour, soft/hard/force `esxcli` kill order, vSphere VM Encryption via KMIP; rclone `mega` backend and endpoint; FIN7 mailed-USB campaign; Yubico OTP shape; registrar-hijack technique mapping (T1584.001); OneDrive 30-day retention; T1657 for payroll diversion.

Fixing an alert keeps its `id`.
