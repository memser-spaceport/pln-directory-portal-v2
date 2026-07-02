import { customFetch } from '@/utils/fetch-wrapper';
import { mapHopNode } from './pathfinder.service';
import type {
  AffinityData,
  AumRange,
  CheckSizeRange,
  EngagementTier,
  EmailStatus,
  EnrichmentStatus,
  InvestorEnrichment,
  InvestorListParams,
  InvestorListResponse,
  InvestorSource,
  InvestorType,
  LabOsProfileRef,
  OutreachInvestor,
  PlPortfolioTeam,
  RaisingNow,
  SectorTag,
  StageFocus,
  WarmIntroTier,
  WarmIntrosParams,
  WarmIntrosResponse,
} from './types';

const INVESTORS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/investor-outreach`;

// ─── Request mappers ──────────────────────────────────────────────────────────

const SORT_FIELD_MAP: Record<string, string> = {
  last_name: 'lastName',
  last_sent_date: 'lastSentDate',
  engagement_tier: 'engagementTier',
  enrichment_date: 'enrichmentDate',
  firm: 'firm',
};

function toApiParams(p: InvestorListParams): Record<string, unknown> {
  const sort = p.sort ? p.sort.replace(/^[^:]+/, (f) => SORT_FIELD_MAP[f] ?? f) : undefined;
  return {
    q: p.q,
    source: p.source,
    investorType: p.investor_type,
    stageFocus: p.stage_focus,
    sectorTags: p.sector_tags,
    geoFocus: p.geo_focus,
    emailStatus: p.email_status,
    engagementTier: p.engagement_tier,
    enrichmentStatus: p.enrichment_status,
    inLabOs: p.in_lab_os,
    isCoInvestor: p.is_co_investor,
    coInvestedTeamId: p.co_invested_team_id,
    tags: p.tags,
    sort,
    page: p.page,
    limit: p.limit,
  };
}

function toWarmIntrosApiParams(p: WarmIntrosParams): Record<string, unknown> {
  return {
    teamId: p.team_id,
    stageFocus: p.stage_focus,
    sectorTags: p.sector_tags,
    checkSizeRange: p.check_size_range,
    geoFocus: p.geo_focus,
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

type AnyDto = Record<string, any>;

function mapLabOsProfile(dto: AnyDto): LabOsProfileRef {
  return {
    type: dto.type as 'member' | 'team',
    uid: dto.uid as string,
    slug: dto.slug as string,
    name: dto.name as string,
    last_active_at: dto.lastActiveAt ?? undefined,
  };
}

function mapEnrichment(dto: AnyDto): InvestorEnrichment {
  return {
    bio: dto.bio ?? null,
    fund_focus: dto.fundFocus ?? null,
    aum: dto.aum ?? null,
    notable_investments: (dto.notableInvestments ?? []) as string[],
    thesis: dto.thesis ?? null,
    sources: (dto.sources ?? []) as string[],
    enriched_via: dto.enrichedVia ?? null,
    fetched_at: dto.fetchedAt ?? null,
  };
}

function mapAffinityPersonRef(dto: AnyDto | null | undefined): AffinityData['source_of_introduction'] {
  if (!dto) return null;
  return {
    name: dto.name as string,
    email: dto.email ?? null,
    affinity_person_id: dto.affinityPersonId ?? null,
    member_uid: dto.memberUid ?? null,
  };
}

function mapAffinityInteractionRef(dto: AnyDto | null | undefined): AffinityData['last_contact'] {
  if (!dto) return null;
  return {
    date: dto.date as string,
    method: dto.method ?? null,
    subject: dto.subject ?? null,
    from: dto.from ? mapAffinityPersonRef(dto.from) : null,
  };
}

function mapAffinityData(dto: AnyDto | null | undefined): AffinityData | null {
  if (!dto) return null;
  return {
    last_contact: mapAffinityInteractionRef(dto.lastContact),
    last_email: mapAffinityInteractionRef(dto.lastEmail),
    source_of_introduction: mapAffinityPersonRef(dto.sourceOfIntroduction),
    key_contact: mapAffinityPersonRef(dto.keyContact),
    lp_stage: dto.lpStage ?? null,
  };
}

export function mapInvestorDto(dto: AnyDto): OutreachInvestor {
  return {
    investor_id: dto.investorId as string,
    canonical_id: dto.canonicalId ?? '',
    dedupe_key: dto.dedupeKey ?? '',
    source: dto.source as InvestorSource,
    first_name: dto.firstName ?? '',
    last_name: dto.lastName ?? '',
    email: dto.email ?? '',
    email_status: (dto.emailStatus ?? 'unknown') as EmailStatus,
    linkedin_url: dto.linkedinUrl ?? '',
    firm: dto.firm ?? '',
    firm_domain: dto.firmDomain ?? '',
    title: dto.title ?? '',
    affiliations: Array.isArray(dto.affiliations)
      ? (dto.affiliations as AnyDto[]).map((a) => ({
          firm: a.firm as string,
          firm_domain: (a.firmDomain ?? a.firm_domain) as string | undefined,
        }))
      : undefined,
    proximity_code: dto.proximityCode ?? null,
    investor_type: dto.investorType as InvestorType,
    fund_thesis: dto.fundThesis ?? '',
    aum_range: (dto.aumRange ?? '') as AumRange,
    check_size_range: (dto.checkSizeRange ?? '') as CheckSizeRange,
    stage_focus: dto.stageFocus as StageFocus,
    sector_tags: (dto.sectorTags ?? []) as SectorTag[],
    geo_focus: dto.geoFocus ?? '',
    recent_deals: ((dto.recentDeals ?? []) as string[]).join(', '),
    outreach_touches: dto.outreachTouches ?? 0,
    outreach_campaigns: ((dto.outreachCampaigns ?? []) as string[]).join(', '),
    opened: dto.opened ?? 0,
    clicked: dto.clicked ?? 0,
    registered: dto.registered ?? 0,
    first_sent_date: dto.firstSentDate ?? '',
    last_sent_date: dto.lastSentDate ?? '',
    last_contact: dto.lastContact ?? '',
    engagement_tier: dto.engagementTier as EngagementTier,
    enrichment_status: dto.enrichmentStatus as EnrichmentStatus,
    enrichment_date: dto.enrichmentDate ?? '',
    last_enrichment_attempt: dto.lastEnrichmentAttempt ?? '',
    enrichment_notes: dto.enrichmentNotes ?? '',
    lab_os_profile: dto.labOsProfile ? mapLabOsProfile(dto.labOsProfile) : null,
    tags: (dto.tags ?? []) as string[],
    co_invested_team_ids: (dto.coInvestedTeamIds ?? []) as string[],
    best_proximity_code: dto.bestProximityCode ?? null,
    has_path: dto.hasPath ?? false,
    best_route_nodes: dto.bestRouteNodes
      ? (dto.bestRouteNodes as Record<string, unknown>[]).map(mapHopNode)
      : undefined,
    best_route_score: dto.bestRouteScore != null ? (dto.bestRouteScore as number) : undefined,
    path_count: dto.pathCount != null ? (dto.pathCount as number) : undefined,
    enrichment: dto.enrichment ? mapEnrichment(dto.enrichment) : null,
    last_email_date: dto.lastEmailDate ?? null,
    affinity_data: dto.affinityData ? mapAffinityData(dto.affinityData) : null,
  };
}

function mapPortfolioTeamDto(dto: AnyDto): PlPortfolioTeam {
  const co_investors = ((dto.coInvestors ?? []) as AnyDto[]).map((c) => ({
    investor_id: c.investorId as string,
    deal_amount: c.dealAmount as number | undefined,
    deal_date: c.dealDate as string | undefined,
  }));
  const founders = ((dto.founders ?? []) as AnyDto[]).map((f) => ({
    name: f.name as string,
    member_uid: (f.memberUid ?? f.member_uid ?? '') as string,
  }));
  return {
    team_id: dto.teamUid as string,
    team_name: dto.teamName as string,
    logo_url: dto.logoUrl ?? '',
    pl_invested_at: dto.plInvestedAt ?? '',
    pl_invested_stage: dto.plInvestedStage as StageFocus,
    raising_now: dto.raisingNow as RaisingNow | undefined,
    raising_stage: dto.raisingStage as StageFocus | undefined,
    last_round_stage: dto.lastRoundStage as StageFocus | undefined,
    last_round_date: dto.lastRoundDate as string | undefined,
    raising_as_of: dto.raisingAsOf as string | undefined,
    raising_source: dto.raisingSource as string | undefined,
    sectors: (dto.sectors ?? []) as SectorTag[],
    geo: dto.geo ?? '',
    founders,
    co_investors,
  };
}

function mapWarmIntrosResponse(json: AnyDto): WarmIntrosResponse {
  const candidates = ((json.candidates ?? []) as AnyDto[]).map((c) => ({
    investor: mapInvestorDto(c.investor),
    tier: c.tier as WarmIntroTier,
    reason: c.reason as string,
    fit_score: c.fitScore as number,
    evidence: (c.evidence ?? []) as string[],
  }));
  return {
    team: json.team ? mapPortfolioTeamDto(json.team) : undefined,
    total: json.total as number,
    candidates,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Single endpoint for the investor table — used by All / Co-investors tabs.
 * The tab determines which default flags to send (is_co_investor=true for Co-investors).
 */
export async function fetchInvestors(params: InvestorListParams): Promise<InvestorListResponse<OutreachInvestor>> {
  const qs = buildQuery(toApiParams(params));
  const res = await customFetch(`${INVESTORS_API_URL}/investors?${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) return { page: 1, limit: 0, total: 0, items: [] };
  const json = await res.json();
  return { ...json, items: (json.items ?? []).map(mapInvestorDto) };
}

export async function fetchCoInvestorTeams(): Promise<PlPortfolioTeam[]> {
  const res = await customFetch(`${INVESTORS_API_URL}/co-investors/by-team`, { method: 'GET' }, true);
  if (!res || !res.ok) return [];
  const json = await res.json();
  return (json as AnyDto[]).map(mapPortfolioTeamDto);
}

export async function fetchInvestorById(id: string): Promise<OutreachInvestor | null> {
  const res = await customFetch(`${INVESTORS_API_URL}/investors/${encodeURIComponent(id)}`, { method: 'GET' }, true);
  if (!res || !res.ok) return null;
  return mapInvestorDto(await res.json());
}

export async function findWarmIntros(params: WarmIntrosParams): Promise<WarmIntrosResponse> {
  const qs = buildQuery(toWarmIntrosApiParams(params));
  const res = await customFetch(`${INVESTORS_API_URL}/warm-intros?${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) return { total: 0, candidates: [] };
  return mapWarmIntrosResponse(await res.json());
}
