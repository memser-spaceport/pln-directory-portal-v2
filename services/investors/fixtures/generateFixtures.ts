import {
  AUM_RANGES,
  CHECK_SIZE_RANGES,
  EMAIL_STATUSES,
  INVESTOR_TYPES,
  SECTOR_TAGS,
  SOURCES,
  STAGE_FOCUSES,
} from '../constants';
import type {
  EmailStatus,
  EngagementTier,
  EnrichmentStatus,
  InvestorSource,
  InvestorType,
  LabOsProfileRef,
  OutreachInvestor,
  PlPortfolioTeam,
  SectorTag,
  StageFocus,
} from '../types';

// ---- Deterministic LCG so fixtures are stable across renders ----
function lcg(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 0xffffffff;
    return state / 0xffffffff;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(rng: () => number, arr: readonly T[], min: number, max: number): T[] {
  const n = min + Math.floor(rng() * (max - min + 1));
  const out: T[] = [];
  const pool = [...arr];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function maybe<T>(rng: () => number, density: number, value: T, fallback: T): T {
  return rng() < density ? value : fallback;
}

const FIRST_NAMES = [
  'Alice', 'Ben', 'Cara', 'Dani', 'Eli', 'Fiona', 'Gus', 'Hana', 'Ivan', 'Jin',
  'Kai', 'Lena', 'Marc', 'Nia', 'Omar', 'Priya', 'Quinn', 'Rafi', 'Sam', 'Tess',
  'Uri', 'Vera', 'Wes', 'Xenia', 'Yara', 'Zack', 'Aki', 'Bea', 'Cy', 'Devi',
];

const LAST_NAMES = [
  'Brown', 'Chen', 'Davis', 'Evans', 'Fischer', 'Garcia', 'Hayes', 'Ito',
  'Johansson', 'Kapoor', 'Lopez', 'Mehta', 'Nakamura', 'Okonkwo', 'Patel', 'Quan',
  'Rao', 'Singh', 'Tanaka', 'Umar', 'Volkov', 'Wong', 'Xu', 'Yamada', 'Zaidi',
  'Costa', 'Diaz', 'Edwards', 'Foster', 'Greene',
];

const FIRM_PREFIXES = [
  'Acme', 'Polaris', 'Catalyst', 'Atlas', 'Vector', 'Beacon', 'Forge', 'Quanta',
  'Nimbus', 'Helix', 'Apex', 'Lumen', 'Pioneer', 'Radix', 'Strata', 'Solstice',
  'Continuum', 'Trellis', 'Hyperion', 'Lattice', 'Aether', 'Cascade',
];

const FIRM_SUFFIXES = ['Capital', 'Ventures', 'Partners', 'Labs', 'Fund', 'Holdings', 'Group'];

const TITLES = [
  'Managing Partner', 'General Partner', 'Partner', 'Principal', 'Investor',
  'Investment Director', 'Associate', 'Vice President', 'Founder', 'Founding Partner',
];

const GEO_OPTIONS = [
  '', 'US', 'US, Europe', 'Europe', 'Global', 'US, Asia', 'EMEA', 'Bay Area',
  'NYC, London', 'Singapore, US', 'LatAm', 'India, US',
];

const RECENT_DEAL_POOL = [
  'Acme Inc', 'Widget Co', 'Foo Labs', 'Bar Systems', 'Northwind', 'Globex',
  'Initech', 'Hooli', 'Pied Piper', 'Stark Industries', 'Wayne Enterprises',
  'Cyberdyne', 'Tyrell Corp', 'Wonka',
];

const CAMPAIGN_POOL = ['W25', 'W26', 'Demo-Day-Fall-25', 'Demo-Day-Spring-26'];

function makeNotes(rng: () => number, status: EnrichmentStatus): string {
  if (status === 'pending') return '';
  const parts: string[] = [];
  parts.push(pick(rng, ['exa:found_linkedin', 'brave:found_linkedin', 'firm_team:found_linkedin']));
  if (rng() < 0.7) parts.push(`verify:${pick(rng, EMAIL_STATUSES)}`);
  if (rng() < 0.5) parts.push('firecrawl:thesis');
  if (rng() < 0.3) parts.push(`triangulate:conf=${pick(rng, ['high', 'medium', 'low'])}`);
  if (rng() < 0.15) parts.push('thesis:rejected_error_page');
  if (rng() < 0.1) parts.push(`rotation:misses:${1 + Math.floor(rng() * 4)}`);
  return parts.join('; ');
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function isoDate(rng: () => number, daysBack: number): string {
  const today = new Date('2026-05-14T00:00:00Z');
  const offset = Math.floor(rng() * daysBack);
  const d = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function isoDateTime(rng: () => number, daysBack: number): string {
  const today = new Date('2026-05-14T00:00:00Z');
  const offset = Math.floor(rng() * daysBack);
  const ms = Math.floor(rng() * 86400000);
  const d = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000 + ms);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Build the base OutreachInvestor record. lab_os_profile, tags, and
 * co_invested_team_ids start empty — they're populated by the post-processing
 * passes (assignLabOsProfiles, assignCoInvestments) after generation.
 */
function buildOutreachInvestor(rng: () => number, idx: number): OutreachInvestor {
  const first = pick(rng, FIRST_NAMES);
  const last = pick(rng, LAST_NAMES);
  const firmPrefix = pick(rng, FIRM_PREFIXES);
  const firmSuffix = pick(rng, FIRM_SUFFIXES);
  const firm = `${firmPrefix} ${firmSuffix}`;
  const firmDomain = `${firmPrefix.toLowerCase()}${firmSuffix === 'Ventures' ? 'vc' : ''}.com`;
  const isPersonalEmail = rng() < 0.18;
  const email = isPersonalEmail
    ? `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`
    : `${first.toLowerCase()}@${firmDomain}`;
  const investorType: InvestorType = isPersonalEmail
    ? pick(rng, ['angel', 'angel', 'hybrid', 'syndicate'] as InvestorType[])
    : pick(rng, ['fund', 'fund', 'fund', 'family_office', 'hybrid'] as InvestorType[]);
  const stage: StageFocus = pick(rng, STAGE_FOCUSES);
  const sectors: SectorTag[] = pickN(rng, SECTOR_TAGS, 1, 4);
  const tier: EngagementTier = (() => {
    const r = rng();
    if (r < 0.05) return 'T1_registered';
    if (r < 0.18) return 'T2_clicked';
    if (r < 0.45) return 'T3_opened';
    return 'T4_cold';
  })();
  const enrichmentStatus: EnrichmentStatus = (() => {
    const r = rng();
    if (r < 0.55) return 'enriched';
    if (r < 0.75) return 'partial';
    if (r < 0.85) return 'pending';
    if (r < 0.95) return 'failed';
    return 'skipped';
  })();
  const emailStatus: EmailStatus = (() => {
    if (enrichmentStatus === 'pending' || enrichmentStatus === 'failed') return 'unknown';
    const r = rng();
    if (r < 0.55) return 'verified';
    if (r < 0.75) return 'catch_all';
    if (r < 0.9) return 'unverified';
    return 'invalid';
  })();
  const isWarm = tier === 'T1_registered' || tier === 'T2_clicked' || tier === 'T3_opened';
  const touches = isWarm ? 1 + Math.floor(rng() * 5) : Math.floor(rng() * 2);
  const opened = touches > 0 && tier !== 'T4_cold' ? 1 + Math.floor(rng() * touches) : 0;
  const clicked = tier === 'T2_clicked' || tier === 'T1_registered' ? 1 : 0;
  const registered = tier === 'T1_registered' ? 1 : 0;
  const firstSent = touches > 0 ? isoDate(rng, 240) : '';
  const lastSent = touches > 0 ? isoDate(rng, 60) : '';
  const enrichmentDate = enrichmentStatus === 'enriched' || enrichmentStatus === 'partial' ? isoDate(rng, 30) : '';
  const lastAttempt = enrichmentStatus !== 'pending' ? isoDateTime(rng, 30) : '';
  const linkedin =
    enrichmentStatus === 'enriched' || enrichmentStatus === 'partial'
      ? `https://www.linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-${pad(idx, 4)}`
      : '';
  const thesis =
    enrichmentStatus === 'enriched'
      ? `${pick(rng, ['Seed', 'Pre-seed', 'Early', 'Multi-stage'])}-stage ${sectors[0] === 'ai' ? 'AI' : sectors[0]} investors across ${pick(rng, ['US', 'US and Europe', 'global'])}.`
      : '';
  const recentDeals = enrichmentStatus === 'enriched' && rng() < 0.3 ? pickN(rng, RECENT_DEAL_POOL, 2, 4).join(', ') : '';
  const aum = maybe(rng, 0.18, pick(rng, AUM_RANGES), 'unknown');
  const checkSize = maybe(rng, 0.22, pick(rng, CHECK_SIZE_RANGES), 'unknown');
  const investorId = `INV-${pad(idx, 6)}`;
  const isDuplicate = rng() < 0.04;
  const canonicalId = isDuplicate ? `INV-${pad(Math.max(0, idx - 1), 6)}` : '';
  const source: InvestorSource = pick(rng, SOURCES);
  const campaigns = touches > 0 ? pickN(rng, CAMPAIGN_POOL, 1, 2).join(', ') : '';
  const geo = pick(rng, GEO_OPTIONS);

  return {
    investor_id: investorId,
    canonical_id: canonicalId,
    dedupe_key: email,
    source,
    first_name: first,
    last_name: rng() < 0.95 ? last : '',
    email,
    linkedin_url: linkedin,
    email_status: emailStatus,
    firm: isPersonalEmail && rng() < 0.4 ? '' : firm,
    firm_domain: isPersonalEmail ? '' : firmDomain,
    title: enrichmentStatus === 'enriched' || enrichmentStatus === 'partial' ? pick(rng, TITLES) : '',
    investor_type: investorType,
    fund_thesis: thesis,
    aum_range: aum,
    check_size_range: checkSize,
    stage_focus: stage,
    sector_tags: sectors,
    geo_focus: geo,
    recent_deals: recentDeals,
    outreach_touches: touches,
    outreach_campaigns: campaigns,
    opened,
    clicked,
    registered,
    first_sent_date: firstSent,
    last_sent_date: lastSent,
    engagement_tier: tier,
    enrichment_status: enrichmentStatus,
    enrichment_date: enrichmentDate,
    last_enrichment_attempt: lastAttempt,
    enrichment_notes: makeNotes(rng, enrichmentStatus),

    // Additive fields (post-processed below)
    lab_os_profile: null,
    tags: [],
    co_invested_team_ids: [],
  };
}

/**
 * ~30% of investors are "in network" (have a LabOS profile). Skewed toward
 * warmer engagement tiers so the In Network tab feels alive.
 */
function assignLabOsProfiles(investors: OutreachInvestor[], rng: () => number): void {
  for (const inv of investors) {
    const probability =
      inv.engagement_tier === 'T1_registered' ? 0.85 :
      inv.engagement_tier === 'T2_clicked' ? 0.55 :
      inv.engagement_tier === 'T3_opened' ? 0.30 :
      0.12;
    if (rng() >= probability) continue;

    const isTeam = rng() < 0.3 && inv.firm.length > 0;
    const slugBase = isTeam
      ? inv.firm.toLowerCase().replace(/\s+/g, '-')
      : `${inv.first_name}-${inv.last_name}`.toLowerCase();
    const profile: LabOsProfileRef = {
      type: isTeam ? 'team' : 'member',
      uid: `${isTeam ? 'team' : 'mem'}-${inv.investor_id.slice(4)}`,
      slug: slugBase,
      name: isTeam ? inv.firm : `${inv.first_name} ${inv.last_name}`,
      last_active_at: isoDate(rng, 60),
    };
    inv.lab_os_profile = profile;
  }
}

const PORTFOLIO_TEAM_NAMES = [
  'Modular Globe', 'Lattice Labs', 'Nimbus Health', 'Polaris Compute',
  'Cascade Robotics', 'Forge Bio', 'Vector Climate', 'Helix Storage',
  'Strata DePIN', 'Apex Decentral', 'Beacon Energy', 'Trellis Mesh',
  'Quanta Edge', 'Hyperion Models', 'Aether AI',
];

function buildPortfolioTeams(rng: () => number, investors: OutreachInvestor[]): PlPortfolioTeam[] {
  return PORTFOLIO_TEAM_NAMES.map((name, idx) => {
    const teamId = `team-${pad(idx + 1, 3)}`;
    const stage = pick(rng, ['seed', 'series-a', 'pre-seed', 'series-b+'] as StageFocus[]);
    const raisingNow = pick(rng, [stage, 'series-a', 'series-b+'] as StageFocus[]);
    const sectors = pickN(rng, SECTOR_TAGS, 1, 3);
    const geo = pick(rng, GEO_OPTIONS.filter((g) => g !== ''));
    const coCount = 4 + Math.floor(rng() * 12);
    const pool = [...investors];
    const co = [];
    for (let i = 0; i < coCount && pool.length; i++) {
      const j = Math.floor(rng() * pool.length);
      const inv = pool.splice(j, 1)[0];
      co.push({
        investor_id: inv.investor_id,
        deal_amount: 250_000 + Math.floor(rng() * 5_000_000),
        deal_date: isoDate(rng, 540),
      });
    }
    return {
      team_id: teamId,
      team_name: name,
      logo_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name)}`,
      pl_invested_at: isoDate(rng, 720),
      pl_invested_stage: stage,
      raising_now: raisingNow,
      sectors,
      geo,
      co_investors: co,
    };
  });
}

/**
 * Back-fill `co_invested_team_ids` on each investor by walking the portfolio
 * team list. After this, an investor with non-empty co_invested_team_ids is
 * a co-investor of PL.
 */
function assignCoInvestments(teams: PlPortfolioTeam[], investors: OutreachInvestor[]): void {
  const byInvestorId = new Map(investors.map((i) => [i.investor_id, i]));
  for (const t of teams) {
    for (const co of t.co_investors) {
      const inv = byInvestorId.get(co.investor_id);
      if (inv) inv.co_invested_team_ids.push(t.team_id);
    }
  }
}

/**
 * Build the full fixture set in one pass so cross-references between
 * investors, LabOS profiles, and portfolio teams stay consistent.
 */
export function buildAllFixtures(): {
  investors: OutreachInvestor[];
  teams: PlPortfolioTeam[];
} {
  const rng = lcg(20260514);
  const investors = Array.from({ length: 250 }, (_, i) => buildOutreachInvestor(rng, i + 1));
  assignLabOsProfiles(investors, rng);
  const teams = buildPortfolioTeams(rng, investors);
  assignCoInvestments(teams, investors);
  return { investors, teams };
}
