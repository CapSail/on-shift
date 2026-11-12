# ON SHIFT — Project Brief for Claude Code

**Owner:** Jordan (Cap). **Status:** working prototype (single HTML file) → turn into a hosted, installable app with a friends-only leaderboard.
**Audience:** senior/advanced security people only (SOC leads, detection engineers, IR). Friends-only distribution. **No easy mode, ever.**

---

## 1. What this is

ON SHIFT is a meme-y SOC alert-triage game. You get realistic alerts across the full ops stack (endpoint, identity, cloud/M365, email, network, Linux/K8s, EDR). You make the call (escalate or close, lean or sure), tap the log line that gave it away, and get a punchy rule plus a "tell". Wrong answers come back via concept-based spaced repetition, using a *different* alert for the same rule. Wrapped in game systems: ranks/XP, streaks, combos, a daily seeded shift with a Wordle-style share grid, story-mode incidents against real ATT&CK groups, a weekly boss, a collectible crew dex of 178 ATT&CK groups earned through intel, a skill report, and a hands-free ride mode (TTS + earbud buttons via Media Session).

Design goal: genuinely fun and genuinely educational for experts, in 5-minute sessions on a phone while riding as a passenger.

## 2. What's in this bundle

| Path | What |
|---|---|
| `prototype/on-shift-v2.html` | Current playable build (single file, data + fonts inlined). Treat it as the behavior reference. |
| `src/app2.html` | App source template (vanilla JS/CSS). `__FONTS__` and `__DATA__` get injected at build. |
| `src/build2.py` | Build: loads YAML + ATT&CK STIX, validates, infers twin pairs, lints cue leaks, inlines fonts, emits HTML. |
| `content/alerts1-5.yaml` | 181 shift alerts. |
| `content/incidents.yaml` | 4 story incidents (38 alerts, each with a containment decision). |
| `content/concepts_a/b/c.yaml` | 125 concept rules (`id`, `rule` ≤15 words, `tac`, `d`). |
| `fonts/` | Press Start 2P, Space Grotesk 400/700, JetBrains Mono 400 (woff2, latin subset, OFL). |
| `reviews/` | Design, learning-science and accuracy reviews behind v2. Read these; they explain *why* things work the way they do. |
| `tests/test2.py` | Playwright smoke test (390x844), useful as a starting point. |

The ATT&CK data file isn't included (55 MB). Fetch it at build time: `https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json`. Pin the version (the prototype was built on **ATT&CK v20**; note T1562.* was revoked into T1685/T1686, T1070.001→T1685.005, T1656→T1684.001).

### Content schema (per alert)
```yaml
id: e01                 # stable forever; progress is keyed on ids and concepts
d: endpoint             # endpoint|identity|cloud|email|network|linux|edr
src: 'Defender for Endpoint · DeviceProcessEvents'
t: 'Alert title (never reveals the verdict)'
h: 'HOST · user'
l: ['key: value', ...] # 2-4 log lines
v: 1                    # 1 = escalate (true positive), 0 = close (benign)
x: T1003.001            # ATT&CK technique, must be live in pinned version
tell: 'meme-voice takeaway'
c: lsass-access         # concept id → rule in concepts_*.yaml; twins share c
k: [1]                  # deciding line indexes into l, or 'h' for the host/user line
diff: 2                 # 1-3
trap: scary|bland       # optional: scary = benign-but-alarming, bland = malicious-but-dull
say: 'TTS script ≤25 words, never reveals verdict'
q: {kind: pivot|tune|contain, ask, o: [..3], a: idx, why}   # optional follow-up
pair: e02               # optional, otherwise inferred (same c, opposite v)
```
Incidents add `contain: {at, ask, o, a, why}` (shuffle options at runtime; the source data has a=0 everywhere).

## 3. Decisions already made (don't relitigate)

- **Advanced/senior only.** No easy mode, no beginner content. Keep the 3-card first-run training.
- **No progress backup or export.** Progress is local. Lose the device or reinstall = start over. That's accepted for now.
- **Friends-only.** Not public, not in app stores (for now).
- **Leaderboard is a must.** It can ship after hosting, but it's required (see Phase 4).
- **Everyone sees the full roster** on the leaderboard immediately, including friends with 0 XP.
- **Reporting:** friends tell Jordan at work; every answer shows its alert id (the owner dropped the report button and the e-mail on 2026-11-11).
- **Testing order:** Jordan on Android first, then a friend on iPhone.
- **Hosting:** free static hosting. GitHub Pages via Actions is the default; Jordan's GitHub account and conventions apply.
- **Keep the voice.** Irreverent, meme-y, accurate. Dale the night-shift SOC manager stays.

## 4. Phases

### Phase 0 — Repo, port, and finish the QA pass
1. Create the repo (private is fine; Pages works on private repos with a paid plan, otherwise make it public; content is fictional and safe to be public). Structure suggestion:
   ```
   /content   (YAML)        /src (app modules)     /public (icons, manifest)
   /scripts   (build, validate, lint)              /tests (playwright)
   ```
2. Port `app2.html` into a real project. Recommendation: **Vite + vanilla TypeScript**, split into modules (state, srs, shift-builder, runner, incidents, boss, dex, skill, ride, ui). No framework needed; the app is already vanilla and fast. Keep the single-page, no-router feel. History-based back already exists.
3. Build step: port `build2.py` logic to a Node script (or keep Python in CI) that outputs `content.json` consumed by the app. Must fail the build on: invalid YAML, missing required fields, invalid/revoked ATT&CK IDs, bad `k` indexes, `q.a` out of range, unregistered concept ids, duplicate ids. Warn on cue leaks (a host/user token appearing 3+ times with one verdict).
4. **Finish the content QA that got cut off.** A second-pass content audit and a fresh playtest of v2 hit a usage limit and never ran. Do these:
   - Name consistency after renames: tells/says/q must reference names that are actually in that alert's `h`/`l`.
   - `k` must point at the line the tell describes.
   - `say` must not leak the verdict (malicious, attacker, benign, legit, suspicious, safe, normal…).
   - Concept ids defined in more than one concepts file with conflicting rules: merge to one canonical rule. The build currently takes the first one silently.
   - Every concept rule must hold for both members of a twin pair.
   - Count `ticket`/`CHG` mentions by verdict. `alerts5.yaml` adds forged/stale/borrowed-ticket attacks; keep "ticket = benign" from being a shortcut.
   - Spot-check technical accuracy (event IDs, tables, field names, commands).
5. Known UI nits from screenshots: the ESCALATE/CLOSE stamp briefly covers the card's source line; the "+XP" float overlaps the log box; the long tactic tag row can wrap awkwardly.

**Done when:** `npm run build` produces the app from YAML, validation is strict and passes, and the Playwright smoke test passes.

### Phase 1 — Installable PWA + hosting + report link + credits
1. **PWA:** `manifest.webmanifest` (name ON SHIFT, short_name ON SHIFT, display standalone, theme/background `#06080c`, portrait), icons 192/512 + maskable + Apple touch icon (pixel-style "ON·SHIFT" mark, green `#3ee68a` on near-black). A service worker that precaches the app shell + content + fonts so it **works fully offline in a car**. Version the cache and show a small "update available, tap to reload" toast when a new build ships.
2. **Hosting:** GitHub Pages via GitHub Actions on push to `main`. Correct `base` path for Pages. Custom domain optional, Jordan decides.
3. **Report link:** on every alert's feedback panel (and incident/boss alerts), a small "🚩 Report this answer" link. Phase 1 implementation: open a prefilled **GitHub issue** URL (`/issues/new?template=report.md&title=[report] <alert id>&body=...`) with alert id, title, given verdict, the player's call and the app version. Add `.github/ISSUE_TEMPLATE/report.md`. Friends without GitHub accounts: also offer a `mailto:` fallback (show the address as text too). In Phase 4 this moves to an in-app report stored in the backend.
4. **Credits / about screen:**
   - MITRE ATT&CK attribution per their terms of use: "© The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation." Include an ATT&CK® trademark note and link to attack.mitre.org.
   - Disclaimer: all alerts, users, hosts and companies are fictional training scenarios, **not affiliated with or derived from any employer or client**, and contain no real customer data.
   - Font licenses (OFL).
5. **Replace the claude.ai link.** The home screen's "Intel library ↗" points to a claude.ai artifact friends can't open. Remove it or replace it with a hosted page.
6. **Daily shift must be identical for everyone.** Today the daily seed uses the device's *local* date. Switch to a fixed reference (UTC, or America/Chicago to match Jordan) so friends in other time zones get the same daily and the leaderboard compares like with like. The weekly boss rotation has the same issue.

**Done when:** Jordan can open the Pages URL on Android, "Install app", go into airplane mode, and play a full shift.

### Phase 2 — Android test pass (Jordan)
Ship a short `TESTING.md` checklist and fix what breaks:
- Install from Chrome; icon, splash, standalone (no browser bar), safe-area insets.
- Swipe feel: lean vs sure threshold (~80px / ~170px), vertical scroll not hijacked, haptics.
- Tap-the-line flow, dock Next button reachable with a thumb, follow-up questions, twin/retry injection.
- Ride mode: speech works, screen-locked playback continues if possible, **earbud / steering-wheel ⏮/⏭ answer calls** via Media Session (uses a silent looping audio element; verify it actually holds media focus on Android).
- Offline play, update toast, progress persists across app restarts.
- Daily share copies to clipboard; boss once-per-day lock; incidents' heart budget.

### Phase 3 — iPhone test pass (friend)
Known iOS gotchas to handle up front:
- **Must be installed via Safari → Share → Add to Home Screen.** Safari can wipe script storage for sites not used for 7 days unless installed. Show an install prompt/instructions on iOS Safari when not running standalone, since progress lives in localStorage.
- `navigator.vibrate` doesn't exist on iOS. Fine, it's already guarded.
- `speechSynthesis` needs a user gesture to start; Media Session prev/next support for web audio on iOS is limited. Ride mode must degrade to big on-screen buttons.
- 100dvh/safe-area quirks; check the dock and swipe areas.

### Phase 4 — Friends-only leaderboard (required)
**Recommended stack:** Supabase free tier (Postgres + auth + row-level security), called from the static app. No server to run.
- **Access model:** invite-only. Jordan generates invite codes (or a single shared group code to start). On first launch after the leaderboard ships: enter the invite code, pick a display name (unique), done. Use Supabase anonymous auth or magic link. Anonymous + invite code is lowest friction; a lost device just creates a new player, which is consistent with "lose progress = restart".
- **Full roster visible immediately:** the leaderboard lists every member, including people who haven't played yet (0 XP, "hasn't clocked in").
- **Boards/tabs:**
  - Daily shift: score/10 for today's seeded daily, then time as a tiebreak. The emoji grid is shown.
  - Weekly XP (resets Monday).
  - All-time XP / rank title.
  - Streak (current, best).
  - Weekly boss: who beat it and in how many attempts.
  - Crew dex: captured / 178.
  - Accuracy: catch rate and clean-close rate, minimum 50 calls to qualify.
- **Data model sketch:** `players(id, display_name, created_at, invite_code)`, `stats(player_id, xp_total, xp_week, week_id, streak, best_streak, dex_count, calls, tp_caught, tp_total, fp_closed, fp_total, updated_at)`, `daily_results(player_id, day_id, score, n, grid, ms, created_at, unique(player_id, day_id))`, `boss_results(player_id, week_id, boss_id, won, attempts)`, `reports(id, player_id, alert_id, content_version, call, note, created_at)`.
- **RLS:** members can read all rows for their group; players can only write their own rows; one `daily_results` row per player per day (first submission wins, no replays counted).
- **Anti-cheat:** light. It's friends. The daily result is accepted only once per day and only from the official daily mode. Basic sanity checks on submission (score ≤ n, plausible XP deltas).
- **Sync behavior:** the game stays fully playable offline. Results queue locally and upload when online. The leaderboard view shows "last updated".
- **Nice later:** reactions/emoji on daily results, "X just beat the boss" feed, push notifications. Not required.

### Phase 5 — Content pipeline (ongoing)
- Adding alerts = edit YAML, push, CI validates and deploys. Bump a `content_version` shown on the credits screen.
- Target: a content drop every ~2 weeks (181 alerts ≈ 3–4 weeks of daily play before it feels repetitive). Priority gaps: more Linux/K8s, macOS, OT/ICS, SaaS (Okta/Google Workspace/GitHub), more `diff: 3`. Keep benign-heavy (~55–60% benign in new drops) with twins.
- New incidents: 1 per drop, against real ATT&CK groups, 9–10 alerts with ~4 decoys and a containment decision. TTPs must match public reporting.
- Reports (Phase 1 issues / Phase 4 table) feed fixes. Fixing an alert must **keep its id**.
- An ATT&CK version bump is a build-time task: re-validate all `x`, remap revoked techniques.

## 5. Gameplay spec (current behavior to preserve)

- **Call:** swipe the card dating-app style (follows the finger, tilts, tints; commits past max(70px, 28% of card width) or on a fast flick, otherwise springs back) or tap Close / Escalate. **SURE is a separate ⚡ toggle** armed before answering (+15 right / −10 wrong instead of +8 / −2), reset after every card; it is never part of the swipe. Keyboard: ←/→ answer, `S` toggles SURE, 1–9 pick line, `h` host line, Enter next.
- **Evidence pick:** after a *correct* call, tap the deciding line. Right line = 🎯 sharp eye (+5), wrong line = 🍀 lucky (half XP, grade capped so it comes back soon), skip = no bonus.
- **Grading → SRS:** grade 3 = sure+right+eye, 2 = lean+right, 1 = lucky or lean+wrong, 0 = sure+wrong. Concept boxes with gaps `[1,3,7,16,35,90]` days. New concept: g3 → box 2, g2 → box 1, else box 0. Wrong → box 0 + lapse. Callbacks serve a *different* alert for the same concept (least seen first).
- **Shift builder:** up to 5 due concepts (most overdue first), then fresh alerts near the player's rolling difficulty tier. 2–6 true positives per shift (randomized). Guarantee one `scary` benign and one `bland` malicious when available. No same concept twice. Interleave domains.
- **In-shift injection** (capped at 3 extra per shift): sure+wrong → a RETRY variant at the end; a miss with a twin → TWIN 2 slots later.
- **XP:** sure right 15, lean right 8, +5 eye, +2 per combo step up to 5, lean wrong −2, sure wrong −10. End-of-shift bonus 10/25/50. Ranks: Intern → Tier 1 → Tier 2 → Tier 3 → Incident Responder → Detection Engineer → Threat Hunter → SOC Lead → CISO's Favorite → APT's Worst Nightmare (0/150/450/900/1600/2600/4000/6000/8500/12000).
- **Streak:** earned by *finishing* a shift, incident, boss or ride shift (not by opening the app). One freeze earned every 7 days, max 2.
- **Daily:** 10 alerts seeded from the bank for everyone, ignoring personal SRS. Emoji grid 🟩 right+eye / 🟨 right / 🟥 wrong, copy to share.
- **Crews:** catching a true positive gives +1 intel to a crew that uses that technique (prefers uncaptured). 3 intel = captured, 10 = foil card. End of shift: pick 1 of 3 face-down drops (rarity-weighted, boosted by a perfect shift; a dupe gives +2 intel). Rarity by technique count: common <15, rare 15–39, epic 40–79, legendary 80+.
- **Incidents:** in-order alerts with decoys; 3 hearts, **any** wrong call costs a heart; one containment decision mid-incident (wrong costs a heart). A win captures the group.
- **Weekly boss:** a group with ≥30 techniques and ≥6 matching alerts, rotating weekly. Phase 1 = triage alerts from techniques they really use plus benign noise (damage on right calls, hearts on wrong). Phase 2 = 3 multiple-choice "which of these has the group been documented using" (distractors share a tactic and exclude parent/child techniques). One attempt per day. A loss shows a recap of the techniques.
- **Skill report:** catch rate, clean-close rate, bias note, calibration (sure vs lean accuracy), sharp-eye rate, retention on 7+ day callbacks, per-domain accuracy, weakest concepts, "Drill my weak spots".
- **Ride mode:** speaks `say` (fallback: title + host + deciding lines), "escalate or close?", 12s to answer via ⏮/⏭ (Media Session) or on-screen halves, speaks verdict + rule, feeds SRS/XP/streak.

## 6. Non-goals (for now)

Easy mode · progress backup/export/cloud save · public release · app stores · accounts beyond what the leaderboard needs · monetization · analytics/tracking.

## 7. Acceptance checklist before Jordan shares the link

- [ ] Strict content validation passes; second-pass QA items in Phase 0.4 resolved
- [ ] Installs as a PWA on Android Chrome; works offline end to end
- [ ] iPhone friend can install via Add to Home Screen and play; ride mode degrades gracefully
- [ ] Report link on every alert works (issue + mailto fallback)
- [ ] Credits/disclaimer screen with MITRE attribution and the "fictional, not affiliated with any employer or client" notice
- [ ] Daily shift identical across time zones
- [ ] No claude.ai links remain
- [ ] Leaderboard (Phase 4) live with invite code and full roster, or explicitly scheduled as the next release
