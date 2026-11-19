# Board-exam pool: Domains 1, 2 and 8

Written 2026-11-19. Files: `content/cissp/exam/d1.yaml`, `d2.yaml`, `d8.yaml`. Format and rules: `AUTHORING.md`, "The board-exam pool".

## Counts

| Domain | Items | diff 1 / 2 / 3 | Kinds | Key position a=0/1/2/3 | Engineer traps |
|---|---|---|---|---|---|
| D1 | 34 | 12 / 15 / 7 | 27 best, 4 first, 3 calc | 9 / 9 / 8 / 8 | 3 |
| D2 | 30 | 9 / 13 / 8 | 26 best, 4 first | 8 / 7 / 8 / 7 | 4 |
| D8 | 28 | 6 / 16 / 6 | 25 best, 3 first | 7 / 7 / 7 / 7 | 4 |

Every difficulty is at least 20% of its domain. Validator (`CISSP_DRAFT=1 ... build-content-cissp.ts`): 0 errors for these files.

Answer cues (`check-cues-cissp.mjs --pool`, FIRST/BEST items, chance 25%):

| Domain | longest | shortest | words | hedge | clauses |
|---|---|---|---|---|---|
| D1 | 17.7 | 16.1 | 22.8 | 25.0 | 25.3 |
| D2 | 20.0 | 10.0 | 14.2 | 23.3 | 17.8 |
| D8 | 14.3 | 17.9 | 14.0 | 24.1 | 22.9 |

## Objectives covered (items per objective)

- D1: 1.1 3 · 1.2 2 · 1.3 3 · 1.4 6 · 1.5 2 · 1.6 2 · 1.7 3 · 1.8 2 · 1.9 5 · 1.10 2 · 1.11 2 · 1.12 2. 24 of 25 D1 concepts have an item (not `business-alignment`: my draft was too close to case k1-01's opening scene, so it became a control-frameworks item); risk maturity models are not tested, risk reporting is. 2027 additions covered: AI ethics, HIPAA (BA status, breach notice), SLAs in vendor contracts, external dependencies in the BIA, PUF, measuring awareness.
- D2: 2.1 5 · 2.2 5 · 2.3 3 · 2.4 7 · 2.5 4 · 2.6 6. All 13 concepts. 2027 additions: data management policy, CNAPP, handling requirements, retirement.
- D8: 8.1 9 · 8.2 6 · 8.3 4 · 8.4 5 · 8.5 4. All 13 concepts. 2027 additions: SSDF, SBOM, shift left, IPT, memory-safe languages, CI/CD and repos, SCA, API security.

## Sources leaned on

ISC2 Code of Ethics; ISC2 CISSP Official Study Guide (ch. 1-5, 16, 19, 20); 2027 outline. GDPR Art. 5, 6, 28(10), 33, 34, 44-46; 45 CFR 160.103, 164.404-408 and HHS cloud guidance; EAR (15 CFR 730-774); 18 U.S.C. 1839, 35 U.S.C. 154, 17 U.S.C. 102(b); FRCP 37(e); EO 13526. NIST SP 800-34, 800-39, 800-50r1, 800-53r5 / 53B, 800-88r2 and FAQ, 800-111, 800-144, 800-161r1, 800-204D, 800-218, AI 100-1; FIPS 186-5, 198-1, 199, 200; NIST CSF 2.0. ISO/IEC 27001/27002:2022. OWASP SAMM, ASVS, API Top 10 2023, CI/CD Top 10, SQLi/XSS/Secrets cheat sheets; CWE-89, -79, -367; CISA/NSA memory-safety papers; NTIA SBOM minimum elements; AICPA SOC 2; SEI SW-CMM.

## Items I was less than certain about, and what I did

- **x1-001 (canon order).** The current ISC2 Code does not state a precedence rule in its text; the Study Guide teaches the canons in priority order. Kept, with the OSG cited; the scenario (public safety vs client) is the case where every source agrees.
- **x1-019 (RTO + WRT within MTD).** This is the Sybex/CISSP formulation; NIST only says RTO < MTD. The `why` says "In CISSP terms".
- **x1-027 (compensating control).** A next-morning review is also detective in function, so "Detective" was left out of the options; the ask says "given the reason it was added".
- **x1-032 (PUF).** Cited to the 2027 outline and Herder et al., Proc. IEEE 2014, from memory (not re-fetched). The item rests only on the core definition (identity from silicon variation, no stored key).
- **x2-006 (courier transport).** I did not find an ISO clause that forbids outer markings, so the `why` only says large outer markings advertise the contents, and the key rests on tamper-evident packaging, approved courier and custody records.
- **x2-025 (confidential computing).** Cited to the Confidential Computing Consortium definition (from memory). The key depends only on "data in use is protected by a hardware TEE".
- **x2-026 / x2-027 (scoping vs tailoring).** NIST treats scoping as part of tailoring; both items say "In CISSP terms" or avoid needing the split (x2-027 hinges on the control still applying).
- **x2-030 (CNAPP).** No standards-body definition exists; the item uses only the widely agreed core (CSPM + CWPP + entitlement management), as in `sources-d1-d2-d6.md`.
- **x8-024 (SOC reports).** A SOC 3 can also come from a period-of-time engagement, so the `why` says why Type II SOC 2 is still the best evidence (detailed tests and results).
- **x8-019 (outcome metric).** Cites OWASP SAMM Strategy and Metrics and SP 800-55 generally, with no section numbers.

## Notes for the maintainer

- During this work `scripts/build-content-cissp.ts` briefly contained literal backspace characters (`\b` written as 0x08) and an unescaped `\d` in a template-literal RegExp, which rejected every valid id and FIRST/BEST ask. It was fixed by someone else before I finished; the final check above uses the fixed script.
- The session scratchpad is shared with the other writers: a validator copy I placed there was overwritten. My helpers live in `scratchpad/w128/`.
