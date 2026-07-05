# Non-Functional Requirements (NFR) & Verification Matrix

This document outlines the operational constraints, capacity parameters, service level agreements (SLAs), and verification matrix for PitchAutopsy.

---

## 1. Performance & Latency Targets
- **Step Processing Latency**: Each analysis step (Devil's Advocate, Market Validator, Improvement Agent) must average under **3.5 seconds** when running on the target LLM provider (NVIDIA NIM/meta/llama-3.1-70b-instruct or Google Gemini-2.5-flash).
- **Safety Interception Latency**: Enkrypt AI safety check processing (including API call and semantic grading) must execute in under **1.2 seconds**.
- **Page Load Time**: Next.js client pages must achieve a Lighthouse Performance score of **>= 90**.

---

## 2. Capacity & Scalability Constraints
- **Global Concurrency**: The background task runner supports a maximum of **10 concurrent workflow runs** simultaneously.
- **Per-Agent Concurrency**: Each agent instance (e.g. devilsAdvocateAgent) is throttled to a maximum of **5 concurrent executions** to avoid provider rate limiting.
- **Backpressure Handling**: Dispatched tasks exceeding concurrency limits must queue gracefully in the LibSQL database queue rather than failing.

---

## 3. Safety, Security & Compliance
- **Toxicity and Abusive Input Guard**: 100% of LLM outputs from analysis sub-agents must undergo Enkrypt AI safety screening. Output containing abusive, toxic, or offensive text is blocked and triggers auto-regeneration.
- **Data Protection**: All documents uploaded to the server must reside in a temporary sandbox directory and be purged after workflow completion.
- **Transport Security**: All API traffic must enforce **TLS 1.3** protocol encryption in production.
- **Data Redaction**: Telemetry logs must redact sensitive patterns (passwords, auth tokens, keys) utilizing the Mastra `SensitiveDataFilter` output processor.

---

## 4. Availability & SLA
- **System Uptime**: The system targets **99.9% availability** for API endpoints.
- **Fault Recovery**: In-progress workflow runs must persist run-state to `mastra.db` (SQLite/LibSQL) to allow resuming from the last successful step in case of process interruption.

---

## 5. Verification Matrix

| Requirement | Category | Target Metric | Verification Method |
|---|---|---|---|
| Step Latency | Performance | < 3.5s per step | OpenTelemetry tracing metrics |
| Concurrency Limit | Scalability | 10 global max runs | Automated load test with concurrent curl scripts |
| Output Safety | Safety | 100% evaluated | Verify Enkrypt safety check log triggers on analysis runs |
| Recovery | Reliability | Resumable state | Verify DB records workflow status during step execution |
| Telemetry | DX | Distributed traces | Check OpenTelemetry console spans on frontend and backend |
