// Module + access level → internal permission code (RBAC v1 prototype)

import type { DirectPermission } from './rbac-mock-data';

export const EXCEPTION_MODULE_IDS = [
  'Founder Guides',
  'Deals',
  'Forum',
  'Demo Day',
  'Office Hours',
] as const;

export type ExceptionModuleId = (typeof EXCEPTION_MODULE_IDS)[number];

export interface ExceptionAccessOption {
  /** Human-readable level shown in the UI (e.g. "View", "Admin") */
  level: string;
  /** Stored permission string */
  permission: string;
}

/**
 * For each module, ordered list of access levels and their internal permission codes.
 */
export const MODULE_ACCESS_OPTIONS: Record<ExceptionModuleId, ExceptionAccessOption[]> = {
  'Founder Guides': [
    { level: 'View', permission: 'founder_guides.view' },
    { level: 'Edit', permission: 'founder_guides.create' },
    { level: 'Admin', permission: 'founder_guides.admin' },
  ],
  Deals: [
    { level: 'View', permission: 'deals.view' },
    { level: 'Edit', permission: 'deals.write' },
    { level: 'Admin', permission: 'deals.admin' },
  ],
  Forum: [
    { level: 'Read', permission: 'forum.read' },
    { level: 'Write', permission: 'forum.write' },
    { level: 'Moderate', permission: 'forum.moderate' },
  ],
  'Demo Day': [
    { level: 'View', permission: 'demoday.prep.read' },
    { level: 'Contribute', permission: 'demoday.prep.write' },
    { level: 'Admin', permission: 'demoday.active.write' },
  ],
  'Office Hours': [
    { level: 'Book', permission: 'oh.demand' },
    { level: 'Host', permission: 'oh.supply' },
    { level: 'Admin', permission: 'oh.admin' },
  ],
};

export function getExceptionAccessOptions(module: string): ExceptionAccessOption[] {
  const opts = MODULE_ACCESS_OPTIONS[module as ExceptionModuleId];
  return opts ?? MODULE_ACCESS_OPTIONS['Founder Guides'];
}

export function resolveExceptionPermission(
  module: string,
  level: string
): { permission: string; option: ExceptionAccessOption } | null {
  const options = getExceptionAccessOptions(module);
  const option = options.find((o) => o.level === level);
  if (!option) return null;
  return { permission: option.permission, option };
}

export function buildExceptionLabel(module: string, level: string): string {
  return `${module} — ${level}`;
}

/** Flat list of every selectable exception (module × level) */
export const ALL_EXCEPTION_OPTIONS: Array<{
  permission: string;
  module: ExceptionModuleId;
  level: string;
  label: string;
}> = EXCEPTION_MODULE_IDS.flatMap((module) =>
  MODULE_ACCESS_OPTIONS[module].map((opt) => ({
    permission: opt.permission,
    module,
    level: opt.level,
    label: buildExceptionLabel(module, opt.level),
  }))
);

/** Reverse-lookup: permission code → label */
export function getExceptionLabelByPermission(permission: string): string {
  return ALL_EXCEPTION_OPTIONS.find((o) => o.permission === permission)?.label ?? permission;
}

/** Display title for table/cards: prefers module+level, else legacy `label` */
export function getExceptionDisplayTitle(dp: DirectPermission): string {
  if (dp.module && dp.level) {
    return buildExceptionLabel(dp.module, dp.level);
  }
  if (dp.label?.includes('—')) {
    return dp.label;
  }
  return dp.label;
}
