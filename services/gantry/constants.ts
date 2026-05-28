export enum GantryQueryKeys {
  ITEMS = 'gantry-items',
  ITEM = 'gantry-item',
  FOCUS_AREAS = 'gantry-focus-areas',
}

export const GANTRY_STAGE_VALUES = ['IDEA', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'] as const;

export const GANTRY_STAGE_LABELS: Record<(typeof GANTRY_STAGE_VALUES)[number], string> = {
  IDEA: 'Idea',
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

export const DEFAULT_ROADMAP_VISIBLE_COLUMNS = [...GANTRY_KANBAN_STAGES];

export function sortRoadmapColumnStages(
  columns: readonly (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number][],
): (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number][] {
  const selected = new Set(columns);
  return GANTRY_ROADMAP_COLUMN_STAGES.filter((stage) => selected.has(stage));
}

/** Mirrors backend `ALLOWED_TRANSITIONS` in roadmap-stage.util.ts */
export const GANTRY_ALLOWED_TRANSITIONS: Record<(typeof GANTRY_STAGE_VALUES)[number], (typeof GANTRY_STAGE_VALUES)[number][]> = {
  IDEA: ['UNDER_REVIEW', 'PLANNED', 'DECLINED'],
  UNDER_REVIEW: ['IDEA', 'PLANNED', 'DECLINED'],
  PLANNED: ['IN_PROGRESS', 'DECLINED'],
  IN_PROGRESS: ['SHIPPED', 'PLANNED', 'DECLINED'],
  SHIPPED: ['IN_PROGRESS'],
  DECLINED: ['IDEA'],
};

export function getAllowedStageTransitions(stage: (typeof GANTRY_STAGE_VALUES)[number]) {
  return GANTRY_ALLOWED_TRANSITIONS[stage] ?? [];
}

export const GANTRY_CREATE_STAGE_OPTIONS = GANTRY_STAGE_VALUES.map((value) => ({
  label: GANTRY_STAGE_LABELS[value],
  value,
}));
