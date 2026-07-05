# PitchAutopsy

PitchAutopsy is an autonomous, multi-agent AI system built with Mastra designed to provide founders with "brutal," data-driven stress testing of their startup pitches.

---

## Project Structure
- `/backend`: The Mastra-powered agentic workflow and vector ingestion codebase.
- `/frontend`: The Next.js 14 web application for uploading decks and viewing reports.

---

## Getting Started

### 1. Configure the Environment
Create or edit your `.env` file in the `backend/` directory:
```env
# Mastra Observability
MASTRA_PLATFORM_ACCESS_TOKEN=your-mastra-token
MASTRA_PROJECT_ID=your-mastra-project-id

# Qdrant Cloud Cluster Credentials
QDRANT_URL=https://your-cluster-url.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

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

### 6. Run Backend Verification Tests
From the `backend/` directory:
* **Test PDF Parsing (OrchestratorAgent Tool):**
  ```shell
  npx tsx --env-file=.env src/test-parser.ts sample.pdf
  ```
* **Test Question Generation (DevilsAdvocateAgent):**
  ```shell
  npx tsx --env-file=.env src/test-devils-advocate.ts
  ```

---

## Model Provider Configurations

PitchAutopsy is designed to support multiple model providers. You can choose the configuration that best fits your developer setup or budget.

### Option A: Google Gemini (Default - Free Tier)
We use `google/gemini-2.5-flash` out of the box because it has a highly generous free tier and fast response times.

* **Configuration:** Add `GOOGLE_API_KEY` to your `.env` file.
* **Agent Setup:** The default model string is `google/gemini-2.5-flash` in the agent configuration.

---

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