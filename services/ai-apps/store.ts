import { createFilterStore } from '@/services/filters';

import { AI_APPS_TRACKED_PARAMS } from './constants';

export const useAiAppsFilterStore = createFilterStore({
  namespace: 'ai-apps',
  trackedParams: AI_APPS_TRACKED_PARAMS,
});
