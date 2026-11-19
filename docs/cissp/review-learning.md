# Ghost CISO: learning-design review

Reviewer: learning-design pass (2026-11-19), after the per-domain accuracy reviews. Scope: whether the case files, the
feedback and the review loop teach the CISSP way of thinking, not just facts. Read: DESIGN, AUTHORING, meta, all of
`d1.yaml` to `d8.yaml` (59 cases, 374 scenes, 157 concepts as built today), `play.ts`, `scene.ts`, `srs.ts`,
`briefing.ts`, `onboarding.ts`, `home.ts`.

## Verdict

**Strong teaching content with one serious leak, and a learning loop that is well designed but has four fixable
holes.**

- The scenes really do teach the reasoning. Most `ask` lines are decisions, not trivia. The `why` lines usually say
  why the right answer is right *and* name the tempting wrong one ("Scanning first is the engineer answer: useful
  later, but data without business context", k1-01.1). The wrong-option reactions (`r`) are the best thing in the
  game: each shows a specific consequence that teaches the principle ("Kim deletes the copy, and the evidence with
  it", k1-07.2). Rules are short and memorable at the right level ("Due diligence is finding out and checking; due care
  is acting on it").
- **The leak: test-wiseness.** Before this review, a guesser who always tapped the longest option got **60%** of the
  FIRST/BEST scenes right (chance is 25%). The right answer was the strictly longest option in 164 of 283 scenes. The
  validator's lint only catches answers more than 25% longer than the next one, so it reported nothing. Some D7 scenes
  also had joke distractors ("Printer jams on the third floor", "Send all alerts to Dale by email") that make the
  answer obvious by elimination. A learner can score well here without learning to think like a manager. I fixed the
  worst of this (now **42%**); more is needed (see 1 below).
- **The loop** (scene first, then the briefing; flashbacks from a different case; sure/lean; engineer-answer tracking)
  is sound learning science. The holes: a board exam silently marks concepts as "met", so their first real meeting
  skips the briefing; due flashbacks are capped at 3 per case with no other way to review them, so a backlog builds;
  the readiness number grows with calendar days more than with ability; and the board-exam score is a
  difficulty-weighted percentage, not an ability estimate, compared against a 700 line it does not map to.

## Top 10 teaching improvements (ranked by impact for effort)

| # | Improvement | Impact | Effort | Status |
|---|---|---|---|---|
| 1 | **Kill the answer-length cue.** Trim right answers and lengthen distractors so length predicts nothing. Then make the lint strict: warn if the right answer is the strictly longest in more than 30% of FIRST/BEST scenes. | High | Medium | **Applied in part:** 2 passes over 80 scenes, pick-longest down from 60.4% to 42.0%. 110 scenes still have the right answer strictly longest. The lint change is code (R3). |
| 2 | **Show "why not the tempting one" when the learner is right.** Today a right answer shows only its own reaction, so about 850 authored wrong-option reactions are seen only by people who pick them. Add a "What the others would have done" toggle under the verdict, with the trap first. | High | Low | Code (R1) |
| 3 | **Replace joke or absurd distractors with tempting, plausible wrong answers**, ideally the ones a real candidate picks: a management-sounding wrong owner, CVSS-only prioritization, a hash on the same download page, a password reset that leaves sessions alive. | High | Medium | **Applied** to 16 scenes (table below). More remain, mostly in D7 (for example k7-04.7, k7-06.6, k8-03.1). |
| 4 | **Fix the exam's silent introduction.** `play.ts answered()` calls `cs(s.c)` for unmet concepts in the board exam, which makes `introduced()` true. The concept's first real meeting in a case then gets `fresh = false` and **no briefing** if answered right. That breaks the pretesting design. | High | Low | Code (R2) |
| 5 | **A real review session.** Flashbacks only run before a new case, at most 3. Every new concept comes due the next day, so one case a day (about 5 new concepts) outruns 3 flashbacks a day, and overdue concepts lose strength. Add a "Flashbacks (N due)" tile that serves up to 10 due scenes, and include flashbacks in the daily case too. | High | Low | Code (R4) |
| 6 | **More engineer-answer traps, and an honest engineer rate.** Only 31 of 283 FIRST/BEST scenes had a `trap` (D2 had one). The rate on the readiness screen divides trap picks by all misses, so it is capped low by construction. Rate = trap picks / trap scenes answered. | Medium-high | Low | **Applied:** 7 traps added (31 to 38). The metric is code (R5). |
| 7 | **Break the character tells.** In the scenes read, Dale's proposal was never the keyed answer, and the only option naming legal, the owner or the policy was often the key (32 scenes). Learners learn "not Dale" and "pick the process word". Have competent people (Kim, Tomás, Rafa) propose the wrong move sometimes, give Dale an occasional right call, and add wrong options that sound managerial but name the wrong owner or the wrong process. | Medium-high | Medium | **Applied** in k1-06.5, k1-07.2, k6-01.1, k6-04.4, k7-05.2, k8-03.5. A content rule for future authoring (C1). |
| 8 | **Honest readiness.** `readiness()` is a coverage x retention index (box-based strength, 0 for unseen concepts). It can't pass 700 until concepts reach box 3 or higher, which takes weeks whatever the learner's ability, yet it is shown as "≈ score" next to the 700 pass line. Show it as "coverage" and "retention" separately, and show the estimated score only from board exams. | Medium | Low | Code (R6) |
| 9 | **A better board-exam score.** The score is a difficulty-weighted percent correct. With adaptive difficulty that number depends on the path taken, and it is not ISC2's scaled score. A one-parameter (Rasch) ability estimate over diff levels, mapped to 0-1000 with 700 at the target ability, is about 30 lines. Also flag or discount scenes the learner has already seen, because repeated exams inflate. | Medium | Medium | Code (R7) |
| 10 | **More FIRST and sequence items, plus balance.** 65% of scenes were `best`. Where the material is about order, ask FIRST. Domain scene counts are uneven against the weights: D7 is 21% of scenes against 12.8% weight; D2, D4, D6 and D8 are 8 to 10% against 11 to 13%. Several objectives have only 2 scenes (1.2, 1.5, 1.6, 1.10, 2.5, 3.3, 3.8, 6.1, 7.3, 8.3). | Medium | Medium-high | **Applied in part:** 5 `best` scenes converted to `first`. New scenes are authoring work (C2, C3). |

## Content changes made

No keyed answer was changed (0 of 374), no id changed, and the validator shows 0 errors and 0 warnings. 95 scenes were
edited:

- 5 scenes converted to FIRST.
- 7 engineer traps added.
- 16 joke, absurd or weak distractors replaced with tempting ones, with new reactions.
- 7 `why` lines extended to contrast the new tempting option.
- 1 scene text giveaway removed.
- The rest are length rebalancing: shorter right answers or longer distractors, with the meaning unchanged.

### Substantive changes

| Scene | What | Why |
|---|---|---|
| k1-02.1 | "Wait for a larger sample" became "Get a larger sample first, so the owner sees solid numbers"; `why` now says waiting lets the harm continue | "Understand before acting" is the classic over-applied CISSP rule; this teaches when live harm beats more data |
| k1-04.6 | "Recovery" became "Corrective" (and reaction) | A closer near-miss to compensating; teaches the control-type boundary |
| k1-06.5 | Wrong options became "Tell Dale privately and give him a week" and "Have Kim search Dale's email to confirm it before reporting" (`trap`); `why` contrasts both | Removes the sole-process-word giveaway; both new options are what a well-meaning manager or engineer actually does |
| k1-06.6 | `best` to `first` ("What should Shifty do FIRST?") | A sequence decision: legal check before any sale |
| k1-07.2 | "Call the police now, as Dale suggests" became "Report the theft to the police now, since it is a crime" | Not just "Dale is wrong": the plausible civic-duty move still skips counsel |
| k1-08.1 | "Fish-shaped stress balls" became "The number of phishing simulations sent" | A real activity metric versus an outcome metric (the 2027 "measure effectiveness" point) |
| k1-09.5 | "It is a form of risk avoidance" became "It is risk avoidance, since Halvorsen no longer bears the loss" | Gives the misconception its reasoning, so the learner has to reject the reasoning |
| k2-02.4 | "Degaussing is meant only for paper" became "Degaussing must be followed by an overwrite to count as purge" (and reaction) | A real misconception about SP 800-88 purge |
| k2-02.5 | `best` to `first`; `trap` on "Copy everything to a spare array first"; `why` names it | Owner approval comes first; copying is the hands-on fix that creates an unowned asset |
| k2-03.5 | `trap` on "Print a test page to overwrite the stored images" | A clever technical hack in place of the process |
| k2-05.3 | "Sell them off at the next garage sale" became "Keep them as they are, since EOS only stops new sales" (and reaction) | Tests the EOL versus EOS confusion this concept exists for |
| k3-08.6 | "Opening windows" became "Dedicated HVAC at full cooling, with humidity left uncontrolled" | Makes humidity, the real teaching point, the discriminator |
| k4-04.4 | "Coaxial cable" became "Coaxial cable with a grounded shield"; right answer shortened | Removes the 3:1 length cue |
| k4-06.6 | "Turning off firewall logging" became "An IPS signature for the video system's known exploits" | A tempting detective control that misses outbound exfiltration |
| k5-05.2 | "It shows passwords in a nicer interface" became "It fills in passwords automatically, so admins never see them" | A real vault feature that is not the risk reducer |
| k5-06.4 | "Delete the forwarding rule" became "Delete the forwarding rule and reset Jonas's password" (`trap`); `why` explains that sessions survive a password reset | The most common real-world mistake in account takeover; pairs with k5-02.5 |
| k6-01.1 | "Let them start, since Dale is an executive and has approved it" | Teaches that authority must come from the system owner, not any executive |
| k6-04.4 | "Send Shifty to haunt the data center" became "Send the provider Halvorsen's own security questionnaire instead"; `why` notes self-attestation | A real weak practice set against independent attestation |
| k6-05.1 | "Stop replying until she forgets" became "Ask her to wait for next year's major release" | A tempting stall that breaks the disclosure timeline |
| k7-02.3 | `best` to `first` ("Which evidence should the examiner collect FIRST?") | Order of volatility is a FIRST question |
| k7-03.1 | "Send all alerts to Dale" became "Raise every alert to high severity so none are missed" | A real alert-fatigue anti-pattern |
| k7-03.4 | `best` to `first`; "Do nothing" became "Wait, since the SIEM has raised no alert"; "Buy a second feed" became "Subscribe to a second feed to confirm the report" | Plausible passive moves set against hunting |
| k7-03.5 | Removed "One option is about Domain Admin accounts, the most powerful accounts" from the scene text; "Printer jams" became "Large file downloads by any user" | The text pointed at the answer |
| k7-04.6 | `trap` on "Open it on Kim's laptop with macros disabled" | The hands-on shortcut |
| k7-05.7 | "Rafa should use a faster laptop" became "Rafa may be deploying changes outside business hours" | A plausible audit concern that is not SoD |
| k7-09.2 | "Throw it away" became "Wipe and reimage it before anyone uses it again" (`trap`); `why` says wiping destroys evidence | The IT reflex that loses the evidence |
| k7-10.1 | `trap` on "Reinstall the payment server tonight" | The engineer answer |
| k7-10.6 | `best` to `first`; "Let Bas remove it himself, since he knows the setup" | A sequence decision; plausible but a conflict of interest |
| k7-10.7 | "Hire a more trustworthy administrator" became "Background-check administrators more thoroughly before hiring" | A single real control set against layered defense |
| k7-12.5 | "Give Ruud a bonus" became "A yearly review of a sample of Ruud's billing entries"; `why` updated | A weak detective control set against job rotation and mandatory vacation |
| k8-03.5 | Text: Kim Osei (competent) suggests CVSS base score; option "Fix them by CVSS base score, highest first"; `why` says base score ignores exposure and exploitation | The most common real prioritization error, now proposed by a competent person |
| k8-05.4 | "Shorter slide deck" became "Add each component's licence and latest scan results" | Useful extras that still miss the NTIA minimum elements |
| k8-05.6 | "Email hospitals a list of file sizes" became "Publish SHA-256 hashes on the same download page"; `why` updated | A real anti-pattern: a hash next to the file proves nothing about origin |

### Length rebalancing only

The meaning is unchanged in these. The right answer was shortened or a distractor lengthened.

k1-01.5, k1-03.6, k1-04.5, k1-06.1, k1-06.4, k1-08.4, k1-08.6, k2-01.6, k3-01.7, k3-03.2, k3-04.4, k3-04.5, k3-06.1,
k3-07.5, k3-09.5, k3-10.6, k3-10.7, k4-01.6, k4-02.6, k4-04.6, k4-05.5, k4-06.3, k5-01.1, k5-04.3, k5-04.6, k5-05.1,
k5-05.3, k5-06.1, k5-07.3, k5-07.4, k5-07.5, k5-07.7, k6-02.1, k6-02.6, k7-02.4, k7-02.6, k7-03.7, k7-04.3, k7-04.5,
k7-05.1, k7-05.2, k7-05.4, k7-05.5, k7-05.6, k7-06.7, k7-07.4, k7-08.5, k7-09.5, k7-10.2, k7-10.3, k7-10.5, k7-11.2,
k7-11.3, k7-11.4, k7-11.5, k7-11.6, k7-12.2, k7-12.3, k8-01.2, k8-02.4, k8-03.6, k8-05.5.

`content_version` in `meta.yaml` was not bumped. Bump it when this ships.

## Code and UX recommendations

| # | Recommendation | Rationale |
|---|---|---|
| R1 | In `scene.ts feedback()`, add a collapsed "What the other moves would have done" block listing the other options' `r`, with the `trap` option first. Open it by default when the learner was right but answered "lean". | The contrast with the tempting wrong answer is the core CISSP skill, and the reactions already exist |
| R2 | In `play.ts answered()`, don't call `cs(s.c)` for unmet concepts in exam mode. Track "seen in exam" in a separate set, or make `introduced()` check `box >= 0`. | Today a board exam suppresses the first-meeting briefing for every concept it touches |
| R3 | In `build-content-cissp.ts`, also warn when the right answer is the *strictly* longest option in more than 30% of FIRST/BEST scenes, and when any domain's rate is above 40%. Print the offending ids. | The current >1.25x lint let a 60% pick-longest rate pass silently |
| R4 | Add a "Flashbacks (N due)" home tile: up to 10 due scenes, most overdue first, never from the same case twice in a row. Scale the case pre-roll to `min(due, 3 + floor(due/5))`. | The 3-per-case cap builds a backlog, and overdue concepts lose strength |
| R5 | `engineerRate()`: rate = trap picks / trap scenes answered (and show "x of y trap scenes"). | Dividing by all misses makes the habit look rarer than it is |
| R6 | Readiness: show "Coverage: met/157" and "Retention: mean strength of met concepts" separately. Show "≈ score" only from the last 2 board exams (or blend, labelled). Don't color it against 700 until coverage is above 80%. | The current number rises with days elapsed and can't reach 700 early, whatever the ability; it misleads in both directions |
| R7 | Board exam: estimate ability with a 1PL model (item difficulty −1/0/+1 from `diff`), map θ to 0-1000 with 700 at the target, and report the SE band from the model. Count partial credit on rank and sort. Mark how many items were previously seen and exclude them from the estimate (or warn). | A difficulty-weighted percentage under adaptive routing is path-dependent and not comparable to the exam's 700 |
| R8 | `nextCase()`: balance on *scenes completed per domain / weight*, not on the fraction of the domain's cases done. | The current rule serves D7 (12 cases) more often than D2 (5 cases), the opposite of the weights |
| R9 | Calibration panel: accuracy when "sure" against accuracy when "lean", over the last 50 answers, with one line of advice ("You're right 92% when sure: use it more" / "Sure-but-wrong 30%: slow down on FIRST questions"). | The current "sure but wrong" count alone doesn't teach calibration |
| R10 | When the learner picks a `trap`, add one line to the engineer card from a fixed checklist: "People safe? What does the plan say? Who owns this decision? Root cause?" | Turns the 🔧 flag from a scolding into a reusable decision procedure |
| R11 | Log per-scene first-attempt accuracy (already in `S.log`) and offer an export, so `diff` labels can be recalibrated from data. Several D7 `diff: 1` scenes were easy only because of joke distractors, and are now harder. | The exam's adaptivity rests on author-guessed difficulty |
| R12 | Drill after a case: put the missed scene's *sibling* scene (a different case, same concept) first, then the briefing. | Immediate transfer to a new story, which is the point of the case format |

## Content recommendations for the next authoring pass

- **C1. Character tells.** Write about 1 in 5 Dale proposals as reasonable or even right (with a rule that Dale
  never *decides* risk). Give about 1 in 5 wrong options to a competent character. In at least half the scenes where
  the key names legal, the owner or a policy, add a wrong option that also names a process or an owner, but the wrong
  one.
- **C2. Balance.** Add about 2 cases each to D2, D4, D6 and D8 (about 50 scenes). Prioritize the thin objectives:
  1.6 policy hierarchy (only 2 scenes, and foundational), 1.10, 2.5, 3.3, 3.8, 6.1, 7.3, 8.3. D8 has only 3
  `diff: 1` scenes; D7 has only 7 `diff: 3`.
- **C3. Item mix.** Keep 4-option MCQ as the majority (that matches the real CAT), but aim for about 20% FIRST. Add
  rank items for genuinely fixed orders that are taught only as `best` today: the incident steps with reporting and
  remediation included, and the NIST SP 800-61 lifecycle.
- **C4. Sibling scenes.** 106 of 157 concepts have exactly 2 scenes. After two flashbacks the learner re-meets a scene
  they remember (recognition, not recall). Aim for 3 scenes for the 40 most-tested concepts.
- **C5. Vague rules.** A few rules are lists rather than a principle and are hard to recall under pressure:
  `osi-model`, `transport-performance`, `converged-protocols`, `test-techniques`, `risk-assessment-maturity`,
  `maturity-models`. Rewrite each as one decision sentence.

## Addendum: second content pass (2026-11-19)

**How it's measured.** The FIRST/BEST scenes only (283; calc excluded). The guesser picks the option with the most
characters, and a tie for longest counts as 1/k when the key is among the k tied options. Before means git HEAD
`333dcd0`.

**Longest-option accuracy, before → after:**

| Domain | Before | After |
|---|---|---|
| D1 | 58.1% | 24.4% |
| D2 | 44.7% | 24.2% |
| D3 | 44.9% | 20.4% |
| D4 | 55.6% | 23.5% |
| D5 | 67.6% | 20.6% |
| D6 | 53.6% | 23.2% |
| D7 | 82.0% | 20.5% |
| D8 | 57.6% | 13.9% |
| **All** | **60.4%** | **21.3%** |

**Related cues, measured the same way, before → after:**

| Cue | Before | After |
|---|---|---|
| Shortest option | 9.9% | 14.8% |
| Most words | 32.1% | 17.4% |
| Most process/hedge words (per, policy, plan, approved, owner, legal, procedure, process, risk, management, agreed, documented) | 35.5% | 33.9% |
| Most clauses (commas, semicolons, colons, "and", "then", "with") | 49.1% | 41.5% |

The compound-answer cue (the key is the multi-part list) is still the strongest remaining tell. The metric is crude,
because it also counts acronyms in parentheses. The fix is authoring: write the most tempting distractor as a
multi-part answer too.

**What this pass changed:**
- Rebalanced 69 more option texts. No key changed.
- Reworded the k5-02.1 scene text so it no longer says the user "logs in" at the identity provider.
- Bumped `content_version` to 1.1.0.

In total, 138 scenes differ from HEAD, 0 keys changed, and the validator shows 0 errors and 0 warnings.

## Addendum: third content pass, the multi-part cue (2026-11-19)

Measured as in the second pass (283 FIRST/BEST scenes, ties count 1/k, chance 25%), now with
`node scripts/check-cues-cissp.mjs`. Before means git HEAD `7af4d9a`.

| Cue | Before | After |
|---|---|---|
| Most clauses (the multi-part / step-list cue) | 41.5% | **18.8%** |
| Longest | 21.3% | 17.3% |
| Shortest | 14.8% | 14.3% |
| Most words | 17.4% | 13.5% |
| Most process/hedge words | 34.0% | 22.1% |

Every domain is at or below 25% on every cue (D7's multi-part cue went from 57.0% to 24.2%). The reverse strategies
were checked too, so plain keys don't become the new tell: fewest clauses 17.6%, fewest words 28.5%, and "rule out
the most detailed option, then guess" 27–30% (chance among the remaining three is 25–33%).

**What changed:**
- 170 scenes have reworded options; 65 keys were reworded only (shorter or plainer). A script compared every scene
  with HEAD: 0 keys, traps, rank orders, sort answers or map answers changed.
- Distractors were written to be as detailed as the key (multi-part, with process words) wherever the key was the
  list. Some keys were made short.
- Story reactions were added to all 91 scenes that lacked one: `r` for the 17 calc scenes, and the new `rr`
  ([if right, if wrong]) for rank, sort and spot. The validator now requires them, and `all-scenes.spec.ts` checks
  that every scene's story shows.
- Two independent accuracy reviewers checked all 261 changed scenes against their sources. They fixed 6
  distractors where padding like "per policy" or "per GDPR" made a wrong action sound sanctioned, or blurred PEP/PDP.
  They found no wrong keys and re-checked all the calc arithmetic. I tightened 2 reworded keys myself: k1-05.1 (a
  BIA ranks by impact, not only cost) and k4-05.5.
- The build now warns when any cue goes over 28% overall, or when the multi-part cue goes over 35% in a domain.
- Per-domain change logs with sources: `review-cues-d1-d2-d3.md`, `review-cues-d4-d5-d6.md`, `review-cues-d7-d8.md`.
- `content_version` 1.2.0.
