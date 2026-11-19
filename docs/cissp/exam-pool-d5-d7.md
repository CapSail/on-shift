# Board-exam pool: Domains 5 and 7

Files: `content/cissp/exam/d5.yaml` (34 items), `content/cissp/exam/d7.yaml` (32 items). Written 2026-11-19.
All new scenarios with neutral organizations. None reuses case wording: the validator's 8-word overlap check flagged x5-008 and x7-018, and both were reworded.

## Counts

| Domain | Items | diff 1 | diff 2 | diff 3 | best | first | calc | key position a=0/1/2/3 | traps |
|---|---|---|---|---|---|---|---|---|---|
| D5 | 34 | 12 | 14 | 8 | 32 | 1 | 1 | 9/7/9/9 | 2 |
| D7 | 32 | 11 | 13 | 8 | 25 | 6 | 1 | 8/8/8/8 | 5 |

Each difficulty level is at least 20% of each domain (the minimum is 7 items).

## Objectives covered

- D5: 5.1 ×4, 5.2 ×10, 5.3 ×3, 5.4 ×7, 5.5 ×5, 5.6 ×5. All 19 D5 concepts are used.
- D7: every objective from 7.1 to 7.15 has at least 2 items (7.2 and 7.7 have 3). There are 24 of 33 concepts, because 32 items cannot cover 33 concepts. These concepts are unused: forensic-imaging, siem-log-mgmt, threat-intel-hunting, ops-defense-in-depth, incident-reporting-lessons, firewalls-ids-ips, sandbox-honeypot, backup-types and ha-fault-tolerance.
- The 2027 items are covered: identities as assets, JIT, passwordless/passkeys, credential vaults, RAdAC, PDP/PEP, service accounts, privilege escalation, SOAR, UEBA, DLP, allowlisting, DDoS scrubbing, XDR, immutable backups, warm sites, the outline's DR test names, and duress and travel.

## Answer cues (`node scripts/check-cues-cissp.mjs --pool`, FIRST/BEST only)

| Cue | D5 | D7 |
|---|---|---|
| longest | 22.7% | 21.0% |
| shortest | 13.6% | 9.7% |
| words | 20.5% | 9.1% |
| hedge | 24.5% | 23.4% |
| clauses | 19.4% | 23.4% |

Most of the hedge figure is four-way ties (no hedge words in any option), which score exactly chance.

## Sources used

- NIST SP 800-63A-4, 63B-4 (AAL3, syncable authenticators, sessions, phishing resistance) and 63C-4.
- NIST SP 800-207 (PDP/PEP), SP 800-162 (ABAC), SP 800-53 Rev. 5 (AC-2, AC-6, IA-5, PS-4/5, CM-2/3/6), SP 800-34 Rev. 1 (sites, RPO, tabletop), SP 800-40 Rev. 4, SP 800-88, SP 800-128, SP 800-167 and SP 800-84.
- RFC 4120 (Kerberos), RFC 8907 (TACACS+), RFC 2865/3580 (RADIUS, 802.1X), RFC 6749 and OpenID Connect Core (OAuth vs OIDC), and RFC 3227 (volatility, custody).
- W3C WebAuthn L3, OASIS SAML 2.0, the CSRC glossary (RAdAC) and OWASP WSTG-ATHZ-03.
- FEMA HSEEP 2020, CISA BOD 22-01 (KEV), the ISC2 2027 outline and the OSG 9th ed. (chapters 5, 10, 13, 14, 16 to 19).

## Items I was less than certain about, and what I did

- **x5-016, x5-015 (SP 800-63C-4 "trust agreements", IdP/RP roles):** cited without section numbers because I did not re-read the document. The key rests on general federation logic: the partner IdP owns the identities.
- **x5-017 (SAML signature stripping):** this is cited to the OASIS SAML 2.0 Core and Profiles documents, which are not on the AUTHORING.md source list. The fact itself (an unsigned assertion means it can be forged) is not in doubt.
- **x5-028 (horizontal vs vertical escalation):** cited to OWASP WSTG-ATHZ-03 rather than the OSG, because I could not confirm the OSG wording. IDOR is deliberately not an option, so there is no second right answer.
- **x5-010 (identity proofing):** the key is "validate the document and verify against a live photo". The why does not claim that 63A-4 bans KBV outright. It says only that KBV uses data attackers can buy.
- **x7-005 (DLP needs classification first):** cited to OSG ch. 5 and the outline, not a NIST control. The key follows ISC2's "understand before acting" teaching.
- **x7-010 (SP 800-88):** cited without a revision or section number, because Rev. 2 (2025) reorganized the document. Purge for media leaving organizational control, and crypto erase as a purge method, are both long-standing.
- **x7-024 ("least critical first" when returning to the primary site):** this rests on the OSG ch. 18 teaching alone.
- **x7-026 (parallel vs simulation):** the scenario requires real transactions at full load with no production risk. Only a parallel test meets both conditions under the OSG definitions. Walkthrough and tabletop are never set against each other, following the note in sources-d5-d7.md.
- **x7-016 (XDR):** SIEM is deliberately left out of the options, because a SIEM could also correlate these sources.

## Validator note (not my file)

In the current uncommitted `scripts/build-content-cissp.ts`, the pool section has two escaping bugs that reject every writer's items:
- Line 223: `` new RegExp(`^x${s.d}-\d{3}$`) `` needs `\\d`.
- Line 237: the `\b` in the BEST check has become literal backspace characters.

I checked D5 and D7 against the intended rules with a scratch script. All ids, FIRST/BEST wording and word limits pass.
