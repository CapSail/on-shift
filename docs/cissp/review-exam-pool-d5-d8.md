# Accuracy review: board-exam pool D5-D8

Reviewer pass over all 122 items in `content/cissp/exam/d5.yaml` .. `d8.yaml` (x5-001..034, x6-001..028,
x7-001..032, x8-001..028). For each item I checked the key, the distractors, every factual claim, the citations
and the answer shape. I redid the calc items x5-009, x6-011, x6-016 and x7-023, and they are correct.

Result: no key changes. 7 items fixed (1 text ambiguity, 1 answer-shape giveaway, 5 citation fixes), all in d5
and d7. Build: 0 errors, 0 warnings. Pool cue stats are unchanged at 25.3% or below per domain.

## Fixes

| id | problem | change | source checked |
|---|---|---|---|
| x7-023 | The calc depends on the nightly full backup being offsite. The text did not say so, and if the base backup is not offsite, the shipped logs alone cannot restore anything. | Text: "takes a full backup nightly at 01:00" is now "sends a full backup offsite nightly at 01:00". Key unchanged (3.5 h). | NIST SP 800-34 Rev. 1 TOC (sec. 3.2.1 is right) |
| x5-008 | The key option was clearly the longest and most detailed (83 chars against 66-72), which gives the answer away. | Key is now "Reject it, since AAL3 needs a non-exportable, device-bound key". Meaning unchanged. | SP 800-63B-4 sec. 2.3.2: "syncable authenticators SHALL NOT be used at AAL3" (keys must be non-exportable); App. B |
| x5-007 | The src cited SP 800-63B-4 sec. 2 for authentication factors, but sec. 2 covers AALs. The factor wording ("something you know") is in sec. 3.1. | src now cites sec. 3.1 (authenticator types). | pages.nist.gov/800-63-4/sp800-63b.html |
| x5-015 | The src cited SP 800-63C-4 with no section. | src now cites "sec. 3 (federation roles: IdP and RP)". | pages.nist.gov/800-63-4/sp800-63c.html (sec. 3, Common Federation Requirements: Federation Models, Roles) |
| x5-016 | The src cited SP 800-63C-4 with no section. | src now cites "sec. 3.5 (trust agreements)". The key stands: the trust agreement sets the partner's obligations, and 63C-4 sec. 3.10 also requires IdPs to deprovision RP accounts for terminated subscribers. | same |
| x5-017 | The SAML citation was vague. | src now cites OASIS SAML 2.0 Core sec. 5 (XML Signature), SAML 2.0 Profiles sec. 4.1.4.5 (with the POST binding each assertion MUST be signed) and the OWASP SAML Security Cheat Sheet. | docs.oasis-open.org saml-profiles-2.0-os; cheatsheetseries.owasp.org |
| x5-028 | Citation only. The scenario (changing an account number) is an IDOR, so the IDOR test also applies. | src adds WSTG-ATHZ-04 (insecure direct object references) beside ATHZ-03 (privilege escalation). | OWASP WSTG v4.2 |
| x7-010 | The src cited SP 800-88 with no revision. Rev. 2 (Sept. 2025) is current. | src now cites "NIST SP 800-88 Rev. 2 (Sept. 2025) (clear, purge, destroy; decision flow for media leaving the organization; sec. 3.2.5 cryptographic erase prerequisites)". Key stands: under Rev. 2, CE is still a purge technique and still the one technique given in detail, because modern SSDs are self-encrypting. | csrc.nist.gov SP 800-88r2 and the r2 FAQ (Q1, Q9, Q12) |

## Checked and left as is

- **x7-024** (OSG only: move the least critical functions back first). This is the standard ISC2/OSG teaching
  (OSG 9th ed. ch. 18) and is consistent across the major CISSP references. No public NIST text states it, so
  the OSG citation is the right one.
- **x6-006** (pause the shared-hosting address "until the IT manager confirms scope"). A purist could note that
  the IT manager cannot authorize the provider's system. But "confirms scope" covers removing the address or
  getting the provider's authorization, and the why says this. I tried rewording the key, but it pushed D6 cue
  stats to 25.0% (longest) and 29.2% (clauses), so I reverted it.
- **x6-020**. The distractor [3] is noticeably longer than the key. That does not give away the key, and
  trimming it raised D6 cue stats, so I reverted it.
- **x6-014**. "Patches deployed within target" could be called a KRI in some frameworks. The key (internet-facing
  hosts open to known exploited flaws) is clearly the better early-warning exposure metric, so this is acceptable.
- **x5-032**. The why already flags the gap between ISC2 and RFC 8907: CISSP says TACACS+ encrypts the body,
  while RFC 8907 calls it obfuscation. Good as is.
- I verified that the SP 800-34 Rev. 1 section numbers in x7-021 (3.4.2), x7-022 (3.4.3), x7-023 (3.2.1) and
  x7-025 (3.5.3) are correct.
