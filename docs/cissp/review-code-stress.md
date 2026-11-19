# Ghost CISO: code review and stress test

Reviewed 2026-11-19 on branch `cissp`: `git diff main...cissp` (src, scripts, tests, config) plus the uncommitted work. Content YAML was not touched; another reviewer was editing it during this review.

## Verdict

**Ship after these fixes.** The runner, the scene kinds, the SRS and the shell hold up under hostile use. Rapid taps, double lock-ins, triple-tapped Next, reloads, shift switches, offline play and a full 125-scene exam all work, and the SHIFTY-1 and SOC saves stay byte-identical. The review found 7 real bugs. Two would have hit real users: a damaged save locked the player out of the shift (white screen, and Reset is on a screen they couldn't reach), and quitting the board exam right after an answer left the exam running over the home screen. All 7 are fixed and covered by tests.

## Bugs found and fixed

Line numbers refer to the `cissp` commit (`333dcd0`) before the fix.

| # | Where | Severity | Scenario | Fix | Test (`tests/stress/cissp-stress.spec.ts`) |
|---|---|---|---|---|---|
| 1 | `src/cissp/state.ts:143` (`fix`) | **High** | A save with `null` or wrong-typed fields (`cs: null`, `log: {}`, `daily: 'x'`, `examDay: 'soon'`, a concept state `{}`) throws in `home()`. The shell catches it and shows only "Could not load that", which leaves a blank screen. Reset lives in About, which can't be reached, so the player is locked out of the shift. | `fix()` now resets only the broken parts: containers to `{}`/`[]`; numbers to finite values; `examDay` to null unless a Date can show it; and each concept state gets its fields back (`box` clamped to -1..5, `seen` restored to an array). Bad log/exam/daily/done entries are dropped. | `a save with null fields / wrong types / half-written concept states recovers` (3 tests, all failed before) |
| 2 | `src/cissp/play.ts:163` | **High** | Board exam: answer, then tap ✕ (or browser back) within the 260 ms pause. The pending `setTimeout(step)` draws the next exam question over home. The run's leave hook has already been used up, so this "ghost" exam keeps going with no clean way out. | A `live` flag is cleared by the run's leave hook, and `step()` returns once it is false. | `quitting the board exam right after an answer leaves no exam running over home` (failed before) |
| 3 | `src/engine/style.css:400` vs `:231` | Medium | The board-confidence counter uses class `.conf`. The confetti pieces already use that class (`position:fixed; top:-20px; animation: fall`), so the 🏛 counter falls off the screen and the player never sees it. The existing smoke test missed this because `toContainText` doesn't check visibility. | Renamed the CISSP class to `.bconf` (play.ts, style.css, smoke test). | `the board-confidence counter is on screen during a case` (failed before: viewport ratio 0) |
| 4 | `src/engine/shift.ts:9-18` | Medium | When storage is blocked (Chrome "block site data" makes `localStorage` calls throw), `setShift` can't persist and `getShift` always falls back to SOC. The switch and `#cissp` do nothing, so the CISO and AI shifts can't be reached. | The session's pick is kept in memory, and `getShift` returns it first. | `localStorage blocked from the start` (failed before: landed on SOC) |
| 5 | `src/cissp/play.ts:121` | Low-medium (teaching) | `fresh = !introduced(c)`. The board exam creates a concept state without grading it, so the first time a case or drill really teaches that concept, the player gets no briefing. | `fresh` now means "never graded" (`n === 0`). | `a concept first met in the board exam still gets its full briefing` (failed before) |
| 6 | `src/cissp/briefing.ts:131` (`lesson`) | Low | Open a lesson card in the briefing book, then press browser back. Home renders under the modal, which stays on `<body>` on top of it. | The modal registers itself as the leave hook (`setLeaving(close)`). | `browser back from every CISSP screen lands on a clean home` (failed before: `.modal` count 1) |
| 7 | `scripts/build-content-cissp.ts:37, 96` | Low (validator vs DESIGN.md) | (a) DESIGN.md says the build fails when a FIRST question's kind doesn't match its wording, but a `best`/`calc`/`sort`/`spot` scene that asks FIRST only produced a warning. (b) An unquoted `obj: 3.10` parses as the number 3.1 and silently lands on objective 3.1. (c) A `trap` on a rank/sort/spot scene was ignored. | All three are now errors. Today's content passes with 0 errors and 0 warnings. | Checked on a scratch copy of the content (unquoted `3.10` and a `best` scene asking FIRST both fail the build). No Playwright test, since this is a build script. |

### Checked and found sound

- **Double-tap and race guards.** Option, lock-in, node and bin buttons are disabled synchronously inside `finish()`. The dock removes itself before it runs its callback, so a triple-tapped Next or "Take the case" moves exactly one step and doesn't tap through onto the next scene. Each scene is logged and paid once.
- **`:where(body[data-shift=…])` scoping.** `.lock` and `.grade` are scoped. The other new CISSP classes (`.map`, `.node`, `.bin`, `.story`, `.srow`…) are not used by SOC or SHIFTY-1. `.conf` was the only leak (bug 3).
- **`main.ts` deep links.** Changing the hash also fires `popstate`, which runs the leave hook. So `#soc` or `#scene=` mid-run leaves no dock or timer behind; tests cover both. A `leave()` call on `hashchange` was tried and removed because it changed nothing.
- **Exam picker.** It never repeats a scene. Domain counts match the 2027 weights to within 1 on 125 items, and the score is clamped to 0..1000.
- **SRS.** Gaps over 90 days behave as intended: a right answer keeps box 5 at 90 days; sure-wrong gives a lapse and box 0; lean-wrong steps back one box. Readiness with heavily overdue concepts clamps at 0 (no NaN).
- **Exam date.** Stored as a UTC-noon day number, the same arithmetic as `today()` (America/Chicago calendar day). Past dates, today, 9999-12-31, 1900-01-01 and clearing the date all display correctly.

## Stress results

New project `stress` (`tests/stress/`, the CISSP shift preselected). 22 tests. Pre-fix, 9 failed for real bugs (bugs 1-6). Two more failures were mistakes in the tests themselves and were corrected. All 22 pass after the fixes.

| Scenario | Result |
|---|---|
| Triple tap "Take the case"; three options clicked in one frame + double-click; triple-tap Next; triple Lock in | pass: one answer, one payout, no tap-through |
| Board-confidence counter visible during a case | fail → **fixed** (bug 3) |
| Quit mid-case with ✕, from the interlude with back, from feedback with back; start again | pass: no dock/run left, XP 8 → 16 (no double count, no combo carry-over) |
| Quit the exam within its 260 ms pause | fail → **fixed** (bug 2) |
| Browser back from board, book, about ×2, exam picker, daily, lesson modal, interlude, scene, feedback, end screen, running exam, exam end, drill | fail (modal) → **fixed** (bug 6) |
| Switch shifts mid-run with `#soc`, back with the switch, play a case | pass |
| `#scene=` link followed mid-run, then ✕ | pass |
| Reload mid-case | pass: home, 2 answers kept once, case not counted |
| Full 125-scene board exam | pass: 125 unique scenes, score 0-1000, domain mix within 1 of the weights, misses listed |
| Offline after first load (service worker) | pass: home, a whole case, the briefing book |
| `cissp.v1` not JSON | pass: starts fresh |
| Save with missing fields | pass |
| Save with nulls / wrong types / half-written concept states | fail (white screen; `seen` undefined) → **fixed** (bug 1) |
| `setItem` throws mid-case (quota) | pass |
| All localStorage calls throw from the start | fail → **fixed** (bug 4) |
| `shifty1.v1`, `shifty1.decks`, `shifty1.v1.bak-merge`, `onshift.v2` after a case, an exam, an exam date and a hat | pass: byte-identical |
| Exam date in the past, today, far future, 1900, cleared | pass |
| SRS after 100-200 day gaps (right / sure-wrong / lean-wrong), gaps logged | pass |
| Concept met in the exam, then drilled | fail → **fixed** (bug 5) |
| Every scene kind (first, best, calc, rank, sort, spot) with the keyboard only, plus the Sure toggle | pass |
| No console errors or page errors in any test | pass (asserted after every test) |

## Left unfixed (with reasons)

- **SHIFTY-1 has bug 2's twin** (`src/ai/run.ts:233`, benchmark `setTimeout(step, 260)`). Not touched, because the owner is studying with that shift right now and the brief kept this review to CISSP. The same 3-line `live` guard would fix it.
- **The daily case can be quit and replayed until finished.** Only a finished attempt is locked, so a player can peek at the answers and retry. That's a design choice, not a crash.
- **A daily case that runs past midnight Central** is recorded under the new day (`end()` reads `today()` again). It's rare and harmless.
- **A 5- or 6-digit year typed into the date picker** clears the exam date (`Date.parse` gives NaN, so the date becomes null). It doesn't crash.
- **A `#scene=` QA link's ✕ goes to `#cissp`**, which leaves the player in the CISO shift. That's acceptable for a QA link.
- **No forward-compat guard on `ver`.** A save from a newer build would be loaded and re-stamped as v1. No v2 exists yet.
- **`S.cases` counts replays**, so the "Close 10 cases" hat can be earned by replaying the same case. This is cosmetic.

## Full suite

`npm test` (build, content validation, then every project: soc, ai, cissp, shell, stress): **103 passed, 0 failed, 0 flaky** in 5.7 min, run 2026-11-19 against the content as it was on disk then.
