import { customFetch } from '@/utils/fetch-wrapper';
import type {
  ApiGantryDraft,
  ApiGantryDraftPayload,
  CreateGantryItemPayload,
  GantryItem,
  GantryItemListResponse,
  GantryListParams,
  GantryObjective,
  GantryPinBalance,
  GantryPinner,
  GantryPinStatus,
  GantryStage,
  UpdateGantryItemPayload,
} from './types';

export class PinBalanceExhaustedError extends Error {
  constructor() {
    super('PIN_BALANCE_EXHAUSTED');
    this.name = 'PinBalanceExhaustedError';
  }
}

type AddPinResult =
  | { ok: true; item: GantryItem; balance: GantryPinBalance }
  | { ok: false; error: 'PIN_BALANCE_EXHAUSTED' | 'UNKNOWN'; status: number };

const ROADMAP_API_URL = `${process.env.DIRECTORY_API_URL}/v1/roadmap/items`;

function buildQuery(params: GantryListParams): string {
  const search = new URLSearchParams();
  if (params.focusArea) search.set('focusArea', params.focusArea);
  if (params.mine) search.set('mine', 'true');
  if (params.includeDeclined) search.set('includeDeclined', 'true');
  if (params.includeArchived) search.set('includeArchived', 'true');
  if (params.stage?.length) {
    search.set('stage', params.stage.join(','));
  }
  if (params.tags?.length) {
    search.set('tags', params.tags.join(','));
  }
  if (params.type?.length) {
    search.set('type', params.type.join(','));
  }
  if (params.objectiveUid) search.set('objectiveUid', params.objectiveUid);
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

export type AssignObjectiveBody =
  | { objectiveUid: string }
  | { objectiveUid: null }
  | { title: string };

export async function assignGantryItemObjective(uid: string, body: AssignObjectiveBody): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/objective`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );
  return parseJsonOrThrow<GantryItem>(res, 'Failed to assign objective');
}

export async function fetchGantryObjectives(): Promise<GantryObjective[]> {
  const res = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/roadmap/objectives`, { method: 'GET' }, true);
  const data = await parseJsonOrThrow<{ objectives: GantryObjective[] }>(res, 'Failed to fetch gantry objectives');
  return data.objectives;
}

export async function addGantryPin(
  uid: string,
  params?: { note?: string | null; swapItemUid?: string | null },
): Promise<AddPinResult> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/pin`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: params?.note ?? null, swapItemUid: params?.swapItemUid ?? null }),
    },
    true,
  );
  if (!res) return { ok: false, error: 'UNKNOWN', status: 0 };
  if (res.status === 409) {
    const json = await res.json().catch(() => null);
    const code = json?.errorCode ?? json?.body?.errorCode;
    return {
      ok: false,
      error: code === 'PIN_BALANCE_EXHAUSTED' ? 'PIN_BALANCE_EXHAUSTED' : 'UNKNOWN',
      status: 409,
    };
  }
  if (!res.ok) return { ok: false, error: 'UNKNOWN', status: res.status };
  const json = await res.json();
  const data = json?.body ?? json;
  return { ok: true, item: data.item, balance: data.balance };
}

export async function removeGantryPin(uid: string): Promise<{ item: GantryItem; balance: GantryPinBalance }> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/pin`,
    { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) },
    true,
  );
  if (!res || !res.ok) throw new Error('Failed to unpin gantry item');
  const json = await res.json();
  const data = json?.body ?? json;
  return { item: data.item, balance: data.balance };
}

export async function fetchGantryPinStatus(): Promise<GantryPinStatus> {
  const res = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/roadmap/pins/me`, { method: 'GET' }, true);
  return parseJsonOrThrow<GantryPinStatus>(res, 'Failed to fetch pin status');
}

export async function savePinNote(uid: string, note: string): Promise<{ item: GantryItem; balance: GantryPinBalance }> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/pin`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) },
    true,
  );
  if (!res || !res.ok) throw new Error('Failed to save pin note');
  const json = await res.json();
  const data = json?.body ?? json;
  return { item: data.item, balance: data.balance };
}

export async function fetchGantryItemPins(uid: string): Promise<GantryPinner[]> {
  const res = await customFetch(`${ROADMAP_API_URL}/${encodeURIComponent(uid)}/pins`, { method: 'GET' }, true);
  const data = await parseJsonOrThrow<{ total: number; pins: GantryPinner[] }>(res, 'Failed to fetch item pins');
  return data.pins;
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

const ROADMAP_DRAFT_URL = `${process.env.DIRECTORY_API_URL}/v1/roadmap/drafts/me`;

export async function fetchGantryDraftFromApi(): Promise<ApiGantryDraft | null> {
  const res = await customFetch(ROADMAP_DRAFT_URL, { method: 'GET' }, true);
  if (!res || !res.ok) return null;
  const json = await res.json();
  return json.draft ?? null;
}

export async function saveGantryDraftToApi(payload: ApiGantryDraftPayload): Promise<void> {
  await customFetch(
    ROADMAP_DRAFT_URL,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    true,
  );
}

export async function discardGantryDraftFromApi(): Promise<void> {
  await customFetch(ROADMAP_DRAFT_URL, { method: 'DELETE' }, true);
}
