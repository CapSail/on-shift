# Accuracy review: Domains 1, 2 and 6

Reviewed 2026-11-18 against the 2027 CISSP outline, the writer's source log and the cited authorities. Scope: every concept and scene in `content/cissp/d1.yaml` (61 scenes), `d2.yaml` (30) and `d6.yaml` (31).

## Verdict

The content is accurate. Every key matches what ISC2 or the cited authority would key. All calculations are correct when redone (ALE, control value, 72 hours, 60 days to May 2, 99.9% SLA, RTO = MTD - WRT, the HIPAA 6-year retention, coverage, KRI and report-rate percentages). Every rank order is fixed by its source, and every sort item fits exactly one bin. The 2027 terms are used correctly: there is no "industry standards" investigation type, "attack simulations" and "responsible disclosure" are used, and the outline's internal/external/third-party audit split is followed. No key was wrong. The 4 changes below fix small precision and cue problems.

## Changes

| Scene / concept | Problem | Fix | Source checked |
|---|---|---|---|
| concept `breach-notification` (d1), bullet 3 | Said HHS is told "at once" for 500 or more. The rule is "contemporaneously with" the notice to individuals, within 60 days, not immediately. | Changed to "told alongside individuals". | 45 CFR 164.408(b), https://www.law.cornell.edu/cfr/text/45/164.408 |
| k1-01, scene 1 (`business-alignment`) `src` | Cited "SP 800-39 sec. 2 (risk framing)". Section 2 is the fundamentals; risk framing is sec. 3.1. | `src` now cites sec. 3.1 (framing risk). | NIST SP 800-39, https://csrc.nist.gov/pubs/sp/800/39/final (table of contents) |
| k1-01, scene 4 (`control-cost-benefit`) | The keyed option was much longer than the distractors (77 characters against about 55), a test-wise cue. | Shortened to "Decline as offered: it costs $20,000 a year more than it saves". | n/a (wording only; math unchanged) |
| k6-05, scene 5 (`attack-simulations`) | The keyed option was the longest by a wide margin and listed every element, a test-wise cue. | Shortened to "Get management approval, an agreed scope and a stop procedure". The `why` still covers safety limits. | n/a (wording only) |

Validator: `node ./node_modules/tsx/dist/cli.mjs scripts/build-content-cissp.ts --check` gives 0 errors and 0 warnings.

Spot-checks of the writer's log: HHS FAQ 2077 (a cloud provider is not a conduit; it is a business associate even if it holds only encrypted data and no key) was confirmed at https://www.hhs.gov/guidance/document/faq-2077-can-csp-be-considered-be-conduit-postal-service-and-therefore-not-business. The other citations were checked from standing knowledge of the documents and match:
- SP 800-115: sec. 5.2, the four phases, and Appendix B (rules of engagement)
- IIA Standards: Principle 7 and Standard 7.1
- 45 CFR 164.316(b)(2)(i)
- ISO/IEC 27002:2022 control numbers
- OWASP API1:2023
- PCI DSS Appendix B
- SSDF PW.1, PW.7 and PW.8

## Debatable items left as written

- **k6-04.1 (customer audit keyed as third-party).** Kept. The 2027 outline separates External ("outside organization control") from Third-party ("outside of enterprise control"). The ISC2 Official Study Guide defines third-party audits as audits done by or for another organization, and external audits as audits by an outside firm the organization hires. The scene says "In CISSP terms", and the External reaction explains the difference.
- **k2-03.6 (scoping vs tailoring).** Kept. The Official Study Guide treats scoping (dropping controls that do not apply) and tailoring (adjusting the remaining controls to the mission) as separate steps. The `ask` says "In CISSP terms", and the `why` notes that NIST SP 800-53B counts scoping as part of tailoring.
- **k1-08.2 (certification study keyed as education).** Kept. The Official Study Guide (ch. 2) says education is most often associated with people pursuing certification or promotion. That is the ISC2 answer, though NIST SP 800-50 Rev. 1 and some programs would call certification prep training.
- **k6-03.1 ("Active accounts that belong to leavers" as a KRI).** Kept. It could also be read as a deprovisioning performance measure. As worded (a count of exposure, not a rate against a target) it fits the KRI bin, and the scene pairs it with clear KPIs.
