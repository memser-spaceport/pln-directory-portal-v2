import type { Option } from '@/components/form/FormSelect/types';
import type { GantryItem } from './types';

export enum GantryQueryKeys {
  ITEMS = 'gantry-items',
  ITEM = 'gantry-item',
  FOCUS_AREAS = 'gantry-focus-areas',
  OBJECTIVES = 'gantry-objectives',
  PIN_STATUS = 'gantry-pin-status',
  ITEM_PINS = 'gantry-item-pins',
}

export const GANTRY_STAGE_VALUES = ['IDEA', 'BACKLOG', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'] as const;

export const GANTRY_PRE_ROADMAP_STAGES = ['IDEA', 'BACKLOG'] as const;

export const GANTRY_STAGE_LABELS: Record<(typeof GANTRY_STAGE_VALUES)[number], string> = {
  IDEA: 'Submitted',
  BACKLOG: 'Backlog',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  SHIPPED: 'Shipped',
  DECLINED: 'Declined',
};

export const GANTRY_KANBAN_STAGES = ['PLANNED', 'IN_PROGRESS', 'SHIPPED'] as const;

/** All stages available as roadmap board columns (lifecycle order). */
export const GANTRY_ROADMAP_COLUMN_STAGES = [
  'IDEA',
  'BACKLOG',
  'PLANNED',
  'IN_PROGRESS',
  'SHIPPED',
  'DECLINED',
] as const;

/** Gantry board defaults to every stage column except DECLINED. */
export const DEFAULT_ROADMAP_VISIBLE_COLUMNS = GANTRY_ROADMAP_COLUMN_STAGES.filter(
  (stage) => stage !== 'DECLINED' && stage !== 'BACKLOG',
);

export const GANTRY_VISIBLE_COLUMNS_STORAGE_KEY = 'gantry.board.visibleColumns';

export function sortRoadmapColumnStages(
  columns: readonly (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number][],
): (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number][] {
  const selected = new Set(columns);
  return GANTRY_ROADMAP_COLUMN_STAGES.filter((stage) => selected.has(stage));
}

export function isPreRoadmapStage(stage: (typeof GANTRY_STAGE_VALUES)[number]): boolean {
  return (GANTRY_PRE_ROADMAP_STAGES as readonly string[]).includes(stage);
}

/** Admin-curated order ASC; items with null order sort to the end. */
export function sortGantryItemsByDefault(items: GantryItem[]): GantryItem[] {
  return [...items].sort((a, b) => {
    if (a.order == null && b.order == null) return 0;
    if (a.order == null) return 1;
    if (b.order == null) return -1;
    return a.order - b.order;
  });
}

/**
 * Stage transitions are unrestricted for members with the transition permission —
 * an item can move from any stage to any other stage. The selector simply offers
 * every stage except the current one.
 */
export function getAllowedStageTransitions(stage: (typeof GANTRY_STAGE_VALUES)[number]) {
  return GANTRY_STAGE_VALUES.filter((value) => value !== stage);
}

export const GANTRY_CREATE_STAGE_OPTIONS = GANTRY_STAGE_VALUES.map((value) => ({
  label: GANTRY_STAGE_LABELS[value],
  value,
}));

const GANTRY_TAG_LABELS = [
  'Directory',
  'Events',
  'Home Page',
  'News Feed',
  'Forum',
  'Demo Day',
  'Search',
  'Back Office',
  'Notifications',
  'Profile',
  'Office Hours',
  'Job Board',
  'Deals',
  'Investor DB',
  'Founder DB',
  'Warm Intros',
  'Pitch Page',
  'Gantry',
] as const;

export const GANTRY_TAG_OPTIONS: Option[] = GANTRY_TAG_LABELS.map((label) => ({ label, value: label }));

export function tagsToOptions(tags: string[] | null | undefined): Option[] {
  return GANTRY_TAG_OPTIONS.filter((o) => tags?.includes(o.value) ?? false);
}

export const GANTRY_ITEM_TYPE_OPTIONS: Option[] = [
  { label: 'Bug Report', value: 'Bug Report' },
  { label: 'Enhancement Request', value: 'Enhancement Request' },
  { label: 'New Feature Request', value: 'New Feature Request' },
];
