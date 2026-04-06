export enum DealsQueryKeys {
  DEALS_LIST = 'deals-list',
  DEAL_BY_ID = 'deal-by-id',
  DEALS_ACCESS = 'deals-access',
  DEAL_REDEEM = 'deal-redeem',
  DEAL_SUBMISSION = 'deal-submission',
}

export const DEALS_PER_PAGE = 10;

/** URL/query param value for the "High Value" category filter (not a real API category). */
export const DEAL_HIGH_VALUE_FILTER_VALUE = '__HIGH_VALUE__';

export const DEAL_CATEGORY_LABELS: Record<string, string> = {};

export const DEAL_AUDIENCE_LABELS: Record<string, string> = {
  DEVELOPERS: 'Developers',
  FOUNDERS: 'Founders',
  ALL_FOUNDERS: 'All Founders',
  PL_FUNDED_FOUNDERS: 'PL Funded Founders',
  FOUNDERS_FORGE: 'Founders Forge',
};

export const REQUIRED_AUDIENCES = ['All Founders', 'PL Funded Founders', 'Founders Forge'] as const;

export { DEAL_SORT_OPTIONS } from './dealSortOptions';
export type { DealSortOption } from './dealSortOptions';
