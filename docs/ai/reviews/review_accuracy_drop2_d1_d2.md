# Technical accuracy review: drop 2, Domains 1 and 2

Files: `content/d1-drop2.yaml` (120 cards, 70 facts), `content/d2-drop2.yaml` (120 cards, 73 facts).
Reviewer pass: 2026-11-13, against AIF-C01 guide v1.2 (`docs/aif-c01-objectives.md`).

## Verdict

**Pass after fixes.** No keyed answer was wrong. One card was misleading about how a current product behaves (Kiro hooks, d2-301). One match card could be answered two ways (d2-232). One fact read as current-tense image/video generation for Amazon Nova (f2-034), which matters now that Nova Canvas and Nova Reel are end-of-life. One explanation named a model whose lifecycle status I could not confirm (d2-212). The rest of the changes fix answer-length bias.

The right answer is now the single longest option in 4 of 56 D1 mcqs (7%, was 18%) and 10 of 63 D2 mcqs (16%, was 33%). In every remaining case it is longer by 2 characters or fewer, which is not a usable tell. `npm run validate` reports 0 errors and 0 warnings.

## Changes

| id | problem | severity | fix |
|---|---|---|---|
| d2-301 | The stem said hooks fire "whenever a source file is saved". Current Kiro docs say file triggers respond only to changes the agent makes, not to manual editor saves. The why said "IDE events such as saving a file". | MISLEADING | Stem now says "each time the agent saves a change to a source file". Why now says hooks "run actions automatically on events such as a file being saved or a tool being used". |
| d2-232 | The right side "Text only" also fits Amazon Translate, and Nova Micro (an LLM) can also translate text, so two pairings were defensible. | AMBIGUOUS | Rights are now 'Fast, low-cost text-only model' (Nova Micro) and 'Speech-to-speech conversation model' (Nova Sonic). |
| f2-034 | "Foundation models for text, images, video and speech" reads as current image and video generation, but Nova Canvas and Nova Reel are end-of-life since 2026-09-30. | MISLEADING | Def is now 'Amazon-built foundation models covering text, image and video understanding, and speech'. |
| d2-212 | The why named Amazon Titan Multimodal Embeddings as a current example, and I could not confirm its 2026 lifecycle status. | NIT | Removed the model name. The why now states the general principle. |
| d1-219 | Right option clearly longest (47 vs 42). | LENGTH | 'Historical bias in the training labels' |
| d1-234 | Right option clearly longest. Also swapped a distractor. | LENGTH | Textract replaced by 'Amazon SageMaker Feature Store'. Why updated. |
| d1-258 | Right option clearly longest. | LENGTH | Distractor is now 'K-means clustering of past tickets'. |
| d1-284 | Right option clearly longest (41 vs 34). | LENGTH | Right is now 'Quoting a regulated insurance premium'. Distractor is now 'Drafting a friendly welcome email for new hires'. |
| d1-290 | Right option clearly longest. | LENGTH | Distractor is now 'Production model monitoring'. |
| d1-291 | Right option clearly longest (32 vs 23). | LENGTH | Distractor is now 'SageMaker Ground Truth labeling jobs'. |
| d2-241 | Right option clearly longest. | LENGTH | 'Documents retrieved for this request' |
| d2-243 | Right option clearly longest. | LENGTH | Right is now 'Filter retrieval by employee country metadata'. Distractor is now 'Raise the maximum output token limit per answer'. |
| d2-259 | Right option clearly longest. | LENGTH | Polly replaced by 'Amazon Bedrock Prompt Management'. Why updated. |
| d2-265 | Right option clearly longest (28 vs 18). | LENGTH | Distractors are now 'Foundation model pre-training' and 'Asynchronous batch inference'. |
| d2-282 | Right option clearly longest. | LENGTH | 'Support for image and text input' |
| d2-285 | Right option clearly longest. | LENGTH | Distractor is now 'Free-trial conversion rate'. |
| d2-292 | Right option clearly longest (50 vs 44). | LENGTH | 'Use the Amazon Bedrock console playgrounds' |
| d2-299 | Right option clearly longest (34 vs 25). | LENGTH | Distractors are now 'Amazon Bedrock AgentCore Memory' and 'A stricter system prompt for the agent'. |
| d2-300 | Right option clearly longest. | LENGTH | Gateway replaced by 'AgentCore Code Interpreter'. Why updated. |
| d2-305 | Right option clearly longest. | LENGTH | Distractor is now 'Amazon CloudFront edge locations'. |
| d2-317 | Right option clearly longest (42 vs 37). | LENGTH | Right is now 'Training and monthly model storage fees'. Distractor is now 'A per-character fee on every prompt sent'. |

No ids changed. No base files (d1.yaml, d2.yaml) were touched.

## Verified claims

- **Policy in AgentCore (d2-299, d2-260, f2-039):** generally available since 2026-03-03. It checks tool calls against Cedar policies, enforced at AgentCore Gateway before a call runs. The exam guide names it in 5.1. https://aws.amazon.com/about-aws/whats-new/2026/03/policy-amazon-bedrock-agentcore-generally-available
- **Kiro agent hooks and steering files (d2-301):** File Save is a hook trigger, but "File triggers respond only to changes made by the agent". Steering files are Markdown files in `.kiro/steering/` that give standing guidance. https://kiro.dev/docs/hooks/types/ and https://kiro.dev/docs/hooks/
- **Bedrock multi-agent supervisor with routing (d2-251):** there are two modes, supervisor and supervisor with routing. Routing sends simple requests straight to the relevant collaborator. https://aws.amazon.com/blogs/aws/introducing-multi-agent-collaboration-capability-for-amazon-bedrock and https://docs.aws.amazon.com/bedrock/latest/userguide/create-multi-agent-collaboration.html
- **Evaluator-optimizer (f2-054):** AWS Prescriptive Guidance uses the term and points to its evaluator reflect-refine loop pattern (generator, then critique, then refine until criteria pass). https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/evaluator-reflect-refine-loop-patterns.html
- **Custom Model Import (d2-291), Bedrock playgrounds (d2-292), Titan Text Embeddings V2 at 256/512/1,024 dimensions (d2-214):** consistent with Bedrock documentation as I know it (Custom Model Import brings weights of supported architectures and invokes them like other Bedrock models; console text/chat and image playgrounds include model comparison; Titan Text Embeddings V2 offers 1,024 by default, plus 512 and 256). I did not re-fetch these pages this pass. They are low-risk, long-standing features.
- **Nova Canvas and Nova Reel:** neither file names them. f2-034 was the only implied mention, now fixed.

## Unverified items

- **Amazon Titan Multimodal Embeddings G1** lifecycle status in late 2026 (https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html did not show its row clearly). The name was removed from d2-212, so nothing depends on it now.
- **Nova Micro** is described as the text-only, low-latency Nova model (d2-220, d2-232). That was true at launch and I found no retirement notice, but I did not check it against the Nova 2 lineup.
