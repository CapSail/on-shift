# ON SHIFT: explaining it to friends

## The 20-second pitch
ON SHIFT is a SOC alert-triage game for people who already do this job. You get a realistic alert, you decide **escalate or close**, you tap the log line that gave it away, and the game tells you the rule and the tell. Five minutes a session, built for a phone, works in airplane mode.

## Get it on your phone (30 seconds)
1. Open the link in **Chrome** (Android) or **Safari** (iPhone). If you tapped it inside Gmail, Slack or a chat, use the menu to **Open in Chrome / Safari** first.
2. Follow the "Make it an app" page: Chrome menu, **Install app**; Safari Share (behind **⋯** on the compact bar), **Add to Home Screen**. If Add to Home Screen is not in the list: scroll to the bottom of the Share sheet, **Edit Actions**, tap **+** next to it, **Done**.
3. Open **ON SHIFT** from your home screen. Do the 3-card training, then tap **New round**.

Why bother installing: it runs full screen, works offline, and on iPhone it stops Safari from wiping your progress after a week of not playing.

## How to play
- **Swipe the card** right to escalate (real attack) or left to close (benign), or tap the buttons.
- **⚡ SURE** is a toggle you arm *before* answering when you can point at the line: +15 if right, −10 if wrong. A plain lean call is +8 if right and costs nothing if wrong. It resets every card.
- After a correct call, **tap the line that decided it** (sharp eye = bonus). Wrong line = lucky, half XP.
- Read the **rule** and the **tell**. That is the learning.
- **Every answer shows an alert id** (like `y45`). If something looks wrong, tell Jordan the id.

## What is in it
- **421 alerts** (381 work + 40 After Hours) across endpoint, identity, cloud/SaaS, email, network, Linux/Kubernetes, macOS, EDR and OT. About half are benign on purpose, and many are scary-looking benigns.
- **Twins:** most alerts have an opposite-verdict twin (same title, different deciding detail). That is the point: you learn what *separates* an attack from its lookalike.
- **Daily shift:** the same 10 alerts for everyone each day (day = America/Chicago), with a share grid.
- **Weekly boss:** a real ATT&CK group. Triage alerts built from techniques it really uses, then a 3-question intel round.
- **4 story incidents** against real groups (Scattered Spider, APT29, Volt Typhoon, Akira): in-order alerts, decoys, 3 hearts, one containment decision.
- **Crew dex:** 178 real ATT&CK groups to collect by catching their techniques.
- **Ride mode:** hands-free, it reads the alert aloud and you answer with earbud or steering-wheel next/previous.
- **Skill report:** catch rate, clean-close rate, calibration (is your "sure" actually better than your "lean"?), weakest rules, and a drill button.
- **After Hours:** a separate, optional deck for real life: scam texts, "bank" calls, account takeovers, home Wi-Fi and phones. Same swipe, no work jargon, no crew drops. Great to send to a non-security friend.
- **Puzzles:** Twin Spotter (tap the real attack among near-identical alerts), Name That Technique (five rounds, the wrong answers come from the same tactic) and a 60-second Speed Round. No penalties; best scores are saved.
- **Shifty:** he is alive. He blinks, waves, dozes off, reacts to your answers, and you can poke him. Rounds and milestones unlock hats and shades in his closet (the 👒 button on the home screen).
- **Friends / leaderboard:** set your name now; the shared board switches on when the backend is set up.

## How it teaches (the "why" behind the design)
- **Concepts, not cards.** Every alert teaches a short rule. If you miss one, it comes back later as a *different* alert for the same rule, on a spaced schedule (1, 3, 7, 16, 35, 90 days), so you learn the pattern instead of memorising a card.
- **Evidence tap** forces you to read the logs, not guess from the title. Titles never give the verdict away.
- **SURE vs lean** trains calibration. Seniors are usually wrong when they are *sure*, and that is the valuable mistake, so it comes back the same shift.
- **Benign-heavy** because real SOC work is mostly closing things correctly. Over-escalating is a normal mistake, so it is gentle: a lean wrong call costs nothing. Only a wrong SURE costs XP, because that is the one worth feeling.
- **Fictional on purpose.** Every host, user and company is invented; nothing comes from any employer or client, and there is no real customer data.

## What it is made with
- **The app:** plain TypeScript and Vite, no framework, no game engine. It is a **PWA**: one small web app plus a service worker that caches everything, so it installs like an app and works offline.
- **The content:** 421 alerts, 231 rules and 4 incidents live as YAML files. A build script checks every one: valid schema, every technique ID live in **MITRE ATT&CK v20.1**, no verdict hints in the spoken script, rules that hold for both twins. A bad alert fails the build.
- **The crew data:** the groups and techniques come straight from MITRE's published ATT&CK data.
- **Hosting:** free GitHub Pages. No server runs the game.
- **Testing:** an automated browser plays whole shifts, bosses and incidents on a phone-sized screen, offline, with touch and keyboard, before every release.
- **The art:** Shifty, the dead-inside night-shift ghost, is drawn from a tiny pixel grid in code, and one small animation loop makes him blink, float and react. The hats are the same grid with extra pixels.
- **How it was made:** built by Jordan with AI help (Claude Code). The alerts were drafted with AI and checked against real incidents; every drop, including the newest 100 work alerts and the 40 After Hours ones, has been reviewed by a human expert; a few mistakes can still slip through, so say the id and it gets fixed.

## Privacy and honesty
- No accounts, no analytics, no tracking. Progress lives **only on your phone**. Lose the phone or clear the site data and you start over (on purpose, for now).
- The leaderboard, when on, sends only your name and a few numbers (XP, streak, accuracy). No logs, no device info.
- It is a **test build** for friends. Not in an app store, not public.
- MITRE ATT&CK® is a trademark of The MITRE Corporation; the About screen has the credit and licences.

## Likely questions
- **"Why can't I just use the website?"** You can (tap "play in the browser anyway"), but progress can be wiped and there is no offline mode.
- **"Is this real data?"** No. Everything is invented. Real techniques, fictional victims.
- **"Why did I get the same rule again?"** That is the spaced repetition working: you missed it, so it returns as a different alert.
- **"Where is the work stuff? It feels like a game."** That is on purpose: ranks are ghosts (Fresh Spook to Legendary Ghost), rounds are rounds, and After Hours is for when you are off the clock.
- **"Why is my SURE hurting my score?"** Sure is high stakes. Use it when you can point at the deciding line.
- **"Can I play with friends?"** Everyone gets the same daily and boss week. The shared leaderboard is next.
