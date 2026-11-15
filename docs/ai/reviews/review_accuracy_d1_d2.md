# Technical accuracy review: content/d1.yaml and content/d2.yaml

Reviewer: independent technical-accuracy pass. Date: 2026-11-13. Scope: all 30 concepts and 155 cards in `d1.yaml` (15 concepts, 79 cards) and `d2.yaml` (15 concepts, 76 cards). Drop-2 files were not touched.

## Overall verdict

**PASS after fixes.** No card had a wrong keyed answer. Every mcq/multi key is the only defensible answer, every hallu `bad` line is false while the other lines are true, the tf values are right, the order steps follow the exam guide's own sequence, and the duel winners are clear. Service names match exam guide v1.2 (Amazon SageMaker AI, SageMaker JumpStart, Amazon Bedrock AgentCore, Strands Agents, Kiro, Amazon Quick).

One real currency problem: the content named **Amazon Nova Canvas and Amazon Nova Reel** as current image and video models. Both reached end of life on Bedrock on 2026-09-30. That is now fixed. The other three edits are small wording fixes.

`npm run validate`: 0 errors, 0 warnings.

## Changes

| id | problem | severity | fix |
|---|---|---|---|
| `genai-use-cases` (concept, learn[1]) | Names Amazon Nova Canvas and Nova Reel as example image and video models. Both reached EOL on Amazon Bedrock on 2026-09-30 (Legacy since 2026-03-30), so a learner would learn retired services. | MISLEADING | Changed to "image, video and audio generation from prompts, using diffusion and multimodal models available through Amazon Bedrock." |
| d2-020 (`why`) | Cites "Amazon Nova Reel" as a current video model (EOL 2026-09-30). The keyed answer `v: false` stays correct. | MISLEADING | Changed to "video generation models create short clips from text prompts." |
| d2-073 (`why`) | Said Provisioned Throughput is "the common way" to serve custom models. Bedrock now also supports on-demand custom model deployments for some customized models (for example Nova), so the wording was too strong. The key (Provisioned Throughput for steady, high, consistent traffic) stays correct. | NIT | Changed to "a standard way". |
| `data-types` (concept, learn[0]) | Said unlabeled data "suits fewer methods", which is vague and arguable. | NIT | Changed to "cheaper but cannot train supervised models." |

### Noted, no change made

- **d2-012 (match):** in strict terms, "Predicts the next token using self-attention" also fits many multimodal LLMs. The 1:1 matching still resolves it, because "Takes in or produces more than one data type" fits only the multimodal row. This is a NIT, left as is.
- **d1-020 (match):** asynchronous inference could also serve "Internal tool used a few times a day". The 1:1 matching resolves it, since async is clearly the "one large file, minutes to process" row. NIT, left as is.
- **d1-057 (order):** EDA before pre-processing is debatable in practice, but it is the exact order the AIF-C01 exam guide lists. Kept.

## Flagged claims verified

| Claim (where) | Verdict | Source |
|---|---|---|
| Custom models on Bedrock "often need" Provisioned Throughput (`provisioned-throughput-costs` learn[1], d2-073) | **True, and "often" is the right hedge.** The PT page says "If you customized a model, you must purchase Provisioned Throughput". A newer feature, custom model deployment, allows on-demand inference for some customized models (Nova Lite, Nova 2 Lite, distilled models). | https://docs.aws.amazon.com/bedrock/latest/userguide/prov-throughput.html ; https://docs.aws.amazon.com/bedrock/latest/userguide/deploy-custom-model-on-demand.html |
| PT is billed hourly, with no-commitment, 1-month and 6-month terms (d2-072, learn[1]) | True | https://docs.aws.amazon.com/bedrock/latest/userguide/prov-throughput.html |
| Batch inference is cheaper than on-demand for supported models (d2-005, learn[0]) | True. AWS states a 50% lower price for select models. | https://aws.amazon.com/bedrock/pricing/ |
| Bedrock does not use your prompts to train base models (d2-059, d2-070, `aws-genai-advantages`) | True. AWS says Bedrock "doesn't use your prompts and completions to train any AWS models and doesn't distribute them to third parties", and model providers cannot access customer prompts or completions. | https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html |
| AgentCore Gateway turns APIs and Lambda functions into MCP-compatible tools (d2-040, `mcp` learn[2]) | True. Supported targets include Lambda, API Gateway REST APIs, OpenAPI, Smithy and MCP servers. | https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html |
| Nova Canvas and Nova Reel are current | **False.** Both reached EOL on 2026-09-30 and are now fixed (see the changes table). | https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html |
| Amazon Titan Text Embeddings is still available (`embeddings-vectors` learn[1]) | True. Titan Text Embeddings V2 is listed among available Amazon models. | https://docs.aws.amazon.com/bedrock/latest/userguide/model-cards-amazon.html |
| Amazon Quick is an agentic workspace with BI, research and automation (d1-065, d2-062, d2-064, d2-065) | True. Quick Sight, Quick Research, Quick Flows and Quick Automate. It evolved from QuickSight, first as "Quick Suite", now "Amazon Quick". | https://aws.amazon.com/blogs/aws/reimagine-the-way-you-work-with-ai-agents-in-amazon-quick-suite |

Checked from established knowledge and judged accurate:
- Kiro is an agentic IDE with spec-driven development (requirements, design, tasks).
- Strands Agents is an open-source SDK.
- AgentCore is framework- and model-agnostic, with Runtime, Memory, Gateway, Identity, Policy and Observability.
- Bedrock Agents multi-agent collaboration uses a supervisor model.
- MCP servers expose tools, resources and prompts, and A2A connects agents to agents.
- SageMaker Serverless Inference scales to zero, with cold starts.
- Async inference handles large payloads and long processing times.
- A token is about 4 characters, and output tokens usually cost more.
- PrivateLink keeps traffic off the public internet.

## Could not fully verify

- **Policy in AgentCore** (listed in `aws-agent-stack` learn[1]): it is in the exam guide objectives, but I did not confirm its current GA or preview status. The name matches the guide, so the content is acceptable.
- **Bedrock data retention:** AWS's newer data-retention page says some models that require abuse detection may retain prompts within the AWS boundary for a limited time. That does not contradict "not used to train base models", which the cards state correctly, but none of the cards make a "never stored" claim, and they should keep it that way.
- **Drop-2 files and d3–d5:** not in scope. A grep found no other Nova Canvas or Reel mentions in `content/`.
