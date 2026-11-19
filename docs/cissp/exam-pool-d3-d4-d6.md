# Board-exam pool: Domains 3, 4 and 6

Written 2026-11-19. Files: `content/cissp/exam/d3.yaml`, `d4.yaml`, `d6.yaml`. All items are new scenarios with neutral
organizations. The validator shows 0 errors with these files, and no case wording is reused.

## Counts

| Domain | Items | diff 1 / 2 / 3 | Kinds | Key positions a=0/1/2/3 |
|---|---|---|---|---|
| D3 | 32 | 11 / 12 / 9 | 30 best, 1 first, 1 calc | 8 / 7 / 8 / 9 |
| D4 | 32 | 9 / 16 / 7 | 31 best, 1 calc | 8 / 8 / 8 / 8 |
| D6 | 28 | 10 / 11 / 7 | 24 best, 2 first, 2 calc | 7 / 8 / 7 / 6 |

Answer cues (`check-cues-cissp.mjs --pool`), in % of FIRST/BEST items:

| Domain | longest | shortest | words | hedge | clauses |
|---|---|---|---|---|---|
| D3 | 22.6 | 19.4 | 14.5 | 25.0 | 22.3 |
| D4 | 17.7 | 14.5 | 16.4 | 22.6 | 25.0 |
| D6 | 21.2 | 16.7 | 21.2 | 22.1 | 23.4 |

The longest/shortest rates were deliberately raised from about 2% to about 20%. A key that is never the longest or the
shortest is also a giveaway, because a guesser can rule out the extremes.

## Objectives covered (items)

- D3: 3.1 x7 (fail securely, rotation of duties, two-person integrity, ZT policy administrator, SASE, IaaS shared
  responsibility, homomorphic encryption as a PET); 3.2 x4 (BLP, Biba, Clark-Wilson, Brewer-Nash); 3.3 x2 (RMF Select,
  FIPS 200 high-water mark); 3.4 x2 (HSM, complete mediation); 3.5 x3 (OT scanning, FaaS, autonomous vehicles); 3.6 x4
  (key count calc, HMAC vs signature, key usage, PQC priority); 3.7 x4 (side-channel, golden ticket, ransomware and
  immutable backups, AI poisoning); 3.8 x2 (CPTED); 3.9 x2 (Class C fire, brownout); 3.10 x2 (requirements phase,
  continuous review).
- D4: 4.1 x23 (OSI, RFC 1918, IPv6 link-local, /26 calc, TLS deprecation, AH, S/MIME, FCoE, CXL, jitter, planes,
  micro-segmentation, VLAN hopping, WPA3-Personal and Enterprise, evil twin, SDN northbound, CDN, software-defined
  security, VPC, egress, IPFIX); 4.2 x4 (NAC posture, post-admission NAC, 100 m limit, STP); 4.3 x5 (split tunneling,
  VDI for unmanaged devices, TACACS+, SRTP, ISA).
- D6: 6.1 x3 (insider gray box, SaaS location, risk-based strategy); 6.2 x10 (pentest vs scan, false positives, scope
  authority, SAST, generation fuzzing, synthetic transactions, misuse case, coverage calc, attack simulations x2); 6.3 x6
  (KRI, awareness KPI, account review calc, backup verification, training data, rubber-stamp access review); 6.4 x4
  (exception, retest, responsible disclosure x2); 6.5 x5 (internal and external audit, SOC 3, CUECs, SaaS assurance).

## Sources leaned on

NIST SP 800-207, 800-215, 800-145, 800-37 Rev. 2, 800-53 Rev. 5 / 53B, FIPS 199/200, FIPS 140-3, FIPS 186-5, FIPS
198-1, SP 800-57 Pt 1 Rev. 5, IR 8547 (draft), AI 100-2, 800-82 Rev. 3, 800-137, 800-160 Vol. 1 Rev. 1, 800-41 Rev. 1,
800-46 Rev. 2, 800-47, 800-115, 800-34 Rev. 1, 800-40 Rev. 4, 800-50 Rev. 1; RFCs 1918, 4291, 4302/4303, 7568, 8996,
8551, 7011, 7426, 3711, 8907; MITRE ATT&CK T1558.001; CISA #StopRansomware Guide; ISO/IEC 27001 cl. 9.2 and 29147;
AICPA SOC 2/3; SAE J3016; the classic model papers (BLP, Biba, Clark-Wilson, Brewer-Nash, Anderson); ISC2 OSG (Sybex).

## Items I was less than certain about

- **x4-032 (ISA vs MOU).** The clear ISA (technical requirements) vs MOU/A (business terms) split comes from the 2002 SP
  800-47. Rev. 1 (2021) lists the agreement types together without that distinction. I cite the 2002 text, name Rev. 1,
  and say "(2002)" in the `why`.
- **x4-020 (software-defined security).** The term is new to the 2027 outline and has no NIST or ISO definition. The
  item uses only the widely agreed core idea (policy-driven controls, separate from hardware), with clearly unrelated
  distractors. `src` cites only the outline.
- **x4-017 (evil twin vs rogue AP).** Diff 3 by design. An evil twin is a kind of rogue AP, so the ask is "MOST
  accurately" and the `why` explains that impersonation makes evil twin the more precise term.
- **x6-023 (unresponsive vendor).** Coordinated disclosure guidance also allows publishing after a missed deadline. The
  key (bring in a coordinator such as a CERT) is the ISO/IEC 29147 and CERT/CC route. The distractors are clearly
  worse: publishing exploit code at once, never disclosing, or selling the details.
- **x3-018 (autonomous vehicles).** "Minimal risk condition" is the SAE J3016 term, so the scenario uses road vehicles
  to stay inside that standard.
- **x4-014 (VLAN hopping).** The double-tagging fix is standard practice, but I could not confirm that the OSG covers
  it, so `src` cites IEEE 802.1Q and the outline only.
- **x4-030 (TACACS+).** RFC 8907 calls the body protection "obfuscation", and the `why` says so. In CISSP terms it is
  "encrypts the whole body".
- Section numbers are given only where I was confident: SP 800-207 sec. 2.1/3/3.1.2, RFC 1918 sec. 3, RFC 4291 sec.
  2.4/2.5.6, ISO 27001 cl. 9.2, SP 800-57 sec. 5.3. Elsewhere the document is cited without a section.
