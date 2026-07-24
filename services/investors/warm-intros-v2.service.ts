import { customFetch } from '@/utils/fetch-wrapper';
import type {
  MasterProfileDetail,
  WarmIntrosV2Facets,
  WarmIntrosV2InvestorPathsResponse,
  WarmIntrosV2ListParams,
  WarmIntrosV2ListResponse,
  WarmIntrosV2PathListItem,
} from './warm-intros-v2.types';

/**
 * Warm Intros v2 read API. Response fields stay camelCase (S3-T1), unlike v1
 * pathfinder which maps to snake_case on the FE.
 */
const BASE = `${process.env.DIRECTORY_API_URL}/v1/warm-intros-v2`;
const MASTER_PROFILES_BASE = `${process.env.DIRECTORY_API_URL}/v1/master-profiles`;

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
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
  if (!res || !res.ok) return { connectors: [], sectors: [] };
  const json = await res.json();
  return {
    connectors: Array.isArray(json.connectors) ? json.connectors : [],
    sectors: Array.isArray(json.sectors) ? json.sectors : [],
  };
}

/** GET /v1/master-profiles/:uid — MasterProfile detail for modal / drawer bio. */
export async function getMasterProfile(uid: string): Promise<MasterProfileDetail | null> {
  const res = await customFetch(`${MASTER_PROFILES_BASE}/${encodeURIComponent(uid)}`, { method: 'GET' }, true);
  if (!res || !res.ok) return null;
  return (await res.json()) as MasterProfileDetail;
}
