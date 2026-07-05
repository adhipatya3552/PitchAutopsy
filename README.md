# PitchAutopsy — Autonomous Multi-Agent AI Pitch Stress-Testing System

<div align="center">

![PitchAutopsy Logo](https://img.shields.io/badge/PitchAutopsy-AI%20Pitch%20Stress--testing-cyan?style=for-the-badge&logo=microscope&logoColor=white)
![Mastra](https://img.shields.io/badge/Mastra-AI%20Agents-blue?style=for-the-badge)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-red?style=for-the-badge)
![Enkrypt AI](https://img.shields.io/badge/Enkrypt%20AI-Safety%20Gate-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

**An autonomous multi-agent AI system built with Mastra and Qdrant to stress-test startup pitch decks against 1,000+ historical post-mortems under Enkrypt AI safety guardrails.**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Model Provider Configurations](#-model-provider-configurations)
- [Enkrypt AI Safety Gate](#-enkrypt-ai-safety-gate)
- [Non-Functional Requirements (NFR)](#-non-functional-requirements-nfr)
- [Verification & Tests](#-verification--tests)
- [Roadmap](#-roadmap)

---

## 🔬 Overview

**PitchAutopsy** is a production-ready AI platform designed to stress-test startup pitch decks with zero mercy. By orchestrating a sequential pipeline of specialized AI agents, the platform acts as a virtual investment committee:
1. Identifying critical assumptions and flaws.
2. Cross-referencing claims against real startup failure histories.
3. Suggesting concrete slide rewrites to pre-empt investor skepticism.
4. Protecting output quality and safety through a mandatory Enkrypt AI evaluation gate.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💀 **Devil's Advocate Agent** | Plays the role of a skeptical VC; generates 10-15 brutal, targeted questions on core business assumptions. |
| 📊 **Market Validator Agent** | Scans Qdrant's vector collection of 1,000+ startup post-mortems, flagging matching failure modes (Cosine similarity >= 0.78). |
| ⚡ **Improvement Agent** | Searches 200+ successful pitch structure templates in Qdrant to provide slide-by-slide improvements. |
| 🔐 **Enkrypt AI Safety Gate** | Intercepts sub-agent outputs via Enkrypt's Toxicity Guard and a semantic grading agent (Criticism, Accuracy, Constructiveness, Score Calibration) with a 2x retry loop. |
| 🔄 **SSE Status Pipeline** | Next.js Server-Sent Events stream live status chunks as agents execute. |
| 📊 **Run History Dashboard** | Persistent LibSQL/SQLite run tracking with modal popups for historical autopsy records. |
| 📈 **Distributed Tracing** | OpenTelemetry spans configured on both Next.js frontend and Mastra backend. |
| 🎨 **Premium UI/UX** | World-class dark theme inspired by Linear and Vercel with smooth framer-motion microinteractions. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 15 CLIENT VIEW                       │
│                                                                      │
│  ┌───────────┐  ┌──────────────────────────────────────────────────┐│
│  │ /         │──▶│ UploadZone.tsx - Drag-and-drop PDF submission     ││
│  └───────────┘  └──────────────────────────────────────────────────┘│
│  ┌───────────┐  ┌──────────────────────────────────────────────────┐│
│  │ /analyze  │──▶│ Real-time SSE status tracker and agent cards     ││
│  └───────────┘  └──────────────────────────────────────────────────┘│
│  ┌───────────┐  ┌──────────────────────────────────────────────────┐│
│  │ /history  │──▶│ SQLite dashboard with detailed run logs          ││
│  └───────────┘  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────┐           ┌──────────────────────┐
│  Enkrypt AI API  │◀──Checks─▶│  Next.js API Gateway │
│                  │           │                      │
│  Toxicity Guard  │           │  /api/analyze        │
│  Safety Analysis │           │  /api/history        │
│                  │           │  /api/report         │
└──────────────────┘           └──────────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │  Mastra Dev Server   │
                               │  (Port 4111)         │
                               │                      │
                               │  - 4-Agent Pipeline  │
                               │  - Background Tasks  │
                               └──────────────────────┘
                                     │          │
                                     ▼          ▼
                             Qdrant Vector    SQLite DB
                             (Failure RAG)    (Workflow Run)
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion.
- **Agent Framework**: Mastra AI SDK (TypeScript).
- **Inference**: NVIDIA NIM (Llama 3.1 70B Instruct), Google Gemini 2.5 Flash.
- **Vector Store**: Qdrant Cloud.
- **Relational Storage**: LibSQL / SQLite (Mastra workflow run logs).
- **Safety**: Enkrypt AI Guardrails.
- **Telemetry**: OpenTelemetry (NodeSDK).

---

## 📁 Project Structure

```
PitchAutopsy/
├── backend/
│   ├── src/
│   │   ├── mastra/
│   │   │   ├── agents/            # Specialized agents (DevilsAdvocate, MarketValidator, etc.)
│   │   │   ├── public/enkrypt.ts  # Enkrypt AI detect wrapper + semantic evaluator
│   │   │   ├── tools/             # PDF parser, Qdrant query, and benchmark tools
│   │   │   ├── workflows/         # Sequential workflow definition
│   │   │   └── index.ts           # Mastra main configurations (storage, background tasks)
│   │   ├── setup-qdrant.ts        # Index creation in Qdrant Cloud
│   │   └── populate-qdrant.ts     # Ingestion & embedding script (Gemini Embeddings)
│   ├── .env                       # Backend secrets
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── analyze/[runId]/       # SSE progress tracking
│   │   ├── api/                   # Local Next.js API routes (SSE proxy, report details)
│   │   ├── history/               # Persistent runs dashboard
│   │   ├── report/[runId]/        # Autopsy detailed report view
│   │   ├── instrumentation.ts     # OpenTelemetry SDK bootstrap
│   │   ├── globals.css            # Custom CSS animations & typography
│   │   └── page.tsx               # Redesigned premium SaaS homepage
│   ├── components/                # Reusable React components (UploadZone, AgentCard)
│   └── package.json
└── NFR.md                         # Non-Functional Requirements & Traceability Matrix
```

---

## 🚀 Getting Started

### 1. Configure the Environment
Create or edit your `.env` file in the `backend/` directory:
```env
# Mastra Observability
MASTRA_PLATFORM_ACCESS_TOKEN=your-mastra-token
MASTRA_PROJECT_ID=your-mastra-project-id

# Qdrant Cloud Cluster Credentials
QDRANT_URL=https://your-cluster-url.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

# Enkrypt AI Guardrails
ENKRYPT_AI_API_KEY=your-enkrypt-api-key

# LLM Providers (Configure at least one)
GOOGLE_API_KEY=your-google-gemini-key
NVIDIA_API_KEY=your-nvidia-nim-key
```

### 2. Install Dependencies & Initialize Qdrant
In the `backend/` directory:
```shell
cd backend
npm install
npx tsx --env-file=.env src/setup-qdrant.ts
```

### 3. Run Ingestion (Optional)
If you need to populate data:
```shell
npx tsx --env-file=.env src/populate-qdrant.ts
```

### 4. Run Backend Server
```shell
npm run dev
```
This launches the Mastra backend on `http://localhost:4111`.

### 5. Launch Frontend Web App
In a new terminal, in the `frontend/` directory:
```shell
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application!

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes (Fallback) | Google Gemini API key (defaults to gemini-2.5-flash for inference). |
| `NVIDIA_API_KEY` | Optional | NVIDIA NIM API Key (runs Llama 3.1 70B model if provided). |
| `QDRANT_URL` | Yes | Target Qdrant Cloud database cluster URL. |
| `QDRANT_API_KEY` | Yes | Client API key for collection indexing. |
| `ENKRYPT_AI_API_KEY` | Yes | API key for calling the Enkrypt AI detect service. |
| `MASTRA_PLATFORM_ACCESS_TOKEN` | Yes | Mastra Cloud platform token for logging traces. |

---

## 🤖 Model Provider Configurations

PitchAutopsy is designed to support multiple model providers. You can choose the configuration that best fits your developer setup or budget.

### Option A: Google Gemini (Default - Free Tier)
We use `google/gemini-2.5-flash` out of the box because it has a highly generous free tier and fast response times.

* **Configuration:** Add `GOOGLE_API_KEY` to your `.env` file.
* **Agent Setup:** The default model string is `google/gemini-2.5-flash` in the agent configuration.

### Option B: NVIDIA NIM APIs (Alternative - Free Credits)
NVIDIA provides a fully OpenAI-compatible endpoint hosting leading open-source models (like Llama 3.1 70B, Mistral, and Nemotron) on DGX systems, offering free initial credits.

#### Setup Guide:
1. Get your API key from [NVIDIA Build](https://build.nvidia.com/settings/api-keys).
2. Install the compatibility package:
   ```shell
   npm install @ai-sdk/openai-compatible
   ```
3. Add `NVIDIA_API_KEY` to your `.env` file.
4. Update the model provider initialization in your agent file (e.g., `src/mastra/agents/devils-advocate-agent.ts`):
   ```typescript
   import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
   
   // Initialize NVIDIA custom provider
   const nvidia = createOpenAICompatible({
     name: 'nvidia',
     apiKey: process.env.NVIDIA_API_KEY,
     baseURL: 'https://integrate.api.nvidia.com/v1',
   });
   
   // Use it in your agent config
   export const devilsAdvocateAgent = new Agent({
     // ...
     model: nvidia('meta/llama-3.1-70b-instruct'), // Or 'nvidia/llama-3.1-nemotron-70b-instruct'
     // ...
   });
   ```

---

## 🛡️ Enkrypt AI Safety Gate

Under the `pitch-analysis-workflow`, outputs generated by the sub-agents are intercepted by a safety gate:
1. **Toxicity Detection**: Invokes `https://api.enkryptai.com/guardrails/detect` using the `toxicity` detector.
2. **Quality Evaluation**: Scores generated text across four dimensions: *Criticism Depth*, *Factual Accuracy*, *Constructiveness*, and *Score Calibration*.
3. **Corrective Retry**: If the response is toxic or scores drop below 5/10, the step automatically triggers a retry (up to **2 retries** / 3 attempts total) incorporating the safety gate feedback directly back into the LLM instructions.

---

## 📊 Non-Functional Requirements (NFR)

Operational details regarding SLA execution speed, scalability, safety compliance thresholds, data protection standards, and database recovery can be viewed in the project's [NFR.md](file:///d:/Builds/new/PitchAutopsy/NFR.md) document.

---

## 🧪 Verification & Tests

From the `backend/` directory:
* **Test PDF Ingestion (OrchestratorAgent Tool):**
  ```shell
  npx tsx --env-file=.env src/test-parser.ts sample.pdf
  ```
* **Test Question Generation (DevilsAdvocateAgent):**
  ```shell
  npx tsx --env-file=.env src/test-devils-advocate.ts
  ```
* **Test Database Claim Matching (MarketValidatorAgent):**
  ```shell
  npx tsx --env-file=.env src/test-market-validator.ts
  ```

---

## 🗺️ Roadmap

- [x] Multi-agent sequential pipeline execution (Orchestrator, Devil's Advocate, Market Validator, Improvement).
- [x] Custom PDF parsing tool integration.
- [x] SSE Real-time pipeline status push.
- [x] Enkrypt AI Toxicity detect API guardrails.
- [x] Semantic safety grading with a 2x retry loop.
- [x] SQLite longitudinal runs dashboard (/history).
- [x] OpenTelemetry distributed tracing implementation.
- [x] 12-Factor App configuration alignment.
- [ ] Longitudinal user vector memory comparison in Qdrant.
- [ ] Exportable Vector PDF and slide decks.