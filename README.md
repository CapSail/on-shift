# ON SHIFT

A meme-y, expert-level SOC alert-triage game for senior security people. Triage realistic alerts (escalate or close, lean or sure), tap the log line that gave it away, get a punchy rule and a "tell". Misses come back as a *different* alert teaching the same rule. Friends-only. No easy mode.

Full project brief, locked decisions and the phase plan: [PROJECT_BRIEF.md](PROJECT_BRIEF.md).

## Commands

| | |
|---|---|
| `npm install` | once |
| `npm run validate` | validate the content (YAML + pinned ATT&CK) and run the editorial lints; writes nothing |
| `npm run content` | validate, then write `src/generated/content.json` |
| `npm run dev` | content + Vite dev server |
| `npm run build` | content + typecheck + production build into `dist/` |
| `npm test` | build, then the Playwright smoke tests (390x844). First time: `node ./node_modules/@playwright/test/cli.js install chromium` |
| `npm run show -- <id\|concept>` | print alerts compactly (authoring helper) |
| `npm run qa` / `npm run qa -- --src` | twin-pair table / log-source list for human review |

> The npm scripts call tools with `node ./node_modules/...` instead of bare `vite`/`tsc`. On Windows the `.cmd` shims break when the folder name contains `&` (this project lives in `Work & Resumes`). It works the same everywhere else.

## Layout

```
content/      YAML source of truth: alerts1-5, incidents, concepts_a/b/c, meta.yaml (versions, tutorial ids)
scripts/      build-content.ts (validate + build), lint-content.ts (editorial lints), show.ts, qa-report.ts
src/          the app (vanilla TypeScript, no framework), generated/content.json is build output
tests/        Playwright smoke tests
docs/         reviews behind v2, content QA record
prototype/    the single-file v2 build, kept as the behaviour reference
```

App modules: `state` (save data) · `srs` (spaced repetition) · `shift-builder` · `runner` (the call -> evidence -> feedback loop, all modes) · `shift` (shift + end report) · `daily` · `incidents` · `boss` · `dex` · `crews` · `skill` · `ride` · `home` · `tutorial` · `voice` · `progress` (XP, streaks) · `ui` (toast, sound, dock, navigation) · `time`.

## Content pipeline

Edit YAML, run `npm run validate`, push. The build **fails** on: invalid YAML, missing or malformed fields, ATT&CK ids that are unknown or revoked in the pinned release (`content/meta.yaml` -> `attack_version`, currently 20.1, downloaded once into `.cache/`), bad `k` indexes, `q`/`contain` answers out of range, unregistered concepts, duplicate ids, a concept defined twice with different rules, rules over 15 words, `trap` that contradicts the verdict, `say` text that leaks the verdict.

It **warns** on: cue leaks (a host/user token that predicts the verdict), names in tells/says/questions that are not in the alert, profile paths that do not match the host-line user, tells that describe a different line than `k`, say text over 25 words, and prints ticket-shortcut and one-sided-concept stats. Fixing an alert must keep its `id`.

Bump `content_version` in `content/meta.yaml` on every content drop. The shared daily shift and weekly boss only draw from alerts up to `daily_pool_drop` (same file), so a drop never changes them until you raise it; see `docs/content-drop-2.md`. Days are calendar days in America/Chicago (`src/time.ts`), not the device's.

## Install, offline and hosting

- **Installable PWA.** `public/manifest.webmanifest`, icons in `public/icons/` (regenerate with `npm run icons`), and a generated service worker (`scripts/sw-template.js` -> `dist/sw.js`) that precaches the whole app, content and fonts, so a full shift plays in airplane mode. A new build gets a new cache; the player sees "New version ready, tap to reload" and nothing swaps mid-shift.
- **Hosting.** `.github/workflows/ci.yml` validates, builds and tests every push and pull request; pushes to `main` also deploy `dist/` to GitHub Pages. The build uses relative paths, so it works under `/on-shift/`.
- **Report link.** Every answer shows "Report this answer", a prefilled GitHub issue (`.github/ISSUE_TEMPLATE/report.md`). To add an e-mail fallback for people without GitHub, set `REPORT_EMAIL` in `src/config.ts` (it is public once set).
- **Credits.** The About screen carries the MITRE ATT&CK attribution and trademark note, the "fictional, not affiliated with any employer or client" disclaimer and the font licences.
- **Days and the daily.** Calendar days are America/Chicago for everyone; the shared daily and weekly boss use only the alerts up to `daily_pool_drop`.
- **iPhone.** Safari can erase a site's saved data after 7 days unused, so the home screen shows an "Add to Home Screen" prompt on iOS when the app is not installed, and the app asks the browser for persistent storage.
