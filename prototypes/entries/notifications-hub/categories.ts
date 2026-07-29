import type { ComponentType, SVGProps } from 'react';

import type { HubCategory } from './mocks';
import { DemoDayIcon, EventIcon, ForumIcon, SystemIcon } from './icons';

/**
 * Category → label mapping, transcribed from the production
 * `getCategoryLabel` so the eight groups stay identical.
 *
 * What's new here is `tone`: production paints every category badge the same
 * #4174ff, which (a) measures 4.06:1 on white and fails AA at 12px, and (b)
 * makes eight distinct domains visually identical. Each group now carries its
 * own hue, drawn from the event palette already used by the newsfeed-v0
 * prototype so the two prototypes stay consistent. Every value below clears
 * 4.5:1 on white.
 */
export type CategoryTone = {
  label: string;
  /** Text + icon colour. */
  fg: string;
  /** Badge fill — the same hue at low alpha. */
  bg: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const DEMO_DAY: CategoryTone = {
  label: 'Demo Day',
  fg: 'var(--foreground-violet-primary, #5925dc)',
  bg: 'var(--background-violet-subtle, rgba(89, 37, 220, 0.07))',
  Icon: DemoDayIcon,
};

const EVENTS: CategoryTone = {
  label: 'Events',
  fg: 'var(--foreground-amber-primary, #b54708)',
  bg: 'var(--background-amber-subtle, rgba(181, 71, 8, 0.07))',
  Icon: EventIcon,
};

const FORUM: CategoryTone = {
  label: 'Forum',
  fg: 'var(--foreground-info-primary, #1849a9)',
  bg: 'var(--background-info-subtle, rgba(24, 73, 169, 0.07))',
  Icon: ForumIcon,
};

const GUIDES: CategoryTone = {
  label: 'Founder Guides',
  fg: 'var(--foreground-success-primary, #027a48)',
  bg: 'var(--background-success-subtle, rgba(2, 122, 72, 0.07))',
  Icon: ForumIcon,
};

const NETWORK_NEWS: CategoryTone = {
  label: 'Network News',
  fg: 'var(--foreground-teal-primary, #0e7090)',
  bg: 'var(--background-teal-subtle, rgba(14, 112, 144, 0.07))',
  Icon: SystemIcon,
};

const NEW_FEATURE: CategoryTone = {
  label: 'New Feature',
  fg: 'var(--foreground-brand-primary, #1b4dff)',
  bg: 'var(--background-brand-subtle, rgba(27, 77, 255, 0.06))',
  Icon: SystemIcon,
};

const NEUTRAL: CategoryTone = {
  label: 'System',
  fg: 'var(--foreground-neutral-secondary, #475467)',
  bg: 'var(--transparent-dark-4, rgba(14, 15, 17, 0.04))',
  Icon: SystemIcon,
};

const GANTRY: CategoryTone = { ...NEUTRAL, label: 'Gantry' };

const BY_CATEGORY: Record<HubCategory, CategoryTone> = {
  DEMO_DAY_LIKE: DEMO_DAY,
  DEMO_DAY_CONNECT: DEMO_DAY,
  DEMO_DAY_ANNOUNCEMENT: DEMO_DAY,
  DEMO_DAY_INVEST: DEMO_DAY,
  EVENT: EVENTS,
  IRL_GATHERING: EVENTS,
  FORUM_POST: FORUM,
  FORUM_REPLY: FORUM,
  GUIDE_POST: GUIDES,
  GUIDE_REPLY: GUIDES,
  NEW_FEATURE,
  GANTRY,
  TEAM_NEWS: NETWORK_NEWS,
  SYSTEM: NEUTRAL,
};

export function getCategoryTone(category: HubCategory): CategoryTone {
  return BY_CATEGORY[category] ?? NEUTRAL;
}

/** Transcribed from the production `getActionText`, unchanged. */
export function getActionText(category: HubCategory): string {
  if (category.startsWith('DEMO_DAY')) return 'View Demo Day';
  if (category === 'EVENT' || category === 'IRL_GATHERING') return 'View event';
  if (category.startsWith('FORUM')) return 'View discussion';
  if (category.startsWith('GUIDE')) return 'View guide';
  if (category === 'TEAM_NEWS') return 'Read update';
  if (category === 'GANTRY') return 'View request';
  return 'View';
}

/**
 * Relative time. Local to the prototype (production uses `utils/formatTimeAgo`,
 * which is fine to import, but the mocks carry minutes rather than dates).
 */
export function formatAgo(minutesAgo: number): string {
  if (minutesAgo < 1) return 'just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/** Date buckets for the full-page inbox — Asana / komoot / Patreon pattern. */
export type DateBucket = 'Today' | 'Yesterday' | 'Earlier';

export function getDateBucket(minutesAgo: number): DateBucket {
  if (minutesAgo < 60 * 24) return 'Today';
  if (minutesAgo < 60 * 48) return 'Yesterday';
  return 'Earlier';
}
