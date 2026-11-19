# Accuracy review: exam pool D1-D4 (x1-001 .. x4-032)

Reviewer pass on 128 items in `content/cissp/exam/d1.yaml` .. `d4.yaml`. Each item was checked for key correctness,
defensible distractors, false statements, calc math, and ask/kind fit. All calc items (x1-019, x1-024, x1-025,
x3-019, x4-005) were recomputed and are correct.

Result: 2 items fixed (citation/explanation only). No key changes. Build: 0 errors, 0 warnings. Cue check: all
measures 14.7-23.8% pool-wide, every domain at or under ~25%.

## Fixes

### x4-032 (ISA vs MOU)
- Problem: the why and src leaned on NIST SP 800-47 (2002), superseded by SP 800-47 Rev. 1 (July 2021,
  "Managing the Security of Information Exchanges").
- Check: Rev. 1 keeps the ISA for system interconnections. Sec. 3.1.5.1 says an ISA "specifies the technical and
  security requirements for establishing, operating, and maintaining an interconnection". Sec. 3.1.5.2 says the
  MOU/A does not include technical details or specific security requirements; "that is the function of the ISA".
  The new information exchange agreement (IEA, sec. 3.1.5.3) is for exchanges *without* an interconnection, so
  it does not compete here (and is not an option). The key (ISA) stays correct.
- Change: why rewritten to cite Rev. 1. src now cites SP 800-47 Rev. 1 sec. 3.1.5.1 and 3.1.5.2 plus SP 800-53
  Rev. 5 CA-3. The 2002 citation was removed. Key, options and id unchanged.
- Source: https://csrc.nist.gov/pubs/sp/800/47/r1/final (PDF text read directly).

### x3-022 (post-quantum priority)
- Problem: src called NIST IR 8547 a "draft". NIST published the final IR 8547 on 27 Oct 2026, and the initial
  public draft was withdrawn.
- Change: src now reads "final, Oct. 2026". The key (ECDH for long-lived secrets) matches the final report,
  which keeps AES as not needing replacement. No other change.
- Source: https://www.nist.gov/news-events/news/2026/10/nist-report-provides-guidelines-transition-post-quantum-cryptography

## Borderline, left as is
- x4-017 (evil twin vs rogue AP): an evil twin is a kind of rogue AP. The stem's impersonation detail and the
  "MOST accurately" wording make evil twin the more precise key, which matches Sybex usage.
- x4-026 (150 m Cat 6 run): a duplex mismatch also causes errors on one link. The 150 m figure points clearly at
  the 100 m limit, so the key holds.
- x2-026 (scoping vs tailoring): NIST treats scoping as part of tailoring. The item says "in CISSP terms" and its
  why explains the difference, which is acceptable.
- x3-002 (rotation of duties): mandatory vacation is the classic detective answer but is not an option. Rotation
  is the only detective choice, so the key is sound.
