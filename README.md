# ON SHIFT

A meme-y, expert-level SOC alert-triage game for senior security people. Triage realistic alerts (escalate or close, lean or sure), tap the log line that gave it away, get a punchy rule and a "tell". Misses come back as a *different* alert teaching the same rule. Friends-only. No easy mode.

Full project brief, locked decisions and the phase plan: [PROJECT_BRIEF.md](PROJECT_BRIEF.md).

## One app, two shifts

Since 2026-11-15 this app is also the home of **SHIFTY-1**, the AWS AI Practitioner (AIF-C01) study game (it used to be its own app at `/shifty-1/`). A switch at the top of the home screen flips between the two; the app reopens on the one used last.

| Shift | Code | Content | Save (localStorage) |
|---|---|---|---|
| **SOC shift**: the alert-triage game described on this page | `src/soc/` | `content/*.yaml` | `onshift.v2` |
| **AI school**: SHIFTY-1 (training runs, daily eval, benchmark, red team, earbud mode, model card, syllabus, speed round) | `src/ai/` | `content/ai/` (cards, facts, `quips/`) | `shifty1.v1` (the standalone app's key and format, unchanged) |

Both run on one engine, `src/engine/`: UI, navigation, PWA and install gate, Shifty, days, the save store, XP/rank/streak rules, line decks, speech. XP, rank, streak, closet and sound are separate per shift. `#shifty-1` opens the AI school (the old link forwards there), `#card=<id>` opens one SHIFTY-1 card. How and why: [docs/MERGE_SHIFTY1.md](docs/MERGE_SHIFTY1.md). SHIFTY-1's brief, objectives, content schema and QA record: [docs/ai/](docs/ai/).

## Commands

| | |
|---|---|
| `npm install` | once |
| `npm run validate` | validate both content banks (SOC: YAML + pinned ATT&CK + editorial lints; AI school: cards, facts, exam coverage) and every quip; writes nothing |
| `npm run content` | validate, then write `src/generated/content.json` (SOC) and `src/generated/ai.json` (AI school) |
| `npm run quips` | lint Shifty's and Dale's lines in both shifts |
| `npm run dev` | content + Vite dev server |
| `npm run build` | content + typecheck + production build into `dist/` |
| `npm test` | build, then every Playwright test (390x844): projects `soc` (the SOC game), `ai` (SHIFTY-1, including every card answered through the UI) and `shell` (switching, deep links, progress carry-over, the old-link forwarder). One project: `node ./node_modules/@playwright/test/cli.js test --project=soc`. First time: `node ./node_modules/@playwright/test/cli.js install chromium` |
| `npm run show -- <id\|concept>` | print SOC alerts compactly (authoring helper) |
| `npm run qa` / `npm run qa -- --src` | twin-pair table / log-source list for human review |

> The npm scripts call tools with `node ./node_modules/...` instead of bare `vite`/`tsc`. On Windows the `.cmd` shims break when the folder name contains `&` (this project lives in `Work & Resumes`). It works the same everywhere else.

## Layout

```
content/      SOC content, YAML source of truth: alerts1-17, incidents, concepts_*, meta.yaml (versions, tutorial ids)
content/ai/   AI school content: d1-d5.yaml (+ drops), meta.yaml (exam, domains, tasks), quips/*.json
scripts/      build-content.ts + lint-content.ts (SOC), build-content-ai.ts (AI school), check-quips.ts, show.ts, qa-report.ts
src/main.ts   the shell: picks the shift, install gate, deep links, lazy-loads the shift
src/engine/   shared by both shifts: ui, pwa, install, shifty, shifty-live, time, store, progress, deck, speech, switcher, style.css
src/soc/      the SOC game          src/ai/   SHIFTY-1          src/generated/   build output
tests/        soc/ ai/ shell/ (Playwright), fixtures/ (a save written by the standalone SHIFTY-1)
cutover/      the page that replaces the old SHIFTY-1 link
docs/         reviews behind v2, content QA records, docs/ai/ (SHIFTY-1's), MERGE_SHIFTY1.md
prototype/    the single-file v2 build, kept as the behaviour reference
```

SOC modules (`src/soc/`): `state` (save data) · `srs` (spaced repetition) · `shift-builder` · `runner` (the call -> evidence -> feedback loop, all modes) · `shift` (shift + end report) · `daily` · `incidents` · `boss` · `dex` · `crews` · `skill` · `ride` · `home` · `tutorial` · `voice` · `progress` (XP, streaks). Shared (`src/engine/`): `ui` (toast, sound, dock, navigation) · `time` · `store` · `speech` · `deck`.

## Content pipeline

Edit YAML, run `npm run validate`, push. The build **fails** on: invalid YAML, missing or malformed fields, ATT&CK ids that are unknown or revoked in the pinned release (`content/meta.yaml` -> `attack_version`, currently 20.1, downloaded once into `.cache/`), bad `k` indexes, `q`/`contain` answers out of range, unregistered concepts, duplicate ids, a concept defined twice with different rules, rules over 15 words, `trap` that contradicts the verdict, `say` text that leaks the verdict.

It **warns** on: cue leaks (a host/user token that predicts the verdict), names in tells/says/questions that are not in the alert, profile paths that do not match the host-line user, tells that describe a different line than `k`, say text over 25 words, and prints ticket-shortcut and one-sided-concept stats. Fixing an alert must keep its `id`.

Bump `content_version` in `content/meta.yaml` on every content drop. The shared daily shift and weekly boss only draw from alerts up to `daily_pool_drop` (same file), so a drop never changes them until you raise it; see `docs/content-drop-2.md`. Days are calendar days in America/Chicago (`src/engine/time.ts`), not the device's.

## Install, offline and hosting

- **Installable PWA.** `public/manifest.webmanifest`, icons in `public/icons/` (regenerate with `npm run icons`), and a generated service worker (`scripts/sw-template.js` -> `dist/sw.js`) that precaches the whole app, content and fonts, so a full shift plays in airplane mode. A new build gets a new cache; the player sees "New version ready, tap to reload" and nothing swaps mid-shift.
- **Hosting.** `.github/workflows/ci.yml` validates, builds and tests every push and pull request; pushes to `main` also deploy `dist/` to GitHub Pages (Pages source: GitHub Actions). If Actions is unavailable on the account, `npm run deploy` builds locally and publishes `dist/` to the `gh-pages` branch instead (Pages source: deploy from branch `gh-pages`). The build uses relative paths, so it works under `/on-shift/`.
- **Reporting.** No report button (owner's call): every answer shows its alert id so a friend can say "y45 looks wrong" at work.
- **Credits.** The About screen carries the MITRE ATT&CK attribution and trademark note, the "fictional, not affiliated with any employer or client" disclaimer and the font licences.
- **Days and the daily.** Calendar days are America/Chicago for everyone; the shared daily and weekly boss use only the alerts up to `daily_pool_drop`.
- **iPhone.** Safari can erase a site's saved data after 7 days unused, so the home screen shows an "Add to Home Screen" prompt on iOS when the app is not installed, and the app asks the browser for persistent storage.

## Friends, Shifty and the install gate

- **Shifty** is the 16-bit night-shift ghost (`src/engine/shifty.ts`, drawn from a pixel grid so the icons and every pose come from one definition; `npm run icons` renders the app icons from it).
- **Install gate.** On a phone that has not installed the app, the first screen is "Make it an app" with exact steps for Android and iPhone (and for in-app browsers). A site cannot force an install, so the gate shows on every visit until installed, with a small "play in the browser anyway" that lasts one session.
- **Leaderboard.** Name, join-by-code and all boards are built; it needs a Supabase project, see `docs/leaderboard-setup.md` (schema in `supabase/schema.sql`).

## Shifty, closet, After Hours and puzzles

- **Animated Shifty** (`src/engine/shifty.ts` = the pixel grid, poses and hats; `src/engine/shifty-live.ts` = one shared ticker that animates every `<span class="shifty-live">`). Put `shiftyHtml(mood, px, cls, reactive)` in any screen; `initShifty()` (called in `main.ts`) upgrades it. `shiftyReact('happy'|'shock'|'cheer')` makes the round-header Shifty react. Reduced motion shows a still frame.
- **Closet** (`src/soc/closet.ts`): six hats unlocked by milestones (rounds, calls, streak, crews, XP, boss win). The equipped hat is `S.hat`.
- **After Hours** (`deck: afterhours`, `d: home` in YAML; files `alerts16-17.yaml`): the personal-life deck. `ALERTS`/`POOL` exclude it, so work rounds, the daily, the boss and incidents never see it; `AFTER` feeds `buildAfterHours()`. Rematches are per deck (`dueConcepts(after)`). The validator requires `deck: afterhours` and `d: home` together.
- **Puzzles** (`src/soc/puzzles.ts`): Twin Spotter, Name That Technique, 60-second Speed Round. No spaced repetition; best scores in `S.puz`; small XP; they count for the streak.
- **Language:** ghost ranks (`RANKS` in `state.ts`), "round" not "shift". Lean-wrong costs 0 XP; only a wrong SURE costs −10.
