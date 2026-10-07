import type { SortOption } from '@/components/common/filters/SortDropdown';

import {
  AI_APP_FEEDBACK_PRIORITY_LABELS,
  AI_APP_FEEDBACK_REPORT_KINDS,
  AI_APP_FEEDBACK_STATUSES,
  AI_APP_FEEDBACK_STATUS_LABELS,
} from '@/services/ai-app-feedback/constants';

export const ALL_FEEDBACK_STATUSES = 'ALL';

export const ALL_FEEDBACK_REPORT_KINDS = 'ALL';

export const ALL_FEEDBACK_PRIORITIES = 'ALL';

export const ALL_TAB = 'All apps';

/** The App filter's "every app" value (its label depends on the tab: "All my apps" or "All apps"). */
export const ALL_APPS = 'ALL';

export const FEEDBACK_STATUS_FILTER_OPTIONS: SortOption[] = [
  { value: ALL_FEEDBACK_STATUSES, label: 'All' },
  ...AI_APP_FEEDBACK_STATUSES.map((status) => ({ value: status, label: AI_APP_FEEDBACK_STATUS_LABELS[status] })),
];

export const FEEDBACK_REPORT_KIND_FILTER_OPTIONS: SortOption[] = [
  { value: ALL_FEEDBACK_REPORT_KINDS, label: 'All' },
  ...AI_APP_FEEDBACK_REPORT_KINDS.map((kind) => ({ value: kind, label: kind })),
];

export const FEEDBACK_PRIORITY_FILTER_OPTIONS: SortOption[] = [
  { value: ALL_FEEDBACK_PRIORITIES, label: 'All' },
  ...Object.entries(AI_APP_FEEDBACK_PRIORITY_LABELS).map(([value, label]) => ({ value, label, selectedLabel: value })),
];
