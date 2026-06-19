import type { FundTag, FounderStatus, ReviewChannel } from './types';

export const FOUNDER_DB_ENABLED = true;

export enum FoundersQueryKeys {
  FOUNDERS_LIST = 'founders-list',
  FOUNDER_DETAIL = 'founders-detail',
  FOUNDERS_KPI_SUMMARY = 'founders-kpi-summary',
  FOUNDERS_FILTERS = 'founders-filters',
  FOUNDERS_METHODOLOGY = 'founders-methodology',
}

export const FUND_VALUES: FundTag[] = ['PLVS', 'NEURO', 'CRYPTO'];
export const FOUNDER_STATUS_VALUES: FounderStatus[] = ['new', 'in-review', 'approved', 'rejected', 'hold'];

export const REVIEW_CHANNEL_LABEL: Record<ReviewChannel, string> = {
  'lead-decision': 'Lead decision',
  'record-quality': 'Record quality',
  platform: 'Platform',
};

export const RECORD_QUALITY_FIELDS = ['why_now', 'bio', 'org', 'score', 'email'] as const;
export const PLATFORM_FEEDBACK_AREAS = ['scoring', 'filters', 'digest'] as const;

export const FUND_LABEL: Record<FundTag, string> = {
  PLVS: 'PLVS',
  NEURO: 'Neuro',
  CRYPTO: 'Crypto',
};

export const FOUNDER_STATUS_LABEL: Record<FounderStatus, string> = {
  new: 'New',
  'in-review': 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  hold: 'Hold',
};

export const DEFAULT_SORT = 'lastSignalAt:desc';
export const DEFAULT_PAGE_SIZE = 25;

export const FOUNDER_COLUMNS = [
  { key: 'name', label: 'Founder', sortable: false },
  { key: 'fundTags', label: 'Fund', sortable: false },
  { key: 'sources', label: 'Sources', sortable: false },
  { key: 'plnProximity', label: 'PLN Proximity', sortable: false },
  { key: 'reviewState', label: 'Status', sortable: false },
];

export const DEFAULT_VISIBLE_COLUMNS = ['name', 'fundTags', 'sources', 'plnProximity', 'reviewState'];

export const FOUNDER_DB_COLUMNS_STORAGE_KEY = 'founder_db.columns.v1';
