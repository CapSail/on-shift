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

## Still to do: forward the old link (needs Cap's OK in chat)

Everything is prepared in `cutover/` (the page, its service worker, the exact steps in `cutover/README.md`) and tested by `tests/shell/forward.spec.ts`. The `shifty_1` folder and the CapSail/shifty-1 repo have **not** been touched. After the forward they stay as the archive; never delete them without Cap's say-so.

## Requests from other apps
(none)
