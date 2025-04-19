import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { myWorkflow } from './workflow';
import { customApiRoutes } from './api-routes';

// import { weatherAgent, coachingAgent, pmAgent } from './agents';
import { pmAgent } from './agents';

export const mastra = new Mastra({
  server: {
    apiRoutes: customApiRoutes,
  },  
  // agents: { weatherAgent, coachingAgent, pmAgent },
  agents: { pmAgent },
  workflows: { myWorkflow },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
