# Content QA record (v1.0.0, 2026-11-13)

Same QC as ON SHIFT: a strict validator on every build, independent reviews, fixes with ids kept, and an end-to-end test that answers every card through the real UI.

## What shipped

- **68 concepts** covering all 14 AIF-C01 task statements (exam guide v1.2, 2026-10-29). Objective list: `docs/aif-c01-objectives.md`.
- **905 hand-written cards**: base set (344) + drop 2 (561). Kinds: mcq, multiple response, catch-the-hallucination, legit-or-hallucination (tf), build-the-pipeline (order), match, duel.
- **319 facts in 46 confusable groups**, from which the app generates term/definition, definition/term, true/false (own vs same-group definition) and match-4 cards: several thousand distinct variations.

## Validator (every build)

Fails on: schema errors, bad answer indexes, unknown or cross-domain concepts, duplicate ids, rules over 15 words, multi-response stems that don't match the answer count, "all/none of the above", concepts missing a tf / mcq-or-multi / hallu card, an exam task with no concept, fact groups under 4 or with duplicate terms/definitions, and fact definitions that contain their own term. Warns on word-count overruns, true/false imbalance (> 65/35) and right-answer-is-longest bias (> 40%). Current: **0 errors, 0 warnings**; tf 103 true / 101 false; right-answer-is-longest 124/353 mcq (35%). mcq options are shuffled at runtime.

## Reviews

| Review | Scope | Result |
|---|---|---|
| `reviews/review_accuracy_d1_d2.md` | 155 base cards, D1–D2 | 0 wrong keys · 2 misleading (retired Nova Canvas/Reel named as current) · 2 nits fixed |
| `reviews/review_accuracy_d3.md` | 85 base cards, D3 | 0 wrong keys · "exposure" vs "prompt leaking" conflated in 3 places, fixed |
| `reviews/review_accuracy_d4_d5.md` | 104 base cards, D4–D5 | 0 wrong keys · 1 ambiguous order card, 1 nit fixed |

Verified against AWS docs (sources in the reports): Bedrock Guardrails policy types and ApplyGuardrail; Clarify vs Model Cards vs Model Monitor; Macie/Inspector/Config/CloudTrail/Artifact/Trusted Advisor; invocation logging off by default; prompts not used to train base models; cross-Region inference; shared responsibility; Scoping Matrix scopes 1–5; AgentCore Identity, Gateway (APIs/Lambda → MCP tools) and Policy (Cedar, enforced at Gateway, default deny); Bedrock Model Evaluation incl. RAG/Knowledge Bases; Prompt Management; batch inference discount; custom models and Provisioned Throughput.

**After review, in drop 2:** the D2 drop reintroduced Nova Canvas/Nova Reel (end of life on Bedrock 2026-09-30) in 6 cards; replaced with current services (Rekognition, Polly, Translate). `grep "Nova (Canvas|Reel)" content/` is now empty. The 3.2 objective "using multiple comments" (from AWS's code-assistant prompt guidance: one requirement per comment) is now taught in the D3 drop.

## Drop-2 accuracy review (second pass)

| Review | Scope | Result |
|---|---|---|
| `reviews/review_accuracy_drop2_d1_d2.md` | 240 cards, 143 facts | 0 wrong keys · 4 fixes (Kiro hooks, an ambiguous match, a Nova fact, an unverifiable example) · 17 length-bias rebalances |
| `reviews/review_accuracy_drop2_d3.md` | 153 cards, 83 facts | 0 wrong keys · 6 fixes (2 cards with two defensible answers, exposure vs leaking, fact defs containing their term) · 30 length-bias rebalances |
| `reviews/review_accuracy_drop2_d4_d5.md` | 168 cards, 93 facts | 0 wrong keys · 6 fixes (DPL metric name, Clarify vs Model Monitor and jailbreak vs indirect injection made swap-safe, GuardDuty def) · 25 length-bias rebalances |

Every card and fact in the bank has now had an independent accuracy review. Answer-length bias in drop 2 went from ~46% "right answer is the longest option" to 10–18%; the validator now warns above 30%.

## Learning and design review

`reviews/review_learning.md` and `reviews/review_design.md` (playtest at 390x844, ~110 screenshots). Fixed from them: same-day SRS promotion (concepts jumped to 90-day intervals within a day; now only the first right answer of a day promotes, and new concepts always come back tomorrow), feedback hidden under the Next bar (now scrolls into view), the Sure toggle below the options (now above, with a hint), calibration polluted by forced-sure modes (excluded), temperature 1.0 dominating careful play (+20/−20 now), pacing that could never finish (cap 5/run, backlog threshold 15, warning on the model card), benchmark reusing practiced cards and leaking the topic header (prefers unseen cards, header hidden, score range shown), red-team deck fixed for a week (now daily), speed round rewarding mashing (score = right − wrong), inverted earbud colours, fact cards showing the parent concept's rule (now FACT), epoch rule under the dock (rule first), JAILBROKEN overflow, onboarding CTA below the fold, more joke lines.

## Final critique (`reviews/review_final.md`, grade B+)

Fixed: screens opening scrolled partway down (scroll reset on every screen), the right answer off-screen after a miss (every miss panel now states `✔ answer`), the red-team tile style clash, the benchmark leaking right/wrong through the combo and Shifty's face, mid-card tier-up toasts (now an end-screen MODEL UPGRADE celebration), `Drill these misses` on every end screen, readiness vs benchmark explained, red-team cards labelled TEMP 1.0, the temperature break-even text, disabled Lock-in looking tappable.

## Open (for polish)

- Remaining review suggestions not yet built: a held-out benchmark-only question pool; a resumable 65-question mock; red-team cards where Dale's attack *is* the question; longer, exam-length scenario stems; coverage of Kendra, AUC/confusion matrix and the Well-Architected ML lens.
- Some fact groups have 5 facts (fewer distractor combinations).