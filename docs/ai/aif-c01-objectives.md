# AWS Certified AI Practitioner (AIF-C01) — objectives

Source: AWS exam guide, https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html (revisions page lists v1.2, 2026-10-29; read 2026-11-13). Paraphrased into compact bullets. Each task statement has one objective list.

Exam: 50 scored + 15 unscored questions; pass 700/1000; types: multiple choice, multiple response, ordering, matching. Target candidate: up to 6 months of AI/ML exposure on AWS.

## Domain 1: Fundamentals of AI and ML (20%)

**1.1 Explain basic AI concepts and terminologies.**
- Define: AI, ML, deep learning, neural networks, computer vision, NLP, model, algorithm, training and inferencing, bias, fairness, fit, LLM, GenAI, agentic AI.
- Similarities/differences between AI, ML, GenAI, deep learning, agentic AI.
- Inferencing types: batch, real-time, asynchronous, serverless.
- Data types: labeled/unlabeled, tabular, time-series, image, text, structured/unstructured.
- Learning types: supervised, unsupervised, reinforcement learning.

**1.2 Identify practical use cases for AI.**
- Where AI/ML adds value (assist human decisions, scalability, automation).
- When AI/ML is NOT appropriate (cost-benefit; a specific deterministic outcome is needed instead of a prediction).
- Select techniques: regression, classification, clustering.
- Real-world applications: computer vision, NLP, speech recognition, recommendation systems, fraud detection, forecasting, knowledge bases, agentic AI.
- Capabilities of AWS managed AI/ML services: Amazon SageMaker AI, Amazon Transcribe, Amazon Translate, Amazon Comprehend, Amazon Lex, Amazon Polly.
- When traditional ML vs foundation models (FMs) fit (regulatory concerns, explainability requirements, operational constraints).

**1.3 Describe the AI/ML development lifecycle.**
- Components of an ML pipeline (data collection, EDA, pre-processing, feature engineering, training, hyperparameter tuning, evaluation, deployment, monitoring).
- Sources of FM models: open-source pre-trained models, training custom models.
- Using a model in production: managed API service, self-hosted API.
- AWS services per pipeline stage: Amazon Bedrock, Amazon Quick, Kiro, Amazon SageMaker AI.
- MLOps fundamentals: experimentation, repeatable processes, scalable systems, managing technical debt, production readiness, model monitoring, model re-training.
- Model metrics (accuracy, precision, recall, F1) and business metrics (cost per user, development costs, customer feedback, ROI).

## Domain 2: Fundamentals of GenAI (24%)

**2.1 Explain the basic concepts of GenAI.**
- Concepts: tokens, chunking, embeddings, vectors, prompt engineering, transformer-based LLMs, FMs, multi-modal models, diffusion models.
- Use cases: image/video/audio generation, summarization, AI assistants, translation, code generation, customer service agents, search, recommendation engines.
- FM lifecycle: data selection, model selection, pre-training, fine-tuning, evaluation, deployment, feedback.
- Token-based pricing and its effect on inference cost and performance.
- Context engineering in FM applications.
- Agentic AI: multi-agent system patterns; Model Context Protocol (MCP) connecting agents to external systems; multi-agent communication patterns; memory management; tool usage; workflow orchestration.

**2.2 Capabilities and limitations of GenAI for business problems.**
- Advantages: adaptability, responsiveness, conversational capability, content generation.
- Disadvantages: hallucinations, interpretability, inaccuracy, nondeterminism.
- Model selection factors: model types, performance requirements, capabilities, constraints, compliance, cost, latency, model complexity.
- Business value/metrics: cross-domain performance, ROI, efficiency, conversion rate, average revenue per user, accuracy, customer lifetime value.

**2.3 AWS infrastructure and technologies for GenAI apps.**
- Services: Amazon Bedrock, Amazon SageMaker AI, SageMaker JumpStart, Amazon Quick, Kiro, Strands Agents, Amazon Bedrock AgentCore.
- Advantages of AWS GenAI services: accessibility, lower barrier to entry, efficiency, cost-effectiveness, speed to market, meeting business objectives.
- Benefits of AWS infrastructure: security, compliance, responsibility, safety.
- Cost tradeoffs: responsiveness, availability, redundancy, performance, regional coverage, token-based pricing, provisioned throughput, custom models.

## Domain 3: Applications of Foundation Models (28%)

**3.1 Design considerations for FM applications.**
- FM selection criteria: cost, modality, latency, multilingual, model size, model complexity, customization, input/output length, prompt caching.
- Inference parameters (temperature, input/output length) and their effect.
- RAG and its business applications (Amazon Bedrock Knowledge Bases).
- AWS vector stores for embeddings: Amazon OpenSearch Service, Amazon Aurora, Amazon Neptune, Amazon RDS for PostgreSQL.
- Cost tradeoffs of customization: pre-training, fine-tuning, in-context learning, RAG, model distillation.
- Role of AI agents and their business applications.

**3.2 Effective prompt engineering techniques.**
- Constructs: context, instruction, negative prompts.
- Techniques: chain-of-thought, zero-shot, single-shot, few-shot, prompt templates.
- Benefits/best practices: response quality, experimentation, guardrails, discovery, specificity and concision, using multiple comments.
- Risks: exposure, poisoning, hijacking, jailbreaking.
- Prompt versioning/management with Amazon Bedrock Prompt Management.

**3.3 Training and fine-tuning FMs.**
- Key elements: pre-training, fine-tuning, continuous pre-training, distillation.
- Fine-tuning methods: instruction tuning, domain adaptation, transfer learning, continuous pre-training.
- Preparing data: curation, governance, size, labeling, representativeness, RLHF.

**3.4 Evaluating FM performance.**
- Approaches: human-in-the-loop evaluation, benchmark datasets, Amazon Bedrock Model Evaluation.
- Metrics: ROUGE, BLEU, BERTScore, LLM-as-a-judge.
- Whether an FM meets business objectives (productivity, user engagement, task engineering).
- Evaluating apps built with FMs: RAG, agents, workflows.
- Business alignment metrics: task completion rate, user satisfaction, cost per interaction.

## Domain 4: Guidelines for Responsible AI (14%)

**4.1 Developing responsible AI systems.**
- Features: bias, fairness, inclusivity, robustness, safety, veracity.
- Tools: Amazon Bedrock Guardrails.
- Responsible model selection: environmental considerations, sustainability.
- Legal risks of GenAI: IP infringement, biased outputs, loss of customer trust, end-user risk, hallucinations.
- Dataset characteristics: inclusivity, diversity, curated sources, balanced datasets.
- Effects of bias and variance: demographic groups, inaccuracy, overfitting, underfitting.
- Detecting/monitoring bias and truthfulness: label quality analysis, human audits, subgroup analysis.

**4.2 Transparent and explainable models.**
- Transparent/explainable vs not.
- Tools: Amazon SageMaker Model Cards, Amazon Bedrock Model Evaluations, open-source models, data, licensing.
- Tradeoffs between model safety and transparency (interpretability vs performance).
- Human-centered design for explainable AI: user-feedback mechanisms, AI decision transparency.

## Domain 5: Security, Compliance, and Governance for AI Solutions (14%)

**5.1 Securing AI systems.**
- Services/features: IAM roles, policies, permissions; encryption; Amazon Macie; AWS PrivateLink; AWS shared responsibility model; Amazon Bedrock AgentCore Identity; Policy in AgentCore; Amazon Bedrock Guardrails.
- Source citation and data origins: data lineage, data cataloging, SageMaker Model Cards.
- Secure data engineering: data quality assessment, privacy-enhancing technologies, data access control, data integrity.
- Security/privacy considerations: application security, threat detection, vulnerability management, infrastructure protection, prompt injection, encryption at rest and in transit, data leakage prevention, output filtering/validation, audit trail and logging of AI interactions, toxicity.
- Hallucination detection and grounding: RAG grounding, output validation, confidence scoring.

**5.2 Governance and compliance.**
- Services: AWS Config, Amazon Inspector, AWS Artifact, AWS CloudTrail, AWS Trusted Advisor.
- Data governance: data lifecycles, logging, residency, monitoring, observation, retention.
- Governance protocols: policies, review cadence, review strategies, frameworks such as the Generative AI Security Scoping Matrix, transparency standards, team training.

## In-scope services (non-exhaustive)
Analytics: AWS Data Exchange, Amazon EMR, AWS Glue, AWS Glue DataBrew, AWS Lake Formation, Amazon OpenSearch Service, Amazon Quick, Amazon Redshift · Cost: AWS Budgets, AWS Cost Explorer · Compute: Amazon EC2, AWS Lambda · Containers: Amazon ECS, Amazon EKS · Database: Amazon Aurora, Amazon DocumentDB, Amazon DynamoDB, Amazon ElastiCache, Amazon Neptune, Amazon RDS · Developer tools: Kiro, Strands Agents · ML: Amazon Bedrock, Amazon Bedrock AgentCore, Amazon Comprehend, Amazon Lex, Amazon Nova, Amazon Personalize, Amazon Polly, Amazon Rekognition, Amazon SageMaker AI, Amazon SageMaker JumpStart, Amazon Textract, Amazon Transcribe, Amazon Translate, AWS Transform · Management: AWS CloudTrail, Amazon CloudWatch, AWS Config, AWS Trusted Advisor, AWS Well-Architected Tool · Networking: Amazon CloudFront, Amazon VPC · Security: AWS Artifact, AWS IAM, Amazon Inspector, AWS KMS, Amazon Macie, AWS Secrets Manager · Storage: Amazon S3, Amazon S3 Glacier.
