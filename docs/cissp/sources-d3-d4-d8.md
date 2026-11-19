# Sources for Domains 3, 4 and 8 (content/cissp/d3.yaml, d4.yaml, d8.yaml)

Written 2026-11-18. These are the non-obvious factual claims the scenes rely on, with the authority and its official location.
Rows marked "(checked)" were read on the official page or PDF this session. Other rows rest on the cited standard as
known to the author; the URL is the publisher's landing page, not a re-verified quote. "Standard reference" means
long-standing textbook material from the cited paper or the ISC2 Official Study Guide (OSG, Sybex).
Section numbers are given only where confirmed; otherwise the document is cited without one.
Third-party prep material (cissp-2027-prep) was not used as a source.

## Outline (scope)

| Claim | Source | Where checked |
|---|---|---|
| 2027 D3 bullets include well-architected framework, rotation of duties, two-person integrity, SASE, PETs, HSM, OT/ICS, serverless/FaaS, supply chain risk, autonomous systems, quantum computing, post-quantum, key management, digital signatures, AitM, pass the hash, Kerberos exploitation, ransomware, zero-day, AI threats, continuous security review | ISC2 CISSP Exam Outline, effective April 15, 2027, Domain 3 | Outline PDF text (scratchpad o27.txt) |
| 2027 D4 bullets include converged protocols with Compute Express Link, micro-segmentation, VPC, network observability, software-defined security, remote working | Same outline, Domain 4 | o27.txt |
| 2027 D8 bullets: SSDF and SBOM requirements, shift left, memory-safe languages, SCA, SAST/DAST, CI/CD, CMM/SAMM, API security | Same outline, Domain 8 | o27.txt |
| Quantum key distribution is not in the 2027 outline; not taught | Same outline, 3.6 | o27.txt |

## Domain 3

| Claim | Source | URL |
|---|---|---|
| Zero Trust tenets in sec. 2.1; logical components (policy engine, policy administrator = PDP; policy enforcement point) in sec. 3; micro-segmentation approach is sec. 3.1.2 | NIST SP 800-207 (checked TOC and text) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf |
| SASE is covered by NIST as part of the enterprise WAN landscape (with SD-WAN) | NIST SP 800-215, Nov 2022 (checked) | https://csrc.nist.gov/pubs/sp/800/215/final |
| SoD = AC-5; dual authorization = AC-3(2) | NIST SP 800-53 Rev. 5 | https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final |
| Bell-LaPadula: simple security (no read up), star (no write down), strong star (read/write own level only); tranquility = labels don't change in operation | Bell and LaPadula, MITRE 1976; OSG ch. 8 | standard reference |
| Biba: simple integrity (no read down), star integrity (no write up) | Biba, MITRE 1977; OSG ch. 8 | standard reference |
| Clark-Wilson: CDI, UDI, TP, IVP, access triple, separation of duties | Clark and Wilson, IEEE S&P 1987; OSG ch. 8 | standard reference |
| Brewer-Nash: conflict-of-interest classes, access changes dynamically after first access; other classes stay open | Brewer and Nash, IEEE S&P 1989; OSG ch. 8 | standard reference |
| Reference monitor: complete mediation, tamper-proof, verifiable | Anderson report, ESD-TR-73-51 (1972); OSG ch. 8 | standard reference |
| RMF steps: Prepare, Categorize, Select, Implement, Assess, Authorize, Monitor | NIST SP 800-37 Rev. 2 | https://csrc.nist.gov/pubs/sp/800/37/r2/final |
| Common Criteria EAL1 (functionally tested) to EAL7 (formally verified design and tested); EAL = evaluation rigor, not strength | ISO/IEC 15408; OSG ch. 8 | https://www.commoncriteriaportal.org/ |
| TPM measures boot into PCRs and seals keys to platform state; HSM for high-volume enterprise keys; FIPS 140-3 validation | TCG TPM 2.0 Library Spec (ISO/IEC 11889); FIPS 140-3 | https://trustedcomputinggroup.org/resource/tpm-library-specification/ ; https://csrc.nist.gov/pubs/fips/140-3/final |
| Cryptoperiods are sec. 5.3, key compromise sec. 5.5, protection requirements sec. 6; comparable strengths Table 2 in sec. 5.6.1.1 (128-bit = AES-128 = RSA 3072 = ECC 256-383; 3TDEA deprecated) (checked) | NIST SP 800-57 Part 1 Rev. 5 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf |
| Symmetric keys n(n-1)/2 (30 parties = 435); asymmetric 2n (60) | OSG ch. 6 | arithmetic |
| Each added key bit doubles key space: 56 to 64 bits = 2^8 = 256 times | Arithmetic; SP 800-57 security strength in bits | arithmetic |
| FIPS 203 ML-KEM (key encapsulation), FIPS 204 ML-DSA and FIPS 205 SLH-DSA (signatures), published August 2024 | NIST FIPS 203/204/205 | https://csrc.nist.gov/pubs/fips/203/final ; /204/final ; /205/final |
| Shor breaks RSA/ECC/DH; Grover only reduces symmetric/hash strength; harvest now, decrypt later | NIST IR 8547 (transition to PQC); FIPS 203 intro | https://csrc.nist.gov (NIST IR 8547) |
| Digital signatures (RSA, ECDSA, EdDSA) give integrity, authenticity, non-repudiation | FIPS 186-5 | https://csrc.nist.gov/pubs/fips/186-5/final |
| X.509 and CRLs; certification path validation is sec. 6 | RFC 5280 | https://www.rfc-editor.org/rfc/rfc5280 |
| OCSP | RFC 6960 | https://www.rfc-editor.org/rfc/rfc6960 |
| Ciphertext-only, known plaintext, chosen ciphertext; timing/side-channel; fault injection | OSG ch. 7; 2027 outline 3.7 | standard reference |
| AitM = T1557; pass the hash = T1550.002; golden ticket = T1558.001 (forged TGT with KRBTGT hash); silver ticket = T1558.002; Kerberoasting = T1558.003; KRBTGT reset twice | MITRE ATT&CK | https://attack.mitre.org/techniques/T1558/001/ |
| FIDO2/WebAuthn credentials are origin-bound, so they resist relay phishing | W3C WebAuthn; NIST SP 800-63B (phishing resistance) | https://www.w3.org/TR/webauthn-2/ |
| Ransomware response: isolate affected systems first; offline/immutable backups | CISA #StopRansomware Guide | https://www.cisa.gov/stopransomware/ransomware-guide |
| No patch available: mitigate (workarounds, reduce exposure) per risk response | NIST SP 800-40 Rev. 4 | https://csrc.nist.gov/pubs/sp/800/40/r4/final |
| Adversarial ML classes: evasion, poisoning, privacy (plus GenAI misuse) | NIST AI 100-2 | https://csrc.nist.gov (NIST AI 100-2) |
| Deepfake threat guidance: verify through out-of-band channels | NSA/FBI/CISA, Contextualizing Deepfake Threats to Organizations (2023) | https://www.cisa.gov (joint CSI, Sept 2023) |
| OT: safety and availability first; active scanning can disrupt; IT/OT DMZ and remote access via jump host | NIST SP 800-82 Rev. 3 | https://csrc.nist.gov/pubs/sp/800/82/r3/final |
| Containers: sec. 3 major risks, sec. 4 countermeasures (non-root, trusted signed images, no host mounts) | NIST SP 800-190 | https://csrc.nist.gov/pubs/sp/800/190/final |
| IaaS consumer controls OS, storage, deployed apps | NIST SP 800-145 | https://csrc.nist.gov/pubs/sp/800/145/final |
| Well-architected pillars include security, reliability, performance efficiency, cost optimization | AWS Well-Architected Framework | https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html |
| Differential privacy guidance | NIST SP 800-226 | https://csrc.nist.gov/pubs/sp/800/226/final |
| Data protection by design and by default; data minimization | GDPR Art. 25, Art. 5(1)(c) | https://eur-lex.europa.eu/eli/reg/2016/679/oj |
| Aggregation, inference, polyinstantiation | OSG ch. 9 | standard reference |
| Supply chain: counterfeit/tampered components | NIST SP 800-161 Rev. 1 | https://csrc.nist.gov/pubs/sp/800/161/r1/final |
| IoT device capability baseline | NIST IR 8259A | https://csrc.nist.gov/pubs/ir/8259/a/final |
| SP 800-88 Rev. 2 is final (Sept 2025); clear, purge, destroy defined in sec. 3.1.1-3.1.3 (checked) | NIST SP 800-88 Rev. 2 | https://csrc.nist.gov/pubs/sp/800/88/r2/final |
| CPTED: natural access control, natural surveillance, territorial reinforcement | OSG ch. 10; Crowe, CPTED | standard reference |
| US fire classes A, B, C, D, K | NFPA 10 | https://www.nfpa.org/codes-and-standards/nfpa-10-standard-development/10 |
| Sprinkler types; preaction most suitable for computer rooms | NFPA 13; OSG ch. 10 | standard reference |
| Power: fault/blackout (loss), sag/brownout (low), spike/surge (high), momentary vs prolonged | OSG ch. 10 | standard reference |
| Positive pressurization for server rooms; exits fail safe for life safety | OSG ch. 10; NFPA 101 | standard reference |
| Lifecycle processes (stakeholder needs, requirements, architecture, implementation, integration, V&V, transition, operation, maintenance, disposal) | ISO/IEC/IEEE 15288; NIST SP 800-160 Vol. 1 Rev. 1 | https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final |
| Continuous monitoring after authorization | NIST SP 800-137 | https://csrc.nist.gov/pubs/sp/800/137/final |

## Domain 4

| Claim | Source | URL |
|---|---|---|
| OSI layers; switches at L2 (MAC), routers at L3 (IP), ports at L4; VLANs are L2 | ISO/IEC 7498-1; IEEE 802.1Q; OSG ch. 11 | standard reference |
| IPv6 has no broadcast; multicast replaces it (sec. 2); anycast addresses | RFC 4291 | https://www.rfc-editor.org/rfc/rfc4291 |
| Anycast operation (one address, many sites, nearest answers) | RFC 4786 | https://www.rfc-editor.org/rfc/rfc4786 |
| IPsec: AH integrity/authentication only, ESP confidentiality; tunnel vs transport modes | RFC 4301, 4302, 4303 | https://www.rfc-editor.org/rfc/rfc4301 |
| TLS 1.0/1.1 deprecated; SSL 3.0 deprecated; TLS 1.3 | RFC 8996; RFC 7568; RFC 8446 | https://www.rfc-editor.org/rfc/rfc8996 |
| SSH architecture (replaces Telnet), TCP 22 | RFC 4251 | https://www.rfc-editor.org/rfc/rfc4251 |
| iSCSI over TCP/IP; CHAP authentication | RFC 7143 | https://www.rfc-editor.org/rfc/rfc7143 |
| SIP security considerations (sec. 26); SRTP | RFC 3261; RFC 3711 | https://www.rfc-editor.org/rfc/rfc3711 |
| CXL is a cache-coherent interconnect built on the PCIe physical layer, supports memory pooling | CXL Consortium | https://computeexpresslink.org/ |
| Cut-through forwards after reading destination address (no FCS check); store-and-forward buffers and checks FCS | OSG ch. 11 | standard reference |
| Jitter = packet delay variation | RFC 3393 | https://www.rfc-editor.org/rfc/rfc3393 |
| DMZ / screened subnet architectures; egress filtering | NIST SP 800-41 Rev. 1 | https://csrc.nist.gov/pubs/sp/800/41/r1/final |
| Ingress filtering of spoofed sources | RFC 2827 (BCP 38) | https://www.rfc-editor.org/rfc/rfc2827 |
| Flow export (IPFIX) | RFC 7011 | https://www.rfc-editor.org/rfc/rfc7011 |
| SDN control/data plane split, northbound/southbound interfaces | RFC 7426 | https://www.rfc-editor.org/rfc/rfc7426 |
| WPA3-Personal uses SAE (resists offline dictionary attack, forward secrecy) | Wi-Fi Alliance WPA3 | https://www.wi-fi.org/discover-wi-fi/security |
| Bluejacking, bluesnarfing, bluebugging | NIST SP 800-121 Rev. 2 | https://csrc.nist.gov/pubs/sp/800/121/r2/upd1/final |
| 5G SUCI conceals SUPI (counters IMSI catchers) | 3GPP TS 33.501 | https://www.3gpp.org/dynareport/33501.htm |
| 802.1X roles: supplicant, authenticator, authentication server | IEEE 802.1X; RFC 3580 | https://www.rfc-editor.org/rfc/rfc3580 |
| Twisted-pair Ethernet segment limit 100 m | IEEE 802.3 | standard reference |
| Telework: split tunneling risk, client device security | NIST SP 800-46 Rev. 2 | https://csrc.nist.gov/pubs/sp/800/46/r2/final |
| Agreements for system interconnections (ISA) | NIST SP 800-47 Rev. 1 | https://csrc.nist.gov/pubs/sp/800/47/r1/final |

## Domain 8

| Claim | Source | URL |
|---|---|---|
| SSDF practice groups PO, PS, PW, RV; PO.1 requirements, PO.2 roles/training, PS.1 protect code, PS.2 release integrity (signing), PS.3 archive releases and provenance, PW.1.1 threat modeling, PW.4 reuse well-secured software, PW.7 code review/analysis, PW.8 test executable code, RV.1 identify vulnerabilities, RV.2.1 analyze each vulnerability, RV.3 root cause | NIST SP 800-218 v1.1 | https://csrc.nist.gov/pubs/sp/800/218/final |
| SBOM minimum elements: data fields (supplier, component name, version, other unique identifiers, dependency relationship, SBOM author, timestamp), automation support (SPDX, CycloneDX), practices and processes | NTIA, The Minimum Elements for an SBOM (July 2021) | https://www.ntia.gov/report/2021/minimum-elements-software-bill-materials-sbom |
| SBOM requirement origin | Executive Order 14028, sec. 4(e) | https://www.federalregister.gov/documents/2021/05/17/2021-10460 |
| Memory-safety roadmaps; memory-safe language examples | CISA et al., The Case for Memory Safe Roadmaps (Dec 2023); NSA CSI Software Memory Safety (Nov 2022) | https://www.cisa.gov/resources-tools/resources/case-memory-safe-roadmaps |
| CI/CD pipeline supply chain security | NIST SP 800-204D | https://csrc.nist.gov/pubs/sp/800/204/d/final |
| Insufficient flow control (unreviewed changes) as a CI/CD risk | OWASP Top 10 CI/CD Security Risks | https://owasp.org/www-project-top-10-ci-cd-security-risks/ |
| SW-CMM levels Initial, Repeatable, Defined, Managed, Optimizing; CMMI renames 2 and 4 | SEI CMU/SEI-93-TR-024 | https://resources.sei.cmu.edu/library/asset-view.cfm?assetid=11955 |
| SAMM v2: Governance, Design, Implementation, Verification, Operations; Design = threat assessment, security requirements, security architecture; Verification = architecture assessment, requirements-driven testing, security testing; Operations = incident, environment, operational management | OWASP SAMM v2 | https://owaspsamm.org/model/ |
| API1 BOLA, API4 unrestricted resource consumption, API9 improper inventory management | OWASP API Security Top 10 2023 | https://owasp.org/API-Security/editions/2023/en/0x11-t10/ |
| Parameterized queries stop SQL injection | OWASP SQL Injection Prevention Cheat Sheet; CWE-89 | https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html |
| Output encoding stops XSS | OWASP XSS Prevention Cheat Sheet; CWE-79 | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html |
| TOCTOU race condition | CWE-367 | https://cwe.mitre.org/data/definitions/367.html |
| SAST white box (no execution), DAST black box (running app) | OWASP Web Security Testing Guide; SSDF PW.7/PW.8 | https://owasp.org/www-project-web-security-testing-guide/ |
| SOC 2 Type 1 (design at a point in time) vs Type 2 (design and operating effectiveness over a period) | AICPA SOC 2 | https://www.aicpa-cima.com (SOC 2 resources) |
| Change management order: request, review, approve/reject, test, schedule and implement, document | ISC2 OSG ch. 16 | standard reference |
| Emergency changes still documented and reviewed; configuration change control | NIST SP 800-53 Rev. 5, CM-3 | https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final |
| Integrated Product Team (multidisciplinary, whole life cycle) | DoD IPPD Handbook (1998); 2027 outline 8.1 | standard reference |

## Judgment calls

- **Inference vs aggregation** (k3-02.5, k3-07.3): textbook definitions are close. Each scene is written so only one fits: a deduction from a small count plus outside knowledge (inference), and a combined collection that is more sensitive than its parts (aggregation).
- **Change management order** (k8-05.3): the ranking follows the ISC2 OSG (approve before test). ITIL-style processes often test before CAB approval, so the scene names the ISC2 guide as its basis.
- **Emergency exit doors** (k3-08.5): taught as fail safe for life safety, the ISC2 answer; fail secure is right only for doors where people can still get out another way.
