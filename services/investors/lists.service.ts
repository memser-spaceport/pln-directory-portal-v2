import { customFetch } from '@/utils/fetch-wrapper';
import { mapInvestorDto } from './investors.service';
import type {
  CheckSizeRange,
  CrosswalkReviewItem,
  CrosswalkReviewResponse,
  InvestorList,
  InvestorListResponse,
  ListMembersParams,
  OutreachInvestor,
  SectorTag,
  StageFocus,
  WarmIntroTier,
} from './types';

// Investor Lists (Lists IA) + Crosswalk review API. Reuses the Investor DB
// permissions (investor_db.view / .edit). Mirrors the mapper style in
// investors.service.ts: the backend returns camelCase (Prisma field names), the
// frontend works in snake_case.
const LISTS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/investor-lists`;
const PATHFINDER_API_URL = `${process.env.DIRECTORY_API_URL}/v1/pathfinder`;

type AnyDto = Record<string, any>;

// ─── Request mappers ──────────────────────────────────────────────────────────

function toListMembersApiParams(p: ListMembersParams): Record<string, unknown> {
  return {
    q: p.q,
    sectorTags: p.sector_tags,
    stageFocus: p.stage_focus,
    checkSizeRange: p.check_size_range,
    relationship: p.relationship,
    connectorLabels: p.connector_labels,
    connectorLabelsContains: p.connector_labels_contains,
    page: p.page,
    limit: p.limit,
  };
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(','));
    } else if (typeof value === 'boolean') {
      if (value) search.set(key, 'true');
    } else {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

// ─── Response mappers ─────────────────────────────────────────────────────────

function mapInvestorList(dto: AnyDto): InvestorList {
  return {
    // The numeric BE id is concealed by ConcealEntityIDInterceptor, so the SLUG is
    // the public list identifier — use it as `id` for selection + member fetch
    // (the BE resolves slug -> internal id). Fall back to numeric id if present.
    id: dto.id != null ? String(dto.id) : (dto.slug ?? ''),
    slug: dto.slug ?? '',
    name: dto.name ?? '',
    description: dto.description ?? '',
    is_graphed: dto.isGraphed ?? false,
    member_count: dto.memberCount ?? 0,
  };
}

function mapCrosswalkReviewItem(dto: AnyDto): CrosswalkReviewItem {
  // BE returns raw PathfinderEntityCrosswalk rows: displayName / firm / entityType /
  // matchMethod / matchConfidence / isFounderLpLink (no source/candidate labels).
  const method = (dto.matchMethod ?? '') as string;
  const reasonBits = [method, dto.isFounderLpLink ? 'founder-is-also-LP link' : ''].filter(Boolean).join(' · ');
  return {
    id: String(dto.id),
    source_label: dto.displayName ?? dto.canonicalId ?? dto.investorId ?? '—',
    candidate_label: dto.firm ?? dto.entityType ?? '—',
    match_confidence: dto.matchConfidence ?? 0,
    reason: reasonBits,
    source_domain: dto.affinityId ?? undefined,
    candidate_domain: dto.directoryUid ?? undefined,
  };
}

// ─── Lists ────────────────────────────────────────────────────────────────────

/** All target lists the user can pick in the warm-intros workspace (v1: Neuro + Gold). */
export async function fetchInvestorLists(): Promise<InvestorList[]> {
  const res = await customFetch(`${LISTS_API_URL}`, { method: 'GET' }, true);
  if (!res || !res.ok) return [];
  const json = await res.json();
  return ((json.items ?? []) as AnyDto[]).map(mapInvestorList);
}

/** Paginated members of one list, with in-list refinements (q / sector / stage / check / relationship). */
export async function fetchListMembers(
  listId: string,
  params: ListMembersParams,
): Promise<InvestorListResponse<OutreachInvestor>> {
  const qs = buildQuery(toListMembersApiParams(params));
  const res = await customFetch(
    `${LISTS_API_URL}/${encodeURIComponent(listId)}/members?${qs}`,
    { method: 'GET' },
    true,
  );
  if (!res || !res.ok) return { page: 1, limit: 0, total: 0, items: [] };
  const json = await res.json();
  return { ...json, items: ((json.items ?? []) as AnyDto[]).map(mapInvestorDto) };
}

/** Add an investor to a list. Gated server-side on investor_db.edit. Returns true on success. */
export async function addToList(listId: string, investorId: string): Promise<boolean> {
  const res = await customFetch(
    `${LISTS_API_URL}/${encodeURIComponent(listId)}/members`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ investorId }) },
    true,
  );
  return !!res && res.ok;
}

/** Remove an investor from a list. Gated server-side on investor_db.edit. */
export async function removeFromList(listId: string, investorId: string): Promise<boolean> {
  const res = await customFetch(
    `${LISTS_API_URL}/${encodeURIComponent(listId)}/members/${encodeURIComponent(investorId)}`,
    { method: 'DELETE' },
    true,
  );
  return !!res && res.ok;
}

// ─── Crosswalk review queue ─────────────────────────────────────────────────

/** Entity-resolution candidates awaiting human review (paginated envelope). */
export async function fetchCrosswalkReview(page = 1, limit = 25): Promise<CrosswalkReviewResponse> {
  const qs = buildQuery({ page, limit });
  const res = await customFetch(`${PATHFINDER_API_URL}/crosswalk/review?${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) return { page, limit, total: 0, items: [] };
  const json = await res.json();
  return {
    page: json.page ?? page,
    limit: json.limit ?? limit,
    total: json.total ?? 0,
    items: ((json.items ?? []) as AnyDto[]).map(mapCrosswalkReviewItem),
  };
}

/** Confirm (link) or reject (keep separate) a crosswalk candidate. Logs a
 *  PathfinderCorrection server-side. Gated on investor_db.edit. */
export async function resolveCrosswalk(id: string, confirmed: boolean, note?: string): Promise<boolean> {
  const res = await customFetch(
    `${PATHFINDER_API_URL}/crosswalk/${encodeURIComponent(id)}/resolve`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmed, note }) },
    true,
  );
  return !!res && res.ok;
}

// Re-exported types kept here so consumers can grab them from the service if needed.
export type { CheckSizeRange, SectorTag, StageFocus, WarmIntroTier };
