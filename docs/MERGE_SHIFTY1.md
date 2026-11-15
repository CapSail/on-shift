# Merging SHIFTY-1 into ON SHIFT

Written 2026-11-15 by the "1 ON SHIFT" chat. Cap's call: both Shifty games run on the same engine, so there is one app, one engine, one install, and it lives here.

Source being merged: `C:\Users\jrsjo\Desktop\Projects & Code\shifty_1` (repo CapSail/shifty-1, live https://capsail.github.io/shifty-1/). It is read-only until the cut-over.

## 1. What the player gets

ON SHIFT keeps its name, icon and link. Inside it there are two **shifts**:

| Shift | What | Save |
|---|---|---|
| **SOC shift** (today's ON SHIFT) | alert triage, daily haunt, boss, incidents, crews, puzzles, After Hours, friends | `onshift.v2` (unchanged) |
| **SHIFTY-1** (AI cert school) | training runs, daily eval, benchmark, red team, earbud mode, model card, syllabus, speed round | `shifty1.v1` (unchanged) |

A switch at the top of the home screen flips between them; the app reopens on the shift used last (`onshift.shift` = `soc` or `ai`). A brand-new visitor lands on the SOC shift. Each shift keeps its own home screen, modes, quips, ranks, XP, streak and closet.

Deep links: `#shifty-1` opens the SHIFTY-1 shift (the old link forwards here); `#card=<id>` still opens one SHIFTY-1 card by itself.

## 2. Cap's progress (the hard rule)

Both apps are on the same origin (`capsail.github.io`), and localStorage belongs to the origin, not the folder. So the merged app **reads and writes `shifty1.v1` and `shifty1.decks` exactly as SHIFTY-1 does today**. There is no migration step and nothing to convert:

- The save format stays frozen at SHIFTY-1's `SAVE_VERSION = 1`. Until the cut-over the old app and the merged app can both be used on the same phone and see the same progress.
- The first time the merged app opens the SHIFTY-1 shift it writes a one-time copy of the save to `shifty1.v1.bak-merge` (never overwritten). Insurance only.
- A test proves it: a save made by the **real old build** (`shifty_1/dist`, played in Playwright) is loaded by the merged app and must come out byte-identical after a visit to home, with the same tier, XP, streak, reviews due and benchmark history on screen (`tests/shell/carryover.spec.ts`; the fixture and the script that made it are in `tests/fixtures/`).
- iPhone only: an installed home-screen app has its own storage box, so a friend who installed SHIFTY-1 on an iPhone will not see their save inside an installed ON SHIFT. For that case the SHIFTY-1 About screen gets "Move my progress" (copy a code / paste a code), and the forwarding page offers the same copy button. Android (Cap) needs none of this.

## 3. Code layout

```
src/
  main.ts        shell: which shift, install gate, deep links, lazy-loads the shift
  engine/        ONE copy, used by both shifts
    ui.ts pwa.ts util.ts shifty.ts shifty-live.ts time.ts install.ts config.ts
    store.ts     createStore(key, defaults, fix): load / save / rankOf / liveStreak / logEv
    progress.ts  createProgress(store, words): addXP / earnStreak (same rules, each shift's wording)
    deck.ts      shuffled, saved deck of lines (no repeats until all are seen)
    speech.ts    text to speech, silent audio, earbud ⏮/⏭ (was copied in ride.ts and voice.ts)
    shift.ts     which shift is on (remembered)
    switcher.ts  the SOC / SHIFTY-1 switch
    style.css    shared styles (SHIFTY-1's sheet is a superset; card styles ride along)
    fonts/ env.d.ts
  soc/           the SOC game: state, srs, runner, shift-builder, shift, daily, boss, incidents, crews, dex,
                 skill, ride, puzzles, closet, friends, leaderboard, home, tutorial, about, voice, shifty-lines,
                 content, types
  ai/            SHIFTY-1: state, srs, run, card, facts, speed, earbud, modelcard, syllabus, onboarding,
                 preview, closet, home, about, lines, content, types
  generated/     content.json (SOC), ai.json (SHIFTY-1): build output
```

Engine files that get unified (one copy instead of two):

| File | Today | After |
|---|---|---|
| `ui.ts`, `pwa.ts`, `util.ts`, `shifty-live.ts`, `env.d.ts`, fonts | identical in both | moved to `engine/`. `ui.ts` reads sound from the active shift instead of importing one save |
| `shifty.ts` | SHIFTY-1 adds the graduation cap | superset (7 hats); the SOC closet still lists its 6 |
| `time.ts` | differ only in the daily-number start day | shared `today / week / DAY`; each shift has its own daily number |
| `state.ts` | same shape, different key, ranks, defaults | `engine/store.ts` + a small `state.ts` per shift |
| `progress.ts` | same rules, different words | `engine/progress.ts` + words per shift |
| `install.ts`, `config.ts`, `sw-template.js`, `vite.config.ts`, manifest, icons, CI | differ only in the app name | ON SHIFT's stay; SHIFTY-1's are dropped |
| `voice.ts` (ai) / `ride.ts` speech (soc) | two copies of the speech code | `engine/speech.ts` |
| line decks (`lines.ts` / `shifty-lines.ts`) | two dealers | `engine/deck.ts` (SHIFTY-1 keeps its saved deck key) |
| `style.css` | SHIFTY-1 = ON SHIFT + card styles | one sheet |

Deliberately **not** unified, because the differences are design, not drift:

- **Spaced repetition.** Same gaps `[1,3,7,16,35,90]` (shared constant), but SHIFTY-1's rules came out of its learning review (a new concept always returns tomorrow, one promotion per day, lean-wrong steps back one box) and its save shape differs. Changing either would change Cap's schedule mid-study or the SOC friends' schedule.
- **Runners.** Alert triage (swipe, evidence pick, twins) and study cards (7 card kinds, pretest, epochs) share nothing but the dock and Shifty.
- **Closets, homes, about screens, onboarding.** Different content per shift.

Each shift is loaded with a dynamic `import()`, so a SOC friend never parses the AI card bank (and the other way round). The service worker precaches both, so both shifts work offline after the first visit.

## 4. Content and build

```
content/            SOC content, exactly where it is today (alerts*, concepts_*, incidents, meta.yaml)
content/ai/         SHIFTY-1 content: d1..d5.yaml, d*-drop2.yaml, meta.yaml, quips/*.json
scripts/build-content.ts      SOC: unchanged, writes src/generated/content.json
scripts/build-content-ai.ts   SHIFTY-1's validator, paths changed only, writes src/generated/ai.json
scripts/check-quips.ts        SHIFTY-1's quip lint, plus the SOC lines (200+, distinct, bubble-sized)
```

- `npm run content` / `npm run validate` run all three (SOC content, AI content, quips). Any failure fails the build, as today.
- `docs/aif-c01-objectives.md`, SHIFTY-1's `docs/content-qa.md` and `docs/reviews/` are copied under `docs/ai/`.
- Ids stay stable forever in both banks; nothing is renumbered.
- `npm run show` / `npm run qa` stay SOC tools.

## 5. Tests

Playwright runs two projects against the one build:

| Project | Specs | Starts on |
|---|---|---|
| `soc` | ON SHIFT's four specs (`tests/soc/`), unchanged apart from import paths | default (SOC) |
| `ai` | SHIFTY-1's `smoke` and `all-cards` specs (`tests/ai/`), unchanged apart from import paths; every card in the bank answered through the UI | `onshift.shift = ai` preset |

A third project, `shell` (`tests/shell/`), holds the new tests: the progress carry-over (section 2), the switcher (flip both ways, choice remembered, neither save touched by the other shift), `#shifty-1` and `#card=` deep links, both shifts playable offline, the move-my-progress round trip, and the forwarding page in `cutover/`.

Gate before deploy: `npm run validate` (both banks + quips), typecheck, build, **both** projects green.

## 6. Cut-over

1. Build on the local branch `merge-shifty1`. Nothing is pushed; the live ON SHIFT and the live SHIFTY-1 are untouched.
2. All gates green locally. Review pass.
3. **Cap's OK** → merge to `main`, push. CI runs every test again and deploys ON SHIFT to Pages. Check the live site: both shifts load, the update banner appears on an old install, and on Cap's phone SHIFTY-1 inside ON SHIFT shows his real progress.
4. **Cap's OK** → in the shifty-1 repo: tag the last standalone build (`v1-final-standalone`), then deploy a tiny forwarding page in place of the app. Its service worker clears the old caches so installed copies pick it up. In a browser tab it forwards straight to `…/on-shift/#shifty-1`; from the old home-screen icon it shows "SHIFTY-1 moved into ON SHIFT" with an Open button (and "copy my progress" for iPhone). The source stays in the repo and the folder stays on disk as the archive.
5. Notes: dated entry in `HANDOFF.md` here and in `shifty_1/HANDOFF.md`, two lines to the PM chat.

Roll-back: before step 4 nothing about SHIFTY-1 has changed. After step 4, redeploying the tag restores the old app; the save was never converted, so it still works.

## 7. Cap's choices

1. **Progress**: separate XP, rank and streak per shift (recommended: keeps his SHIFTY-1 numbers exact and the friends' leaderboard about SOC work), or one combined total.
2. **Home**: a two-way switch at the top that remembers the last shift (recommended), or SHIFTY-1 as one more tile on the ON SHIFT home.
3. **Going live**: deploy the merged ON SHIFT as soon as every test passes, then ask again before the old link is forwarded (recommended), or check with him before each push.
