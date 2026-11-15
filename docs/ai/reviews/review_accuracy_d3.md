# Technical accuracy review — content/d3.yaml (Domain 3, Applications of Foundation Models)

Reviewer: independent technical-accuracy pass. Date: 2026-11-13. Scope: all 17 concepts and 85 cards (d3-001 … d3-085) in `content/d3.yaml`. Drop-2 files not touched.

## Verdict

**PASS after minor fixes.** No card had a wrong keyed answer. Every mcq distractor is wrong, every multi has exactly the keyed set, every hallu has exactly one false line with a correct keyed fix, tf values are right, the order cards (RAG pipeline d3-012, cost ladder d3-021, FM lifecycle d3-059, RLHF d3-067) are in a defensible order, and the match pairs (incl. ROUGE/BLEU/BERTScore/LLM-judge d3-076) are unambiguous. One terminology problem in the prompt-risk taxonomy, fixed in 3 places. `npm run validate`: 0 errors, 0 warnings.

## Changes

| id | problem | severity | fix |
|---|---|---|---|
| prompt-attack-risks (`learn[1]`) | Treated "exposure" and "prompt leaking" as the same thing. In AWS's wording, **exposure** means sensitive or confidential data gets revealed (through prompts, training data, or outputs). **Prompt leaking** means the hidden prompt or system instructions get revealed. A learner could miss an exam item that turns on this difference. | MISLEADING | Now reads: "Exposure reveals sensitive data; prompt leaking reveals the hidden system prompt." |
| prompt-attack-risks (`say`) | Same conflation ("Exposure, or leaking, is…"). | MISLEADING | Now reads: "Exposure means private data gets revealed; prompt leaking means the hidden prompt does." |
| d3-046 (match) | The label "Prompt leaking (exposure)" was paired with a system-prompt-extraction example, which taught that the two are the same. | MISLEADING | Label changed to "Prompt leaking". The pairs are still unambiguous. |

No ids changed and no cards rewritten.

## Claims checked

- **Model Evaluation covers RAG / Knowledge Bases.** This is true. Bedrock evaluations cover programmatic (automatic) model jobs with built-in or custom prompt datasets, human-worker jobs (your own team or subject-matter experts), and LLM-as-a-judge jobs. They also run LLM-based RAG evaluations of Bedrock Knowledge Bases and of outside RAG sources, scoring retrieval and generation. So the concept bullet "…including for RAG" and cards d3-072 and d3-074 are correct. Source: https://docs.aws.amazon.com/bedrock/latest/userguide/evaluation.html
- **Prompt Management.** It supports variables, a chosen model and inference settings, variants you compare during testing, versions used to deploy, and use in Flows or at inference. This backs the concept, d3-051, d3-053, d3-054 and d3-055. Source: https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html
- **Prompt-risk taxonomy (exposure, poisoning, hijacking, jailbreaking).** AWS's framing: poisoning is malicious data put into training data (cards also cover retrieval sources, which matches OWASP and is defensible), hijacking is prompt injection, jailbreaking is bypassing safety rules, and exposure is leaking sensitive data, with prompt leaking listed separately. I could not reach the Skill Builder course itself, so this is checked against secondary exam-prep sources, e.g. https://aws-ai-practitioner-prep.vercel.app/docs/Domain-3/Task-3.2/potential-risks-and-limitations-of-prompt-engineering
- **Bedrock Guardrails prompt-attack filter** (d3-049, d3-050). Its content filters have a "Prompt attacks" category. Source: https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-content-filters.html
- **Inference parameters.** Temperature, top-p (cumulative-probability cutoff), top-k (count cutoff), max tokens as a ceiling, and stop sequences are all stated correctly. Covers d3-006 through d3-010. Source: https://docs.aws.amazon.com/bedrock/latest/userguide/inference-parameters.html
- **Vector stores.** OpenSearch Service does k-NN search. Aurora PostgreSQL and RDS for PostgreSQL support pgvector. Neptune Analytics does vector search alongside graph queries (GraphRAG). The line "Knowledge Bases can use several of these" is accurate: OpenSearch, Aurora PostgreSQL and Neptune Analytics are supported Knowledge Bases stores, but RDS for PostgreSQL is not, and no card claims it is. Sources: https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-setup.html , https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html
- **Customization cost ladder.** Prompting < RAG < fine-tuning < continued pre-training < pre-training. This matches AWS's guidance on customization tradeoffs. Distillation is taught separately as an inference-cost lever, which is correct. Bedrock supports fine-tuning, continued pre-training and distillation. Source: https://docs.aws.amazon.com/bedrock/latest/userguide/custom-models.html
- **Prompt caching** (d3-001, d3-002). It cuts latency and the cost of cached input tokens. Source: https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html
- **Metrics.** ROUGE is recall-oriented and used for summarization. BLEU is precision-based with a brevity penalty and used for translation. BERTScore uses embedding similarity. An LLM judge needs no reference answers. These are standard definitions.

## "Using multiple comments" (3.2 best practices)

No official exam-guide definition was found. The phrase comes from AWS's prompt-engineering guidance for Amazon CodeWhisperer (now Amazon Q Developer), "Utilizing multiple comments". It means splitting a multi-part request into several separate, focused comment lines (one requirement per comment) instead of one long instruction. This adds context while keeping each instruction short. In general prompting terms, it means breaking a complex request into smaller, explicit instructions. Source: https://aws.amazon.com/blogs/devops/best-practices-for-prompt-engineering-with-amazon-codewhisperer

**Gap:** d3.yaml does not teach this practice yet. I suggest one card, e.g. a duel: one long comment vs three separate comments for a coding assistant. I did not add it here, to keep my edits minimal.

## Not verified

- I could not open the AWS Skill Builder course text, which is the primary source for the exposure / poisoning / hijacking / jailbreaking definitions. I relied on secondary prep sources that agree with the fix.
- Whether the AWS-managed human work team option is still offered in Bedrock human evaluation. Cards only say "a work team", which is true either way.
