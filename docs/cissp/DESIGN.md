# CISSP shift: "Ghost CISO"

Decided by Cap on 2026-11-18: teach the **2027 outline** (ISC2 CISSP Exam Outline, effective April 15, 2027), use a **new format: case files**, story **Ghost CISO**.

## Story

After the breach, nobody living will take the CISO job. The board hires Shifty: he can't be fired, sued or paged (he's dead). There's one problem. His ghost hands go straight through keyboards, so he can't fix anything himself. He has to do it the CISSP way: protect people first, follow policy, get management to decide, fix the root cause and never touch the keyboard. Dale, promoted by accident to "Chief Synergy Officer", is his very confused boss. Shifty is studying for the CISSP because the board will only keep a CISO who has one.

The joke carries the main lesson. The **engineer answer** (the clever hands-on fix) is the classic CISSP trap, and a ghost can't make it.

## The format: case files

A case is a short story in 4 to 7 **scenes**: a ransomware night at a hospital, a vendor breach, a merger, an audit. Each scene is one decision, and the story reacts to what you picked. Scene kinds:

| Kind | What you do | Exam link |
|---|---|---|
| `first` | pick what Shifty does FIRST | the classic CISSP "FIRST" question |
| `best` | pick the BEST (or MOST/LEAST) option | the classic "BEST" question |
| `rank` | put 4 or 5 actions or steps in order | drag-and-drop ordering items |
| `sort` | drop 4 to 8 items into 2 or 3 bins (e.g. preventive / detective / corrective) | drag-and-drop matching items |
| `spot` | tap the place on a diagram (network, floor plan, data flow) | hotspot items |
| `calc` | work out a number (ALE, RTO fit, key counts) and pick it | quantitative risk |

- Every wrong option in `first`/`best` has a **reaction**: what happens in the story if Shifty does that ("Legal on line 2: you just wiped the evidence"). The story then carries on along the right path, so a case never dead-ends.
- An option can be marked the **engineer answer** (`trap`). Picking it is tracked separately: the readiness screen shows how many misses were "engineer answers", the habit to unlearn.
- **Board confidence** runs through a case and ends in a grade.
- Every scene must make sense on its own, because the spaced-repetition reviews (**flashbacks**) and the mock exam serve single scenes outside their case.

## Modes

| Mode | What |
|---|---|
| **Next case** | one new case, plus up to 3 flashback scenes for concepts that are due (a different scene for the same concept). About 6 to 8 minutes. |
| **Daily case** | the same case for everyone (America/Chicago day), shareable grid |
| **Board exam** | adaptive mock: single scenes, difficulty follows your answers like CAT, weighted by the 2027 domain weights, 25 / 50 / 125 items, scored as an estimate 0 to 1000 (pass line 700) |
| **Flashbacks** | on demand: up to 8 due concepts, each served as a scene from a case other than the last one seen (cases already played first) |
| **Weak spots** | a drill of your 5 weakest concepts |
| **Briefing book** | every objective and concept, with the lesson and a drill |
| **Readiness** | strength by domain, estimated score, engineer-answer rate, sure-but-wrong rate, weakest concepts |
| **Closet** | hats, as in the other shifts |

Spaced repetition is per concept, using the SHIFTY-1 rules (new concepts return tomorrow, one promotion per day, gaps 1/3/7/16/35/90 days).

## Content

`content/cissp/d1.yaml` to `d8.yaml`, each with `concepts:` and `cases:`. The schema is checked by `scripts/build-content-cissp.ts`. Every concept and every scene carries `src`, the authority it rests on (the ISC2 outline or Code of Ethics, NIST SP/FIPS, RFCs, ISO titles, laws, vendor-neutral standards). Third-party prep material, including `cissp-2027-prep` by Joe Cook (MIT), is used only as a cross-check, never as a source.

The build fails on: schema errors, bad indexes, unknown concepts, duplicate ids, missing `src`, any 2027 objective with fewer than 2 scenes, any concept with fewer than 2 scenes, over-length text, banned options ("all of the above"), a trap that is the right answer, or a FIRST/BEST question whose kind doesn't match its wording. It warns on right-answer-is-longest bias and on lopsided answer positions.

## Quality control

As for the other shifts: strict validator, then independent reviews (technical accuracy per domain against the sources, learning design, design playtest), fixes, Playwright tests of every mode and **every scene answered through the UI**, a QA record in `docs/cissp/`.
