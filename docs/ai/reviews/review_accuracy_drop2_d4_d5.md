# Technical accuracy review: D4 and D5 drop 2

Reviewer: independent technical accuracy pass · Date: 2026-11-13 · Scope: `content/d4-drop2.yaml` (72 cards d4-201 to d4-272, 43 facts f4-001 to f4-043) and `content/d5-drop2.yaml` (96 cards d5-201 to d5-296, 50 facts f5-001 to f5-050). Base `d4.yaml` / `d5.yaml` were read for context only and not edited.

## Verdict

**PASS after edits.** I found no WRONG keyed answers. Every mcq, multi, hallu, tf, order, match and duel card has one defensible key. I made 6 accuracy or clarity edits (1 MISLEADING, 5 NIT) and 25 answer-length rebalances.

- **Answer-length bias:** the right option was the single longest in 39 of 79 drop-2 mcqs (49.4%). After the edits it is 14 of 79 (17.7%), a little under the 25% you would expect by chance.
- **The 14 left alone** are mostly one-word or service-name options where the gap is 1 to 3 characters: d4-204, d4-217, d4-259, d4-269, d5-204, d5-211, d5-220, d5-234, d5-242, d5-252, d5-258, d5-265, d5-275, d5-277.
- **Validation:** `npm run validate` reports 0 errors and 0 warnings.

## Changes

| id | Problem | Severity | Fix |
|---|---|---|---|
| d4-252 | The metric was named "difference in positive proportions in labels (DPL)". The real name is Difference in Proportions of Labels. The wording was also close to DPPL, the post-training metric for predicted labels, so it could teach the wrong name. | MISLEADING | Stem now says "difference in proportions of labels (DPL)". |
| f4-026 (Clarify) | Writer flag: the Clarify and Model Monitor defs could be confused. "Measures data and model bias" could also describe Model Monitor's bias drift checks. | NIT | Def is now "Computes pre- and post-training bias metrics and SHAP feature attributions". |
| f4-028 (Model Monitor) | Same pair as above. | NIT | Def is now "Watches deployed endpoints on a schedule and flags data and model quality drift". |
| f5-027 / f5-028 (jailbreak, indirect prompt injection) | Writer flag: make the pair unmistakable. The difference is who supplies the attack and where it comes from. | NIT | Jailbreak: "A user's own role-play or trick prompts that talk a model past its safety rules". Indirect injection: "Hidden attacker commands inside documents or web pages the app feeds the model". |
| f5-012 (GuardDuty) | Writer flag. The def was accurate, but it named "CloudTrail", which is another term in the same group. That gives a clue on mcqs and looks odd when defs are swapped on tf cards. | NIT | Kept GuardDuty, because task 5.1 explicitly lists "threat detection" and GuardDuty is AWS's threat detection service. The guide's service list is non-exhaustive. Def is now "Detects threats by analyzing account activity, network flow and DNS logs". The comment is updated. |
| f5-015 (Data residency) | "as set by law" overstated it: residency can also come from contracts or policy. | NIT | Now "often required by law". |
| d4-226 | The right option was the longest. | LENGTH | KMS distractor is now "Encrypt every generated audio file with an AWS KMS key". |
| d4-229 | The right option was the longest. | LENGTH | Price distractor is now "...lowest price per generated image". |
| d4-234 | The right option was the longest. | LENGTH | Distractor is now "Too many input features in the training dataset". |
| d4-236 | The right option was the longest. | LENGTH | Distractor is now "The model's sampling temperature is set too high". |
| d4-245 | The right option was the longest (+11 characters). | LENGTH | Distractor is now "Stronger regularization on the current model". |
| d4-258 | The right option was the longest. | LENGTH | Distractor is now "Amazon SageMaker Model Cards for the claims model". |
| d4-265 | The right option was the longest. | LENGTH | Distractor is now "The general categories of customer data the model uses". |
| d4-267 | The right option was the longest. | LENGTH | Distractor is now "Offering affected users a way to contest a decision". |
| d5-202 | The right option was the longest. | LENGTH | Distractor is now "...with a customer managed KMS key". |
| d5-203 | The right option was the longest. | LENGTH | Distractor is now "Amazon Macie sensitive data discovery in every account". |
| d5-212 | The right option was the longest. | LENGTH | Distractor is now "You can disable the key to cut off access to the data". |
| d5-218 | The right option was the longest (+10 characters). | LENGTH | Distractor is now "Amazon CloudFront caching in front of the training files". |
| d5-225 | The right option was the longest. | LENGTH | Distractor is now "Writing IAM policies for the app that calls Bedrock". |
| d5-226 | The right option was the longest. | LENGTH | Distractor is now "Validating model outputs before they are used downstream". |
| d5-227 | The right option was the longest (+10 characters). | LENGTH | Distractor is now "Encrypting its own S3 data sources for knowledge bases". |
| d5-228 | The right option was the longest. | LENGTH | Distractor is now "Physical security of the data center hosting the endpoint". |
| d5-233 | The right option was the longest. | LENGTH | Distractor now uses the full official name, "Policy in Amazon Bedrock AgentCore". |
| d5-243 | The right option was the longest (+10 characters). | LENGTH | Distractor is now "A larger model context window for chat history". |
| d5-251 | The right option was the longest. | LENGTH | Distractor is now "An AWS Config conformance pack for log groups". |
| d5-259 | The right option was the longest (+10 characters). | LENGTH | Distractor is now "Lower the maximum output tokens to 50 per response". |
| d5-267 | The right option was the longest. | LENGTH | "Amazon Macie" is replaced by "Amazon SageMaker Model Monitor". It is a closer distractor and still wrong, because it monitors drift and does not document training data or intended use. |
| d5-268 | The right option was the longest. | LENGTH | Distractor is now "AWS PrivateLink plus KMS encryption of the documents". |
| d5-273 | The right option was the longest. | LENGTH | Distractor is now "AWS Artifact compliance reports". I avoided the Well-Architected Tool on purpose, because it also reviews cost and security best practices, which would make the card ambiguous. |
| d5-282 | The right option was the longest. | LENGTH | Distractor is now "...word filters in the app's guardrail". |
| d5-293 | The right option was the longest (+12 characters). | LENGTH | Distractor is now "Choosing which data the vendor's app is trained on". |

## Claims verified

- **RAG is Scope 3 in the Generative AI Security Scoping Matrix** (writer flag; cards d5-292, d5-294, f5-024). AWS's blog places RAG with pre-trained models (Scope 3) and describes it as "an alternative to training or fine-tuning". Scope 4 begins when you fine-tune the model with your data. The key is correct. Sources: https://aws.amazon.com/blogs/security/securing-generative-ai-an-introduction-to-the-generative-ai-security-scoping-matrix/ · https://aws.amazon.com/ai/generative-ai/security/scoping-matrix/
- **Scope names and order** for Scopes 1 to 5 (d5-289 to d5-296 and the facts) match the sources above and the earlier base review.
- **Clarify, Model Monitor and Model Cards** (d4-251, d4-252, d4-256, d4-258, d4-261, d5-267):
  - Clarify computes pre-training and post-training bias metrics, including DPL, and SHAP feature attributions.
  - Model Monitor schedules data quality, model quality and bias drift checks on endpoints.
  - Model Cards record intended use, risk rating, training details and evaluation.
  - Sources: https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-data-bias-metric-true-label-imbalance.html · https://docs.aws.amazon.com/sagemaker/latest/dg/clarify-model-monitor-bias-drift.html · https://docs.aws.amazon.com/sagemaker/latest/dg/model-cards.html
- **Guardrails behavior** (d4-209 to d4-216, d5-258, d5-260, d5-262, f4-011 to f4-018):
  - Content filters have separate input and output strengths.
  - Sensitive information filters can block or mask.
  - A blocked input skips the model and returns the configured message.
  - The contextual grounding check uses separate grounding and relevance thresholds, needs the source and the query, and blocks responses scored below the threshold, so a higher threshold blocks more.
  - Automated reasoning checks use formal logic.
  - ApplyGuardrail works on text from any model.
  - Sources: https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-components.html · https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-contextual-grounding-check.html · https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-independent-api.html
- **Bedrock Model Evaluation** offers automatic metrics (accuracy, robustness, toxicity) and human evaluation jobs (d4-259). Source: https://docs.aws.amazon.com/bedrock/latest/userguide/evaluation.html
- **Trainium is for training and Inferentia is for inference, both focused on performance per watt** (d4-217, d4-219, d4-221). Sources: https://aws.amazon.com/ai/machine-learning/inferentia/ · https://aws.amazon.com/ai/machine-learning/trainium/
- **KMS keys** (d5-212, d5-214, d5-216):
  - A customer managed key gives you the key policy, can be disabled, supports automatic rotation, and its use is logged in CloudTrail.
  - AWS owned keys cannot be viewed or managed in your account.
  - Key policies and IAM policies work together.
  - Source: https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html
- **IAM policy logic** (d5-206, d5-207): requests are denied unless allowed, and an explicit deny always wins. SCPs set maximum permissions across an organization (d5-203). Sources: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html · https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html
- **Macie automated sensitive data discovery** (d5-222). Source: https://docs.aws.amazon.com/macie/latest/user/discovery-asdd.html
- **Bedrock in CloudWatch and CloudTrail** (d5-249 to d5-256):
  - Bedrock sends the metrics Invocations and InvocationLatency to CloudWatch.
  - CloudTrail records Bedrock API calls, including changes to the logging configuration and CreateGuardrail.
  - CloudTrail does not record prompt or response text.
  - Sources: https://docs.aws.amazon.com/bedrock/latest/userguide/monitoring.html · https://docs.aws.amazon.com/bedrock/latest/userguide/logging-using-cloudtrail.html
- **Governance services** (d5-273 to d5-280):
  - Trusted Advisor covers best-practice categories.
  - Config uses managed rules and conformance packs.
  - Inspector scans EC2, ECR and Lambda.
  - Artifact offers reports and agreements, including the BAA.
  - Sources: https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html · https://docs.aws.amazon.com/artifact/latest/ug/managing-agreements.html · https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html
- **AgentCore** (d5-233 to d5-240, f5-045 to f5-050):
  - Identity integrates with identity providers such as Cognito and Okta, keeps tokens in a vault, and handles delegated user access.
  - Policy uses Cedar rules enforced at Gateway on each tool call, including conditions on tool parameters.
  - Gateway exposes APIs and Lambda functions as MCP tools.
  - Runtime provides session-isolated serverless hosting.
  - Memory holds short-term and long-term context.
  - Observability works through CloudWatch.
  - Sources: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html · https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-core-concepts.html · https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html
- **GuardDuty analyzes CloudTrail events, VPC Flow Logs and DNS logs** as its foundational data sources (f5-012). Source: https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html
- **Glue Data Catalog is a metadata repository** (d5-265), and **S3 Lifecycle rules transition and expire objects** (d5-283). Sources: https://docs.aws.amazon.com/glue/latest/dg/catalog-and-crawler.html · https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html
- **Standard ML and privacy concepts** were checked against standard definitions with no source fetched: bias and variance, regularization, early stopping, class imbalance, proxy features, differential privacy, tokenization vs masking, hashing as pseudonymization, and the jailbreak, injection, inversion, membership inference and extraction attack types.

## Fact groups checked for swap-safety

All 12 groups were checked. Every def is true, fits only its own term within its group, and does not contain its term:

- `responsible-ai-dimensions`, `guardrails-policies`, `bias-variance-terms`, `rai-tools`, `genai-legal-risks`, `sustainable-levers`
- `aws-security-services`, `governance-terms`, `scoping-matrix-scopes`, `genai-threats`, `shared-responsibility`, `agentcore-services`

Groups with only 5 facts are left as they are.

## Unverified or judgment calls

- **d5-252:** I did not re-check whether CloudTrail classifies Bedrock InvokeModel as a management event or a data event. Either way CloudTrail can record who called it and when, so the key holds.
- **d5-245:** "Screen user input with the Guardrails prompt attack filter" is keyed correct for a RAG app over web pages. That filter mainly targets direct injection in user input, but it still reduces prompt injection risk, and the other three distractors are clearly harmful or irrelevant.
- **Inferentia and Trainium "performance per watt" and sustainability** is AWS's own framing. I accepted it as the exam framing.
