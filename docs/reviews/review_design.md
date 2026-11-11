# ON SHIFT — design review (playtest, 2026-11-08)

Tested `file:///home/claude/on-shift.html` in headless Chromium (Playwright) at 390x844, touch + mobile emulation.
Played: 3 full shifts (one ~70% accuracy, one played to "perfect", one on a simulated day 2), 2 incidents (Scattered Spider won with an "escalate everything" strategy, APT29 deliberately lost), 1 weekly boss fight (lost), crew dex + detail modal + rarity filter, ride mode (play/pause/auto-advance), plus a mid-shift quit. Screenshots are in `/home/claude/pt/shots/`. No JS errors were thrown.

**Verdict:** The core works and the content is the strongest part. The alerts are good, "the tell" is excellent, and the twin alerts (same title, different verdict, e.g. two "LSASS handle opened" alerts) are a great design choice. What holds it back is a thin loop: two taps per alert, roasts that repeat, an incident mode a no-skill strategy can beat, a boss that is a trivia coin flip, and a dex that does nothing. Ride mode, the feature built around the "passenger in a car" use case, can't actually be played by ear.

---

## 1. Bugs (with repro)

| # | Severity | Bug | Repro |
|---|---|---|---|
| B1 | **High (design-breaking)** | **Escalating everything wins every incident.** Incidents have 6/7, 5/7, 6/7 and 6/7 true positives, so the "always escalate" strategy loses at most 2 hearts and always clears. | Home → "Help Desk, We Have a Problem" → Take the case → tap Escalate 7 times → "INCIDENT CONTAINED" plus an Epic capture. Same for all four. |
| B2 | High | **Ride mode only reads `l[0]`**, which is usually `parent: cmd.exe` / `parent: WINWORD.EXE`. The deciding evidence is in lines 2–3, so a listener can't make the call. The screen doesn't show the log lines either. | Ride mode → ▶. For e01 (rundll32 MiniDump) you hear "parent cmd.exe" and never hear "comsvcs.dll MiniDump" or "PID 724 = lsass". |
| B3 | High | **The streak goes up when the app opens, not when you play.** `touchStreak()` runs in `home()`. Opening the app counts as a day. | Set `lastDay` to yesterday in localStorage → reload → streak goes 1→2 without playing. |
| B4 | Med | **The callback backlog keeps growing.** Every alert you get *right* is also due the next day (`GAPS[0]=1`), but a shift only serves 4 callbacks (`slice(0,4)`) and fills the rest with fresh alerts, which adds 6+ new items due tomorrow. After day 1 the home screen said "20 callbacks due", and only 4 showed up in the next shift. The home footer also says "Wrong answers come back tomorrow", which hides that correct ones come back too. | Play 3 shifts → move `srs[*].d` back 1 day → home shows "20 callbacks due"; the next shift has 4 CALLBACK tags. |
| B5 | Med | **Boss HP doesn't match.** The home tile says "HP 240" (`t.length*5`) but the fight uses 100. The "100 / 100" label never updates after a hit (only the bar width changes). | Home tile vs boss screen; answer one correctly and the label stays "100 / 100" (shot 14). |
| B6 | Med | **About 9% of boss "Nope" questions are ambiguous.** The negative pool includes parent techniques of sub-techniques the group uses (and the reverse). Example: the group uses T1059.003, you're asked about T1059, and the answer is "no recorded use". Measured: 2,001 of 21,893 possible negatives across the 48 bosses. | `bossFight` builds `allT` from `D.tech` minus the exact IDs only. |
| B7 | Med | **Boss rematches are unlimited and re-roll the questions**, so a player can brute-force the weekly capture. A loss also shows no recap of what you got wrong, so you learn nothing. | Lose → Rematch → new 16 questions; repeat. |
| B8 | Low | **Fonts load from Google Fonts.** Offline, or on a weak car connection, none load (`document.fonts` had 0 loaded in the test) and the pixel-font identity disappears. `.q .id` uses `font-family:"JetBrains Mono"` with **no fallback**, so it renders in Times New Roman (shot 13). | Load with no network; look at the boss technique ID. |
| B9 | Low | **After a decision the card flies off-screen, snaps back, and the stamp sits on top of the log text** ("pd64.exe" covered in shot 04; CLOSE stamp over `securityContext` in shot 04_verdict3). The decided card can still be dragged around. | Make any call and look at the card. |
| B10 | Low | **Quitting mid-shift counts as a shift** (`S.shifts++` on ✕ when i>0). | Start a shift, answer 1, press ✕ → the shift counter goes up. |
| B11 | Low | **The floating "+XP" is fixed at top:40%**, so it lands on top of the log and question text (shots 06, 14). Two floaters stack on the end screen when you get a dupe drop. | Any correct answer. |
| B12 | Low | **No history/back handling.** The Android back gesture leaves the app mid-shift (progress is saved, but run state like combo is lost). The hint text "use ← → keys" shows on phones. | Press back during a shift. |
| B13 | Low | **Boss buttons reuse the close/escalate colours.** "Nope" is green and "They use it" is red, which suggests "yes" is the bad answer. | Boss screen. |

Not a bug: the duplicate titles with opposite verdicts are deliberate twins. Keep them and make more use of them (see #4).

---

## 2. Design critique

**Moment-to-moment.** A swipe with stamps and a rotating card is the right base, and the sound and vibration are good. But each alert costs **two actions** (decide, then "Next alert"), and the second one sits below the tell, so on a moving phone you tap, read, reach for the button, and sometimes scroll. Feedback is flat: a correct call and a 6-combo look almost the same. The combo counter is small yellow text in the corner, nothing changes at x5, and a perfect shift has no special moment. The speed bonus (<9s) **rewards guessing on a learning task** and is the opposite of what you want in a bumpy car. Reading load per card is fine (~120 chars of log, ~140-char tell). The tell is the payoff, and it's well written.

**Core loop depth.** Plain binary is fine as the default verb (Reigns proves it), but nothing ever asks *why*, so a right guess and a right read score the same. An expert gets bored once the twins are memorised (103 alerts is about 10 shifts of fresh content). You can add depth without adding friction: (a) an optional one-tap "what's the tell?" pick between 3 highlighted log tokens after a correct call, for bonus XP; (b) a confidence swipe (short vs long swipe); (c) occasional "shift modifiers" (e.g. "Change freeze tonight: any admin activity is suspicious") that flip verdicts for familiar alerts, like Papers Please rule changes.

**Meta.** Rank/XP works early (rank 3 after 2 shifts) and slows sensibly. The dex is **just a list**: drops are random, unrelated to what you played, and owning a crew does nothing. At 1 drop per shift with Legendary at 2%, completing it takes 300+ shifts with no decisions involved. The weekly boss is MITRE trivia: with random negatives, a guesser's chance of winning is ~9%, and an expert using "common technique = yes" gets ~60%. That's not because they know the group; the negatives are just obscure. The streak isn't earned (B3). There's no daily goal, no daily "special", and nothing new appears in the session after the first day.

**Humor.** The tone lands, and the tells carry it ("Signed tools, unsigned intentions"). The **roasts are generic** (6 per bucket, not tied to the alert), so by shift 3 they repeat and read like filler. Boss taunts are 4+4 lines. Grade lines are good.

**Onboarding.** There's none. The first screen shows rank, boss, dex, ride, library, 4 incidents and stats all at once. The rules are in tiny text at the bottom. The meaning of "escalate = true positive" and "the tell" is learned by failing. For an expert that's mostly fine. For anyone else, the first 60 seconds are: tap the green button, see a raw log, guess.

**Homework risks.** The "20 callbacks due" counter (B4) will look like a growing pile of debt. Ride mode loops the same 10 alerts forever with no score. The boss intro is a MITRE paragraph. The dex modal is a MITRE paragraph.

---

## 3. Top 12 improvements (prioritised)

### 1. Make the call one action: auto-advance with tap-to-hold — **S**
**What:** After a decision, show the verdict as an overlay on the card (verdict + tell), and let the *next swipe or tap anywhere* advance. Remove the separate "Next alert" button. Add a "📌 pin" tap that keeps the tell open longer when you want to read.
**Why:** It halves the input per alert and removes the reach-and-scroll. That's the biggest single feel improvement for one-handed use in a car.
**Sketch:** In `decide()`, instead of replacing `#after`, render `.verdict`+`.tell` *inside* `#card` (replacing the `.log` area or as an absolutely positioned back face; a CSS `rotateY(180deg)` flip makes good juice). Set a `ready=true` flag after 600ms. The card's `pointerup` with `|dx|<10` → `next()`, and a swipe in either direction → `next()`. The Enter/Space handler stays. Move the decided card back to `transform:none` without the fly-off/snap-back (fixes B9). Show the stamp at the top edge of the card, not over the log.

### 2. Fix incident balance and give incidents a real decision — **S**
**What:** Rebalance each incident to ~4 attack / 3 decoy alerts. A false escalation costs a heart *and* an "IR budget" chip (3 per incident). Add one "contain" choice at a pivotal alert (isolate host vs disable account vs reset creds), with branching flavour text.
**Why:** Right now escalate-everything wins every incident (B1). Story mode should be the hardest, best-written part of the game.
**Sketch:** Content: add 1–2 benign decoys per incident in `incidents.yaml` (benign alerts that look like the attacker's TTPs, using the twin idea). Code: in `runAlerts` for `mode:'inc'`, track `budget`; `if(escl&&!a.v){budget--;if(budget<0)lives--}`. Optional `a.choice=[{t:'Isolate WS-…',ok:true,txt:'…'},…]`, rendered as 3 stacked buttons after the verdict. A wrong choice costs a heart. Show the incident as a vertical timeline the player builds (a small chip per confirmed attack step) so the kill chain becomes visible.

### 3. Rebuild ride mode for listening — **M**
**What:** Read all the log lines, as rewritten text that makes sense out loud. Let the player *answer*: big left/right halves of the screen, **and headphone/steering-wheel buttons via the Media Session API** (previous track = close, next track = escalate). Score it, give XP, and let it feed SRS.
**Why:** This is the use case the game is built for (passenger, eyes up), and right now it can't be played by ear (B2) and has no stakes.
**Sketch:** Add an optional `say` field per alert in YAML (one sentence, ~25 words, e.g. "rundll32 calling comsvcs MiniDump on process 724, which is LSASS."). Fall back to `a.l.map(speakable).join('. ')`. Start a looping silent `<audio>` (a tiny base64 WAV) so `navigator.mediaSession` becomes active, then `setActionHandler('previoustrack',()=>answer(false))`, `('nexttrack',()=>answer(true))`, `('pause',…)`. Replace the fixed 5s `wait` with "wait until answered or 12s, then read the answer". Correct → `sfx('ok')` + short spoken roast. Call `grade()` and `addXP()` as in shifts. Build the queue with `buildShift()` but stop after 10 and speak the result ("8 of 10. Grade A."). Show the full log in large type for a passenger who glances down.

### 4. Twin duels and "spot the difference" — **M**
**What:** When you miss an alert that has a twin (same title, opposite verdict), serve the twin 2–4 cards later in the *same* shift, tagged "TWIN". When you see both, a short "Spot the difference" card highlights the one field that differs.
**Why:** Contrast is the fastest way to learn triage, and the content already has 24 twin pairs. It turns a miss into a quick win in the same session instead of a debt for tomorrow.
**Sketch:** At load: `twins = group D.alerts by t where verdicts differ`. In `decide()` when `!ok && twins[a.t]`: `Q.splice(Math.min(i+3,Q.length),0,{...twin,twin:true})`. Optional `diff:"granted access / signer"` field in YAML, used to highlight lines with `<mark>`. Award "Twin cracked +20 XP" when you get the twin right.

### 5. Earn the streak, add a daily goal and a daily shift — **S**
**What:** The streak counts only when you finish a shift (or 10 ride-mode answers). Add a daily goal ring (e.g. 20 correct calls) and a **Daily Shift**: the same seeded 10 alerts for everyone that day, with a shareable emoji result grid (Wordle-style 🟩🟥).
**Why:** Fixes B3 and gives a concrete reason to open the app daily. A seeded daily run makes good talk with SOC coworkers without needing a backend.
**Sketch:** Move `touchStreak()` into `shiftEnd()` and the ride-mode end. Add a streak freeze: 1 freeze earned per 7-day streak, stored as `S.freeze`, used up automatically on one missed day. Seeded RNG: `mulberry32(today())` → shuffle → slice 10 (with the ≥3 benign rule). `S.daily[today()]={score,grid}`. Share with `navigator.share({text:'ON SHIFT #'+n+' 8/10\n🟩🟩🟥…'})`, falling back to clipboard.

### 6. Make the dex do something: crews as the source of alerts — **M/L**
**What:** Tag each alert with crews whose ATT&CK technique list includes `a.x`. When you catch a true positive, the "attributed to" crew gains **intel**. Crews unlock and level up by being *encountered and caught*, not by random drops. Owned crews give a small perk (e.g. +5 XP on their techniques, or a "hint" charge).
**Why:** Collection becomes knowledge ("I've seen Scattered Spider do MFA fatigue 4 times"). The dex becomes a record of what you've learned, not a list of 178 question marks.
**Sketch:** At load, `byTech[x] = D.crews.filter(c=>c.t.includes(x))`. On a correct TP, pick a weighted crew (prefer un-owned, prefer rarity tied to grade), set `S.intel[c.id]=(…)+1`, and show "🕵 Intel on APT29 +1" on the verdict. Thresholds: 1 intel = silhouette with name revealed, 3 = captured card, 10 = "foil" card (animated border). Keep end-of-shift drops, but make them a pick of 1 of 3 face-down cards (Balatro booster style) to add a small choice. In the dex modal, show the techniques you have personally caught for that crew as chips.

### 7. Replace the boss trivia with a boss *shift* — **M**
**What:** The weekly boss runs 8–10 alerts built from its own techniques (from your 103 alerts plus incident alerts where `a.x ∈ boss.t`), mixed with benign twins. Each correct call hits; each miss costs a heart. Between phases, ask one ATT&CK question as multiple choice with **plausible distractors from the same tactic**. Allow one free attempt per day, with the questions fixed for the week.
**Why:** The current yes/no on 517 techniques is close to a coin flip, has 9% ambiguous negatives (B6), and can be brute-forced (B7). A boss should test the skill the game teaches.
**Sketch:** `pool = allAlerts.filter(a=>boss.t.includes(a.x))`, topped up with benign twins and fresh alerts if fewer than 6. For the multiple choice: correct = random `boss.t`; distractors = 3 techniques with the same tactic (`D.tech[t][1]`) that are not in `boss.t`, nor parents or children of anything in `boss.t`. Seed with `week()`. Track `S.boss[key].tries` per day. Phase 2 at 50% HP: taunt + screen shake + faster music. Loss screen lists the techniques you missed with ATT&CK links (that's the learning).

### 8. Juice: escalating combo, crits, a perfect-shift moment — **S**
**What:** Combo tiers at x3/x5/x8 change the card border glow and raise the pitch of `sfx('ok')`. At x5, "ON FIRE": the progress bar turns gold. A perfect shift gets a full-screen "S" slam with confetti, and the crew drop is held back for a reveal tap. Remove the speed bonus, or replace it with a "**read bonus**" (see #9).
**Why:** Duolingo and Balatro keep players with layered feedback. Right now a 9-combo feels the same as the first correct answer.
**Sketch:** `sfx('ok')` frequency `*= 1+min(combo,8)*0.06`. Add `.card.c3{box-shadow:0 0 24px var(--cy)}` and similar per tier. Confetti: 40 absolutely positioned divs with CSS keyframes, no library. Show the floating XP at the verdict's `getBoundingClientRect()` instead of a fixed 40% (fixes B11). Drop `fast`.

### 9. "Show your work" bonus that rewards reading — **M**
**What:** After a correct call, optionally tap the log token that gave it away (3–4 tokens become tappable chips). A right pick = "Sharp eye +10" and builds a separate **Eye** meter. It's never required, and it skips itself after 4s.
**Why:** It separates guessing from reading without adding a mandatory step, and gives experts a skill ceiling.
**Sketch:** YAML field `key:["comsvcs.dll","724"]`. When rendering `.log`, wrap the key tokens plus 2 random decoy tokens (other words in the log) in `<button class=tok>`. Only active after a correct decision. `S.eye` counter shown on home. Incidents could later *require* it on one pivotal alert.

### 10. Fix the SRS so callbacks drain — **S**
**What:** First correct answer → first due in 3 days (not 1). Callbacks take up to 5 slots, overdue first, before fresh ones. On the home tile, show only *missed* items as "callbacks" and count correct reviews as "refreshers".
**Why:** Fixes B4. A growing "20 due" pile feels like homework and makes players avoid the app.
**Sketch:** `grade`: on the first-ever correct answer set `r.b=2` (a 3-day gap). `buildShift`: `d=due().sort((a,b)=>S.srs[a.id].d-S.srs[b.id].d).slice(0,5)`. Home label: `missed=due().filter(a=>S.srs[a.id].b===0).length`. Cap displayed callbacks at "5+" to avoid scary numbers.

### 11. 45-second onboarding shift — **S**
**What:** On first run, replace the home screen with a 3-card tutorial shift: (1) an obvious ransomware alert with an arrow overlay "swipe right = escalate"; (2) an obvious benign one, "swipe left = close"; (3) a twin that teaches "the tell". Then a guaranteed Rare crew drop and the full home screen.
**Why:** The first 60 seconds currently show a full dashboard and then a raw log. A guided win plus a reward is the standard hook.
**Sketch:** `if(!S.onboarded) return runAlerts({mode:'tut',queue:[e10,…]})`. In `frame()` for `tut`, add an overlay `<div class=coach>` with an animated hand ✋ sliding over the card. On finish: `S.onboarded=true`, `dropCrew` forced to rarity 1, then `home()`. Hide incidents, boss and ride on the home screen until 1 shift is done (unlocking them adds progression).

### 12. Fresher voice: alert-aware roasts and a rotating supervisor — **S/M**
**What:** Roasts reference the alert (`${user}`, `${host}`, tactic), and there are more of them (20+ per bucket), drawn without repeats via a shuffled deck per session. Add a recurring character, e.g. "Dale, the night-shift SOC manager", who comments on combos, streaks and grade, with occasional rare lines (1 in 30) as a reward. Cut the boss intro to 2 lines and move the MITRE paragraph behind "Intel ↗".
**Why:** Generic roasts repeat by the third shift. A character and rare lines keep the humour surprising, which is what keeps it funny.
**Sketch:** `ROAST.tp.push("${user} on ${host}? Not tonight.")` and render with a tiny template replace from `a.h.split(' · ')`. Deck draw: `deck[k]=deck[k]?.length?deck[k]:shuffle(ROAST[k])` then `pop()`. Per-alert overrides via optional YAML `roast:{miss:'…'}`. Add a `DALE` object with keys `combo5`, `perfect`, `streak7`, `firstMiss` and `rare`.

---

### Smaller items worth doing alongside
- Inline the fonts (or a subset of Press Start 2P, ~10 KB woff2, as base64) or use a system mono stack, and give every `font-family` a fallback (B8).
- Fix the boss HP label and home tile (B5); don't count quits as shifts (B10); use neutral colours for the boss buttons (B13).
- `history.pushState` per screen and `onpopstate` → confirm quit (B12). Hide the keyboard hint when `matchMedia('(pointer:coarse)')` is true.
- Show the domain distribution: 40 of 103 alerts are endpoint, email is only 8. Let players pick a "focus" (Identity night, Cloud night) as a shift modifier.
