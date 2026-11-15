# Technical accuracy review: D4 (Responsible AI) and D5 (Security, Compliance, Governance)

Reviewer: independent technical accuracy pass · Date: 2026-11-13 · Scope: `content/d4.yaml` (9 concepts, 45 cards), `content/d5.yaml` (12 concepts, 59 cards). Drop-2 files not touched.

## Verdict

**PASS, with 2 minor edits.** I found no WRONG keyed answers. Every mcq, multi, hallu, tf, order, match and duel card has one defensible key. One order card had two steps that could be swapped (now made explicit), and one earbud script had a small inaccuracy about responsibility on EC2. `npm run validate`: 0 errors, 0 warnings.

## Changes

| id | Problem | Severity | Fix |
|---|---|---|---|
| d4-034 | Order steps "Measure performance for each subgroup" and "Have humans audit a sample of decisions" could defensibly be swapped, which makes the keyed order ambiguous. | AMBIGUOUS | Steps reworded to "Measure test-set performance for each demographic subgroup" and "Have humans audit a sample of decisions before release". The `why` already says the audit comes before release. |
| ai-shared-responsibility (`say`) | "you patch everything above the hardware" is wrong: on EC2, AWS still owns the hypervisor and virtualization layer. | NIT | Changed to "you patch the operating system and everything on it." |

## Claims verified

- **Bedrock Guardrails policy types** (d4 `bedrock-guardrails` and d4-006 to d4-010, d5-036, d5-040). I confirmed each type and what it does:
  - Content filters cover Hate, Insults, Sexual, Violence, Misconduct and Prompt attack, with a strength setting for each category.
  - Denied topics are described in natural language.
  - Word filters cover custom words and phrases plus a managed profanity list.
  - Sensitive information filters block or mask PII and support custom regex.
  - Contextual grounding checks score grounding and relevance against a threshold.
  - Automated reasoning checks validate answers against formal logic built from policy documents.
  - Source: https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-components.html
- **ApplyGuardrail works on any text, including self-hosted or third-party models** (d4-009 is false as keyed). Source: https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-independent-api.html
- **SageMaker Clarify vs Model Cards vs Model Monitor** (d4-031, d4-035, d4-036, d4-039):
  - Clarify measures pre-training and post-training bias and gives feature attributions.
  - Model Cards record intended use, risk rating, training details and evaluation.
  - Clarify together with Model Monitor tracks bias drift.
  - Sources: https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-configure-processing-jobs.html · https://docs.aws.amazon.com/sagemaker/latest/dg/model-cards.html · https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-model-monitor-bias-drift.html
- **Overfitting, underfitting, bias and variance** (d4-026 to d4-030): overfit means high variance, underfit means high bias, and more epochs is not a fix for overfitting. This is standard ML, matching https://docs.aws.amazon.com/machine-learning/latest/dg/model-fit-underfitting-vs-overfitting.html
- **What each governance service does** (d5-011 to d5-013, d5-045 to d5-049):
  - Macie finds sensitive data in S3 using ML and pattern matching. It does not scan live Bedrock prompts.
  - Inspector scans EC2, ECR container images and Lambda for vulnerabilities.
  - Config records configuration history and evaluates it against rules.
  - CloudTrail records API activity.
  - Artifact provides SOC and ISO reports and agreements.
  - Trusted Advisor runs best-practice checks.
  - Sources: https://docs.aws.amazon.com/macie/latest/user/what-is-macie.html · https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html · https://docs.aws.amazon.com/artifact/latest/ug/what-is-aws-artifact.html
- **Bedrock model invocation logging is off by default**, and its destinations are CloudWatch Logs and S3 (d5-031 to d5-033). Source: https://docs.aws.amazon.com/bedrock/latest/userguide/model-invocation-logging.html
- **Bedrock does not use prompts or completions to train AWS models or share them with third parties**, and model providers have no access to them (d5-020). Source: https://docs.aws.amazon.com/bedrock/latest/userguide/data-protection.html
- **Cross-Region inference can process requests in other Regions** (d5-052, `data-governance`). Source: https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html
- **Shared responsibility for Bedrock vs self-managed EC2** (d5-016 to d5-019): the customer owns IAM and data. On EC2 the customer also owns the guest OS. The order card d5-019 (EC2, then SageMaker AI endpoint, then Bedrock, then SaaS) is defensible. Source: https://aws.amazon.com/compliance/shared-responsibility-model/
- **Generative AI Security Scoping Matrix** (d5-055 to d5-059): the names and order are exact. 1 Consumer app, 2 Enterprise app, 3 Pre-trained models, 4 Fine-tuned models, 5 Self-trained models. Sources: https://aws.amazon.com/ai/generative-ai/security/scoping-matrix/ · https://aws.amazon.com/blogs/security/securing-generative-ai-an-introduction-to-the-generative-ai-security-scoping-matrix
- **AgentCore Identity** (d5-021, d5-023, d5-024): it manages agent identities, integrates with identity providers, and keeps OAuth tokens and API keys in a token vault so an agent can act with a user's delegated access.
- **Policy in AgentCore** (d5-021 to d5-025):
  - Policies are written in Cedar, or authored in natural language and turned into Cedar.
  - They are enforced at AgentCore Gateway on each tool call, outside the agent's code.
  - Default deny: if no policy matches, the request is denied, and a forbid wins over a permit.
  - Sources: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-core-concepts.html · https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-understanding-cedar.html · https://aws.amazon.com/blogs/security/why-policy-in-amazon-bedrock-agentcore-chose-cedar-for-securing-agentic-workflows/ · https://aws.amazon.com/about-aws/whats-new/2026/03/policy-amazon-bedrock-agentcore-generally-available

## Overlap check (report only, no change)

- D4 `bedrock-guardrails` is the feature catalogue (task 4.1). D5 `prompt-injection-defense` uses the prompt attack filter as one defense among several (least privilege, keeping secrets out of prompts, output validation). D3 `prompt-attack-risks` names the attack types (d3-049 and d3-050 also mention the prompt attack filter). D5 `grounding-validation` reuses the contextual grounding check (d5-036). All four concepts are consistent with each other and stress different things, so I see no confusing overlap.
- One mild observation: d4-007 and d5-036 test the same fact, that the contextual grounding check catches unsupported RAG answers. That repetition is fine for learning.

## Not fully verified

- The "AWS CloudTrail management events" distractor in d5-031 is wrong as a distractor whichever way Bedrock runtime calls are classified, since neither management nor data events capture prompt text. I did not re-check that classification.
- That Inferentia and Trainium are energy efficient (`sustainable-model-selection`) is AWS's own claim. I accepted it as the exam framing.
