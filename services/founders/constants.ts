import type { FundTag, FounderStatus, ReviewFeedback } from './types';

export enum FoundersQueryKeys {
  FOUNDERS_LIST = 'founders-list',
  FOUNDER_DETAIL = 'founders-detail',
  FOUNDERS_KPI_SUMMARY = 'founders-kpi-summary',
}

export const FUND_VALUES: FundTag[] = ['PLVS', 'NEURO', 'CRYPTO'];
export const FOUNDER_STATUS_VALUES: FounderStatus[] = ['new', 'in-review', 'approved', 'rejected', 'hold', 'wrong-fund'];
export const REVIEW_FEEDBACK_VALUES: ReviewFeedback[] = ['good', 'bad', 'wrong-fund', 'needs-context'];

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
  'wrong-fund': 'Wrong Fund',
};

export const REVIEW_FEEDBACK_LABEL: Record<ReviewFeedback, string> = {
  good: 'Good fit',
  bad: 'Not a fit',
  'wrong-fund': 'Wrong fund',
  'needs-context': 'Needs context',
};

export const DEFAULT_SORT = 'alignmentMax:desc';
export const DEFAULT_PAGE_SIZE = 25;

export const FOUNDER_COLUMNS = [
  { key: 'name', label: 'Founder', sortable: false },
  { key: 'fundTags', label: 'Fund', sortable: false },
  { key: 'alignmentMax', label: 'Alignment', sortable: true },
  { key: 'plvsScore', label: 'PLVS Score', sortable: true },
  { key: 'sources', label: 'Sources', sortable: false },
  { key: 'reviewState', label: 'Status', sortable: false },
];

export const DEFAULT_VISIBLE_COLUMNS = ['name', 'fundTags', 'alignmentMax', 'plvsScore', 'sources', 'reviewState'];

export const FOUNDER_DB_COLUMNS_STORAGE_KEY = 'founder_db.columns.v1';
