# SHIFTY-1: learning design review

Reviewed: `src/srs.ts` (grade, GAPS, dueConcepts, strength, readiness, nextNewConcepts), `src/run.ts` (buildRun, plannedNew, play/answered, bench, boss, daily), `src/card.ts` (sure toggle, feedback), `src/earbud.ts`, `src/speed.ts`, `src/facts.ts`, `src/modelcard.ts`, plus `content/d1.yaml`…`d5.yaml` and the drop-2 files.
Content was being added while I reviewed: the first build had 68 concepts, 344 cards and 0 facts. The last build I checked (about 23:00, 2026-11-13) had 68 concepts, 905 cards and 319 facts. Card counts below are from that last build.
Method: code reading. I also ran a 40–60 day simulation that drives the **real** `srs.ts` (fake clock and localStorage, scratch script outside the repo), and two Playwright playtests of the built app at 390×844. The playtests covered three simulated days, every mode, and state dumps after each run.
Who it's for: Cap, a SOC analyst studying for AIF-C01 in 5-minute phone sessions, often hands-free.

---

## Diagnosis

**What already works.**
- **The core loop is retrieval, not reading.** Every lesson is bracketed by questions: pretest, then epoch, then practice. Feedback is immediate and elaborated: the rule first, then the why, then a SOC analogy on a miss. This matches the testing-effect and feedback literature (Roediger & Karpicke 2006; Butler & Roediger 2008).
- **Scheduling is concept-level, and reviews serve a *different* card.** This is the right fix for the "recognize the card, not the rule" problem the ON SHIFT review found. With ~13 cards per concept now, there is enough variety for months of reviews.
- **The confidence toggle with an asymmetric score is a real metacognition tool.** A sure miss is a lapse and comes back as a retry card in the same run. That is the hypercorrection effect used on purpose (Butterfield & Metcalfe 2001).
- **The card formats map onto exam formats and onto real AI-engineering skills.** Catch-the-hallucination is error detection plus correction. Ordering and matching are on the exam.
- **The content is good.** It is accurate, the SOC analogies are well chosen, it follows exam-guide v1.2 (Amazon Quick, Kiro, Strands, AgentCore are all present), and `why` explains the trap.
- **Domain interleaving and exam-weighted selection of new concepts are right** (interleaving: Rohrer & Taylor 2007).

**What limits learning.**
1. **The spaced-repetition math inflates intervals badly. This is the biggest problem in the app.**
   - `grade()` promotes on *every* correct answer, including several on the same day.
   - A new concept is graded twice in its first run (p1 + p2). It then gets graded again by "practice" fill in later runs, by the daily eval, by the red team, by drills and by earbud.
   - In the playtest, `tokens-and-pricing` was learned on day 1 and reached **box 5 (next review in 90 days) on day 2**. `responsible-ai-dimensions` hit box 5 one day after it was introduced.
   - The end screen says every new concept "comes back tomorrow". The real first interval is 3, 7 or 16 days (the 16 comes from sure-right at temperature 1.0).
   - The schedule, the "mastered" count, the syllabus dots and the readiness score are all built on these inflated boxes.
2. **Readiness is not an estimate of exam performance.** It is `100 + 900 × weighted mean(box-based strength)`. The boxes are inflated, the accuracy term mixes in speed-round guesses and forced-sure answers, and nothing is calibrated against benchmark results. In the 80%-accuracy simulation it passed 700 on day 35, with most concepts never tested after a gap longer than a few days.
3. **The benchmark tests the training items with topic cues on screen.**
   - There is no held-out pool.
   - Each card shows its domain, task and kind label ("Using FMs · 3.2 · MATCH").
   - The drop-2 MCQs have a strong **longest-answer cue**: the key is the longest option in **124 of 270 (46%)**, where chance is 25%. For multiple response, the right set is the longest options in 48 of 101.
   - 20 items give roughly ±100 points of noise on the 1000 scale.
4. **Calibration data is polluted.** Temperature 1.0 and the red team log every answer as *sure*. Speed round and earbud log every answer as *lean*. The "your sure is X% / lean is Y%" readout mixes deliberate judgments with forced ones. The XP rule also makes temperature 1.0 the dominant strategy for anyone above about 41% accuracy, which turns off the confidence judgment.
5. **Exam-date pacing caps at 3 new concepts per run and counts runs, not days.** With 59 concepts left and 22 days to go (shown on the model card), one run a day finishes about 57 concepts by the cut-off. Nothing warns that the plan is infeasible. Playing three runs a day introduces 9 concepts a day, which the schedule then cannot absorb.
6. **Generated fact cards are useful, but they are graded as if they were the concept.**
   - A single term-to-definition recall promotes the whole concept.
   - The feedback shows the *concept's* rule. "What is Top-k?" was answered with the rule "Low temperature means focused and repeatable…".
   - These cards are labelled "EXAM SCENARIO" even though they are plain definitions.

**Friction budget (phone, often one-handed or eyes-free).** A run is ~10 graded cards plus up to 3 lessons in about 5 minutes, so roughly 25 s per card. Most changes below are invisible to the player because they change scheduling and scoring, not taps. The two that add interaction (#4 and #9) are costed explicitly.

---

## Answers to the specific questions

**Is pretest, then epoch, then two spaced practices right?** It is right for the first session. It is wrong about what happens next.
- The pretest effect is robust when the guess is followed by the lesson (Richland, Kornell & Kao 2009; Pan & Carpenter 2023 review). Showing the rule and why right after the pretest is fine.
- p1 comes roughly 20 s after the epoch, so it is answered from working memory. It helps confidence and encoding but says little about learning. p2 comes 3–5 items later, a short lag with a different format, which is good.
- What is missing is **successive relearning**: recall to criterion in several *separate sessions*, the first at about 1 day (Rawson & Dunlosky 2011, 2013). Today p1 and p2 both promote, which skips that first next-day retrieval. Fix it in the scheduler (#1), not the run.
- Make the pretest something you have to generate an answer for, not a true/false coin flip. Most `pre:` cards are `tf` (44 of the 68 originals), and a 50% guess primes less than a 4-option guess.

**Concept SRS bugs (srs.ts / run.ts).**

| # | Where | Bug | Effect (measured) |
|---|---|---|---|
| S1 | `srs.ts:19-33` `grade()` | Every grade ≥2 promotes, even when `st.last === today` | A new concept answered right twice in its first run ends at box 2 (7 d). Sure-right ends at box 3 (16 d). |
| S2 | `run.ts:58-66` (fill) | "Practice" fill grades concepts that are **not due** (`learning` + `weakest(8)`), so early reviews promote | In the real-srs sim (one run a day, 80% accuracy, lean only), 38 of 68 concepts were at box 5 (90 d) by day 35. In the playtest, a concept reached 90 d on day 2. |
| S3 | `run.ts:205` | Daily, red team, benchmark, drill and earbud all call `grade()` for introduced concepts, and all promote | Several promotions a day per concept |
| S4 | `srs.ts:22` | First grade at `g=3` jumps straight to box 2 (7 d) | No next-day retrieval after a sure-right first answer |
| S5 | `run.ts:216` + `grade()` | A sure miss lapses to box 0. The same-run retry answered right then moves to box 1 (3 d) | A confident error is not seen the next day |
| S6 | `run.ts:47,56` | Reviews are capped at 5 per run, and fill takes `weakest` **instead of** the remaining due concepts. New concepts stop entirely when due > 10 | At 60% accuracy, due count reached 13 by day 30. New concepts stalled at 51–55 of 68 and the syllabus never finished. |
| S7 | `grade()` | Being overdue earns no credit. A right answer 30 days late moves one box, the same as one on time | Wasted reviews for strong learners (minor) |
| S8 | `run.ts:312` | The end screen says "comes back tomorrow" for every new concept | Untrue in nearly every case |
| S9 | `modelcard.ts` "Mastered (7+ day interval)" uses `box >= 3` | Box 3 is a 16-day interval, not 7 | Label is wrong (minor) |

**Backlog growth with ~70 concepts.** Once S1–S3 are fixed, real intervals get shorter, so the review load goes **up**: roughly 6–9 reviews a day in steady state with 68 concepts. One run (5 reviews plus ~5 fill) can carry that only if fill draws from due concepts first. See #1 and #2 for the queue rule and a daily review budget.

**Pacing to an exam date.** `plannedNew()` returns `ceil(left / (days − 3))`, clamped to 1–3, *per run*. Problems:
1. It counts runs, so the plan depends on how often you play.
2. The cap of 3 makes any exam under ~23 days infeasible, and nothing says so.
3. It ignores the review load that those new concepts will create later.
4. There is no taper: the last 3 days are reserved, but the final 10 days should shift toward mixed exam-style practice and benchmarks.

See #3.

**Is the readiness estimate valid?** No, not yet.
- It is a weighted average of a box-lookup table (`[0.3…0.95]`) times recent accuracy.
- That recent accuracy mixes speed, earbud, daily and forced-sure answers.
- It drops 1% per overdue day and counts never-seen concepts as 0.
- There is no link to the probability of answering an exam item correctly, and no check against benchmarks.
- In the playtest, readiness said 182 while the benchmark said 682–702. Neither is wrong as such, but showing two unrelated numbers in "/1000" units confuses the decision about when to book.

See #5.

**Calibration.** The design is right: a binary sure/lean judgment with an asymmetric payoff. Careful mode's break-even is sound: sure beats lean when p > 0.59. The problems:
1. **Forced-sure and forced-lean answers are logged as real judgments.** Temperature 1.0, red team, speed and earbud all do this. In the playtest, every run-4 answer was logged as "sure".
2. **Temperature 1.0 pays +25/−12, which beats careful mode's best response above ~41% accuracy.** XP-seeking players will switch to it, and that removes the judgment.
3. **The sure toggle sits *below* the options**, but MCQ and true/false lock on the first tap. You have to commit to confidence before you answer, and the button is in the wrong place on screen for that, so most answers default to "lean".
4. **The readout is only "sure − lean ≥ 10 points".** A useful target is "when sure, right ≥ 85–90%", split by domain.

See #4.

**Benchmark validity against the real exam.**
- **Item exposure.** Benchmark items come from the same pool as training. After a few benchmarks plus weeks of training, a "pass" partly measures recognizing items you have seen.
- **Cues.** The domain, task and kind header gives away the topic. The longest-answer bias (46% in drop 2) and absolute words (10% of distractors vs 3% of keys) give away the answer.
- **Length and sampling.** 20 items, one card per sampled concept, uniform within a domain (task weights ignored). 40 is better. The real exam is 65 questions (50 scored) in 90 minutes. Stems here have a median of 23 words; real AIF-C01 stems often run 40–70 words with business context.
- **Behaviour.** It auto-advances after 260 ms, with no flag-for-review and no changing answers. Benchmark answers also grade spaced repetition with no feedback until the end, which is fine but adds to S3.
- **Scoring.** Linear `100 + 900 × weighted %` is a reasonable proxy, but AWS uses scaled scoring with unpublished cut equating. Show it as "≈ % correct, needs ~72–75% to be safe" with a band, not a precise number.

See #6 and #7.

**Value of generated fact cards.** They are high-value for one thing AIF-C01 tests heavily: **telling confusable services and terms apart** (Comprehend vs Textract vs Transcribe, Top-k vs Top-p, Scope 1–5). Same-group distractors are exactly the right contrastive set. In their current form they are recall-only (`diff: 1`), they promote the whole concept, they show an unrelated concept rule as feedback, and their `why` just restates the definition. They should feed their own fact-level schedule and teach by contrast. See #8.

**Earbud mode.**
- **Good:** true/false via ⏮/⏭ works without a screen. A 12 s timeout reveals the answer without grading. The `say` scripts are written for listening.
- **Limits:**
  - It is true/false only, so it never practises scenario discrimination.
  - A lesson plus two true/false claims on the same concept the same day double-promote it (S1).
  - It introduces 2 new concepts every session regardless of the backlog.
  - Prev/next is a triple-press or double-press on most earbuds, which is error-prone.
  - The on-screen colours are inverted: "Hallucination" is green and "Legit" is red.

See #9.

**Could a learner pass AIF-C01 from this?** Probably yes on knowledge coverage. Possibly not on the evidence the app gives. Coverage is now broad: all objective bullets, the v1.2 services, and evaluation metrics (ROUGE, BLEU, BERTScore, F1). The gaps:
- **Long, multi-constraint scenario stems.** The exam's main difficulty is picking the *best* of several plausible AWS options under cost, latency and compliance constraints.
- **A full-length timed mock (65 Q / 90 min)** to train pacing and stamina.
- **Option-level explanations** ("why B is wrong").
- **Thinly covered services and terms:** Amazon Kendra (0 mentions; still a common distractor), SageMaker Canvas and Data Wrangler (0), Amazon A2I (1), AWS Well-Architected (0, and it is in the exam's in-scope list), Cost Explorer and Budgets (0–1), AUC, RMSE and confusion matrix (0–1), LIME and partial dependence (0). Some of these are out of scope in v1.2. An accuracy reviewer should confirm.
- **A trustworthy go/no-go signal** (#5–#7).

Recommend also pointing to AWS's official free practice question set before booking.

---

## 10 changes, in priority order

### 1. Fix the scheduler: one promotion per concept per day, and first review tomorrow
- **Why:** expanding-interval schedules only work if each promotion follows a successful retrieval *after a real gap* (spacing effect; Cepeda et al. 2008). Successive relearning needs about 3 spaced successes, starting the next day (Rawson & Dunlosky 2011). Today's same-session promotions skip all of that, so concepts vanish for 1–3 months after a single day.
- **How:**
  - In `grade()`, if `st.last === t` and `g >= 2`, record the answer but don't change `box` or `due`. Only the first graded answer of the day promotes; misses still demote.
  - From box −1, any correct answer sets box 0 (due tomorrow). Drop the jump to box 2.
  - Promote only if `gap >= 0.5 × GAPS[box]`, so early reviews don't count.
  - For overdue successes, allow a jump of 2 when `gap >= 2 × GAPS[box]`.
  - After a lapse, the retry card can confirm but not promote.
  - Make the end screen show the real next date ("back tomorrow", "back in 3 days").
- **Data/schema:** none (the `CState` fields already exist). Optional: add `firstToday: boolean` to `LogEvent` so analytics can separate the evidence answer from practice.
- **Friction:** zero.

### 2. A queue that serves due concepts first and budgets reviews
- **Why:** with correct intervals, about 6–9 concepts are due per day. Missed reviews compound. The current fill grades the weakest *non-due* concepts while due ones wait (S6).
- **How:**
  - Fill order: due (oldest first), then lapsed-today, then learning concepts whose due date is tomorrow (only as non-promoting practice), then new concepts.
  - Gate new concepts on a projected load, not on `due > 10`: allow a new concept only if tomorrow's projected due count is ≤ 8.
  - Home shows "Today: 7 reviews · 2 new".
  - After the day's due set is cleared, "Another run" becomes non-promoting practice (or the speed round, or a benchmark).
- **Data/schema:** none. `S.cs` already has `due`.
- **Friction:** none. Runs stay 10 cards.

### 3. Exam-date pacing per day, with an honest feasibility line
- **Why:** goal-setting with concrete, attainable sub-goals improves persistence (Locke & Latham). An infeasible plan that looks fine is worse than none.
- **How:**
  - `newPerDay = ceil(left / max(1, daysLeft − 7))`. Keep the last 7 days for mixed practice and benchmarks.
  - Track `S.newToday` and spread the day's new concepts across however many runs happen.
  - If `newPerDay > 5`, show "Syllabus finishes on Dec 3; exam is Dec 1. Add a second run on 6 days, or move the date." Raise the cap to 5–6 when needed.
  - In the final 7 days, switch runs to an exam mix: 70% due and weak concepts, 30% fresh benchmark-style items.
- **Data/schema:** `S.newToday: {day, n}`.
- **Friction:** one line of text on the model card and home.

### 4. Clean calibration data, and let confidence follow the answer
- **Why:** calibration training needs honest judgments (Koriat; Dunlosky & Rawson 2012 show overconfidence ends study too early). Forced values corrupt the signal. A dominant XP strategy removes the judgment.
- **How:**
  - Log `conf: 'sure' | 'lean' | 'forced'`. Leave forced answers (temperature 1.0, red team, speed, earbud) out of calibration and the "hallucination rate".
  - Rebalance spicy XP so its expected value equals careful play at about 75% accuracy: +18/−18. Its appeal becomes variance plus a cosmetic, not more XP.
  - Move the toggle **above** the options, or use "long-press an option = sure answer" (no extra tap).
  - Model card: "When you tap Sure you're right 78% (target 90%)", plus a per-domain mini-table.
- **Data/schema:** `LogEvent.conf`. Migrate existing `sure` values as-is.
- **Friction:** none with long-press. One reach-up change with a moved toggle.

### 5. Replace readiness with a predicted-percent-correct, and show coverage separately
- **Why:** a learner decides when to book from this number. It has to be a calibrated probability, not a table lookup.
- **How:**
  - Per concept, keep a recall estimate `p = 2^(−elapsed / halfLife)`. Halve `halfLife` on a lapse and grow it on a spaced success, using only first-of-day evidence answers (a simple half-life regression in the style of Settles & Meeder 2016).
  - Exam estimate = Σ over domains of weight × mean `p` over **all** concepts in the domain (unseen concepts count at a guess rate of ~0.3).
  - Show it as "≈ 64% (±6)", with a "Syllabus covered 40/68" bar beside it.
  - When at least 2 benchmarks exist, blend the two and show the gap ("benchmarks say 71%, the model says 64%").
- **Data/schema:** `CState.hl` (half-life in days).
- **Friction:** zero.

### 6. Hold out a benchmark pool and strip cues
- **Why:** a benchmark only predicts the exam if items are new to you and cue-free. Re-testing seen items inflates scores (the transfer-appropriate-processing argument cuts both ways).
- **How:**
  - Mark about 2 exam-format cards per concept `bench: true` (about 140 items), and never serve them in runs, drills, daily or red team.
  - Hide the domain, task and kind header in benchmark mode.
  - Add a validator lint: the key must not be the uniquely longest option in more than ~30% of a file. The current drop-2 rate is 46%.
  - Sample concepts by **task** weight within a domain.
  - Show `score ± 1.96·SE`.
  - Track item exposure and warn when more than 30% of a benchmark's items were seen before.
- **Data/schema:** `Card.bench?: true`, `S.benchSeen: string[]`.
- **Friction:** none. One content pass to rebalance option lengths.

### 7. A full mock: 65 Q / 90 min, flag and review, longer stems
- **Why:** practice under test conditions (the length, pacing and review behaviour of the real exam) improves transfer and calibrates time use. Long stems are the exam's main difficulty.
- **How:**
  - Add a "Full mock" option (65 items: 50 counted plus 15 "unscored-style" drawn from diff 3).
  - Allow changing answers, with a ⚑ flag and a review grid before submitting. The 260 ms auto-advance is replaced by a Next button.
  - Make it pausable and resumable across sessions, since 90 minutes doesn't fit a 5-minute habit (save the progress index).
  - Author ~40 long-stem "best option under constraints" cards (`diff: 3`, 45–70 words, plausible AWS-only distractors).
- **Data/schema:** `S.mock: {items, answers, flags, t}`. New content.
- **Friction:** opt-in, used once or twice a week near the exam.

### 8. Fact cards on their own schedule, teaching by contrast
- **Why:** discrimination learning needs the confusable pair shown side by side (contrasting cases; Schwartz et al. 2011). One definition shouldn't stand in for a whole concept.
- **How:**
  - Keep a light Leitner box per fact (`S.fs[factId]`). Generated cards grade the fact, not the concept.
  - Concept credit comes only from authored cards.
  - On a miss, show "You picked **Textract**: extracts text and forms from documents. **Comprehend**: finds meaning in text." (contrastive feedback using the chosen distractor).
  - Show the fact's own term and definition in the rule slot, not the concept rule.
  - Label it "TERM CHECK", not "EXAM SCENARIO".
  - Add a scenario template: "A company needs to {use-case clause}. Which service?" This needs a new `use:` field on service facts.
  - Speed round: penalise wrong answers (−1 point) so mashing stops paying, and feed misses into the fact schedule.
- **Data/schema:** `S.fs`, optional `Fact.use`.
- **Friction:** none.

### 9. Earbud mode that practises discrimination, not just true/false
- **Why:** for hands-free study the bottleneck is the response channel, not the content. Two-option audio questions keep the effort high (desirable difficulty) with the same two buttons.
- **How:**
  - Add "Which fits better: option one, …; option two, …?" built from `duel` cards and from fact pairs in the same group. ⏮ = one, ⏭ = two.
  - Before each claim, re-read the concept rule for *due* concepts only.
  - Grade with first-of-day semantics (#1).
  - Don't introduce new concepts when the backlog is over budget (#2).
  - Map answers to **volume up/down** where the Media Session allows, or keep play/pause = "repeat the question".
  - Fix the colours: Legit green, Hallucination red/purple.
- **Data/schema:** none.
- **Friction:** same two gestures.

### 10. Make the content harder in the ways the exam is hard
- **Why:** desirable difficulties (Bjork). The current mix is 200 diff-3 cards out of ~900. Many distractors use absolutes ("always", "no cost"), which can be ruled out without knowing the content.
- **How:**
  - Add a lint pass for absolutes in distractors, longest-option bias, and stem-word overlap with the key (14% of MCQs).
  - Ensure each concept has at least 2 diff-3 scenario cards.
  - Add an `explain` line per distractor for diff-3 cards (shown on a miss).
  - Add missing exam-adjacent comparisons: Kendra vs Bedrock Knowledge Bases vs OpenSearch; AUC and confusion matrix; Well-Architected ML lens; Canvas for no-code.
- **Data/schema:** optional `Card.ox?: string[]` (per-option explanations).
- **Friction:** none. Reading time on a miss goes up about 3 s.
