# Writing CISSP case files

Read `DESIGN.md` first. The model to copy is case `k1-01` in `content/cissp/d1.yaml`: its length, voice, reactions and sources.

## Accuracy comes first

- Teach the **2027 outline** (`content/cissp/meta.yaml` has every objective). Where ISC2 uses a specific term, use ISC2's term (e.g. "Adversary-in-the-Middle", "responsible disclosure", "attack simulations", "Risk-Adaptable Access Control").
- Every concept and every scene has `src`: the authority the answer rests on, specific enough to check (document and section). Good sources, best first:
  1. ISC2: the 2027 CISSP Exam Outline, the Code of Ethics, the ISC2 CISSP CBK / Official Study Guide (Sybex)
  2. Standards and law: NIST SP 800-series, FIPS, NIST CSF 2.0, NIST SSDF (SP 800-218), ISO/IEC 27001/27002/27005/22301 (cite by title and clause), RFCs, GDPR/HIPAA/CCPA articles and sections, FIDO Alliance / W3C WebAuthn, OWASP (Top 10, ASVS, SAMM), CISA (SBOM)
  3. Long-standing textbook material (Bell-LaPadula, Biba, Clark-Wilson, OSI) cited to the paper or the OSG chapter
- **If you are not sure a fact is right, check it** against the source (web search and fetch are allowed: use official sites). If you still are not sure, leave it out. Never invent a feature, a number, a section number or a standard.
- Where ISC2 and real-world usage differ, teach the ISC2 answer and say so in `why` (e.g. "In CISSP terms...").
- Third-party prep material (including the `cissp-2027-prep` repo) may be read to spot gaps, **never copied** and never cited as `src`. No real exam questions, no question text from any book or bank.

## The CISSP mindset (what the scenes train)

The right answer is usually what a **risk-focused security manager** would do: people's safety first; follow policy and process; involve the right owner (senior management decides and owns risk; the data owner classifies; legal handles law enforcement); understand before acting; fix the root cause; document. The **engineer answer** (the clever hands-on technical fix, done right now, by you) is the classic trap: mark it with `trap` whenever one of the wrong options is exactly that. Not every scene has one; do not force it.

But do not make "call a meeting" always right. Some scenes must reward decisive action (life safety, containing an active incident per the IR plan, a legally required notice). Vary it.

## The world

All fictional. Real organizations may only be named as authorities (ISC2, NIST, the FBI, a regulator, OWASP).

- **Halvorsen Freight**: mid-size logistics company (trucks, warehouses, a route-planning platform, a customer portal, payment processing for shipments). Breached last spring. Subsidiaries: **Halvorsen MedLink** (medical courier: carries lab samples and handles patient PHI for hospitals, so HIPAA applies), **Halvorsen Labs** (in-house dev team: the portal, mobile driver app, APIs), and a new EU branch in Rotterdam (GDPR).
- **Shifty**: the ghost CISO. Earnest, a bit dim, getting wiser. Can't touch keyboards, badges, coffee or screwdrivers: he has to lead, delegate and decide. Floats through walls (useful in physical-security scenes, unhelpful for badge logs).
- **Dale**: "Chief Synergy Officer", Shifty's confused boss, promoted by accident. Pitches bad shortcuts with total confidence. Never the decision-maker on risk (that's the board / CEO / risk owner).
- **Priya Nair** COO · **Marcus Webb** CFO · **Ines Albescu** General Counsel · **Tomás Reyes** IT Director · **Kim Osei** SOC lead (living, competent) · **Rafa Lind** lead developer at Halvorsen Labs · **Dr. Amara Cole** MedLink privacy officer · **Jonas Vries** Rotterdam ops manager. Vendors, auditors, attackers: invent names as needed.
- Tone: funny in the narration, the reactions and the `open`/`close`. **Exact and plain** in `ask`, options and `why`. Humor never changes a fact.

## Format rules (the validator enforces most)

- Case id `k<domain>-NN` (two digits), stable forever. 4 to 7 scenes per case, mixing kinds. `open` ≤ 80 words, `close` ≤ 60.
- Scene `text` ≤ 75 words and must **make sense alone** (it will be shown outside the case): name the people and facts it needs. `ask` ≤ 30 words, `why` ≤ 50 words and says why the right answer is right *and* why the tempting wrong one is wrong.
- `first`: ask contains "FIRST". `best`: ask contains BEST, MOST, LEAST, PRIMARY, GREATEST or MAIN (capitals). Exactly 4 options, `a` = index, `r` = 4 story reactions (≤ 35 words each: what happens if Shifty does that; the right one moves the story on). Optional `trap` = the engineer-answer index.
- Every other kind gets a story too: `calc` has `r` (4 reactions, one per number), and `rank`, `sort` and `spot` have `rr: ['if right', 'if wrong']` (≤ 35 words each).
- `calc`: 4 numeric options, `a`; show the working in `why`. Distractors are the classic mistakes (forgot ARO, used SLE, wrong formula).
- `rank`: `items` in the CORRECT order, 4 or 5, ≤ 18 words each; `ask` says what the order means (e.g. "first step at the top"). Only for orders that are genuinely fixed by the source (process steps, canon order, test types by disruption).
- `sort`: `bins` (2 or 3) and `pairs` [text, bin index], 4 to 8 items, ≤ 14 words each, every item belongs in exactly one bin by the source's definitions.
- `spot`: `map` with 4 to 12 `nodes` {id, label ≤ 22 chars, x, y on a 0-100 grid, optional w (default 22), h (default 12)}, optional `links` [[id, id]], optional `caption`; boxes must not overlap or run off the grid; `a` = the node id to tap. Use for network diagrams, floor plans, data flows, trust boundaries.
- Options: same category, similar length and detail. If the key is a multi-part list, make the most tempting distractor a multi-part list too, and keep some keys short; `node scripts/check-cues-cissp.mjs` must show every cue at or below about 25% (the right one must not be the longest by habit), no "all/none of the above", no trick wording, no absolutes that give the answer away.
- Spread right answers across positions (they are shuffled at runtime anyway).
- Concept: id kebab-case, `obj` its objective, `name` ≤ 40 chars, `rule` ≤ 15 words, `learn` exactly 3 bullets ≤ 28 words, optional `ghost` ≤ 30 words (Shifty's angle), `src`.

## Coverage

- Every objective in your domains needs **at least 2 scenes**; aim for every bullet of the objective to appear somewhere. Every concept needs **at least 2 scenes, in 2 different cases** (so a flashback can show a different story).
- The 2027 changes deserve extra weight (new items: AI ethics, HIPAA, SLAs in vendor agreements, reputational supply-chain risk, measuring awareness; handling requirements, data management policy, CNAPP; well-architected, two-person integrity, rotation of duties, PETs, HSM, OT, autonomous systems, quantum and post-quantum, key management, AitM, zero-day, AI threats, continuous security review; software-defined security, remote working; identities as targets, passwordless/passkeys, RAdAC; attack simulations, responsible disclosure; SOAR, DLP, EDR/XDR, allowlist/denylist, DDoS scrubbing, MSSP, immutable backups, warm sites, MTTR/MTBF; SSDF, SBOM, shift left, memory-safe languages, SCA).
- Mix difficulty: about 30% `diff: 1`, 50% `diff: 2`, 20% `diff: 3`.

## Check your work

`node ./node_modules/tsx/dist/cli.mjs scripts/build-content-cissp.ts --check` must show **no errors for your domains** (errors about other domains are someone else's). Then read every scene once more as a skeptical CISSP instructor: is the keyed answer the one ISC2 would key? Is any distractor also defensible? If so, fix it.

## The board-exam pool (content/cissp/exam/d<n>.yaml)

Items that appear ONLY in the board exam (never in cases, drills or flashbacks), so a practice exam measures
understanding, not memory of scenes already played. Format:

```yaml
items:
  - id: x3-001          # x<domain>-NNN, stable forever
    c: crypto-hybrid    # an existing concept id from this domain's dN.yaml
    kind: best          # first | best | calc
    diff: 2             # 1 easy, 2 medium, 3 hard (each domain needs at least 20% of each)
    text: >-
      A regional hospital ... (the situation, ≤ 90 words, stands alone)
    ask: 'Which approach BEST ...?'
    o: ['...', '...', '...', '...']
    a: 2
    trap: 1             # optional: the hands-on "engineer answer"
    why: '... (≤ 50 words: why the key is right and the tempting one wrong)'
    src: 'NIST SP 800-57 Pt 1 Rev. 5 sec. 5.3; CISSP 2027 outline 3.6'
```

Rules:
- Real-exam style: neutral organizations ("a regional hospital", "a payments startup"). No Halvorsen, no Shifty, no
  cast names, and no reused case wording (the validator rejects 8-word overlaps with case scenes).
- One clearly best answer per the cited authority, from the manager or risk view where the question calls for it.
  Distractors are plausible and wrong per the source. No "all/none of the above", no trick wording.
- No answer-shape giveaways: run `node scripts/check-cues-cissp.mjs --pool` (every cue about 25% or lower).
- Count per domain: D1 34, D2 30, D3 32, D4 32, D5 34, D6 28, D7 32, D8 28, and every 2027 objective needs at least
  2 items.
