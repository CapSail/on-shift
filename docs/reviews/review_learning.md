# ON SHIFT: learning design review

Reviewed: `app.html` (buildShift, grade/GAPS, runAlerts, bossFight, ride) and `alerts1-3.yaml` (103 alerts) plus `incidents.yaml` (4 incidents, 28 alerts).
Who it's for: an experienced detection lead, playing in 5-minute phone sessions as a car passenger.

---

## Diagnosis

**What already works.** The core is sound. You make a call before you see the answer (retrieval practice, not reading), and right after the call you get an explanation. The bank also has a strength that hasn't been used yet: **19 contrastive pairs**. These are 38 alerts that share a title but get opposite verdicts (e05/e06 "Encoded PowerShell", e08/e09 "LSASS handle", i13/i14 "DCSync", and others). That is exactly the material discrimination learning needs. Incidents add sequence and context, which is good for transfer.

**What limits skill growth.**

1. **The answer carries no evidence of reasoning.** A binary call has a 50% guess floor, and nothing tells a lucky guess apart from a real read. The 9-second speed bonus rewards skimming for keywords, which pushes play toward "scary word means escalate". The app never asks *why*, so the generation and self-explanation effects never kick in.
2. **The spaced repetition repeats the same card, and its scheduling is off.**
   - `grade()` sets `b=1` on a first correct answer, so `GAPS[0]` means **every new alert comes back the next day, even when you got it right.** An expert wastes reviews on things he already knows.
   - Only 4 due items are pulled per shift while about 6 new items are added each day, so the backlog grows without limit. Due items are shuffled instead of sorted by how overdue they are.
   - `due()`'s `b<GAPS.length+1` check is always true.
   - Re-showing the *identical* card trains you to recognize the card ("oh, the comsvcs one"), not the rule. Scheduling tracks items, not concepts.
3. **The base rate is reversed.** 65 of 103 alerts are true positives (63%), and 6 of 7 alerts in each incident are true positives. Real queues are mostly benign. The learned prior is "lean escalate". The hardest real-world skill, confidently closing benign alerts that *look* scary, gets the least practice.
4. **Surface cues leak the answer.** Usernames like `pentest_ext`, `svc_sccm`, `svc_jenkins`, `it_tom` and `helpdesk_ana` show up mostly on benign alerts. Words like "Mimikatz", "Cobalt" and "c2" show up mostly on malicious ones. A player can score well on these cues without reading the log.
5. **The boss is trivia, and it misleads.** "Has group X used technique Y" tests memory of MITRE's group pages. Distractors are drawn at random from every technique in the dataset, so many are easy to rule out. Worse, "no recorded use" is treated as "doesn't use", which teaches wrong negatives. A detection lead needs to know *how* a group does things and what to build or hunt for. He doesn't need its technique list.
6. **Ride mode reads only `l[0]`.** That line is usually `parent: cmd.exe`. The deciding evidence is usually line 2 or 3 (the `comsvcs MiniDump` command, the decoded body, `PID 724 = lsass`). You are asked to judge without the evidence, so audio play turns into guessing. Audio answers also never feed the spaced repetition.
7. **The metrics show volume, not skill.** "Alerts worked / accuracy / shifts" hides direction of error (over-escalating vs. missing attacks), calibration, and weak areas.

**Friction budget (phone, in a moving car).** One thumb, quick glances, no typing, at most about 2 taps per alert. At roughly 30 s per alert, 10 alerts fill 5 minutes. Every change below is costed against that budget. If the additions push an alert to about 35 s, drop to 8 alerts per shift instead of adding taps.

---

## 10 changes, in priority order

### 1. Confidence built into the swipe (calibration, no extra tap)
- **Why it helps:**
  - Confidence judgments train metacognitive monitoring (calibration).
  - A proper scoring rule removes the payoff from guessing.
  - Confident errors are the ones learners fix best once corrected (the **hypercorrection effect**, Butterfield & Metcalfe).
- **How it works:**
  - A short swipe means "lean" and a long swipe (or a hold past a haptic tick) means "sure". Buttons: two per side, `Close ·sure` / `Close ·lean` / `Lean ·Esc` / `Sure ·Esc` in a 4-wide row.
  - XP follows a scoring rule: sure-right +15, lean-right +8, lean-wrong −2, sure-wrong −10 (XP floor 0).
  - **Drop the speed bonus.**
  - A **sure-wrong** answer gets a "Big miss" banner and comes back at the end of the same shift as a *variant* from the same concept (see #3).
- **Data/schema:**
  - Log entries change from `ok` to `{ok, conf: 0|1}`.
  - Spaced repetition takes a 0–3 grade: 0 sure-wrong, 1 lean-wrong, 2 lean-right, 3 sure-right.
- **Friction:** none. The gesture you already make now carries more information.

### 2. "Tap the line that decided it" (evidence check)
- **Why it helps:**
  - **Self-explanation** and the **generation effect**: naming the evidence makes you process it.
  - It separates real reads from lucky guesses, and it is closer to the real job of finding the field that matters.
- **How it works:**
  - After the call and before the feedback, the log lines stay on screen and each becomes tappable. The host/user line (`h`) is tappable too.
  - **One tap** on the deciding line.
  - Right call + right line = full credit.
  - Right call + wrong line = "**Lucky**". The answer counts as correct, but the grade is capped at 1 so the concept comes back soon.
  - The deciding line then glows yellow in the feedback.
- **Data/schema:**
  - New field `k: [1]`: 0-based indexes of the deciding lines in `l`, where any one counts. Use `k: [h]` when the host or user is the evidence, as in e35 `pentest_ext`.
  - For pairs, `k` should point at the line that *differs* between the two alerts.
- **Friction:** +1 tap, about 3 s. Turn it off in incident mode if the pace drags.

### 3. Schedule concepts, not cards, and use variants for review
- **Why it helps:**
  - **Transfer-appropriate processing**, and variability of practice builds rules that generalize.
  - **Expanding retrieval** scheduled to the learner's grade beats a fixed interval.
  - Delayed retrieval of the *rule* (the tell) strengthens the rule itself, not just the trigger card.
- **How it works:**
  - Every alert gets a concept id (`c`). The scheduler keeps state per concept: `{box, due, lapses, lastItem, last}`.
  - A due concept is served by a **different alert from the same concept** where one exists (`lastItem` is excluded). Contrastive pairs give 19 concepts with two forms each right away.
  - Review formats rotate between:
    - (a) a variant alert, most of the time;
    - (b) a **rule card**: "Rule recall: when does an encoded PowerShell get closed?" Free recall, then the answer is shown and you self-grade with one tap ("Had it / Didn't");
    - (c) an **apply-the-rule** card: the rule is shown, and you pick which of 3 log lines it applies to.
  - Scheduling fixes:
    - A first-sight grade of 3 (sure-right with right evidence) goes straight to box 3 (7 days).
    - A grade of 2 goes to box 1 (3 days).
    - A grade of 0 or 1 comes back the next day, plus the in-shift retry for a 0.
    - Due items are sorted by how overdue they are. The cap becomes `min(due, 5)`, and the remaining slots go to fresh items only after the backlog is under 10.
    - Gaps: `[1, 3, 7, 16, 35, 90]`.
- **Data/schema:**
  - `c: ps-encoded-decode` on each alert.
  - New `concepts.yaml`:
    ```yaml
    - id: ps-encoded-decode
      rule: 'Decode before you judge: IEX + DownloadString is a cradle; perf counters are not.'
      tactic: execution          # for metrics
      d: endpoint
    ```
  - About 50–60 concepts for 103 alerts. The state key moves from `S.srs[alertId]` to `S.cs[conceptId]`, with item history kept for `lastItem`.
- **Friction:** none during play. Rule cards are one tap.
- **Content:** add a second variant for the roughly 40 concepts that have only one alert. This is the single largest authoring job, but it is what turns "memorized 103 cards" into "knows 55 rules".

### 4. Feedback: rule first, roast second, a contrast case on errors
- **Why it helps:**
  - Feedback that explains the reason beats bare right/wrong (**elaborated feedback**, Shute 2008).
  - Short rules are easier to retrieve later.
  - **Worked examples** and **contrasting cases** (analogical encoding, Gentner) teach the boundary of a rule better than the rule alone.
  - Immediate feedback is right for this format, so keep it.
- **How it works:**
  - Layout order:
    1. a verdict line with the deciding line highlighted (from #2);
    2. **RULE**, a generalizable line of 15 words or fewer;
    3. the case-specific tell;
    4. the roast, as small text, with the technique tag.
  - **On a wrong call**, if the alert has a `pair`, show a mini "Compare" card: the pair's deciding line next to this one ("Same title, other verdict: parent `CcmExec.exe` → benign").
  - Rename the tag line to `technique · tactic`. ATT&CK links stay as they are.
  - Cap feedback at about 60 words on screen. "More" expands the full tell.
- **Data/schema:**
  - `rule:` comes from `concepts.yaml`, so it isn't stored on each alert.
  - `pair: e06` on both alerts of a pair. The app can infer pairs from shared `t`, but explicit is safer.
- **Friction:** reading time stays the same or drops, since the rule is shorter than the current tells (140 characters on average).

### 5. Rebalance the base rate, remove cue leaks, add a difficulty scheme and adaptive selection
- **Why it helps:**
  - Calibration to a realistic base rate and resistance to answer bias.
  - **Desirable difficulties**: training near 75–85% success maximizes learning rate (Wilson et al. 2019, "85% rule").
  - Cue leaks let you pattern-match without reading.
- **How it works:**
  - **Base rate:** target about 40% true positives across the bank, with the true-positive count per shift drawn at random from 2–6 out of 10 so you can't count your way to the answer. Add about 25 benign alerts, weighted toward **scary-looking benign** (admin Tor use, sanctioned Mimikatz in red-team windows, encoded PowerShell from management agents, vendor beacons) and a few more **bland-looking malicious** ones.
  - Incidents: make about 3 of 7 alerts benign noise, and add plausible red herrings.
  - **Cue audit:** no username or alert name should predict the verdict on its own. Rename giveaway accounts (`pentest_ext` → `jlee`, with the pentest context moved into a log line such as `ticket: CHG-4471 red team window`).
  - Build a lint step in `build_data.py` that reports any token in `h`/`t`/`src` appearing 3 or more times with one verdict 80% or more of the time.
  - **Difficulty tags:**
    - `diff: 1`: one obvious field decides it.
    - `diff: 2`: one subtle field (parent process, decoded body, ASN).
    - `diff: 3`: needs combining 2+ fields or outside context (change window, out-of-office, baseline).
  - **Trap tags:**
    - `trap: scary`: benign with alarming surface features.
    - `trap: bland`: malicious with a mundane surface.
  - **Adaptive selection:** keep a rolling accuracy over the last 30 fresh items per difficulty. Serve fresh items from the highest difficulty where rolling accuracy is at least 70%, with one tier up every third item. In each shift, guarantee at least 1 `trap: scary` and 1 `trap: bland`, interleave domains, and never show two alerts from the same concept back to back.
  - **Domain mix:** weight the domains he actually works in (likely endpoint and identity). Raise `edr` above its current 4 alerts, since EDR alert triage is core detection-lead work.
- **Data/schema:** `diff: 1|2|3`, `trap: scary|bland` (optional), `S.rolling[diff]`.
- **Friction:** none.

### 6. Ride mode: read the evidence, answer by voice or earbud, and count the answers
- **Why it helps:**
  - Retrieval practice works by ear too, but **working memory is the bottleneck** when there is no screen. A log has to be cut down to the 1–2 lines that matter.
  - **Free recall** beats recognition.
  - If ride answers don't feed the spaced repetition, ride time is exposure, not practice.
- **How it works:**
  - **Fix:** read `t` + `h` (shortened) + the `k` lines. Prefer a hand-written `say:` script of 25 words or fewer where one exists, because paths and hashes don't survive text-to-speech.
  - **Answer input**, in order of preference:
    1. Media Session API handlers (`nexttrack` = escalate, `previoustrack` = close). These work from earbud or steering-wheel buttons with the phone locked.
    2. Web Speech `SpeechRecognition` for "escalate"/"close", plus "sure"/"lean". Chrome Android supports it; car noise may cause misses.
    3. Big on-screen half-screen tap zones.
  - Answers feed the spaced repetition with a lean/sure grade. Silence means "unanswered" and isn't graded.
  - **Audio formats that work:**
    - (a) alert triage, using the trimmed script;
    - (b) **rule recall**: "Rule check: certutil with url-cache. Why does it matter?" Pause 6 s, then the answer, then a one-press "Had it / Didn't";
    - (c) **pair duel**: "Two alerts, same title. One: parent is Word. Two: parent is CcmExec. Which escalates? Say one or two."
    - (d) "What's missing": the evidence is read and you say the technique or tactic, then self-grade.
  - **Pause:** adaptive. Start at 6 s, and shorten by 1 s after 3 fast answers in a row.
- **Data/schema:** `say:` (optional, 25 words or fewer), using `k` for the fallback. Ride results write to the same `S.cs`.
- **Friction:** removes screen time. Setting up the earbud buttons once is the only cost.

### 7. "Spot the difference" pair rounds
- **Why it helps:** **contrasting cases** and **interleaving** directly train discrimination, the core triage skill. The bank already has 19 pairs.
- **How it works:**
  - Twice per shift (the 4th and 8th slots), and only once both alerts of a pair are unlocked: show both cards stacked, compact, with the same title and the differing line visually *not* highlighted.
  - The question is "Which one escalates?", answered with a tap on the card.
  - Optional second tap: the line that differs (reusing `k`).
  - Feedback: the rule, plus both deciding lines side by side.
  - Grades both concepts.
- **Data/schema:** `pair:` (from #4). As pairs grow, also allow a `pair_group` for 3-way sets (benign, malicious, and a second benign).
- **Friction:** 1–2 taps, more reading. Keep the compact view to 3 log lines per card.

### 8. Detection-lead follow-ups: "next pivot" and "how would you tune it?"
- **Why it helps:**
  - **Transfer** to his real decisions.
  - Practicing the *next action* builds procedural knowledge, not just classification.
  - A detection lead's value is mostly in tuning: suppressing a false positive without blinding the detection.
- **How it works:**
  - On about 1 in 3 alerts (never on review variants, never twice in a row), after the feedback, ask one 3-option multiple-choice question:
    - **True positive → "First pivot?"** (e.g., e01: pull lsass access and process tree on the host / reset jmiller's password / block 45.61.x.x).
    - **False positive → "Best tuning?"** (e.g., e02: exclude parent `CcmExec.exe` + path `C:\Windows\CCM\SystemTemp\` / exclude `-ExecutionPolicy Bypass` globally / exclude host SRV-FILE-02). The traps are tuning that is too broad or too narrow.
  - One tap, then a one-line `why`. +5 XP if right. A wrong answer doesn't change the concept's schedule.
- **Data/schema:**
  ```yaml
  q:
    kind: pivot | tune | contain
    ask: 'Best tuning?'
    o: ['Exclude parent CcmExec.exe + CCM\SystemTemp path', 'Exclude -ExecutionPolicy Bypass org-wide', 'Exclude host SRV-FILE-02']
    a: 0
    why: 'Scope to parent + path. Org-wide flag exclusion blinds you to real bypasses.'
  ```
  Start with about 30 authored `q` items, most of them `tune`.
- **Friction:** +1 tap on about a third of alerts.

### 9. Replace the boss: "Adversary Run" (how a group operates, plus what you'd build)
- **Why it helps:**
  - Procedures (how a group does things) and prioritization are what transfer to detection work.
  - **Narrative and sequence** help both encoding and engagement.
  - The current yes/no format is shallow recognition with a 50% floor, and it teaches false negatives ("no recorded use" ≠ "doesn't use").
- **How it works:** the weekly boss runs in 3 phases with 3 hearts, about 4 minutes.
  1. **Pressure wave (5 alerts):** pull from the alert bank where `x ∈ boss.t`, mixed with 2 benign alerts. Triage as usual, with confidence and evidence. This tests the boss's real techniques *as they look in logs*.
  2. **Predict the next move (3 questions):** show stage N of the boss's chain and pick stage N+1 from 3 options. The distractors come from the same tactic but are not used by this group, or are used by it at a different stage.
  3. **Finisher, "Ship one detection" (1 question):** "You get one detection this sprint against [group]. Which?" Three candidates differ in coverage of the group's chain, in fragility (an IOC vs. a behavior), and in whether the data source exists. The answer explains the trade-off.
  - Damage comes from correct sure answers. A sure-wrong answer costs a heart.
- **Data/schema:** new `bosses.yaml`:
  ```yaml
  - g: G0102          # Wizard Spider
    chain: [T1566.001, T1204.002, T1059.001, T1003.001, T1021.002, T1486]
    next: [{at: 3, o: [T1003.001, T1110.003, T1555.003], a: 0, why: '...'}]
    ship: {o: ['Behavior: lsass access by non-system parent', 'IOC: known Ryuk hash', 'Rule needing Sysmon 10 you do not collect'], a: 0, why: '...'}
  ```
  The phase 1 pool is automatic. Phases 2–3 need about 10 authored entries. Until those exist, keep the fallback boss as **phase 1 only**, and drop the yes/no question type.
- **Friction:** same as a shift.

### 10. A "Skill" screen that measures real skill
- **Why it helps:**
  - Accurate self-assessment directs effort (metacognition, deliberate practice needs targeted feedback).
  - Separate sensitivity and specificity show bias, which overall accuracy hides.
- **What it shows:** replace "Your numbers" with:
  - **Catch rate** (true positives escalated) and **clean-close rate** (false positives closed) as two bars, with a bias label ("You over-escalate: 31% of benign sent to IR").
  - **Calibration:** accuracy when "sure" vs. "lean". Target ≥90% for sure, with a warning when they are within 10 points of each other ("your confidence isn't informative yet").
  - **Evidence accuracy:** % of correct calls where you also picked the right line. The "Lucky" rate is shown separately.
  - **Retention:** accuracy on reviews with gaps of 7 days or more. This is the number that proves learning.
  - **Mastery map:** a grid of tactics × domains showing n and accuracy, greyed out under 5 attempts.
  - **Concepts:** mastered (box 3 or higher) / learning / lapsed.
  - **Weakest 5 concepts** with a **"Drill these"** button that starts a 5-item shift from them, as variants.
  - XP and rank stay as the fun layer on top.
- **Data/schema:**
  - An event log `S.log: [{id, c, v, call, conf, evOk, t, day, mode}]`, capped at about 2,000 entries (around 200 KB in localStorage).
  - Every metric is derived from it, with tactic taken from `concepts.yaml`.
- **Friction:** none. It lives on its own screen, viewed between rides.

---

## Schema summary (new fields)

| Where | Field | Purpose | Change |
|---|---|---|---|
| alert | `c` | concept id | #3 |
| alert | `k` | indexes of deciding lines (`h` allowed) | #2, #6, #7 |
| alert | `diff` | 1–3 difficulty | #5 |
| alert | `trap` | `scary` / `bland` | #5 |
| alert | `pair` | id of the contrast alert | #4, #7 |
| alert | `q` | follow-up multiple choice `{kind, ask, o, a, why}` | #8 |
| alert | `say` | audio script, 25 words or fewer | #6 |
| `concepts.yaml` | `id, rule, tactic, d` | concept registry, short rule | #3, #4, #10 |
| `bosses.yaml` | `g, chain, next, ship` | Adversary Run | #9 |
| state | `S.cs`, `S.log`, `S.rolling` | concept spaced repetition, event log, adaptive difficulty | #3, #5, #10 |

`build_data.py` should check that `k` indexes are valid, that `pair` is reciprocal with opposite `v`, that every `c` exists in `concepts.yaml`, and run the cue-leak lint from #5.

## Suggested build order
1. **#1, #2, #3**: confidence, evidence tap, concept scheduling. These turn guessing into graded reasoning and fix the review bugs. They need `k` and `c` on all 103 alerts, roughly 2 hours of tagging.
2. **#4, #6**: feedback layout and fixing ride mode. Ride mode currently hides the evidence.
3. **#5, #7**: content rebalance and pair rounds.
4. **#10, #8, #9**: metrics, detection-lead questions, the new boss.
