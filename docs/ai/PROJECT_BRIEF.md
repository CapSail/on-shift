# SHIFTY-1 — Project Brief

> **2026-11-15:** SHIFTY-1 now lives inside ON SHIFT as the **AI school** shift (see `docs/MERGE_SHIFTY1.md`). This brief is unchanged apart from paths: content is in `content/ai/`, code in `src/ai/`, this folder is `docs/ai/`.

**Owner:** Cap. **Started:** 2026-11-13. **Sibling of:** ON SHIFT (`Desktop\Work & Resumes\ON SHIFT`), whose infrastructure (Shifty pixel art, PWA, install gate, service worker, deploy, Playwright) is reused here.

## 1. What this is

A phone-first, fun, free study game for AI certs. Premise: **AI took Shifty's night-shift job, so Shifty got turned into a tiny, dumb AI model, Shifty-1. You are the engineer training him.** Every concept you learn is his "training data"; his rank (model tier), mood and lines improve as you do. Teach him wrong and he hallucinates. Lessons are *epochs*, a session is a *training run*, the daily is an *eval*, the mock exam is a *benchmark*. Dale (the night-shift SOC manager from ON SHIFT) cameos as the guy who now "manages the AI initiative".

Audience: Cap first (SOC analyst moving into AI engineering), then friends. 5-minute sessions on a phone, often without looking (earbud mode).

## 2. Cert path

1. **AWS Certified AI Practitioner (AIF-C01)** — v1 content. Exam guide version 1.2 (2026-10-29). No coding, concept + scenario questions, a good phone fit.
2. Later: Microsoft AI-901 (Azure AI Fundamentals; replaced AI-900 on 2026-06-30; 55–60% hands-on Foundry + Python), an AI engineer associate cert, then an AI security specialty (OWASP LLM Top 10, MITRE ATLAS).

AIF-C01 domains (weights of scored content): D1 Fundamentals of AI and ML 20% · D2 Fundamentals of GenAI 24% · D3 Applications of Foundation Models 28% · D4 Guidelines for Responsible AI 14% · D5 Security, Compliance, and Governance for AI Solutions 14%. 50 scored + 15 unscored questions, 90 min, pass 700/1000. Question types: multiple choice, multiple response, ordering, matching. Full objective list: `docs/ai/aif-c01-objectives.md`.

## 3. Teaching methods (and why)

ON SHIFT taught triage by retrieval + spaced repetition. SHIFTY-1 keeps those and adds:

| Mode | Method | Why |
|---|---|---|
| **Pretest** ("Shifty guesses, you guess") | Guess before the lesson, no penalty | Pretesting effect: a failed guess primes encoding |
| **Epoch** (micro-lesson) | 3 short bullets + a **SOC analogy** | Elaborative/analogical encoding to what Cap already knows |
| **Catch the hallucination** | Shifty says 3–4 lines, one is confidently wrong: tap it, pick the fix | Error detection + correction; hypercorrection; a real AI-eng skill |
| **Exam scenario** | AIF-C01-style MCQ / multiple response | Transfer-appropriate processing |
| **Build the pipeline** | Put steps in order | Ordering questions exist on the exam; procedural knowledge |
| **Match** | Pair terms with uses | Matching questions exist on the exam |
| **Duel** | Pick the better prompt/design of two | Contrasting cases |
| **Legit or hallucination?** | Shifty makes a claim: true or false | Fast retrieval; the earbud format |
| **Earbud mode** | TTS lesson + true/false via ⏮/⏭ | Learning without a screen |
| **Benchmark** | Domain-weighted mock exam + readiness per domain | Calibrated readiness to book the exam |

Plus: confidence ("sure") toggle with a proper scoring rule, concept-level spaced repetition (a miss comes back as a *different* card for the same concept), interleaved domains, new concepts picked by exam weight, adaptive difficulty, immediate elaborated feedback (rule first, then why).

## 4. Locked decisions

- Free. Public GitHub repo `CapSail/shifty-1`, GitHub Pages. Installable PWA, works offline.
- Shareable daily **Eval** (10 cards, same for everyone, America/Chicago day) with an emoji share grid. Leaderboard later (ON SHIFT's code can be ported).
- Funny voice, accurate content. Dale cameos.
- Same QC as ON SHIFT: strict content validator + lints, three independent reviews (technical accuracy, learning design, design playtest), fixes, Playwright tests, QA record in `docs/`.
- Not affiliated with AWS/Microsoft. Credit/trademark notice on the About screen. Link to free official prep (AWS Skill Builder).

## 5. Content schema

Content lives in `content/ai/d1.yaml` … `content/ai/d5.yaml`, one file per exam domain, each with two top-level lists: `concepts:` and `cards:`. Ids are **stable forever** (progress is keyed on them).

### Concept
```yaml
- id: rag                     # kebab-case, unique across all files
  task: '3.1'                 # exam task statement it belongs to
  name: 'Retrieval Augmented Generation'   # display name, ≤ 40 chars
  rule: 'RAG fetches your docs at query time; the model weights never change.'   # ≤ 15 words, the takeaway
  learn:                      # the micro-lesson: exactly 3 bullets, each ≤ 25 words
    - '...'
  soc: 'Like enriching an alert with threat intel before triage: ...'   # ≤ 25 words, analogy to SOC work
  say: '...'                  # earbud script ≤ 60 words, plain spoken English, no symbols/acronyms unexplained
```

### Card (every card has these)
```yaml
- id: d3-001                  # <domain>-<3 digits>, unique, never reused
  c: rag                      # concept id
  kind: mcq                   # mcq | multi | hallu | tf | order | match | duel
  diff: 2                     # 1 recall · 2 apply · 3 tricky scenario / combine ideas
  pre: true                   # optional: good as a pretest (guessable, short)
  why: '...'                  # ≤ 40 words, explains the right answer (and the trap)
```
Per kind:
- `mcq`: `q` (exam-style stem, usually a scenario "A company wants…"), `o` (exactly 4 options), `a` (index of the right option). Options are shuffled at runtime, so authoring order doesn't matter.
- `multi`: `q` ending with "(Choose TWO.)" or "(Choose THREE.)", `o` (5 or 6 options), `a` (list of indexes, length matches the stem).
- `hallu`: `s` (3–4 short lines Shifty says, each ≤ 20 words), `bad` (index of the one confidently WRONG line; the others must be correct), `o` (3 candidate corrections for that line), `a` (index of the right correction).
- `tf`: `s` (a claim by Shifty, ≤ 25 words, readable aloud), `v` (true/false).
- `order`: `q`, `steps` (4–5 items in the CORRECT order; shuffled at runtime).
- `match`: `q`, `pairs` (3–4 `[left, right]` pairs; rights shuffled at runtime; every right must fit only its own left).
- `duel`: `q`, `A`, `B` (two prompts/designs, each ≤ 40 words), `a` (0 = A is better, 1 = B).

### Content drops
A domain can have extra files `content/ai/d<n>-<name>.yaml` (e.g. `d3-drop2.yaml`) with more `cards:` (and `facts:`) for existing concepts. Drop-2 card ids start at `d<n>-201`.

### Fact (generator raw material)
```yaml
facts:
  - id: f3-001                # f<domain>-NNN, unique
    c: vector-stores          # concept id
    g: aws-vector-stores      # group: facts in a group are the SAME kind of thing and mutually confusable
    term: 'Amazon Neptune'
    def: 'Graph database that can store vectors for graph-plus-semantic search'   # ≤ 14 words, never contains the term
```
The app generates cards from facts: term → which definition, definition → which term, true/false (a term shown with its own or a same-group definition), and match-4. So within a group every `def` must fit ONLY its own term, and every group needs ≥ 4 facts (6–10 is better).

### Authoring rules (the validator enforces what it can)
- Every objective bullet in `docs/ai/aif-c01-objectives.md` is taught by at least one concept (concept `task` + its cards).
- Every concept has ≥ 4 cards, including ≥ 1 `tf`, ≥ 1 `mcq` or `multi`, and ≥ 1 `hallu`. Mark ≥ 1 card `pre: true`.
- Accuracy first. Use AWS service names exactly as in the exam guide (Amazon Bedrock, Amazon SageMaker AI, Amazon Bedrock Guardrails…). Don't invent features. If unsure about a fact, leave it out.
- Distractors must be plausible and from the same category (other real AWS services, other real techniques). No "all of the above" / "none of the above". No trick wording. Options roughly equal length (the right answer must not be the longest by habit).
- `tf` cards are balanced: about half true, half false. A false claim must be a realistic misconception, not an absurdity.
- `hallu`: the wrong line is a *realistic* misconception stated confidently; the other lines are true. Funny is welcome in tone, never in the facts.
- `why` explains the reasoning, not just the answer.
- Voice: Shifty is an earnest, slightly dim AI model in training ("I am 97% confident, which is how you know"). Light and funny; Dale cameos in the occasional line. Keep the stems themselves exam-plain.
- No real customer data; fictional companies only.
