# Accuracy review: Domains 5 (IAM) and 7 (Security Operations)

Reviewed 2026-11-18 against the 2027 CISSP outline (o27.txt) and primary sources. Scope: all 18 D5 and 30 D7 concepts, and all 120 scenes (D5 41, D7 79) in `content/cissp/d5.yaml` and `content/cissp/d7.yaml`.

## Verdict

The content is accurate. No scene has a wrong key. I found no distractor that is equally defensible, no `rank` order the sources leave open, and no `sort` item that fits two bins. The calcs check out: 6 restore sets, 99.0% availability, 8-hour margin, 6-hour loss. The facts most likely to be out of date were checked in the live NIST pages: the SP 800-63B-4 AAL rules and timeouts, the ban on syncable authenticators at AAL3, and the SP 800-63A-4 IAL3 rule ("on-site attended" plus a biometric). All are correct. I made four small fixes: one ambiguous ask, one contradiction between scenes in the same case, and one citation that did not support its claim.

## Changes

| Scene | Problem | Fix | Source checked |
|---|---|---|---|
| k5-01, scene 5 (session-management) | The ask was "BEST fits AAL2 guidance". The AAL3 option (12 h / 15 min) is stricter, so it also complies with AAL2. That makes the ask arguable. | Ask now reads "MOST closely matches the AAL2 limits in SP 800-63B-4". | SP 800-63B-4 sec. 2.2.3 and 2.3.3: AAL2 overall SHOULD be no more than 24 h, inactivity SHOULD be no more than 1 h; AAL3 overall SHALL be no more than 12 h, inactivity no more than 15 min. https://pages.nist.gov/800-63-4/sp800-63b.html |
| k7-06, scene 2 (recovery-sites) | The text said the warm site is "ready in about 24 hours with data restore". The calc scene in the same case, and the case close, say 20 + 14 + 6 = 40 hours. | Text now says "about 40 hours including data restore". The reaction now says "ready in under two days". The key is unchanged: 40 h is still inside the 48 h RTO. | Internal consistency; SP 800-34 Rev. 1 sec. 3.4.3 (alternate sites), numbering confirmed in the PDF. https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf |
| k7-02, scene 7 (forensic-imaging sort) | `src` cited SP 800-86 sec. 4-7 for mobile device artifacts. SP 800-86 does not cover mobile devices. | `src` now cites SP 800-86 sec. 5-6 (OS, network traffic) and NIST SP 800-101 Rev. 1 (mobile device forensics). | https://csrc.nist.gov/pubs/sp/800/86/final ; https://csrc.nist.gov/pubs/sp/800/101/r1/final |

Validator: `--check` shows no errors for D5 or D7. The remaining 13 errors are the unwritten D2 and D6.

## Spot-checks of the source log (confirmed)

- SP 800-63B-4: the AAL2 verifier SHALL offer a phishing-resistant option (2.2.2). AAL3 needs a non-exportable key, and syncable authenticators SHALL NOT be used there (2.3.2, App. B). PSTN/SMS is restricted (3.1.3.3, 3.2.9). Phishing resistance is 3.2.5, recovery 4.2, sessions sec. 5.
- SP 800-63A-4 sec. 4.3: "IAL3 identity proofing SHALL only be delivered as on-site attended". The CSP SHALL collect a biometric. IAL2 may be remote unattended.
- SP 800-34 Rev. 1: 3.4.2 is Backup Methods and Offsite Storage, 3.4.3 Alternate Sites, 3.5 TT&E. Mobile and mirrored sites are defined.
- 2027 outline: identities in 5.1; RAdAC, PDP and PEP in 5.4; the order of the 7.6 steps; the 7.12 test labels; "Mean Time to Resolve" in 7.11; SLAs in 1.8 (cited by the k7-03 MSSP scene).

## Debatable, left as is

- **TACACS+ "protects the whole body"** (k5-02, concept aaa-protocols). RFC 8907 calls this obfuscation and says it is weak. CISSP material says it encrypts the whole packet. The wording "protects" plus the note in the concept is a fair compromise. The ISC2-expected answer is unchanged.
- **IR steps** (k7-01, k7-03). Scenes use ISC2's seven steps, not the CSF 2.0-aligned functions in SP 800-61r3. This is correct for the exam, and the outline lists the same seven.
- **k7-10, scene 1 (send logs to the SIEM FIRST).** Some instructors would key "preserve the existing logs and evidence" first. The keyed option does protect evidence, and the other three options (tip off, delete, rebuild) are clearly wrong, so there is still one best answer.
- **k7-09 returned loaner laptop (forensic image).** Some real-world travel guidance says to wipe or discard such a device. The scene says Kim wants to know whether anything was installed, which makes the forensic image the best answer.
- **k5-03 mac-dac (defense contract): ABAC distractor.** ABAC can model labels. But the text describes the classic MAC definition (labels, clearances, users cannot change or pass on access), and the reaction says so.
- **Length cue on some keyed options** (k5-04 svc_routing, k5-05 vault features, k7-10 defense in depth). The keyed option is a bit longer because it lists the controls, which is what makes it right. The distractors are close in length, so I did not rewrite them.
- **dr-metrics concept: "RTO must be shorter than the MTD".** SP 800-34 says the RTO must not exceed the MTD. The difference is too small to matter for the exam.
- **800-53 control enhancements** (AC-2(2), AC-2(4), AC-2(7), AC-6(2), AC-6(9), AU-9(2), AU-9(4), PL-8(1), SC-7(10)). I checked them from memory of the Rev. 5 catalog, not online. Every number matches the purpose cited.
