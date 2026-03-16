export enum DealsQueryKeys {
  DEALS_LIST = 'deals-list',
  DEAL_BY_ID = 'deal-by-id',
  DEAL_FILTER_VALUES = 'deal-filter-values',
}

export const DEALS_PER_PAGE = 10;

export const DEAL_CATEGORY_LABELS: Record<string, string> = {
  'hosting-infrastructure': 'Hosting & Infrastructure',
  'developer-tools': 'Developer Tools',
  'design-collaboration': 'Design & Collaboration',
  'analytics-monitoring': 'Analytics & Monitoring',
  'security-compliance': 'Security & Compliance',
};

export const DEAL_AUDIENCE_LABELS: Record<string, string> = {
  'all-founders': 'All Founders',
  'pl-funded-founders': 'PL Funded Founders',
};

export const DEAL_SORT_OPTIONS = [
  { value: 'newest', label: 'Most recent' },
  { value: 'alphabetical', label: 'Alphabetical' },
] as const;
