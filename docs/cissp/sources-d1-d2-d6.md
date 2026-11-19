# Sources for Domains 1, 2 and 6

The non-obvious facts that scenes in `content/cissp/d1.yaml`, `d2.yaml` and `d6.yaml` depend on, with the source each one was checked against (2026-11-18). "Checked" means the official text was read in this session. "Standard reference" means a well-established fact taken from the named standard or the ISC2 Official Study Guide and not re-fetched.

## Domain 1

| Claim | Used in | Source | How checked |
|---|---|---|---|
| 2027 outline wording: 1.1 adds Ethics in AI; 1.4 adds HIPAA; 1.5 drops "industry standards"; 1.8 adds SLAs; 1.9 adds risk mitigation strategies, maturity modeling and HIPAA; 1.11 adds reputational risk; 1.12 adds stakeholder engagement | all of D1 | ISC2 CISSP Exam Outline, effective April 15, 2027 (and the 2024 outline for the diff) | Checked: outline text, both years |
| ISC2 canons and their order | k1-01, k1-02.4 | ISC2 Code of Ethics, https://www.isc2.org/ethics | Standard reference (also in k1-01) |
| AI RMF trustworthy characteristics (valid and reliable; safe; secure and resilient; accountable and transparent; explainable and interpretable; privacy-enhanced; fair, with harmful bias managed) | k1-02.1, k1-02.5, k1-08.4 | NIST AI 100-1 (AI RMF 1.0), sec. 3, https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf | Standard reference |
| Providers must design AI systems that interact with people so those people are told it is an AI, unless that is obvious | k1-02.5 | Regulation (EU) 2024/1689 (AI Act), Art. 50(1), https://eur-lex.europa.eu/eli/reg/2024/1689/oj | Checked: search results agree on Art. 50(1) and its "obvious" exception |
| GDPR: controller (Art. 4(7)) and processor (Art. 4(8)) definitions; data minimisation (5(1)(c)); storage limitation (5(1)(e)); Art. 28 processor contract; Art. 33(1) notice to the authority without undue delay and, where feasible, within 72 hours; Art. 33(2) processor tells the controller; Art. 34(1) tell data subjects when high risk; Art. 35 DPIA; Art. 46(2)(c) standard data protection clauses | k1-03, k2-03 | GDPR, https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679 | Checked: article text |
| Employee consent is rarely freely given | k1-03.3 | EDPB Guidelines 05/2020 on consent (employment context) | Standard reference |
| HIPAA breach presumed unless a 4-factor risk assessment shows a low probability of compromise; definition of unsecured PHI | k1-04.2 | 45 CFR 164.402, https://www.law.cornell.edu/cfr/text/45/164.402 | Checked |
| Individuals notified without unreasonable delay, no later than 60 calendar days after discovery | k1-04.3 | 45 CFR 164.404(b), https://www.law.cornell.edu/cfr/text/45/164.404 | Checked |
| Media notice when more than 500 residents of a state or jurisdiction are affected | k1-04.2 | 45 CFR 164.406, https://www.law.cornell.edu/cfr/text/45/164.406 | Checked |
| HHS: told at the same time for 500 or more; fewer than 500 go in a log, reported within 60 days after the end of the calendar year | k1-04.2 | 45 CFR 164.408, https://www.law.cornell.edu/cfr/text/45/164.408 | Checked |
| A business associate tells the covered entity, within 60 days at most | k1-04.2 | 45 CFR 164.410, https://www.law.cornell.edu/cfr/text/45/164.410 | Checked |
| Conduit exception covers transmission only (e.g. USPS, couriers), with no more than random or infrequent access; a cloud provider that stores ePHI is a BA even without the key | k1-04.1, k1-04.4 | HHS FAQ 245 and FAQ 2077; HHS Guidance on HIPAA and Cloud Computing, https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html | Checked: HHS pages via search summary (hhs.gov blocks direct fetch) |
| BAs need BAAs with their subcontractors; Security Rule risk analysis; Security Rule applies to BAs | k1-04.4, k1-05.6 | 45 CFR 164.308(b)(2), 164.502(e)(1)(ii), 164.308(a)(1)(ii)(A), 164.302 | Standard reference |
| March 3 + 60 days = May 2 (28 + 30 + 2) | k1-04.3 | Arithmetic on 164.404(b) | Worked out |
| US export of encryption items controlled under the EAR (Commerce, BIS), Category 5 Part 2; defense articles under ITAR (State) | k1-06.6 | 15 CFR parts 730-774; 22 CFR parts 120-130 | Standard reference |
| Patent term about 20 years from filing; copyright life + 70 years; no copyright in methods; trademarks renewable; trade secret definition | k1-06.2, k1-07.3 | 35 U.S.C. 154(a)(2); 17 U.S.C. 302(a), 102(b); 15 U.S.C. 1058-1059, 1114; 18 U.S.C. 1836, 1839(3) | Standard reference |
| Investigation types and standards of proof (criminal: beyond reasonable doubt; civil: preponderance; regulatory: agency) | k1-03.2, k1-07.2 | ISC2 CISSP Official Study Guide (Sybex), ch. 19 | Standard reference |
| Risk responses: accept, avoid, mitigate, share or transfer | k1-03.5, k1-05.4, k1-09.5 | NIST SP 800-39, sec. 3.3, https://csrc.nist.gov/pubs/sp/800/39/final | Standard reference |
| RMF steps: Prepare, Categorize, Select, Implement, Assess, Authorize, Monitor | k1-05.7 | NIST SP 800-37 Rev. 2, https://csrc.nist.gov/pubs/sp/800/37/r2/final | Standard reference |
| CMMI levels: Initial, Managed, Defined, Quantitatively Managed, Optimizing | k1-09.2 | CMMI Institute (ISACA) | Standard reference |
| CSF 2.0 has six functions; Govern is new and includes supply chain risk management | k1-09.6 | NIST CSWP 29, https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf | Standard reference |
| BIA steps, MTD/RTO/RPO; contingency strategies follow the BIA | k1-05.1, k1-05.2, k1-04.5 | NIST SP 800-34 Rev. 1, sec. 3.2, https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final | Standard reference. "RTO + WRT ≤ MTD" is the Sybex (CISSP) formulation; NIST only says RTO must be below MTD |
| ALE = SLE x ARO; SLE = AV x EF; control value = ALE before - ALE after - annual cost | k1-05.3, k1-06.7 | ISC2 CISSP Official Study Guide (Sybex), ch. 2 | Standard reference |
| 99.9% of a 30-day month = 43.2 minutes of allowed downtime (43,200 x 0.001) | k1-05.5 | Arithmetic | Worked out |
| Silicon root of trust and firmware verification at boot | k1-06.4 | NIST SP 800-193, https://csrc.nist.gov/pubs/sp/800/193/final | Standard reference |
| SBOM minimum elements | concept scrm | NTIA, The Minimum Elements for an SBOM (2021) | Standard reference |
| Learning program guidance with metrics and evaluation (supersedes SP 800-50 (2003) and SP 800-16) | k1-08.1, k1-08.3, k1-09.4 | NIST SP 800-50 Rev. 1 (Sept 2024), https://csrc.nist.gov/pubs/sp/800/50/r1/final | Checked |
| SSDF PW.1: threat modeling at design time | k1-04.7 | NIST SP 800-218 | Standard reference |

## Domain 2

| Claim | Used in | Source | How checked |
|---|---|---|---|
| SP 800-88 Rev. 2 is final (Sept 26, 2025) and supersedes Rev. 1 | k2-02, k2-04, k2-05 | https://csrc.nist.gov/pubs/sp/800/88/r2/final | Checked |
| Clear, purge and destroy remain the three methods; clear is a single-pass logical overwrite (multi-pass not needed); degaussing purges legacy magnetic media only and can fail on flash; cryptographic erase is a purge method with preconditions (no prior plaintext, ≥128-bit strength, key zeroization); in cloud storage CE is often the only purge method; shred and pulverize are avoided for medium and high data, incineration is used for SSDs | k2-02.3, k2-02.4, k2-04.4, k2-05.2 | NIST SP 800-88r2 FAQ (July 2026), Q6, Q8, Q9, Q10, Q13, https://csrc.nist.gov/files/pubs/sp/800/88/r2/final/docs/sp800-88r2-faq.pdf | Checked: full FAQ text |
| HIPAA documentation kept 6 years from creation or last effective date, whichever is later | k2-04.5 | 45 CFR 164.316(b)(2)(i), https://www.law.cornell.edu/cfr/text/45/164.316 | Checked |
| Classification levels: Top Secret (exceptionally grave damage), Secret (serious), Confidential (damage) | k2-05.4 | Executive Order 13526, sec. 1.2; CUI at 32 CFR part 2002 | Standard reference |
| FIPS 199 categorization; FIPS 200 high-water mark | k2-01.4, k2-02.7 | FIPS 199, FIPS 200 | Standard reference |
| Transmission security for ePHI | k2-04.3 | 45 CFR 164.312(e)(1); NIST SP 800-52 Rev. 2 (TLS) | Standard reference |
| Legal hold and the duty to preserve ESI | k2-02.2 | Federal Rules of Civil Procedure, Rule 37(e) | Standard reference |
| ISO/IEC 27002:2022 controls 5.9 (inventory), 5.11 (return of assets), 5.12 (classification), 5.13 (labelling), 5.14 (information transfer), 7.10 (storage media) | k2-01, k2-02, k2-05 | ISO/IEC 27002:2022 (control titles) | Standard reference |
| Scoping and tailoring of baselines | k2-03.6, k2-04.6 | NIST SP 800-53B; ISC2 CISSP Official Study Guide (Sybex), ch. 5 | Standard reference. NIST treats scoping as part of tailoring; the scene teaches the CISSP split and says so |
| No EU adequacy decision for Singapore | k2-03.2 | European Commission adequacy decisions list | Standard reference |
| CNAPP combines CSPM, CWPP and entitlement management for cloud-native apps | k2-04.1 | CISSP 2027 outline 2.6 (term only) | Industry definition. No NIST or ISO definition exists, so the scene uses only the widely agreed core |

## Domain 6

| Claim | Used in | Source | How checked |
|---|---|---|---|
| 2027 changes: "attack simulations" replaces "breach attack simulations"; red/blue/purple dropped from the pentest bullet; "responsible disclosure" replaces "ethical disclosure"; 6.4 now says test/audit output | all of D6 | 2027 and 2024 outlines | Checked: outline text |
| SP 800-115 title and four pentest phases: planning, discovery, attack, reporting; rules of engagement template in Appendix B | k6-01.1, k6-01.3, k6-01.6, k6-05.5 | NIST SP 800-115, sec. 5.2, https://csrc.nist.gov/pubs/sp/800/115/final | Title checked; phases are standard reference (Figure 5-1) |
| Fagan inspection: overview, preparation, inspection, rework, follow-up (Sybex adds planning) | k6-02.3 | Fagan, IBM Systems Journal 15(3), 1976; Sybex OSG ch. 15 | Standard reference. The rank uses only the five steps both sources share |
| Coverage = tested / total x 100 (52/80 = 65%) | k6-02.4 | Sybex OSG ch. 15 | Worked out |
| 84 / 1,200 = 7% | k6-03.2 | Arithmetic | Worked out |
| SOC 1 = controls relevant to clients' financial reporting (SSAE 18, AT-C 320); SOC 2 = Trust Services Criteria, restricted use; SOC 3 = general use; Type I = design at a point in time, Type II = operating effectiveness over a period | k6-03.7, k6-04.2, k6-04.6 | AICPA SOC suite, https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2 | Standard reference |
| Internal audit reports functionally to the board or audit committee for independence | k6-03.4 | IIA Global Internal Audit Standards (2024), Principle 7, Standard 7.1 | Checked: secondary summaries of the standard |
| Internal, external and third-party audit definitions | k6-04.1 | 2027 outline 6.5; Sybex OSG ch. 15 | Standard reference (see "debatable" below) |
| Coordinated / responsible disclosure | k6-02.1, k6-05.1 | ISO/IEC 29147:2018, ISO/IEC 30111:2019, RFC 9116, CISA CVD program | Standard reference |
| Prioritize known exploited vulnerabilities | k6-05.2, k6-04.5 | CISA KEV catalog and BOD 22-01, https://www.cisa.gov/known-exploited-vulnerabilities-catalog | Standard reference |
| Broken object level authorization is API1 | k6-02.6 | OWASP API Security Top 10 2023 | Standard reference |
| SP 800-61 Rev. 3 (incident response) is current | k6-01.6 | https://csrc.nist.gov/pubs/sp/800/61/r3/final | Standard reference (published April 2025) |

## Where the ISC2 answer could be argued

- **Third-party vs external audit (k6-04.1).** Outside the exam, a customer's audit of a supplier is often called "external". The scene uses the Sybex/ISC2 split (external = a firm the organization engages; third-party = done by or for another party) and says "In CISSP terms".
- **Scoping vs tailoring (k2-03.6).** NIST counts scoping as one part of tailoring; CISSP materials treat them as two steps. The scene asks "in CISSP terms" and the `why` notes the NIST view.
- **Education vs training for certification study (k1-08.2).** The Sybex guide places degrees and certifications under education; some programs would call certification prep training.
