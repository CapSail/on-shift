# ON SHIFT: running log (newest at the bottom)

Claude: read `README.md`, `PROJECT_BRIEF.md` and `C:\Users\jrsjo\.claude\CLAUDE.md` first. This folder belongs to the chat **"1 ON SHIFT"** in the sidebar group **PHONE APPS**; the boss of that group is **"0 PHONE APPS PM"**, and the app list and rules are in `C:\Users\jrsjo\Desktop\Projects & Code\PHONE_APPS.md`.

## 2026-11-15: SHIFTY-1 merged into ON SHIFT

Cap's call: both Shifty games run on the same engine, so one app, one engine, one install, here. Plan and reasons: `docs/MERGE_SHIFTY1.md`.

What changed
- The app has two **shifts**, picked with a switch at the top of home (remembered in `onshift.shift`): **SOC shift** (`src/soc/`, the game as it was) and **AI school** = SHIFTY-1 (`src/ai/`, content in `content/ai/`).
- One engine in `src/engine/`: ui, pwa, install gate, Shifty, days, plus new shared `store` (saves), `progress` (XP/rank/streak rules), `deck` (lines), `speech`, `shift`/`switcher`. `src/main.ts` is the shell and lazy-loads the shift.
- Cap's choices (asked 2026-11-15): XP, rank and streak stay **separate** per shift; **switch at the top** of home; deploy ON SHIFT when every test passes, **ask again before forwarding** the old link.
- Progress: SHIFTY-1 keeps its own key and format (`shifty1.v1`, `shifty1.decks`), which the merged app reads directly because both sites are on capsail.github.io. Nothing is converted. A one-time copy is kept in `shifty1.v1.bak-merge`. **Do not change the SHIFTY-1 save shape or `SAVE_VERSION` before the old link is forwarded**: until then the old app reads the same save.
- iPhone installs have separate storage per home-screen app, so the AI school's About screen has "Move my progress" (copy / paste a code).
- Build: `npm run content` / `validate` run the SOC bank, the AI bank and the quip lint. Tests: Playwright projects `soc`, `ai` (SHIFTY-1's suite, every card answered through the UI) and `shell` (switch, deep links, carry-over from a save written by the real standalone build, offline, the forwarder).
- Fixed in passing: the SOC test "no report button or e-mail" failed whenever the random alert contained a made-up gmail address; it now checks the report line itself.

Status at the end of 2026-11-15
- Gate passed locally on the final build: `npm run validate` (SOC bank, AI bank, quips) and `npm test` = 69/69 (soc 37, ai 12 with all 905 cards, shell 20). An independent review found three style leaks between the shifts and a few edge cases; all fixed, with tests.
- Committed to `main` (5e5e01b) and **deployed**: https://capsail.github.io/on-shift/ serves the merged app (checked live: `#shifty-1` opens the AI school). Not yet checked on Cap's phone with his real save.
- Deploying: this repo's Pages site comes from the **`gh-pages` branch**, so a push to `main` deploys nothing. Run `npm run deploy` (builds, then force-pushes `dist/` to `gh-pages`). The Actions workflow in `.github/` does not run here; the tests are the local `npm test`.

## 2026-11-15 (later): old link forwarded, merge finished

- Cap confirmed his progress and said "Yes, forward it". https://capsail.github.io/shifty-1/ now serves the forwarding page (checked live: a browser tab lands on ON SHIFT's AI school). An installed old SHIFTY-1 shows "New version ready", then the "moved" page with an Open button.
- In the shifty-1 repo: tag `v1-final-standalone` = the last standalone app; `forward/` is the site; the workflow only deploys that folder; README and HANDOFF say it is the archive. Roll-back: restore the workflow from the tag and push.
- `C:\Users\jrsjo\Desktop\Projects & Code\shifty_1` and CapSail/shifty-1 stay as the archive. Never delete without Cap's say-so. All SHIFTY-1 work now happens here (`src/ai/`, `content/ai/`).
- The SHIFTY-1 save format is no longer tied to the old app, so it may change from now on, with a migration in `src/ai/state.ts` and a bumped `SAVE_VERSION`.
- If the forwarding page ever needs a change: edit `cutover/shifty-1/` here (tests: `tests/shell/forward.spec.ts`), copy it to `shifty_1/forward/`, push that repo.

## 2026-11-18/19: the Ghost CISO (CISSP) shift

Cap asked (2026-11-18) for a CISSP module, as quirky as the others, with a story, a new format (not cards), accuracy from reputable sources, and the same QC. His choices: the **2027 outline** (ISC2, effective April 15, 2027), **case files** as the format, the **Ghost CISO** story. Design: `docs/cissp/DESIGN.md`; authoring rules: `docs/cissp/AUTHORING.md`.

- Third shift in the switch ("CISO", Shifty in a top hat), `src/cissp/`, content `content/cissp/` (d1-d8.yaml, quips), save `cissp.v1`. Deep links `#cissp`, `#scene=<id>`.
- Content 1.1.0: 50 cases, 435 scenes, 133 concepts; every 2027 objective has 2+ scenes; every scene cites its source (ISC2 outline/Code of Ethics/OSG, NIST SP/FIPS, RFCs, GDPR/HIPAA text, FIDO/W3C, OWASP, CISA). Cap's downloaded `cissp-2027-prep` repo (third-party, MIT) was used only as a cross-check, never copied.
- Modes: next case (with up to 3 flashbacks first), daily case, board exam (adaptive, 25/50/125), flashbacks on demand, weak-spot drill, briefing book (readiness, exam date, every objective), case board, closet.
- QC: 3 writers, then 3 accuracy reviewers (one per domain group: no wrong keys found, ~11 fixes; `docs/cissp/review-accuracy-*.md`), then a learning-design review (138 scenes improved; the "pick the longest option" shortcut went from 60% to 21%, chance is 25%), a phone playtest (2 blockers, 6 majors, all fixed) and a code critique + stress test (7 bugs fixed with tests, new `stress` project). `npm test` = 104/104 (soc, ai, cissp incl. every scene through the UI and every diagram fitting a phone, shell, stress).
- Also fixed in SHIFTY-1: quitting a benchmark right after an answer no longer draws the next question over home (save format untouched).
- Left for later (in the review docs): the "key is the multi-part option" cue is still ~41%; a few non-option scenes have no story reaction; the board exam score is a difficulty-weighted %, labelled as such, not an IRT estimate.
- Writer agents hit the Pro 5-hour limit once overnight; resumed after the reset with SendMessage.

## Requests from other apps
(none)
