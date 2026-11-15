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

## Requests from other apps
(none)
