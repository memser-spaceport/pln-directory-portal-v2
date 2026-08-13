'use client';

import {
  DISCUSSIONS_CAT,
  DISCUSSIONS_CATEGORY,
  ALL_CAT,
  ALL_TAB,
  CATEGORIES,
  type TeamNewsCategoryId,
} from '@/components/page/home/TeamNews/constants';

/**
 * The feed's four narrowing/ranking axes as one addressable object.
 *
 * Today the prototype (and production `TeamNews`) hold these as four loose
 * `useState`s that reset on every reload, so there is nothing to save, share, or
 * subscribe to. Collapsing them into one value is the prerequisite for all of
 * that — and on its own it buys "the feed remembers me" plus shareable filtered
 * links.
 */
export type FeedSort = 'latest' | 'popular' | 'following';

export interface FeedView {
  /** Focus-area tab ("All" | "Infrastructure" | …). */
  tab: string;
  /** Event-type pill, or the injected "Active Discussions" pseudo-category. */
  category: TeamNewsCategoryId;
  sort: FeedSort;
  query: string;
  /**
   * Team uid, or '' for the whole network — the axis every "N new updates" badge
   * elsewhere in the product lands on (`?team=<uid>`). Optional so the four-axis
   * literals in newsfeed-v0 stay valid.
   *
   * It belongs here rather than beside the feed as its own state because a team
   * scope is a filter like any other: it must narrow the view, key a
   * subscription, and be summarizable — "email me when Protocol Labs posts" is
   * the same object as "email me about Funding".
   */
  team?: string;
}

export const DEFAULT_VIEW: FeedView = { tab: ALL_TAB, category: ALL_CAT, sort: 'following', query: '', team: '' };

/**
 * A view is "narrowed" when it differs from the default on a *filter* axis.
 * Sort is excluded on purpose: ranking is not a filter — the same call
 * production's `useFilterCount` makes with `excludeParams: ['sort']`.
 */
export const isNarrowed = (v: FeedView): boolean =>
  v.tab !== ALL_TAB || v.category !== ALL_CAT || v.query.trim() !== '' || Boolean(v.team);

const CATEGORY_LABEL: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])),
  [DISCUSSIONS_CAT]: DISCUSSIONS_CATEGORY.label,
};

/**
 * Human label for a view — " · "-joined criteria, the convention production's
 * `summarizeFilterState` (utils/job-alerts.utils.ts) uses to title a job alert
 * from its criteria instead of asking the user to name it.
 */
export function summarizeView(v: FeedView, teamName?: string): string {
  const parts: string[] = [];
  // Named first: a team scope is the strongest thing a view can say about
  // itself. `teamName` is passed by the caller that holds the items — the view
  // stores the uid, which is stable, not the label.
  if (v.team) parts.push(teamName || 'This team');
  if (v.tab !== ALL_TAB) parts.push(v.tab);
  if (v.category !== ALL_CAT) parts.push(CATEGORY_LABEL[v.category] ?? v.category);
  if (v.query.trim()) parts.push(`“${v.query.trim()}”`);
  return parts.length ? parts.join(' · ') : 'All network updates';
}

/**
 * Canonical "is this the same view?" key, mirroring `filterStateToHashKey`.
 * Sort is left out for the same reason `isNarrowed` leaves it out — a weekly
 * digest has no sort order, so changing it must not read as a different scope.
 */
export const viewHashKey = (v: FeedView): string =>
  `tab=${v.tab}&cat=${v.category}&q=${v.query.trim().toLowerCase()}&team=${v.team ?? ''}`;

// ---------- URL round-trip ----------

const PARAM = { tab: 'tab', category: 'cat', sort: 'sort', query: 'q', team: 'team' } as const;

/** Writes only this view's keys into `params`, deleting the ones at default. */
export function writeViewParams(params: URLSearchParams, v: FeedView): URLSearchParams {
  const set = (key: string, value: string, isDefault: boolean) =>
    isDefault ? params.delete(key) : params.set(key, value);

  set(PARAM.tab, v.tab, v.tab === DEFAULT_VIEW.tab);
  set(PARAM.category, v.category, v.category === DEFAULT_VIEW.category);
  set(PARAM.sort, v.sort, v.sort === DEFAULT_VIEW.sort);
  set(PARAM.query, v.query.trim(), v.query.trim() === '');
  set(PARAM.team, v.team ?? '', !v.team);
  return params;
}

/** Reads a view out of the URL. Returns null when the URL carries none of it. */
export function readViewParams(params: URLSearchParams): FeedView | null {
  const has = Object.values(PARAM).some((key) => params.has(key));
  if (!has) return null;

  const sort = params.get(PARAM.sort);
  return {
    tab: params.get(PARAM.tab) || DEFAULT_VIEW.tab,
    category: (params.get(PARAM.category) as TeamNewsCategoryId) || DEFAULT_VIEW.category,
    sort: sort === 'latest' || sort === 'popular' || sort === 'following' ? sort : DEFAULT_VIEW.sort,
    query: params.get(PARAM.query) || '',
    team: params.get(PARAM.team) || '',
  };
}

// ---------- Persistence (mocked) ----------

/**
 * Shape production's Investors saved views use (services/investors/store.ts).
 * PARKED: kept for `SavedViewsBar`, which is no longer wired into the feed —
 * the saved-*collection* option lost to the single saved filter.
 */
export interface StoredSavedView {
  id: string;
  name: string;
  view: FeedView;
  createdAt: string;
}

// Versioned keys, so a changed shape retires its own stale data rather than
// crashing on it — the discipline production uses for `investor_db.columns.v2`.
/** The view you last left behind (only restored when nothing is saved). */
export const VIEW_STORAGE_KEY = 'proto.newsfeed.view.v1';
/** The one saved filter — a singleton, like the job board's single alert. */
export const SAVED_FILTER_STORAGE_KEY = 'proto.newsfeed.saved_filter.v1';
/** PARKED alongside `StoredSavedView`. */
export const SAVED_VIEWS_STORAGE_KEY = 'proto.newsfeed.saved_views.v1';

/** SSR-safe read; a malformed or absent entry falls back rather than throwing. */
export function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStored(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota — persistence is a nicety here, never a blocker.
  }
}
