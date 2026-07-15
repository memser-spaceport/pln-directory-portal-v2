/**
 * Stateful in-memory mock for the Gantry impact-rating API (contract agreed, backend not
 * deployed). Real API responses are DECORATED with impact state from a module-level store:
 * mutations write the store synchronously inside the service call — before its promise
 * resolves — so react-query's onSettled invalidation refetches read post-mutation state.
 * A page reload resets everything (accepted for dev).
 *
 * Only `gantry.service.ts` may import this module, and only lazily inside
 * `GANTRY_IMPACT_MOCK` branches, so production bundles carry no mock bytes.
 * Delete this file (and its call sites) at API cutover.
 */
import { applyImpactChange, type GantryItemImpactAggregate } from './impact';
import type { GantryImpactValue, GantryItem, GantryItemListResponse, GantryPinner, GantryPinStatus } from './types';

const MOCK_PIN_LIMIT = 10;
/** How many of the first-seen real items get fixture impact data; the rest exercise the legacy path. */
const SEEDED_ITEM_COUNT = 6;

interface MockItemImpact {
  aggregate: GantryItemImpactAggregate;
  authorImpact: GantryImpactValue | null;
  authorImpactReasoning: string | null;
  viewerImpact: GantryImpactValue | null;
  viewerNote: string | null;
}

const store = new Map<string, MockItemImpact>();
let seeded = false;

const FIXTURE_REASONINGS = [
  'Directly unblocks the Q3 onboarding goal — every new team hits this within the first week.',
  'Reduces operator toil on imports; support tickets about duplicates are our #1 recurring theme.',
];

function emptyEntry(): MockItemImpact {
  return {
    aggregate: { avgImpact: null, impactCount: 0, impactDistribution: null },
    authorImpact: null,
    authorImpactReasoning: null,
    viewerImpact: null,
    viewerNote: null,
  };
}

function ensureEntry(uid: string): MockItemImpact {
  let entry = store.get(uid);
  if (!entry) {
    entry = emptyEntry();
    store.set(uid, entry);
  }
  return entry;
}

/** Deterministic — mock state must be stable across refetches within a session. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededAggregate(uid: string): GantryItemImpactAggregate {
  const hash = hashString(uid);
  const count = 3 + (hash % 12);
  const center = ((hash >> 4) % 3) + 3; // 3..5 — fixtures skew meaningful, like a real board would
  let aggregate: GantryItemImpactAggregate = { avgImpact: null, impactCount: 0, impactDistribution: null };
  for (let i = 0; i < count; i += 1) {
    const offset = ((hash >> i % 24) % 3) - 1; // -1..1 around the center
    const value = Math.min(5, Math.max(1, center + offset)) as GantryImpactValue;
    aggregate = applyImpactChange(aggregate, { prev: null, next: value });
  }
  return aggregate;
}

function seedFromItems(items: GantryItem[]): void {
  if (seeded) return;
  seeded = true;
  items.slice(0, SEEDED_ITEM_COUNT).forEach((item, index) => {
    const entry = ensureEntry(item.uid);
    entry.aggregate = seededAggregate(item.uid);
    entry.authorImpact = ((hashString(item.uid) % 3) + 3) as GantryImpactValue; // 3..5
    entry.authorImpactReasoning = index < FIXTURE_REASONINGS.length ? FIXTURE_REASONINGS[index] : null;
    if (index === 0 && item.viewerHasPinned) {
      entry.viewerImpact = 4;
      entry.viewerNote = item.viewerPinNote;
    }
  });
}

/**
 * Assign per-pin impacts by expanding the aggregate distribution (descending), so the
 * curator rater list is consistent with the aggregate as far as pin count allows.
 */
function decoratePins(pins: GantryPinner[], entry: MockItemImpact): GantryPinner[] {
  const values: GantryImpactValue[] = [];
  const distribution = entry.aggregate.impactDistribution;
  if (distribution) {
    for (const value of [5, 4, 3, 2, 1] as const) {
      for (let i = 0; i < distribution[value]; i += 1) values.push(value);
    }
  }
  return pins.map((pin, index) => ({ ...pin, impact: values[index] ?? null }));
}

function decorate(item: GantryItem): GantryItem {
  const entry = store.get(item.uid);
  if (!entry) return item;
  return {
    ...item,
    ...entry.aggregate,
    authorImpact: entry.authorImpact,
    authorImpactReasoning: entry.authorImpactReasoning,
    viewerImpact: entry.viewerImpact,
    viewerPinNote: entry.viewerNote ?? item.viewerPinNote,
    pins: item.pins ? decoratePins(item.pins, entry) : item.pins,
  };
}

/** `?slowImpact` in the URL makes mutation/refetch races reproducible in dev. */
export async function mockLatency(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!window.location.search.includes('slowImpact')) return;
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

export function decorateItems(response: GantryItemListResponse): GantryItemListResponse {
  seedFromItems(response.items);
  return { ...response, items: response.items.map(decorate) };
}

export function decorateItem(item: GantryItem | null): GantryItem | null {
  if (!item) return null;
  seedFromItems([]); // no-op if already seeded; a detail-first visit simply starts unseeded
  return decorate(item);
}

export function decorateItemPins(uid: string, pins: GantryPinner[]): GantryPinner[] {
  const entry = store.get(uid);
  return entry ? decoratePins(pins, entry) : pins;
}

export function decoratePinStatus(status: GantryPinStatus): GantryPinStatus {
  return { ...status, limit: MOCK_PIN_LIMIT, remaining: Math.max(0, MOCK_PIN_LIMIT - status.used) };
}

export function recordPinImpact(uid: string, impact: GantryImpactValue, note?: string | null): void {
  const entry = ensureEntry(uid);
  entry.aggregate = applyImpactChange(entry.aggregate, { prev: entry.viewerImpact, next: impact });
  entry.viewerImpact = impact;
  if (note !== undefined) entry.viewerNote = note;
}

export function updatePinImpact(uid: string, payload: { impact?: GantryImpactValue; note?: string }): void {
  const entry = ensureEntry(uid);
  if (payload.impact !== undefined) {
    entry.aggregate = applyImpactChange(entry.aggregate, { prev: entry.viewerImpact, next: payload.impact });
    entry.viewerImpact = payload.impact;
  }
  if (payload.note !== undefined) entry.viewerNote = payload.note;
}

export function removePinImpact(uid: string): void {
  const entry = store.get(uid);
  if (!entry || entry.viewerImpact === null) return;
  entry.aggregate = applyImpactChange(entry.aggregate, { prev: entry.viewerImpact, next: null });
  entry.viewerImpact = null;
  entry.viewerNote = null;
}

export function recordAuthorImpact(
  uid: string,
  impact: GantryImpactValue | undefined,
  reasoning: string | undefined,
): void {
  if (impact === undefined && reasoning === undefined) return;
  const entry = ensureEntry(uid);
  if (impact !== undefined) {
    entry.aggregate = applyImpactChange(entry.aggregate, { prev: entry.authorImpact, next: impact });
    entry.authorImpact = impact;
  }
  if (reasoning !== undefined) entry.authorImpactReasoning = reasoning;
}
