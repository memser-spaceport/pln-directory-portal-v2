import { customFetch } from '@/utils/fetch-wrapper';
import type {
  CreateGantryItemPayload,
  GantryItem,
  GantryItemListResponse,
  GantryListParams,
  GantryStage,
  UpdateGantryItemPayload,
} from './types';

const ROADMAP_API_URL = `${process.env.DIRECTORY_API_URL}/v1/roadmap/items`;

function buildQuery(params: GantryListParams): string {
  const search = new URLSearchParams();
  if (params.focusAreaUid?.length) search.set('focusAreaUid', params.focusAreaUid.join(','));
  if (params.mine) search.set('mine', 'true');
  if (params.includeDeclined) search.set('includeDeclined', 'true');
  if (params.includeArchived) search.set('includeArchived', 'true');
  if (params.stage?.length) {
    search.set('stage', params.stage.join(','));
  }
  return search.toString();
}

async function parseJsonOrThrow<T>(res: Response | undefined, message: string): Promise<T> {
  if (!res || !res.ok) {
    throw new Error(message);
  }
  const json = await res.json();
  return (json?.body ?? json) as T;
}

export async function fetchGantryItems(params: GantryListParams): Promise<GantryItemListResponse> {
  const qs = buildQuery(params);
  const url = qs ? `${ROADMAP_API_URL}?${qs}` : ROADMAP_API_URL;
  const res = await customFetch(url, { method: 'GET' }, true);
  return parseJsonOrThrow<GantryItemListResponse>(res, 'Failed to fetch gantry items');
}

export async function fetchGantryItem(uid: string): Promise<GantryItem | null> {
  const res = await customFetch(`${ROADMAP_API_URL}/${encodeURIComponent(uid)}`, { method: 'GET' }, true);
  if (!res || !res.ok) {
    if (res?.status === 404) return null;
    throw new Error('Failed to fetch gantry item');
  }
  const json = await res.json();
  return (json?.body ?? json) as GantryItem;
}

export async function createGantryItem(payload: CreateGantryItemPayload): Promise<GantryItem> {
  const res = await customFetch(
    ROADMAP_API_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to create gantry item');
}

export async function updateGantryItem(uid: string, payload: UpdateGantryItemPayload): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to update gantry item');
}

export async function archiveGantryItem(uid: string, deletionReason?: string): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletionReason: deletionReason ?? null }),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to archive gantry item');
}

export async function addGantryUpvote(uid: string, note?: string): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/upvote`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note ?? null }),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to upvote gantry item');
}

export async function removeGantryUpvote(uid: string): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/upvote`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to remove upvote');
}

export async function transitionGantryItem(uid: string, stage: GantryStage): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/transition`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to transition gantry item');
}

export async function promoteGantryItem(uid: string): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/promote`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to promote gantry item');
}

export async function declineGantryItem(uid: string, reason: string): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/decline`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to decline gantry item');
}

export async function trackBuildButtonClick(uid: string): Promise<void> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/build-button-click`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
    true,
  );
  if (!res || !res.ok) {
    throw new Error('Failed to track build button click');
  }
}
