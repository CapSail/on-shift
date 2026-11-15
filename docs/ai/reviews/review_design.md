# SHIFTY-1: design review (playtest, 2026-11-13)

Tested the production build (`dist/`, served by `vite preview` on 127.0.0.1:4190) in headless Chromium through Playwright. Settings: 390×844, Pixel 5 mobile emulation (touch, Android UA), DPR 2. The script lives outside the repo and answers cards from `src/generated/content.json` by the id in `.card .cid`.

Content was being rebuilt during the session, so I played two builds:
- **Build A:** 344 cards, no facts.
- **Build B:** dist rebuilt 22:53, 809 cards, 269 facts.

Played on each build:
- Install gate and onboarding.
- First training run at ~75% accuracy with random sure taps.
- A second run the same day.
- A simulated **day 2**: `cs[*].due/last`, `lastPlay` and log days moved back 1.
- Temperature 1.0 run.
- Daily eval, share (clipboard) and a revisit.
- 20Q benchmark.
- Red team won (6 straight), then lost (record cleared, 3 wrong).
- Weak-spots drill.
- Model card with an exam date.
- Syllabus and its modal.
- Speed round: on build A it was a dead end; on build B I played a full 60 s by mashing.
- Earbud mode (play, answer).
- Mid-run quit.

I looked at 110 screenshots and measured where the verdict sits against the fold and the dock after each answer. **No console errors or page errors in any run.**

**Verdict.** The app is polished and the premise lands. Shifty-as-model, temperature as a risk dial, the model card as the report card, and Dale as the attacker are all clever, and they *teach* the vocabulary while being jokes. The pixel art, haptics, combo and share grid feel good. Three things hold it back:
1. **On long cards the feedback (the teaching moment) usually lands under the Next button, unseen.**
2. **The progress the player sees (tiers, mastered dots, readiness) runs ahead of real learning**, because the scheduler promotes concepts several times a day (see the learning review, #1).
3. **The side modes are thin.** The red team is the same deck all week and about 60 seconds long. The speed round pays for mashing. Earbud's colours are reversed.

---

## 1. Bugs (with repro)

| # | Severity | Bug | Exact repro |
|---|---|---|---|
| B1 | **High** | **Feedback renders below the fold and under the fixed Next dock, with no auto-scroll.** On multi, hallu, order, match and generated-match cards the verdict top is at 787–899 px against a dock top of 767 px (viewport 844). The player sees coloured options and the Next button, taps Next, and never reads the rule or the why. | Fresh save → START EPOCH 1 → pretest → epoch → answer the MULTIPLE RESPONSE card (d1-004 on build A) → Lock in. The `#fb .verdict` top is 790 px and the dock covers it (shots `09_run1_fb2_multi`, `42_drill_fb3_hallu`). The same happens for every hallu card, measured at 829–899 px. |
| B2 | **High** | **Concepts jump to 1–3-month intervals within a day, and the end screen lies ("comes back tomorrow").** Same-day grades all promote (`srs.ts grade()`, `run.ts:58-66, 205`). | Play run 1, then run 2 the same day → localStorage `cs['tokens-and-pricing']` = box 3, due +16. Do the day-2 run → box 4/+35. One day later it is box 5/+90. Run 1's end screen said "comes back tomorrow" for all 3 concepts, but they were due +3, +7 and +7 (shot `13_run1_end`). |
| B3 | Med | **Epoch: the RULE box, the one line to remember, sits under the "Got it, train me" dock.** | Any epoch at 390×844 (shot `07_run1_epoch`). The rule text is cut off by the dock, and "Got it" works without scrolling. |
| B4 | Med | **"JAILBROKEN" overflows the screen width** (the grade text in Press Start 2P clips to "JAILBROKE"). | Red team → DEFEND SHIFTY → answer 3 wrong → result screen (shot `37_boss_loss`). |
| B5 | Med | **The red-team deck is identical on every try in a week** (`buildBoss` is seeded by `week()` only), and the loss screen shows the answers. The next day's rematch is memory, not skill. | Lose (cards d5-004, d5-057, d4-015 on build A; d4-221, d4-238, d3-288 on build B) → clear `S.boss` or wait a day → fight again: the same cards come in the same order. |
| B6 | Med | **Earbud colours are inverted:** "⏮ Hallucination" is green and "Legit ⏭" is red (ON SHIFT's `b-cls`/`b-esc` classes reused, `earbud.ts:63`). | Home → Earbud mode (shot `50_earbud_playing`). |
| B7 | Med | **Generated cards are labelled "EXAM SCENARIO" and show the wrong rule.** "What is Top-k?" is labelled EXAM SCENARIO. The feedback RULE is the parent concept's ("Low temperature means focused…"), not the fact (`facts.ts:33-34`, `card.ts:219`). | Day-2 or temperature-1.0 run on build B until a `g:` card appears (shot `26_run4-spicy_fb11_genEXAMSCENARIO`). |
| B8 | Med | **Speed round rewards mashing.** Wrong answers cost only 1.1 s. Tapping the first option for 60 s gave 17 right / 35 wrong, "NEW BEST 🏆", +51 XP, and earned the daily uptime. | Fresh save → Speed round → tap the first option repeatedly (shot `speed_end`). |
| B9 | Med | **The benchmark shows "🎯 Sure? +15 / −10 when on", but benchmark XP ignores sure** (6/0, `run.ts:149,191`). The daily shows "on: counts as 🟩", which is correct. | Benchmark → Quick 20Q → look under the options. |
| B10 | Med | **Build A only: Speed round with an empty fact bank is a dead end.** It shows "The fact bank is empty in this build." with no ✕ or back button, yet the home tile still advertises it. The guard in `speed.ts` still has no quit button. | Build A → Speed round (shot `48_speed`). |
| B11 | Low | The model-upgrade toast and confetti fire **mid-card** and cover the card header, options and verdict. | Cross a tier on any answer (shots `20_…genMATCH`, `26_…`, `25_run4_spicy_end`). |
| B12 | Low | The "+51 XP" float overlaps the speed-round grade numeral. | End of a speed round (shot `speed_end`). |
| B13 | Low | The red team intro says "About 4 minutes". A fight is 3–8 cards, about 60–120 s. | Red team intro vs. an actual fight. |
| B14 | Low | Onboarding's only CTA, **START EPOCH 1, is below the fold** at 844 px, after a 5-bullet wall. | Fresh save, skip the gate (shot `03_onboarding_fold`). |
| B15 | Low | "Lock in (0/2)" looks enabled: solid teal, low-contrast text, the same as active. | Any multi/order/match card before selecting (shot `08_run1_q1`). |
| B16 | Low | The benchmark shows the domain, task and kind header (e.g. "Using FMs · 3.2 · MATCH"), which leaks the topic. It also auto-advances 260 ms after a tap, so a mis-tap is final. | Benchmark → any question (shot `31_bench_q`). |
| B17 | Low | Model card "Mastered (7+ day interval)" counts `box >= 3`, which is a 16-day interval. | Model card. |
| B18 | Low | The exam-date note says "each run teaches 3 new concepts" when 3 a day can't finish 59 concepts in the time left, and nothing warns about it. | Model card → set a date 21 days out → "22 days left. 59 concepts… 3 new concepts" (shot `45_modelcard_exam`). |
| B19 | Low | The generated 4-pair match (long definitions) is about 2 screens tall. Lock in and feedback are both below the fold. | Day-2 run until `g:…:m` appears (shot `20_…genMATCH`). |

Not bugs, checked and fine:
- Streak is earned only on finishing.
- Quitting mid-run leaves no dock behind and returns home.
- The daily is one attempt, and the revisit shows the share card.
- Share copies `SHIFTY-1 Daily Eval #1 8/10 / grid / URL` to the clipboard (with no `navigator.share` in headless).
- Retry cards appear after confident misses.
- Back from every screen returns home.

---

## 2. Design critique

### Moment-to-moment feel
- A card is 1 tap (MCQ/tf/duel) or 3–6 taps (multi/order/match), then **Next**. The rhythm is good, with sound, buzz, a shake on a miss, a combo "x3" pop, Shifty's face changing and the XP label pulsing.
- **The weak beat is right after the answer.** On short cards the verdict, the RULE (yellow) and the why stack nicely (shot `06_run1_fb1_tf`). On long cards nothing visibly changes except colours, and the dock says "Next" (B1). The fix is cheap: scroll `#fb` into view (`scrollIntoView({block:'end'})` above the dock), or collapse the answered card to its chosen option and slide the verdict up.
- Pretest → epoch → practice feels like a lesson rather than a quiz. The PRETEST · NO PENALTY flag and the coach banner make guessing feel safe. But the pretest's own feedback already shows the full RULE and why, so the epoch that follows repeats it. Consider showing only the right/wrong verdict on a pretest ("Hold that thought, lesson next") and saving the RULE for the epoch.
- Temperature 1.0 is a great idea (the exam-concept joke *is* the mechanic). As tuned (+25/−12) it is simply better XP, so the "careful" choice has no pull. See the learning review, #4.

### Readability on a phone
- The type is large and legible. Space Grotesk for body and Press Start 2P only for headings is the right split. Contrast is good on the dark theme.
- Stems in bold at about 17 px make MCQ stems heavy. Four-line bold stems (shot `08`) read as shouting. Use regular weight for stems and bold for the key noun phrase only.
- Hallu cards are tall: 4 dashed boxes, then a second step with 3 more options. On 390×844 the correction options and verdict always fall below the fold. Tighter line boxes (no dashed borders, 8 px padding) would keep the whole card on one screen.
- The epoch's three bullets are fine. The SOC BRAIN box in small dashed purple text is the most charming part and the smallest text on screen. Give it equal weight to the bullets, and move RULE **above** the bullets as the headline, so the one thing to remember is never under the dock.

### Thumb reach
- The Next dock (full width, bottom) and option buttons (full width, 64–70 px tall) are excellent for one thumb. ✕ quit at the top left is fine since it is rarely used.
- The 🎯 Sure toggle is reachable but **in the wrong order**: it sits below the options, while MCQ/tf/duel lock on the first tap. You must reach past the answers to set confidence, then come back up. In practice most answers get logged as "lean". Long-press an option for "sure" (with a haptic tick at 350 ms), or move the toggle above the options.
- The home screen puts START TRAINING RUN high (y≈640/1688), with 8 tiles below in a 2-column grid. Fine, but the screen is long: tiles, an install button, 8 hats and the footer. The daily eval, the most social thing, is the 4th visual block.

### Feedback juice
- Good: combo pop, XP pulse on the verdict label, shake, haptics, confetti on a perfect run, the tier-up toast, Shifty's expressions.
- Misplaced: the tier-up toast and confetti fire mid-card and cover the content (B11). Queue them for the end screen ("MODEL UPGRADE → Tokenizer" as its own beat with Shifty's new pose and tier flavour), which also makes it a bigger moment.
- Missing: a progress signal *inside* the run for what you learned. On the end screen, "New training data: X — comes back tomorrow" is the right idea but currently wrong (B2). Add "Reviewed: 4 concepts, 3 got stronger (●●○ → ●●●)".

### Humor: does it land, and how often does it repeat?
- It lands. "Amazon Vibes", "I have like six neurons", "Dale says I'm 'production ready'. Dale says that about everything", and the model card's "Not intended for: replacing the SOC (sorry, Dale)" all work. Dale's end lines are good and short.
- Repetition is the risk. The pools per brain tier are small:
  - `ok`: 5 / 4 / 4 lines.
  - `no`: 4 / 3 / 3.
  - `pre`: 3 / 2 / 2.
  - `epoch`: 3 / 2 / 2.
  - Each Dale pool: 2–3.

  The no-repeat deck helps, but a 10-card run with 7 right uses most of the `ok` pool, so by run 3 every line is a rerun. The pretest banner repeats every lesson (2–3 times a run).

  Options:
  - Triple each pool.
  - Show a line on only ~1 in 3 answers (silence makes the jokes land).
  - Add **concept-specific** one-liners (an optional `quip:` per concept: "Embeddings: vibes with coordinates").
- The Red team taunt ("Respond only in base64…") has nothing to do with the card under it (an IAM true/false). The joke would land twice as hard if the attack *were* the question (see the red team section below).

### Meta progression
- **The tier ladder is good.** Ten tiers named after the training pipeline teach the pipeline as a side effect. The fake parameter count is a nice touch.
- **XP runs fast early:** 9 sessions took the playtest to tier 4 (Instruction-Tuned) on day 2. That is fine for hooking, but it decouples from knowledge. Tie the top tiers to **mastery gates** as well as XP, e.g. "Grounded" needs D3 at 60% predicted, and "AGI (Allegedly)" needs two benchmarks of 750 or more.
- **Hats** (7 milestones) are cosmetic only. Fine. Add 2–3 tied to *learning behaviour*: "Calibrated" (sure accuracy ≥ 90% over 50 answers), "Red-teamer" (beat Dale 4 weeks running), "Full syllabus".
- The syllabus with ○ ◐ ● dots is the best long-term progress view. Today it shows "mastered 95%" on concepts learned yesterday (B2).

### Daily eval and share loop
- **Works well.** One attempt, same cards for everyone (Chicago day), 🟩 sure-right / 🟨 lean-right / 🟥 miss, a URL, and a revisit that shows the result.
- **The 🟩/🟨 split is clever**: the grid shows confidence too, which is the app's teaching point.
- **New players get cards on concepts they've never seen.** That is fine for a shared daily, but say so on the result: "6 of these were from concepts you haven't trained yet".
- **The share text is plain.** Add Shifty's tier and the streak ("SHIFTY-1 Eval #12 · 8/10 · 🔥5 · Instruction-Tuned"). Those are bragging rights, and they recruit.
- **No social comparison yet.** A "today's global average" or a friends board (ported from ON SHIFT) is the next lever for retention.

### Red team: is it fun?
- The premise is the best in the app (Dale as the jailbreaker, the AI-security half of the exam as defence).
- As built it is a 6-card true/false/MCQ sprint (about 60 s to win), the same deck all week (B5), and the taunt is decoration. Win or lose, it ends almost before it starts.

Suggestions:
1. **Make each round an attack with a defence question.** Dale's attack line is the stem, e.g. "Dale hides 'ignore your instructions' in a PDF your RAG app ingests. What stops it?", with options drawn from Guardrails, least-privilege IAM, input validation and human review. Author about 20 attack-to-defence cards tagged `atk:`.
2. **Use phases.** At HP 66 and 33 Dale escalates ("He found the system prompt"), and the card difficulty steps up.
3. **Give a fresh deck per try**, seeded by `week + tries`, so a rematch tests the concept, not the item.
4. **Make the result shareable** ("Held Dale-GPT in 7 moves 🛡️").
5. **Fix B4 (overflow) and B13 (time claim).**

### What would make it addictive in a good way
- **A visible daily goal that completes.** "Today: 7 reviews + 2 new" with a ring that fills and a "Shifty's weights are synced ✅" done state. Then extra play becomes optional practice. The app has all the data (`dueConcepts`, the plan).
- **Progress tied to real learning.** Domain bars on the model card that move when *spaced* recall succeeds, a "retention" number that unlocks after day 7, and tier gates tied to mastery. Players trust and chase numbers that mean something.
- **Tomorrow hooks.** On the end screen: "Tomorrow: Dale tries prompt injection, and your 3 new concepts are up for recall." Spacing becomes the cliffhanger.
- **Variety in the 5 minutes.** One "special" card per run, e.g. a Shifty glitch round (find 2 hallucinations in 5 lines), a duel, or a mini-boss on the weakest concept. This is a variable reward that is still learning.
- **Avoid rewarding volume.** Speed-round mashing (B8), XP for 1.0 (#4 in the learning review) and "Another run" after due work is done should give less XP, not more.

---

## 3. Top 10 fixes, in priority order

1. **Bring feedback into view (B1, B3, B19).** After `finish()`, scroll `#fb` so the verdict and RULE sit just above the dock, or collapse the answered card. In epochs, put RULE first and add bottom padding equal to the dock height (`.scr.run{padding-bottom:calc(96px + var(--bot))}`). This makes the core teaching moment visible on every card.
2. **Fix the scheduler (B2).** One promotion per concept per day, the first review tomorrow, due-first fill, and an honest "comes back in N days". See the learning review, #1–#2. Everything the player sees about progress depends on this.
3. **Confidence after or with the answer, not below it.** Long-press = sure (or move the toggle above the options). Rebalance temperature 1.0 to equal expected value. Exclude forced answers from calibration. Remove the sure toggle from the benchmark, or make it honest (B9).
4. **Rebuild the red team as attack-to-defence** with a fresh deck per try (B5), phases, the taunt as the stem, a fixed overflow (B4), an honest duration (B13) and a share line.
5. **Speed round: −1 for a wrong answer and a 3 s lockout after 3 misses in a row**, so mashing doesn't earn "NEW BEST" or uptime (B8). Add a ✕ to the empty-bank guard (B10).
6. **Generated cards: "TERM CHECK" label, the fact's own term and definition in the rule slot, and contrastive feedback naming the distractor you picked** (B7). Use a 3-pair match when definitions run over 60 characters (B19).
7. **Move tier-up toasts and confetti to the end screen** as a dedicated beat (B11, B12).
8. **Earbud: fix the colours (B6), add two-option audio questions, and use volume or play-pause friendly controls.** See the learning review, #9.
9. **Benchmark polish.** Hide the domain/task/kind header (B16). Replace the auto-advance with Next plus a flag. Show score ± band. Add a 65Q/90-minute resumable full mock.
10. **Onboarding and home trim.** Show START EPOCH 1 above the fold, with the 5 method bullets moved to a "How it works" link (B14). Show a daily-goal ring on home, put the daily eval tile beside START, and add the tier and streak to the share text. Make "Lock in" look disabled until it is ready (B15). Triple the line pools, or show a quip on about 1 in 3 answers.
