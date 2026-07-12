
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, MastraStorageExporter, MastraPlatformExporter, SensitiveDataFilter } from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather-workflow';
import { pitchAnalysisWorkflow } from './workflows/pitch-analysis-workflow';
import { weatherAgent } from './agents/weather-agent';
import { orchestratorAgent } from './agents/orchestrator-agent';
import { devilsAdvocateAgent } from './agents/devils-advocate-agent';
import { marketValidatorAgent } from './agents/market-validator-agent';
import { improvementAgent } from './agents/improvement-agent';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';

export const mastra = new Mastra({
  workflows: { weatherWorkflow, pitchAnalysisWorkflow },
  agents: { weatherAgent, orchestratorAgent, devilsAdvocateAgent, marketValidatorAgent, improvementAgent },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  backgroundTasks: {
    enabled: true,
  },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: "file:./mastra.db",
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new MastraStorageExporter(), // Persists observability events to Mastra Storage
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
