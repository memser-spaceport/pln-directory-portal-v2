import { customFetch } from '@/utils/fetch-wrapper';
import type {
  MasterProfileDetail,
  UpsertWarmPathFeedbackBody,
  WarmIntrosV2Facets,
  WarmIntrosV2InvestorPathsResponse,
  WarmIntrosV2ListParams,
  WarmIntrosV2ListResponse,
  WarmIntrosV2PathListItem,
  WarmPathFeedbackQueueParams,
  WarmPathFeedbackQueueResponse,
  WarmPathFeedbackRow,
} from './warm-intros-v2.types';

/**
 * Warm Intros v2 read API. Response fields stay camelCase (S3-T1), unlike v1
 * pathfinder which maps to snake_case on the FE.
 */
const BASE = `${process.env.DIRECTORY_API_URL}/v1/warm-intros-v2`;
const MASTER_PROFILES_BASE = `${process.env.DIRECTORY_API_URL}/v1/master-profiles`;

function buildQuery(params: Record<string, string | number | string[] | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      qs.set(key, value.join(','));
      continue;
    }
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function listWarmIntrosV2Paths(params: WarmIntrosV2ListParams = {}): Promise<WarmIntrosV2ListResponse> {
  const qs = buildQuery({
    targetSet: params.targetSet,
    search: params.search,
    connectorProfileUid: params.connectorProfileUid,
    sector: params.sector,
    minScore: params.minScore,
    rank: params.rank ?? 1,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
    relationKind: params.relationKind,
    bridgeProfileUid: params.bridgeProfileUid,
    directOnly: params.directOnly ? 'true' : undefined,
    plBacker: params.plBacker ? 'true' : undefined,
  });
  const res = await customFetch(`${BASE}/paths${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) return { paths: [], total: 0 };
  const json = await res.json();
  return {
    paths: (Array.isArray(json.paths) ? json.paths : []) as WarmIntrosV2PathListItem[],
    total: typeof json.total === 'number' ? json.total : 0,
  };
}

export async function getWarmIntrosV2PathsForInvestor(
  profileUid: string,
  opts: { targetSet?: string } = {},
): Promise<WarmIntrosV2InvestorPathsResponse> {
  const qs = buildQuery({ targetSet: opts.targetSet });
  const res = await customFetch(`${BASE}/paths/${encodeURIComponent(profileUid)}${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) {
    return {
      paths: [],
      investor: {
        profileUid,
        personKey: '',
        name: profileUid,
        email: null,
        currentOrg: null,
        currentTitle: null,
        sectors: [],
        affinityPersonId: null,
        memberUid: null,
      },
    };
  }
  const json = await res.json();
  return {
    paths: (Array.isArray(json.paths) ? json.paths : []) as WarmIntrosV2PathListItem[],
    investor: json.investor as WarmIntrosV2InvestorPathsResponse['investor'],
  };
}

export async function getWarmIntrosV2Facets(opts: { targetSet?: string } = {}): Promise<WarmIntrosV2Facets> {
  const qs = buildQuery({ targetSet: opts.targetSet });
  const res = await customFetch(`${BASE}/facets${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) return { connectors: [], sectors: [], kinds: [], bridges: [], plBackerCount: 0 };
  const json = await res.json();
  return {
    connectors: Array.isArray(json.connectors) ? json.connectors : [],
    sectors: Array.isArray(json.sectors) ? json.sectors : [],
    kinds: Array.isArray(json.kinds) ? json.kinds : [],
    bridges: Array.isArray(json.bridges) ? json.bridges : [],
    plBackerCount: typeof json.plBackerCount === 'number' ? json.plBackerCount : 0,
  };
}

/** GET /v1/master-profiles/:uid — MasterProfile detail for modal / drawer bio. */
export async function getMasterProfile(uid: string): Promise<MasterProfileDetail | null> {
  const res = await customFetch(`${MASTER_PROFILES_BASE}/${encodeURIComponent(uid)}`, { method: 'GET' }, true);
  if (!res || !res.ok) return null;
  return (await res.json()) as MasterProfileDetail;
}

/** PUT /v1/warm-intros-v2/paths/:warmPathUid/feedback — upsert caller’s refer/note. */
export async function upsertWarmPathFeedback(
  warmPathUid: string,
  body: UpsertWarmPathFeedbackBody,
): Promise<WarmPathFeedbackRow | { deleted: true } | null> {
  const res = await customFetch(
    `${BASE}/paths/${encodeURIComponent(warmPathUid)}/feedback`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );
  if (!res || !res.ok) return null;
  return (await res.json()) as WarmPathFeedbackRow | { deleted: true };
}

/** DELETE /v1/warm-intros-v2/paths/:warmPathUid/feedback/refer — clear canRefer, keep note. */
export async function clearWarmPathRefer(
  warmPathUid: string,
  connectorProfileUid: string,
): Promise<WarmPathFeedbackRow | { deleted: true } | null> {
  const res = await customFetch(
    `${BASE}/paths/${encodeURIComponent(warmPathUid)}/feedback/refer`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectorProfileUid }),
    },
    true,
  );
  if (!res || !res.ok) return null;
  return (await res.json()) as WarmPathFeedbackRow | { deleted: true };
}

/** GET /v1/warm-intros-v2/feedback — admin queue (investor_db.edit). */
export async function listWarmPathFeedback(
  params: WarmPathFeedbackQueueParams = {},
): Promise<WarmPathFeedbackQueueResponse> {
  const qs = buildQuery({
    targetProfileUid: params.targetProfileUid,
    q: params.q,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  });
  const res = await customFetch(`${BASE}/feedback${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) return { items: [], total: 0, limit: params.limit ?? 50, offset: params.offset ?? 0 };
  const json = await res.json();
  return {
    items: Array.isArray(json.items) ? (json.items as WarmPathFeedbackRow[]) : [],
    total: typeof json.total === 'number' ? json.total : 0,
    limit: typeof json.limit === 'number' ? json.limit : (params.limit ?? 50),
    offset: typeof json.offset === 'number' ? json.offset : (params.offset ?? 0),
  };
}
