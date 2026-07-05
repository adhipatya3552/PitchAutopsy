# Product Requirements Document (PRD): PitchAutopsy

## 1. Executive Summary
PitchAutopsy is an autonomous, multi-agent AI system designed to provide founders with "brutal," data-driven stress testing of their startup pitches. By leveraging a sequential pipeline of specialized AI agents, the system simulates investor scrutiny, validates market claims against historical failure data, and provides actionable improvement recommendations. The platform prioritizes high-quality, safe, and constructive output through a mandatory evaluation gate.

## 2. Problem Statement
Founders often operate in an echo chamber, receiving feedback that is either too polite or lacks objective data. Traditional pitch coaching is expensive and subjective. There is a need for an automated, rigorous system that can identify "fatal flaws" in a business model or pitch deck before a founder meets with actual investors.

## 3. Goals & Objectives
*   **Rigorous Validation:** Subject every pitch to 10–15 brutal investor-style questions.
*   **Data-Backed Analysis:** Cross-reference market claims against a corpus of 1,000+ startup post-mortems.
*   **Actionable Output:** Provide specific rewrites and data point suggestions for weak sections.
*   **Safety & Quality:** Ensure 100% of agent outputs pass a multi-stage safety and quality check.
*   **Progress Tracking:** Enable founders to track pitch evolution over time through longitudinal history.

## 4. Target Users / Stakeholders
*   **Early-stage Founders:** Preparing for seed or Series A rounds.
*   **Incubators/Accelerators:** Using the tool to vet or coach cohort members.
*   **Angel Investors:** Using the tool as a first-pass "pre-due diligence" filter.

## 5. Functional Requirements
### 5.1 Pitch Submission & Processing
*   The system must support PDF and text-based pitch submissions.
*   The **OrchestratorAgent** must parse inputs using `pdf-parse`.
*   Users must receive real-time updates via Server-Sent Events (SSE) as agents progress through the pipeline.

### 5.2 Multi-Agent Analysis Pipeline
The system follows a vertical sequential flow:
1.  **OrchestratorAgent:** Entry point; manages dispatching and final report compilation.
2.  **DevilsAdvocateAgent:** Generates 10–15 critical investor questions based on the `investor_questions` vector collection.
3.  **MarketValidatorAgent:** Validates claims against the `startup_failures` collection (Cosine similarity threshold: 0.78).
4.  **ImprovementAgent:** Rewrites weak sections using the `pitch_benchmarks` collection.

### 5.3 Mandatory Safety Gate (Enkrypt AI)
*   **Mandatory Interception:** All outputs from sub-agents (2, 3, 4) must be evaluated by Enkrypt AI before returning to the Orchestrator.
*   **Evaluation Criteria:** Criticism Depth, Factual Accuracy, Constructiveness, Toxicity Guard, and Score Calibration.
*   **Retry Logic:** If an evaluation fails, the system must trigger a regeneration request to the specific agent (Max 2 retries).

### 5.4 Reporting & History
*   Final reports must be stored in Supabase.
*   The system must support longitudinal tracking, pulling `user_history` from Qdrant to provide context on how the pitch has improved over time.

## 6. Non-Functional Requirements
*   **Performance:** Use Vercel Edge Functions to minimize latency for API routing and SSE.
*   **Scalability:** Managed agent runtime via Mastra Cloud to handle concurrent agentic workflows.
*   **Reliability:** Maximum of 2 retries for agent outputs to prevent infinite loops while maintaining quality.
*   **UI/UX:** Dark-themed interface with professional, high-density data visualization.

## 7. System Architecture Overview
The system is organized into five distinct layers:
1.  **Client Layer:** Next.js 14 Web App.
2.  **Edge & Auth Layer:** Vercel API Gateway and Clerk Auth.
3.  **Mastra Cloud:** Managed runtime for the 4-agent sequential pipeline.
4.  **Data Persistence Layer:** Qdrant (Vector) and Supabase (Relational).
5.  **External AI & Safety:** Enkrypt AI for evaluation and OpenRouter for unified LLM access.

## 8. Tech Stack
*   **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Lucide React.
*   **Backend/Edge:** Next.js API Routes, Vercel Edge Functions.
*   **Authentication:** Clerk (OAuth 2.0).
*   **Agent Framework:** Mastra (TypeScript).
*   **Vector Database:** Qdrant Cloud (Cosine Similarity).
*   **Relational Database:** Supabase (PostgreSQL).
*   **Safety/Eval:** Enkrypt AI.
*   **LLMs:** Claude 3.5 Sonnet, GPT-4o (via OpenRouter).

## 9. Data Requirements
### 9.1 Vector Collections (Qdrant)
*   `startup_failures`: 1,000+ post-mortems for market validation.
*   `investor_questions`: 500+ Q&A patterns for stress testing.
*   `pitch_benchmarks`: 200 funded pitch structures for improvement suggestions.
*   `user_history`: Per-user pitch history for longitudinal tracking.

### 9.2 Relational Schema (Supabase)
*   Job Queue: Tracking active agentic workflows.
*   User Reports: Final compiled "Autopsy" reports.
*   Score History: Numerical tracking of pitch quality over time.

## 10. API Specifications
*   `POST /api/pitch/submit`: Accepts pitch content/file; initiates Mastra pipeline.
*   `GET /api/pitch/status/[id]`: Returns current agent status via SSE.
*   `GET /api/report/[id]`: Retrieves the final compiled report from Supabase.

## 11. Security Requirements
*   **Identity Management:** Mandatory authentication via Clerk before accessing the API Gateway.
*   **Data Protection:** Encryption of pitch documents at rest.
*   **Safety Guardrails:** Enkrypt AI Toxicity Guard to ensure "brutal" feedback remains professional and non-abusive.

## 12. Deployment & Infrastructure
*   **Hosting:** Vercel for the frontend and API gateway.
*   **Agent Runtime:** Mastra Cloud for managing long-running agent states.
*   **CI/CD:** Automated deployments via Vercel/GitHub integration.

## 13. Success Metrics
*   **Accuracy:** Percentage of market claims correctly flagged against the failure corpus.
*   **Quality:** Pass rate of agent outputs through Enkrypt AI on the first attempt.
*   **User Growth:** Number of "improved" versions submitted per user (longitudinal engagement).
*   **Latency:** Time from submission to final report compilation.

## 14. Timeline & Milestones
*   **Phase 1:** Frontend scaffolding and Clerk Auth integration.
*   **Phase 2:** Mastra Cloud setup and OrchestratorAgent development (PDF parsing).
*   **Phase 3:** Sub-agent development and Qdrant collection ingestion.
*   **Phase 4:** Integration of Enkrypt AI safety gate and retry logic.
*   **Phase 5:** SSE implementation for real-time reporting and Beta launch.

## 15. Open Questions & Risks
*   **LLM Costs:** High volume of calls to Claude 3.5 Sonnet and GPT-4o via OpenRouter may require usage limits.
*   **PDF Complexity:** Highly visual decks may require advanced OCR if `pdf-parse` is insufficient for complex layouts.
*   **Eval Latency:** The mandatory Enkrypt AI gate adds a sequential step that may increase total processing time.