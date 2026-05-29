import type { GantryItem } from './types';

export enum GantryQueryKeys {
  ITEMS = 'gantry-items',
  ITEM = 'gantry-item',
  FOCUS_AREAS = 'gantry-focus-areas',
}

export const GANTRY_STAGE_VALUES = ['IDEA', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'] as const;

export const GANTRY_STAGE_LABELS: Record<(typeof GANTRY_STAGE_VALUES)[number], string> = {
  IDEA: 'Need',
  UNDER_REVIEW: 'Under Review',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  SHIPPED: 'Shipped',
  DECLINED: 'Declined',
};

export const GANTRY_KANBAN_STAGES = ['PLANNED', 'IN_PROGRESS', 'SHIPPED'] as const;

/** All stages available as roadmap board columns (lifecycle order). */
export const GANTRY_ROADMAP_COLUMN_STAGES = [
  'IDEA',
  'UNDER_REVIEW',
  'PLANNED',
  'IN_PROGRESS',
  'SHIPPED',
  'DECLINED',
] as const;

/** Gantry board defaults to every stage column except DECLINED. */
export const DEFAULT_ROADMAP_VISIBLE_COLUMNS = GANTRY_ROADMAP_COLUMN_STAGES.filter((stage) => stage !== 'DECLINED');

export function sortRoadmapColumnStages(
  columns: readonly (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number][],
): (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number][] {
  const selected = new Set(columns);
  return GANTRY_ROADMAP_COLUMN_STAGES.filter((stage) => selected.has(stage));
}

/** Most upvotes first; ties broken by most recently updated. */
export function sortGantryItems(items: GantryItem[]): GantryItem[] {
  return [...items].sort((a, b) => {
    const countDiff = b.upvoteCount - a.upvoteCount;
    if (countDiff !== 0) return countDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
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
