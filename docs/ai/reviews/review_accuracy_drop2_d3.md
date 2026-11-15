# Technical accuracy review: content/d3-drop2.yaml (Domain 3, drop 2)

Reviewer: independent technical accuracy pass, 2026-11-13. Exam: AIF-C01, guide v1.2.
Scope: all 153 cards (d3-201 to d3-353) and 83 facts (f3-001 to f3-083). Base d3.yaml was read for context only and was not edited.

## Verdict

**PASS after fixes.** No card had a wrong keyed answer. One card (d3-256) had a second defensible answer and one card (d3-226) had a defensible alternative order. Both are fixed. One `why` conflicted with AWS's exposure versus prompt leaking framing (d3-283). It is fixed. Answer-length bias is fixed: in 72 mcqs, the share where the right option is strictly the longest fell from about 46% to **9.7% (7/72)**. Each of the 7 left over is a short term or service name option (for example "Stop sequence" vs "Top-k", "pgvector" vs "PostGIS"), where the gap is one to nine characters and comes from the real names. No Amazon Nova Canvas or Nova Reel mentions. `npm run validate`: **0 errors, 0 warnings**.

## Changes

| id | problem | severity | fix |
|---|---|---|---|
| d3-256 | "Do not suggest fast food" is also an instruction (the `why` calls it a negative instruction), so two options were defensible | AMBIGUOUS | Stem now asks for "the instruction that states the task". Prompt changed to "List three nearby restaurants." (this also fixes length). `why` adds "not the task itself" |
| d3-226 | A knowledge base can be created before the documents are uploaded, so steps 1 and 2 could be swapped | AMBIGUOUS | Step 2 is now "Create a knowledge base on that bucket, with an embedding model and vector store", which ties it to step 1 |
| d3-283 | `why` said "prompt leaking (exposure)". That merges two AWS terms: exposure means sensitive data revealed, and prompt leaking means the system prompt revealed | MISLEADING | `why` now says exposure is a different risk that reveals sensitive data such as PII |
| d3-208 | `why` said "hand-written description" for what option A calls a typed description. Easy to confuse with the handwriting in the photos | NIT | Changed to "typed description" |
| f3-022 | Aurora def contained "PostgreSQL", part of the term, which gives the answer away against the other stores in the group | NIT | "AWS-built relational engine with distributed cloud storage; vectors via pgvector" |
| f3-023 | RDS def contained "PostgreSQL", part of the term | NIT | "Managed service running the standard open-source engine; vectors via pgvector" |
| d3-220 | Right option longest | LENGTH | "RAG over current rate tables" |
| d3-221 | Right option tied longest | LENGTH | "...re-ingest the files" |
| d3-222 | Right option longest | LENGTH | "Revise the chunking strategy" |
| d3-230 | Right option longest | LENGTH | Right option: "Stores embeddings for similarity search". Distractor now: "Filters harmful prompts and model responses" |
| d3-239 | Right option longest | LENGTH | Right option: "Pre-training from scratch". Distractors made specific: "Continued pre-training on domain text", "Fine-tuning on labeled examples", "RAG over a document store" |
| d3-241 | Right option longest | LENGTH | "It generates the student's training data" |
| d3-246 | Right option longest | LENGTH | "It plans steps and calls tools to act" |
| d3-247 | Right option longest | LENGTH | "An action group backed by Lambda" |
| d3-248 | Right option longest | LENGTH | Right option: "An agent with a knowledge base and action group". Distractors lengthened (same meaning) |
| d3-257 | Right option longest | LENGTH | Right option: "A negative prompt banning dosage advice". Two distractors lengthened |
| d3-265 | Right option longest | LENGTH | Right option: "Include examples of every label". Temperature distractor lengthened |
| d3-267 | Right option far longest | LENGTH | Right option: "Inconsistent example formats". All three distractors lengthened |
| d3-274 | Right option longest | LENGTH | Distractors: "Raising the temperature setting", "Lowering the maximum tokens" |
| d3-275 | Right option longest | LENGTH | "A reusable prompt with fill-in placeholders" |
| d3-276 | Right option longest | LENGTH | "Reasoning steps, then the answer" |
| d3-277 | Right option longest | LENGTH | "They update model weights per user" |
| d3-285 | Right option longest | LENGTH | "Poisoning of retrieval data" |
| d3-292 | Right option longest | LENGTH | "Point the app to the previous version" |
| d3-293 | Right option longest | LENGTH | Right option: "A model and inference settings". Distractor now: "A copy of the model's trained weights" |
| d3-294 | Right option longest | LENGTH | "Compare variants in Prompt Management" |
| d3-311 | Right option longest | LENGTH | "It reuses already-learned knowledge" |
| d3-320 | Right option longest | LENGTH | "Data governance and lineage" |
| d3-322 | Right option longest | LENGTH | Right option: "Human rankings of responses". Two distractors lengthened |
| d3-326 | Right option longest | LENGTH | "Likely too few; prompt or gather more data" |
| d3-328 | Right option longest | LENGTH | Right option: "Human evaluation by reviewers". Two distractors lengthened |
| d3-339 | Right option longest | LENGTH | Right option: "Outputs shorter than the references". Distractor now: "Outputs that use rare or unusual words" |
| d3-340 | Right option longest | LENGTH | "An LLM-as-a-judge job" |
| d3-344 | Right option longest | LENGTH | "It scores overlap, not meaning" |
| d3-347 | Right option longest | LENGTH | "Time saved per document" |
| d3-348 | Right option far longest | LENGTH | "Each $2 resolution costs $4 in AI spend" (math re-checked: 10 x $0.40 = $4 for one $2 saving) |

Counts: 0 WRONG, 1 MISLEADING, 2 AMBIGUOUS, 3 NIT, 30 LENGTH. In total 36 items were changed: 34 cards and 2 facts.

## Verified claims (with sources)

- Prompt Management: you can save prompts with variables, create versions, pick a model and inference settings per variant, and compare up to 3 variants side by side. Covers d3-291 to d3-298 and f3-060. https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html, https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-prompt-management-is-now-available-in-ga/
- A Flows prompt node can use a prompt from Prompt Management or an inline prompt. Covers d3-296 and f3-062. https://docs.aws.amazon.com/bedrock/latest/userguide/flows-nodes.html
- Knowledge Bases supports several vector stores: OpenSearch Serverless, OpenSearch managed clusters, Aurora PostgreSQL, Neptune Analytics, Pinecone, MongoDB Atlas, Redis and S3 Vectors. Quick create can build OpenSearch Serverless, Aurora PostgreSQL Serverless (pgvector), Neptune Analytics or S3 Vectors. Covers d3-232, d3-236 and f3-057. https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-create.html, https://aws.amazon.com/blogs/database/accelerate-your-generative-ai-application-development-with-amazon-bedrock-knowledge-bases-quick-create-and-amazon-aurora-serverless/
- Vector store options on AWS: OpenSearch k-NN, Aurora and RDS PostgreSQL with pgvector, Neptune Analytics, DocumentDB and MemoryDB. Covers d3-228 to d3-235 and f3-021 to f3-026. https://docs.aws.amazon.com/prescriptive-guidance/latest/choosing-an-aws-vector-database-for-rag-use-cases/vector-db-options.html, https://docs.aws.amazon.com/documentdb/latest/devguide/vectorSearch.html, https://aws.amazon.com/blogs/aws/vector-search-for-amazon-memorydb-is-now-generally-available/
- Model Distillation: the teacher generates responses, and those responses fine-tune a smaller student in the same model family. Covers d3-241, d3-304 and f3-032. https://docs.aws.amazon.com/bedrock/latest/userguide/model-distillation.html
- Checked from domain knowledge with no search, because these are standard and low-risk:
  - inference parameter behavior (temperature, top-p, top-k, maximum tokens, stop sequences)
  - ROUGE is recall-oriented and BLEU is precision-oriented with a brevity penalty
  - BERTScore uses contextual embeddings
  - RLHF uses a reward model trained on human rankings
  - continued pre-training uses unlabeled data and fine-tuning uses labeled prompt and completion pairs
  - Guardrails prompt attack filter
  - AgentCore runtime, identity and memory
  - MCP is an open standard
  - AWS's "use multiple comments" guidance for code assistants

## Unverified or watch items (not changed)

- d3-245 "Custom models can need Provisioned Throughput". Bedrock now also offers on-demand deployment for some custom models, which is why the card says "can need" and stays true. Re-check if AWS drops the Provisioned Throughput requirement entirely.
- d3-302 and d3-303: continued pre-training on Bedrock is offered only for some model families. The cards make no claim about which models, so they are fine.
- f3-039 Context vs f3-044 System prompt: a role can live in a system prompt. A generated true/false card pairing "System prompt" with the Context def ("Background such as role, audience or situation...") is borderline but still false, because a system prompt is defined by applying to every turn. Low risk. Left as is.
- Seven mcqs still have the right option strictly longest by a few characters, because the options are fixed names (d3-203, 212, 213, 231, 291, 312, 346). The share is well under the 30% target.
