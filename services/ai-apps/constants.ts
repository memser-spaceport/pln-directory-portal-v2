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
export const AI_APPS_STARTER_KIT_VERSION = '1.10';

export const PL_INFRA_OS_APP_UID = 'cmst544z7008siz4g1d59fubr';
export const PL_INFRA_OS_PATH = '/pl-infra-os';

export const AI_APPS_SEARCH_PARAM = 'search';
export const AI_APPS_CREATED_BY_PARAM = 'createdBy';
export const AI_APPS_SORT_PARAM = 'sort';

/** Params that narrow the list. `sort` is absent: re-ordering must not raise the applied count or hide the create tile. */
export const AI_APPS_FILTER_PARAMS = [AI_APPS_SEARCH_PARAM, AI_APPS_CREATED_BY_PARAM] as const;

/** Everything the filter store owns in the URL. */
export const AI_APPS_TRACKED_PARAMS = [...AI_APPS_FILTER_PARAMS, AI_APPS_SORT_PARAM] as const;

export const AI_APPS_SORT = {
  UPDATED: 'updated',
  CREATED: 'created',
  NAME: 'name',
  VIEWS: 'views',
} as const;

export type AiAppsSortValue = (typeof AI_APPS_SORT)[keyof typeof AI_APPS_SORT];

export const AI_APPS_DEFAULT_SORT: AiAppsSortValue = AI_APPS_SORT.UPDATED;

export const AI_APPS_SORT_OPTIONS = [
  { value: AI_APPS_SORT.UPDATED, label: 'Recently updated' },
  { value: AI_APPS_SORT.CREATED, label: 'Recently added' },
  { value: AI_APPS_SORT.NAME, label: 'A-Z (Ascending)' },
  { value: AI_APPS_SORT.VIEWS, label: 'Most viewed' },
] as const;
