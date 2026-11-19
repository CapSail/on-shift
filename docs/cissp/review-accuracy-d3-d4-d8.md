# Technical-accuracy review: D3, D4, D8

Reviewed 2026-11-18 against the 2027 outline (o27.txt), the cited standards and the writer's source log.
Scope: every concept and scene in `content/cissp/d3.yaml` (65 scenes), `d4.yaml` (36 scenes), `d8.yaml` (31 scenes).

## Verdict

Accurate and exam-aligned. Keys match ISC2 / the cited authority in every scene; security models (BLP, strong star,
Biba, Clark-Wilson IVP/TP/CDI, Brewer-Nash), FIPS 203/204/205 names and roles, TPM vs HSM, IaaS shared
responsibility, NFPA fire classes and sprinkler types, OSI/802.1X/IPsec modes, SUCI, SDN planes, SSDF groups and
practice IDs, NTIA SBOM minimum elements, SAMM v2 practices, CMM/CMMI levels and OWASP API 2023 numbering all check
out. No QKD taught. Validator: 0 errors, 0 warnings. Four small fixes, no key changes.

## Changes

| Scene | Problem | Fix | Source checked |
|---|---|---|---|
| k3-03 (calc, 56 vs 64-bit) `why` | "Current guidance starts at 128-bit security" is wrong: NIST's floor is 112-bit security (128 after 2030) | Now "NIST requires at least 112-bit security" | NIST SP 800-57 Pt 1 Rev. 5 sec. 5.6 / SP 800-131A Rev. 2, https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final |
| k3-04.1 (golden ticket) `text` | "A user account that does not exist": since the 2021-22 PAC hardening (CVE-2021-42287, KB5008380), DCs reject TGTs for non-existent accounts, so that is no longer a reliable sign | Reworded: an ordinary account asks for any service as domain admin, ten-year lifetime, not issued by any DC | MITRE ATT&CK T1558.001, https://attack.mitre.org/techniques/T1558/001/ |
| k3-04.1 `r[1]` | Still said "for imaginary users" | Now "ten-year domain admin tickets" | same |
| k3-04.3 (backup key) option 2 | Keyed option was much longer than the others and repeated the stem's wording (a test-wise cue) | Shortened to "Keeping an escrowed key copy off the backup server" | NIST SP 800-57 Pt 1 Rev. 5 (key backup) |

## Debatable items left as they are

- **k8-05.3 change-management order** (approve before test). Kept. The scene says it follows the ISC2 study guide,
  and the OSG ch. 16 list is exactly request, review, approve/reject, test, schedule and implement, document. ITIL
  shops often test before CAB approval, but the exam keys the OSG order, and the scene names its basis.
- **k3-02.5 inference vs k3-07.3 aggregation.** Kept. Each stem is built so only one fits: a count of 1 plus outside
  knowledge (inference), and Internal datasets combined into something more sensitive than any part (aggregation,
  where the fix is a higher classification for the combined set). The `why` and reactions spell out the boundary.
- **k3-04.1 golden-ticket recovery (reset KRBTGT twice).** Kept. This is MITRE's mitigation for T1558.001 and
  Microsoft's guidance: two resets, because the account keeps its previous password too.
- **NIST IR 8547** is cited in k3-03 and the post-quantum concept. It was an initial public draft when last checked.
  The claims it backs (Shor breaks RSA/ECC, Grover weakens symmetric) are textbook, so the citation is fine. If
  the final version renames it, update the `src` string.
- **Two-person integrity scene (k3-02.6).** The stem describes "two authorized people approve the same export" and
  the key names it. That is easy but not wrong. No distractor is separation of duties, so there is only one right
  answer.
- **SSH replaces FTP (d4 concept)**, via SFTP/SCP, and **RoCE called "InfiniBand over Ethernet"**: both are loose
  but follow the outline's own wording. Left as they are.
