import { customFetch } from '@/utils/fetch-wrapper';
import { GANTRY_IMPACT_MOCK } from '@/utils/feature-flags';
import { normalizeGantryItemImpact, toImpactValue } from './impact';
import type {
  ApiGantryDraft,
  ApiGantryDraftPayload,
  CreateGantryItemPayload,
  GantryImpactValue,
  GantryItem,
  GantryItemListResponse,
  GantryListParams,
  GantryObjective,
  GantryPinBalance,
  GantryPinner,
  GantryPinStatus,
  GantryStage,
  UpdateGantryItemPayload,
  UpdateGantryPinPayload,
} from './types';

/** Loaded lazily so production bundles (flag off/on) carry no mock bytes. */
function impactMock() {
  return import('./gantry-impact.mock-data');
}

/** Normalize impact fields in ALL modes (live API doesn't send them yet); decorate from the mock store in mock mode. */
async function finalizeItem(item: GantryItem): Promise<GantryItem> {
  const normalized = normalizeGantryItemImpact(item);
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    return mock.decorateItem(normalized) ?? normalized;
  }
  return normalized;
}

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
  if (params.objectiveUid?.length) {
    search.set('objectiveUid', params.objectiveUid.join(','));
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
  const data = await parseJsonOrThrow<GantryItemListResponse>(res, 'Failed to fetch gantry items');
  const normalized = { ...data, items: data.items.map(normalizeGantryItemImpact) };
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    await mock.mockLatency();
    return mock.decorateItems(normalized);
  }
  return normalized;
}

export async function fetchGantryItem(uid: string): Promise<GantryItem | null> {
  const res = await customFetch(`${ROADMAP_API_URL}/${encodeURIComponent(uid)}`, { method: 'GET' }, true);
  if (!res || !res.ok) {
    if (res?.status === 404) return null;
    throw new Error('Failed to fetch gantry item');
  }
  const json = await res.json();
  const item = (json?.body ?? json) as GantryItem;
  return finalizeItem(item);
}

export async function createGantryItem(payload: CreateGantryItemPayload): Promise<GantryItem> {
  const { authorImpact, authorImpactReasoning, ...rest } = payload;
  // Until the backend deploys the contract, mock mode must not send unknown fields to the live API.
  const body: CreateGantryItemPayload = GANTRY_IMPACT_MOCK ? rest : payload;
  const res = await customFetch(
    ROADMAP_API_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );
  const created = await parseJsonOrThrow<GantryItem>(res, 'Failed to create gantry item');
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    mock.recordAuthorImpact(created.uid, authorImpact, authorImpactReasoning);
  }
  return finalizeItem(created);
}

export async function updateGantryItem(uid: string, payload: UpdateGantryItemPayload): Promise<GantryItem> {
  const { authorImpact, authorImpactReasoning, ...rest } = payload;
  const body: UpdateGantryItemPayload = GANTRY_IMPACT_MOCK ? rest : payload;
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );
  const updated = await parseJsonOrThrow<GantryItem>(res, 'Failed to update gantry item');
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    mock.recordAuthorImpact(uid, authorImpact, authorImpactReasoning);
  }
  return finalizeItem(updated);
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
  return finalizeItem(await parseJsonOrThrow<GantryItem>(res, 'Failed to archive gantry item'));
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
  return finalizeItem(await parseJsonOrThrow<GantryItem>(res, 'Failed to upvote gantry item'));
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
  return finalizeItem(await parseJsonOrThrow<GantryItem>(res, 'Failed to remove upvote'));
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
  return finalizeItem(await parseJsonOrThrow<GantryItem>(res, 'Failed to transition gantry item'));
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
  return finalizeItem(await parseJsonOrThrow<GantryItem>(res, 'Failed to promote gantry item'));
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
  return finalizeItem(await parseJsonOrThrow<GantryItem>(res, 'Failed to decline gantry item'));
}

export type AssignObjectivesBody = {
  objectiveUids: string[];
  titles?: string[];
};

export async function assignGantryItemObjectives(uid: string, body: AssignObjectivesBody): Promise<GantryItem> {
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/objectives`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );
  return finalizeItem(await parseJsonOrThrow<GantryItem>(res, 'Failed to assign objectives'));
}

export async function fetchGantryObjectives(): Promise<GantryObjective[]> {
  const res = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/roadmap/objectives`, { method: 'GET' }, true);
  const data = await parseJsonOrThrow<{ objectives: GantryObjective[] }>(res, 'Failed to fetch gantry objectives');
  return data.objectives;
}

export async function addGantryPin(
  uid: string,
  params?: { note?: string | null; swapItemUid?: string | null; impact?: GantryImpactValue },
): Promise<AddPinResult> {
  const body: Record<string, unknown> = { note: params?.note ?? null, swapItemUid: params?.swapItemUid ?? null };
  // The contract requires `impact` on the pin POST; the pre-contract live API must not receive it (mock mode).
  if (!GANTRY_IMPACT_MOCK && params?.impact !== undefined) body.impact = params.impact;
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/pin`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    await mock.mockLatency();
    if (params?.impact !== undefined) mock.recordPinImpact(uid, params.impact, params?.note);
    if (params?.swapItemUid) mock.removePinImpact(params.swapItemUid);
  }
  return { ok: true, item: await finalizeItem(data.item), balance: data.balance };
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
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    await mock.mockLatency();
    mock.removePinImpact(uid);
  }
  return { item: await finalizeItem(data.item), balance: data.balance };
}

export async function fetchGantryPinStatus(): Promise<GantryPinStatus> {
  const res = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/roadmap/pins/me`, { method: 'GET' }, true);
  const status = await parseJsonOrThrow<GantryPinStatus>(res, 'Failed to fetch pin status');
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    return mock.decoratePinStatus(status);
  }
  return status;
}

/** PATCH the viewer's active pin — the contract requires at least one field. */
export async function updateGantryPin(
  uid: string,
  payload: UpdateGantryPinPayload,
): Promise<{ item: GantryItem; balance: GantryPinBalance }> {
  if (payload.impact === undefined && payload.note === undefined) {
    throw new Error('updateGantryPin requires impact and/or note');
  }
  // Pre-contract live API only understands `note`; an impact-only update in mock mode skips the network.
  const body: UpdateGantryPinPayload = GANTRY_IMPACT_MOCK ? { note: payload.note } : payload;
  if (GANTRY_IMPACT_MOCK && payload.note === undefined) {
    const mock = await impactMock();
    await mock.mockLatency();
    mock.updatePinImpact(uid, payload);
    const [item, status] = await Promise.all([fetchGantryItem(uid), fetchGantryPinStatus()]);
    if (!item) throw new Error('Failed to update pin');
    return { item, balance: { limit: status.limit, used: status.used, remaining: status.remaining } };
  }
  const res = await customFetch(
    `${ROADMAP_API_URL}/${encodeURIComponent(uid)}/pin`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    true,
  );
  if (!res || !res.ok) throw new Error('Failed to update pin');
  const json = await res.json();
  const data = json?.body ?? json;
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    await mock.mockLatency();
    mock.updatePinImpact(uid, payload);
  }
  return { item: await finalizeItem(data.item), balance: data.balance };
}

export async function savePinNote(uid: string, note: string): Promise<{ item: GantryItem; balance: GantryPinBalance }> {
  return updateGantryPin(uid, { note });
}

export async function fetchGantryItemPins(uid: string): Promise<GantryPinner[]> {
  const res = await customFetch(`${ROADMAP_API_URL}/${encodeURIComponent(uid)}/pins`, { method: 'GET' }, true);
  const data = await parseJsonOrThrow<{ total: number; pins: GantryPinner[] }>(res, 'Failed to fetch item pins');
  const pins = data.pins.map((pin) => ({ ...pin, impact: toImpactValue(pin.impact) }));
  if (GANTRY_IMPACT_MOCK) {
    const mock = await impactMock();
    return mock.decorateItemPins(uid, pins);
  }
  return pins;
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
