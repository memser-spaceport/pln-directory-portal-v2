import { ENGAGEMENT_TIER_RANK } from './constants';
import { INVESTOR_FIXTURES, PL_PORTFOLIO_TEAMS_FIXTURES } from './fixtures';
import type {
  InvestorListParams,
  InvestorListResponse,
  OutreachInvestor,
  PlPortfolioTeam,
  WarmIntroCandidate,
  WarmIntrosParams,
  WarmIntrosResponse,
} from './types';

const DEFAULT_LIMIT = 50;
const SIMULATED_LATENCY_MS = 300;

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function matchesArrayFilter<T>(value: T, allowed?: T[] | T): boolean {
  if (!allowed) return true;
  if (Array.isArray(allowed)) {
    if (allowed.length === 0) return true;
    return allowed.includes(value);
  }
  return value === allowed;
}

function matchesAnyFilter<T>(values: T[], allowed?: T[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  return values.some((v) => allowed.includes(v));
}

function applyFilters(rows: OutreachInvestor[], params: InvestorListParams): OutreachInvestor[] {
  const q = params.q?.toLowerCase().trim();
  const geo = params.geo_focus?.toLowerCase().trim();
  return rows.filter((r) => {
    if (q) {
      const hay = `${r.first_name} ${r.last_name} ${r.email} ${r.firm}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (!matchesArrayFilter(r.source, params.source)) return false;
    if (!matchesArrayFilter(r.investor_type, params.investor_type)) return false;
    if (!matchesArrayFilter(r.stage_focus, params.stage_focus)) return false;
    if (!matchesArrayFilter(r.email_status, params.email_status)) return false;
    if (!matchesArrayFilter(r.engagement_tier, params.engagement_tier)) return false;
    if (!matchesArrayFilter(r.enrichment_status, params.enrichment_status)) return false;
    if (!matchesAnyFilter(r.sector_tags, params.sector_tags)) return false;
    if (!matchesAnyFilter(r.tags, params.tags)) return false;
    if (geo && !r.geo_focus.toLowerCase().includes(geo)) return false;

    // Cross-cutting flags
    if (params.in_lab_os === true && !r.lab_os_profile) return false;
    if (params.is_co_investor === true && r.co_invested_team_ids.length === 0) return false;
    if (params.co_invested_team_id && !r.co_invested_team_ids.includes(params.co_invested_team_id)) return false;

    return true;
  });
}

function applySort(rows: OutreachInvestor[], sort?: string): OutreachInvestor[] {
  if (!sort) {
    // default: engagement_tier asc, last_sent_date desc
    return [...rows].sort((a, b) => {
      const tierDiff = ENGAGEMENT_TIER_RANK[a.engagement_tier] - ENGAGEMENT_TIER_RANK[b.engagement_tier];
      if (tierDiff !== 0) return tierDiff;
      return (b.last_sent_date || '').localeCompare(a.last_sent_date || '');
    });
  }
  const [field, dir] = sort.split(':');
  const mult = dir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[field];
    const bv = (b as unknown as Record<string, unknown>)[field];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mult;
    return String(av ?? '').localeCompare(String(bv ?? '')) * mult;
  });
}

function paginate<T>(rows: T[], page = 1, limit = DEFAULT_LIMIT): InvestorListResponse<T> {
  const start = (page - 1) * limit;
  const items = rows.slice(start, start + limit);
  return { page, limit, total: rows.length, items };
}

/**
 * Single endpoint for the investor table — used by All / In Network /
 * Co-investors tabs. Each tab just sets different default filter flags
 * (in_lab_os, is_co_investor) before calling.
 */
export async function mockGetInvestors(params: InvestorListParams): Promise<InvestorListResponse<OutreachInvestor>> {
  await delay(SIMULATED_LATENCY_MS);
  const filtered = applyFilters(INVESTOR_FIXTURES, params);
  const sorted = applySort(filtered, params.sort);
  return paginate(sorted, params.page, params.limit);
}

export async function mockGetCoInvestorTeams(): Promise<PlPortfolioTeam[]> {
  await delay(SIMULATED_LATENCY_MS);
  return PL_PORTFOLIO_TEAMS_FIXTURES;
}

export async function mockGetInvestorById(id: string): Promise<OutreachInvestor | null> {
  await delay(120);
  return INVESTOR_FIXTURES.find((i) => i.investor_id === id) ?? null;
}

// ---- Warm intros ranking ----

/**
 * Score an investor's fit for a target portfolio team / criteria.
 * Combined score: warmth (network path) + criteria match (sectors, stage,
 * geo, check size). Higher = better.
 */
function scoreCandidate(
  inv: OutreachInvestor,
  team: PlPortfolioTeam | undefined,
  params: WarmIntrosParams,
): { tier: WarmIntroCandidate['tier']; score: number; reason: string; evidence: string[] } {
  let score = 0;
  const evidence: string[] = [];
  let tier: WarmIntroCandidate['tier'] = 'cold_match';
  let reason = '';

  // ---- Warmth signal ----
  if (team && inv.co_invested_team_ids.includes(team.team_id)) {
    tier = 'co_invested';
    score += 50;
    reason = `Co-invested on ${team.team_name}`;
    evidence.push(`Same team: ${team.team_name}`);
  } else if (inv.co_invested_team_ids.length > 0) {
    tier = 'co_invested';
    score += 35;
    const otherTeam = PL_PORTFOLIO_TEAMS_FIXTURES.find((t) => t.team_id === inv.co_invested_team_ids[0]);
    reason = `Co-invested on ${otherTeam?.team_name ?? 'PL portfolio team'}`;
    if (inv.co_invested_team_ids.length > 1) evidence.push(`+ ${inv.co_invested_team_ids.length - 1} more`);
  } else if (inv.engagement_tier === 'T1_registered' || inv.engagement_tier === 'T2_clicked') {
    tier = 'engaged';
    score += inv.engagement_tier === 'T1_registered' ? 30 : 22;
    reason = inv.engagement_tier === 'T1_registered' ? 'Registered for last Demo Day' : 'Clicked recent outreach';
    evidence.push(inv.engagement_tier.replace('_', ' '));
  } else if (inv.engagement_tier === 'T3_opened') {
    tier = 'engaged';
    score += 14;
    reason = 'Opened recent outreach';
    evidence.push('T3 Opened');
  } else {
    tier = 'cold_match';
    reason = 'Stage + sector match · no prior touch';
  }

  // ---- Sector match ----
  const targetSectors = params.sector_tags ?? team?.sectors ?? [];
  if (targetSectors.length > 0) {
    const overlap = inv.sector_tags.filter((s) => targetSectors.includes(s));
    if (overlap.length > 0) {
      score += 10 * overlap.length;
      evidence.push(`Sector match: ${overlap.join(', ')}`);
    } else if (tier === 'cold_match') {
      // No sector overlap and no warm path: skip from results entirely
      score = 0;
    }
  }

  // ---- Stage match ----
  const targetStage = params.stage_focus ?? team?.raising_now ?? team?.pl_invested_stage;
  if (targetStage && (inv.stage_focus === targetStage || inv.stage_focus === 'all')) {
    score += 10;
  }

  // ---- Email deliverability bonus ----
  if (inv.email_status === 'verified') score += 5;

  // Cap at 100
  if (score > 100) score = 100;

  return { tier, score, reason, evidence };
}

export async function mockFindWarmIntros(params: WarmIntrosParams): Promise<WarmIntrosResponse> {
  await delay(SIMULATED_LATENCY_MS);
  const team = params.team_id ? PL_PORTFOLIO_TEAMS_FIXTURES.find((t) => t.team_id === params.team_id) : undefined;
  const candidates: WarmIntroCandidate[] = INVESTOR_FIXTURES
    .map((inv) => {
      const { tier, score, reason, evidence } = scoreCandidate(inv, team, params);
      return { investor: inv, tier, fit_score: score, reason, evidence };
    })
    .filter((c) => c.fit_score > 0)
    .sort((a, b) => b.fit_score - a.fit_score);
  return { team, total: candidates.length, candidates };
}
