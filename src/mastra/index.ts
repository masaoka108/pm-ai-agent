
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';

import { weatherAgent, coachingAgent } from './agents';

export const mastra = new Mastra({
  agents: { weatherAgent, coachingAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
