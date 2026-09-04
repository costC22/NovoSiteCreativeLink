import { getStore } from '@netlify/blobs';
import { createBriefingHandler } from './_shared/briefing-core.mjs';

export default createBriefingHandler(getStore);

export const config = {
  path: '/api/briefing',
  rateLimit: {
    windowLimit: 6,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};
