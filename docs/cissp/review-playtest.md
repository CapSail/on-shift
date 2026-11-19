# Ghost CISO: design playtest (2026-11-19)

Played on branch `cissp` against the Vite dev server (`src/` live, `src/generated/cissp.json`), Playwright Chromium at 390x844, DPR 2, touch, iPhone UA. Covered: first-run onboarding, case 1 in full (right, wrong, wrong-while-sure, sort, calc, rank), case closed, home, a seeded flashback run, the engineer answer (`#scene=k1-01.1`, trap option), rank mid-state, four spot diagrams, case board, daily case and its re-open screen, board exam (25), briefing book (exam date, objectives, lesson modal, drill), weak-spot drill, closet, about, and the shift switch to SOC and AI school and back.

Screenshots: `C:\WINDOWS\TEMP\claude\516a258960585fe9\b1f4b95e-59e4-4d1b-b0d9-c8049bc6da14\scratchpad\playtest\` (scratch folder; it may be cleared on reboot). Scripts `p1.mjs` to `p4.mjs` and `log.txt` (tap-target and font audits) are in the same folder.

## Verdict

**Ship after three fixes.** The core works. The case-file format is the right idea for CISSP, the "FIRST/BEST" scenes read like real exam items with a story around them, and the WHAT HAPPENED reactions are the best thing in the app ("The scan finds 4,000 issues and crashes the dispatch system at 2 a.m."). Spot diagrams are clean and legible at 390 px. No JS errors, no horizontal overflow on any screen.

What holds it back: a CSS collision makes the first thing every case shows (the dateline) look broken, the board exam leaks right/wrong through the XP float, and a player who taps SOC or AI school from the CISO home can get stuck on that shift's first-run screen with no way back. After those, the biggest experience issue is **too much reading per scene**: a missed scene shows the rule, the why, and a 3 to 5 bullet briefing that mostly say the same thing (about 160 to 210 words of feedback on top of a 110 to 170 word scene). Case 1 is about 2,000 words. "About 6 minutes" is closer to 9 or 10.

The story lands. Shifty + Dale is funny in short doses ("Dale frames the canons, upside down."), and the engineer-answer flag feels like a wink, not a lecture, because it is rare (31 of 374 scenes) and tied to the joke that ghosts can't type. It would get preachy if it fired more often, so keep it rare.

## Findings

### Blocker

**B1. Case opening: the dateline renders as a fake green button with an unreadable label.** Every case and every daily starts with this.
- Seen: `02-case-open-0.png`, `13-case2-open.png`. "HALVORSEN FREIGHT HQ · MONDAY 09:00" is yellow (#fbbf24) on the green `.big` button fill (#3ee68a), about 1:1 contrast, with a ▶ arrow on top of the last characters. It looks tappable but does nothing.
- Cause: `play.ts` renders `<div class="dateline big">`, and `.big` is the primary button class (`style.css:29-32`: green background, padding, `::after` ▶).
- Fix: rename the modifier. In `play.ts` use `class="dateline lead"`, and in CSS change `.dateline.big{...}` to `.dateline.lead{font-size:12px;color:var(--yl);text-align:center;margin-top:8px}`.

**B2. Board exam leaks right/wrong.** The exam says "no feedback until the end", but a right answer floats "+6 XP" over the next question and a wrong one floats nothing.
- Seen: `21-exam-after-2.png` (the "+6 XP" ghost over the Q4 text), and still faintly behind the score on `22-exam-end-0.png`.
- Cause: `play.ts answered()` calls `addXP(gain, …, true)` for every mode; `engine/progress.ts addXP` always calls `xpFloat`.
- Fix: in exam mode, add the XP silently and give it all at the end: `if (mode === 'exam') { examXp += gain; } else addXP(gain, …)`, then `addXP(examXp)` in `end()`. Or pass a `silent` flag that skips `xpFloat`.

### Major

**M1. Dead end when switching shifts.** From the CISO home, tap **SOC**: if the SOC tutorial was never done you land on its first-run screen, which only links to the AI school (`soc/tutorial.ts:23`). The AI school's first-run screen only links to SOC (`ai/onboarding.ts:24`). There is no way back to the Ghost CISO short of typing `#cissp` or finishing a tutorial. My script timed out looking for the CISO switch.
- Seen: `30-soc-0.png`, `31-ai-0.png`.
- Fix: put the full `switchHtml()` on all three first-run screens instead of the single `otherShiftLink`, or add a second link to each one, e.g. in `soc/tutorial.ts`: `otherShiftLink('cissp','Studying for CISSP? Open the Ghost CISO →')`, and the same in `ai/onboarding.ts`.

**M2. Feedback is too long and says the same thing three times.** After a miss: verdict, answer line, WHAT HAPPENED, RULE, why paragraph, BRIEFING (3 to 5 bullets plus a ghost line), source. The rule, the first briefing bullet and the why paragraph often restate each other ("Governance starts from the business…" appears in all three on k1-01.1). That is 880 px of feedback at 390 px, more than a full screen, after a 110 to 170 word scene.
- Seen: `03-s1-fb-0..2.png`, `03-s4-after.png`, `12-flash-fb.png`, `15-trapAll-1.png`. The log has `fbwords` 160 to 209 for every scene in case 1.
- Fix: (a) Collapse the briefing by default on a miss when the concept isn't new: in `scene.ts feedback()` render `brief` as `<details class="sk brief"><summary>Briefing · …</summary>…</details>` unless `fresh`. (b) On a right, non-fresh answer, show verdict + story + rule only and fold the why into a "Why" `<details>`. (c) Content: lint for why paragraphs that repeat the rule's wording.

**M3. Sort and rank misses print the whole answer key as a bold green paragraph.** Then the same key appears again in the rows (sort) or in the "Correct order" box (rank).
- Seen: `03-s2-after.png` (a 7-line green wall), `03-s6-after.png` + `03-s6-fb-0.png` (the order shown twice).
- Fix: in `scene.ts feedback()`, skip `.ansline` for `sort` and `rank` (`${ok || s.kind === 'sort' || s.kind === 'rank' ? '' : …}`) and replace it with a short line: "Right bins are outlined in green above." / "Correct order is shown above."

**M4. Flashbacks come from cases the player hasn't opened.** After only case 1, the flashback for `business-alignment` served k1-08.5 "from case: Fish Week", with Priya Nair, Kim's team and Marcus, all unknown to the player, and it spoils a scene they will meet again in Fish Week.
- Seen: `12-flash-q-0.png`, `12-flash-fb.png`.
- Fix: in `srs.ts sceneFor(c, {notCase})`, prefer scenes from closed cases (`S.done`), then scenes already `seen`, and only then unplayed cases. When the scene comes from an unplayed case, change the dateline to "from a case you haven't opened yet" (or drop it) instead of naming it.

**M5. Two readiness numbers that disagree.** After a 735/1000 board exam, the home tile next to it says "Briefing book ≈7/1000", and the briefing book shows a giant "≈7" with no "/1000".
- Seen: `27-home-hat.png`, `23-briefing-0.png`.
- Fix: until enough concepts are met (say under 20% of the weight), show "Too early: N/157 concepts met" instead of a number. In `briefing.ts`, render `≈${rd.score}<small>/1000</small>`. Label the tile "Retention ≈…" so it isn't read as the exam estimate, or show the latest exam score next to it.

**M6. Rank: tapped items stay in the pool and the pool jumps down.** Each tap adds a row to the placed list above the pool, so the remaining choices move down 80 to 100 px and the next target moves under your thumb. The placed item also stays in the pool, faded, so all four canons are on screen twice.
- Seen: `16-rank-mid.png`; log: `rank pool after 2 picks … opt st used` still `display:block`.
- Fix: `.k-rank .st.used{display:none}`, and put `#placed` below `#pool` (or give `.placed` a fixed `min-height` of n x row height), so the list only grows downward from where the thumb already is.

### Minor

**m1. The case ending ignores how you did.** You get a D (45/100, 3/6) and the close still says "The board renews Shifty's contract". Only Dale's line changes.
- Seen: `04-endscreen-0.png`. Fix: add an optional `close_bad` per case (or one shared closing line by grade from `quips/misc.json`), used when the grade is D or F.

**m2. Story reactions are missing on about a quarter of scenes.** 283 of 374 scenes have `r`. Sort, rank, calc and spot never do, so 3 of case 1's 6 scenes have no story beat and the case feels like it stops and starts.
- Seen: `03-s2-after.png`, `03-s3-fb-0.png`. Fix (content): add a single `r_ok` / `r_no` reaction line to non-option scenes and render it as WHAT HAPPENED.

**m3. Shifty's generic miss line mentions the engineer when there wasn't one.** "Hmm. Was that the engineer in you?" fired on a sort miss (`03-s2-after.png`). Fix: move engineer-themed lines into a separate `no_eng` deck in `quips/feedback.json` and deal from it only when `eng` is true. That also makes the trap flag feel more personal.

**m4. Exam review lacks context.** "Review your misses" shows only the ask ("Which asset is the MOST critical to protect?") without the scenario or the player's own pick (`22-exam-end-2.png`). Fix: in `missRow`, add the first sentence of `s.text` (or a `<details>` with the full text) and "You picked: …".

**m5. The unlock toast lands on the next screen and covers the header.** `checkHats` delays the toast by 1.8 s, so "Unlocked: Boardroom top hat" appears over the home logo and streak, or over the ✕ and title of the next screen (`05-home-0.png`, `19-daily-again.png`, `23-briefing-0.png`). Fix: show the unlock on the end screen itself (an `.upg`-style card next to PROMOTED) and drop the delayed toast, or reduce the delay to 0 while still on `.endscr`.

**m6. Daily share text wraps mid-score.** "daily case #1  3/" then "5" on the next line (`19-daily-end-0.png`, `19-daily-again.png`). Fix: in `shareText()` put the score on its own line (`…#${n}\n${score}/${n} ${grid}`), or use `.share{font-size:13px;overflow-wrap:anywhere}`.

**m7. Quitting mid-case has no confirmation.** ✕ goes straight home and the case progress is lost (`14-after-quit`, log). Fix: if `res.length > 0`, confirm with "Leave the case? Answers so far are kept for flashbacks, the grade isn't."

**m8. The Weak spots tile is dead before the first case.** Tapping it does nothing (`home.ts`: `if (met) go(…)`). Fix: toast "Close a case first" or disable it visibly.

**m9. Drill end uses case copy.** Dale says "Tough case. Read the rules…" after a drill (`26-drill-end-0.png`). Fix: add `dale('drill')` lines.

**m10. Onboarding states the premise three times.** Shifty's bubble, Dale's intro and case 1's opening all say "nobody alive will take the job, ghost hands go through keyboards" (`01-onboarding-0.png`, `02-case-open-0.png`). Fix: cut Shifty's onboarding bubble to one line ("I'm the CISO now. I can't touch a keyboard. I have to lead.") and let the case opening carry the setup.

**m11. Content: k5-02.1's spot is answered by its own text.** The text says the user "is redirected to Halvorsen's identity provider, logs in there". The ask is "tap the component that authenticates the user", and the box is labelled "Halvorsen IdP" (`29-weak.png`). Fix: drop the redirect sentence.

**m12. A source cites a prep book.** The quant-risk lesson cites "ISC2 CISSP Official Study Guide (Sybex), ch. 2" (`25-lesson.png`), but DESIGN.md says third-party prep material is only a cross-check. Fix: cite NIST SP 800-30 or the outline, or note that the OSG is allowed.

### Polish

- **p1. Tap targets just under 44 px:** `.suretog` is 43 px tall (`min-height:44px`); briefing `.syl` chips 36 px; `details.dombook summary` 42 px; spot `.node` boxes 71x39; footer `.linkbtn` 19 px (About, sound, other-shift link). Add `.linkbtn{padding:12px 4px}` and `.syl{min-height:44px}`.
- **p2. Home has too many entry points:** rank card, Next case, 6 tiles, install, 7-hat closet. "The exam" tile and the About link go to the same screen, and "Weak spots" duplicates the briefing book's "Drill my 5 weakest". Cut to 4 tiles (Daily, Board exam, Case board, Briefing book) and move "The exam" facts into About.
- **p3. Rank flavour wraps badly:** "Acting CISO (Deceased) the board / is nervous" (`05-home-0.png`). Put the flavour on its own line: `.rank .n small.flav{display:block}`.
- **p4. Home Shifty is in the "dead" pose with no hat,** while the switch shows him happy in a top hat. Use `happy` and default `S.hat` to `tophat` once unlocked, or show the top hat in the CISO corner by default.
- **p5. "2 scene(s)" on the flashback interlude:** pluralise properly. The interlude is also a mostly empty screen and an extra tap; it could be a strip above the first flashback scene.
- **p6. Difficulty stars are inconsistent:** the case opening shows ★☆☆ and the case board shows ★ (filled stars only). Pick one.
- **p7. Spot labels shrink unevenly:** "Manufacturer" drops to 9.5 px while its neighbours are 11.5 px (log, k1-06.3). Allow labels to break inside a word (`hyphens:auto`) before shrinking.
- **p8. Primary button after a case is "Drill these misses",** which outranks "Next case". Those misses already come back tomorrow, so make Next case primary and the drill secondary, to keep the story moving.

## Consistency with the other two shifts

The three homes share the frame (logo, switch, Shifty quip, rank card, big green CTA, tiles), so the CISO shift feels like the same app (`40-soc-home-0.png`, `41-ai-home-0.png`, `42-cissp-back.png`). Differences: SOC shows the iOS "keep your progress" card near the top, while CISO buries its install button below the tiles (fine, but pick one placement); and SOC has name, closet and sound chips in the header where CISO has streak and XP. Apart from M1, switching works both ways once each shift is onboarded, and the app reopens on the last shift after a reload.

## The 3 things that would most improve it

1. **Fix the three breakers:** the dateline `.big` collision (B1), the exam XP float (B2) and the shift-switch dead end (M1). All are small code changes.
2. **Halve the reading after each answer (M2, M3):** collapse the briefing unless the concept is new, drop the duplicated answer key on sort and rank, and lint for why paragraphs that repeat the rule. That turns a 9 to 10 minute case into the promised 6 and keeps the story in front.
3. **Keep the story coherent:** serve flashbacks from cases already played (M4), give non-option scenes a WHAT HAPPENED line (m2), and make the ending follow the grade (m1). The story is the hook, and it should never introduce strangers or contradict a D.
