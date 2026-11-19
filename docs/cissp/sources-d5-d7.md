# Sources checked: Domains 5 (IAM) and 7 (Security Operations)

Content: `content/cissp/d5.yaml`, `content/cissp/d7.yaml`. Written 2026-11-18. Checked means the claim was read in the source at the URL below during writing. Claims marked *(OSG)* rest on the ISC2 CISSP Official Study Guide (Sybex, 9th ed.) and long-standing CISSP teaching; they were not re-read online.

## Outline

| Claim | Source | URL |
|---|---|---|
| 2027 objective wording and bullets for 5.1-5.6 and 7.1-7.15 (identities added to 5.1; JIT, passwordless, credential management in 5.2; RAdAC and PDP/PEP in 5.4; privilege escalation and service accounts in 5.5; 5.6 has no bullets) | ISC2 CISSP Exam Outline, effective April 15, 2027 (local text copy, o27.txt) | https://www.isc2.org/certifications/cissp/cissp-certification-exam-outline |
| ISC2 spells out RAdAC as "Risk-Adaptable Access Control" and MTTR as "Mean Time to Resolve" | same | same |
| ISC2 incident management steps: detection, response, mitigation, reporting, recovery, remediation, lessons learned | 2027 outline 7.6; *(OSG ch. 17)* | same |
| DR test types listed as read-through/tabletop, walkthrough, simulation, parallel, full interruption | 2027 outline 7.12; *(OSG ch. 18)* | same |
| "External security controls" (2024: "perimeter") and internal controls; personnel safety bullets: travel, training and awareness, emergency management, duress | 2027 outline 7.14, 7.15 | same |

## Domain 5

| Claim | Source | URL |
|---|---|---|
| AAL1: single- or multi-factor. AAL2: two factors, verifier SHALL offer a phishing-resistant option. AAL3: phishing resistance required, cryptographic authenticator with non-exportable private key | NIST SP 800-63B-4 sec. 2.1-2.3, 3.2.5 | https://pages.nist.gov/800-63-4/sp800-63b.html |
| Syncable authenticators (synced passkeys) allowed at AAL2, SHALL NOT be used at AAL3 | SP 800-63B-4 sec. 2.3.2, App. B | same |
| Reauthentication: AAL2 overall ≤ 24 h (SHOULD), inactivity ≤ 1 h; AAL3 overall ≤ 12 h (SHALL), inactivity ≤ 15 min | SP 800-63B-4 sec. 2.2, 2.3 | same |
| SMS/PSTN out-of-band is a "restricted" authenticator | SP 800-63B-4 sec. 3.1.3.3, 3.2.9 | same |
| Section layout: sec. 4 events (4.2 recovery), sec. 5 session | SP 800-63B-4 table of contents | same |
| IAL1/IAL2 allow remote or on-site proofing; IAL3 adds an on-site attended session with a trained proofing agent and collection of a biometric | NIST SP 800-63A-4 sec. 4.1-4.3 | https://pages.nist.gov/800-63-4/sp800-63a.html |
| Passkeys: synced (end-to-end encrypted) or device-bound; private key stays on the device; biometric stays on the device; phishing resistant because each passkey is bound to one service | FIDO Alliance, Passkeys | https://fidoalliance.org/passkeys/ |
| WebAuthn credentials are scoped to the relying party and can only be used by its origins | W3C Web Authentication Level 3, sec. 1, 4 | https://www.w3.org/TR/webauthn-3/ |
| PDP = policy engine (decides, logs) + policy administrator (sets up/tears down path, configures PEP); PEP enables, monitors and terminates connections; CDM and threat intel are data sources | NIST SP 800-207 sec. 3 | https://doi.org/10.6028/NIST.SP.800-207 |
| RAdAC: access decisions balance security risk against operational need, using heuristics; NSA (McGraw) 2009 | NIST CSRC Glossary (from CNSSI 4009); McGraw, RAdAC paper, NIST Privilege Management Workshop 2009 | https://csrc.nist.gov/glossary/term/risk_adaptive_adaptable_access_control |
| TACACS+ uses TCP 49; body "obfuscation" (sec. 4.5), which RFC 8907 sec. 10.1 says gives no meaningful privacy; CISSP teaching calls it "encrypts the whole packet". Content says "protects the whole body" and notes the difference | RFC 8907 | https://www.rfc-editor.org/rfc/rfc8907 |
| RADIUS over UDP hides only the User-Password attribute; RADIUS used with 802.1X | RFC 2865 sec. 5.2; RFC 3580 | https://www.rfc-editor.org/rfc/rfc2865 |
| OAuth 2.0 is an authorization framework; OIDC adds authentication (ID token) | RFC 6749 sec. 1; OpenID Connect Core 1.0 | https://www.rfc-editor.org/rfc/rfc6749 |
| Kerberos: AS issues TGT, TGS issues service tickets; tickets encrypted in the server's key, so a stolen KDC (krbtgt) key lets attackers forge TGTs | RFC 4120 sec. 1, 3, 5.3 | https://www.rfc-editor.org/rfc/rfc4120 |
| ABAC uses subject, object, action and environment attributes | NIST SP 800-162 sec. 2 *(not re-read)* | https://csrc.nist.gov/pubs/sp/800/162/upd2/final |
| DAC, MAC, RBAC, rule-based definitions | *(OSG ch. 14)*; NIST IR 7316 | https://csrc.nist.gov/pubs/ir/7316/final |
| Control numbers used: AC-2, AC-2(2), AC-2(4), AC-2(j), AC-5, AC-6, AC-6(2), AC-6(9), IA-2, IA-5, PS-4, PS-5, PE-2, PE-3 | NIST SP 800-53 Rev. 5 *(from memory of the catalog)* | https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final |

## Domain 7

| Claim | Source | URL |
|---|---|---|
| Order of volatility: registers, cache; routing table, ARP cache, process table, kernel statistics, memory; temporary file systems; disk; remote logging and monitoring data; physical configuration, network topology; archival media | RFC 3227 sec. 2.1 | https://www.rfc-editor.org/rfc/rfc3227 |
| Chain of custody: document where, when, by whom evidence was found, collected, handled, examined; who had custody, for how long, how stored; each transfer | RFC 3227 sec. 4.1 | same |
| Forensic phases collection, examination, analysis, reporting; write blockers and hashes when acquiring data | NIST SP 800-86 sec. 3, 3.1.2 *(not re-read)* | https://csrc.nist.gov/pubs/sp/800/86/final |
| Evidence must be relevant, material and competent | *(OSG ch. 19)* | n/a |
| Cold site: space and infrastructure; warm: partly equipped; hot: fully equipped with personnel; mobile and mirrored sites; mirrored most expensive, cold cheapest; alternate site should not share the primary's hazard; reciprocal agreements are an option | NIST SP 800-34 Rev. 1 sec. 3.4.3 | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf |
| Backup policy sets frequency and scope (full or incremental); offsite storage criteria (geography, accessibility, security, environment, cost) | SP 800-34 Rev. 1 sec. 3.4.2 | same |
| Tabletop exercises are discussion-based; functional exercises validate operational readiness | SP 800-34 Rev. 1 sec. 3.5.3 | same |
| MTD, RTO, RPO defined in the BIA | SP 800-34 Rev. 1 sec. 3.2.1 | same |
| Restore sets: full + every incremental since; full + latest differential. Worked case: Sunday full, Mon-Fri incrementals, failure Saturday = 6 sets | *(OSG ch. 18)*; arithmetic | n/a |
| Availability = MTBF / (MTBF + MTTR); 990 / 1,000 = 99.0% | standard reliability formula | n/a |
| RTO margin: 20 + 14 + 6 = 40 h against 48 h = 8 h; 6-hour backup interval can lose 6 h, exceeds a 4-hour RPO | arithmetic on SP 800-34 definitions | n/a |
| DR test order by disruption: read-through/tabletop, walkthrough, simulation, parallel, full interruption; parallel runs the alternate site while production continues | 2027 outline 7.12; *(OSG ch. 18)* | outline URL |
| HSEEP: discussion-based (seminars, workshops, tabletops, games); operations-based (drills, functional, full-scale) | FEMA HSEEP 2020 *(not re-read)* | https://www.fema.gov/emergency-managers/national-preparedness/exercises/hseep |
| Honeypots: enticement allowed, entrapment not; sandboxing | *(OSG ch. 17)* | n/a |
| IDS passive (copy of traffic), IPS inline | NIST SP 800-94 sec. 2, 4 *(not re-read)* | https://csrc.nist.gov/pubs/sp/800/94/final |
| GDPR breach notification to the supervisory authority within 72 hours where feasible | GDPR Art. 33(1) | https://eur-lex.europa.eu/eli/reg/2016/679/oj |
| Media sanitization methods clear, purge, destroy; cryptographic erase as a purge technique | NIST SP 800-88 *(not re-read)* | https://csrc.nist.gov/pubs/sp/800/88/r2/final |
| Patch management depends on asset inventory; risk responses when patching is not possible | NIST SP 800-40 Rev. 4 *(not re-read)* | https://csrc.nist.gov/pubs/sp/800/40/r4/final |
| Application allowlisting | NIST SP 800-167 | https://csrc.nist.gov/pubs/sp/800/167/final |
| Configuration baselines and monitoring | NIST SP 800-128; SP 800-53 Rev. 5 CM-2, CM-3, CM-6 | https://csrc.nist.gov/pubs/sp/800/128/upd1/final |
| Log management, time stamps, protected audit storage | NIST SP 800-92; SP 800-53 Rev. 5 AU-6, AU-8, AU-9(2), AU-9(4) | https://csrc.nist.gov/pubs/sp/800/92/final |
| HIPAA references: 45 CFR 164.308(a)(4) information access management; 164.312(e) transmission security | HIPAA Security Rule | https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C |

## Places where the ISC2 answer is debatable (handled in content)

- **Read-through vs tabletop vs walkthrough.** The OSG pairs "structured walk-through" with "tabletop", but the 2027 outline pairs "read-through/tabletop" and lists "walkthrough" separately. The content uses the outline's labels and order, and no scene asks you to tell tabletop and walkthrough apart.
- **TACACS+ "encryption".** CISSP material says it encrypts the whole packet. RFC 8907 calls this obfuscation and says it is weak. The content says "protects the whole body" and gives the nuance in the concept.
- **Resource capacity agreements.** The outline names the term but does not define it. The content treats it like a reciprocal or capacity guarantee, with SP 800-34's warnings (capacity, shared hazard). It is used in one scene only.
- **IR step names.** NIST SP 800-61 Rev. 3 now follows the CSF 2.0 functions. The content teaches ISC2's seven steps and cites the outline and OSG for them.
