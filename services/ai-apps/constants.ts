export enum AiAppsQueryKeys {
  AI_APPS_LIST = 'ai-apps-list',
  AI_APP_DETAIL = 'ai-app-detail',
  AI_APP_PRD_CONTENT = 'ai-app-prd-content',
  AI_APP_PRD_SIZE = 'ai-app-prd-size',
  // Key shape is [AI_APP_LOGS, uid, stream]; if a time-window selector ever
  // ships, sinceMinutes must join the key or windows cross-contaminate the cache.
  AI_APP_LOGS = 'ai-app-logs',
}

/** Keep in sync with `AI_APPS_STARTER_KIT_VERSION` in pln-directory-portal web-api. */
export const AI_APPS_STARTER_KIT_VERSION = '1.4';
