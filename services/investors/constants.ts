import type {
  AumRange,
  CheckSizeRange,
  EmailStatus,
  EngagementTier,
  EnrichmentStatus,
  InvestorSource,
  InvestorType,
  SectorTag,
  StageFocus,
} from './types';

export enum InvestorsQueryKeys {
  INVESTORS_LIST = 'investors-list',
  CO_INVESTOR_TEAMS = 'investors-co-investor-teams',
  INVESTOR_DETAIL = 'investors-detail',
  FILTER_VALUES = 'investors-filter-values',
  WARM_INTROS = 'investors-warm-intros',
  SAVED_VIEWS = 'investors-saved-views',
}

export const SOURCES: InvestorSource[] = [
  'W26',
  'OpenVC',
  'Ramp',
  'Visible',
  'AlphaGrowth',
  'Dealroom',
  'RootData',
  'Exa',
  'Manual',
  'Pitchbook',
  'Tracxn',
  'Foundersuite',
  'Crunchbase',
  'SecEdgar',
  'GitHub',
  'FirmTeam',
];

export const EMAIL_STATUSES: EmailStatus[] = ['verified', 'catch_all', 'unverified', 'invalid', 'unknown'];

export const EMAIL_STATUS_LABEL: Record<EmailStatus, string> = {
  verified: 'Verified',
  catch_all: 'Catch-all',
  unverified: 'Unverified',
  invalid: 'Invalid',
  unknown: 'Unknown',
};

export const INVESTOR_TYPES: InvestorType[] = ['fund', 'angel', 'hybrid', 'family_office', 'syndicate', 'unknown'];

export const INVESTOR_TYPE_LABEL: Record<InvestorType, string> = {
  fund: 'Fund',
  angel: 'Angel',
  hybrid: 'Hybrid',
  family_office: 'Family office',
  syndicate: 'Syndicate',
  unknown: 'Unknown',
};

export const STAGE_FOCUSES: StageFocus[] = ['pre-seed', 'seed', 'series-a', 'series-b+', 'all', 'unknown'];

export const STAGE_FOCUS_LABEL: Record<StageFocus, string> = {
  'pre-seed': 'Pre-seed',
  seed: 'Seed',
  'series-a': 'Series A',
  'series-b+': 'Series B+',
  all: 'Stage-agnostic',
  unknown: 'Unknown',
};

export const AUM_RANGES: AumRange[] = ['<50M', '50-100M', '100-500M', '500M-1B', '1B+', 'unknown'];

export const CHECK_SIZE_RANGES: CheckSizeRange[] = ['<100K', '100-500K', '500K-1M', '1M-5M', '5M+', 'unknown'];

// Surfaced in UI as "Industry / Sector" per LabOS naming convention.
// Underlying schema field stays `sector_tags`; only display label changes.
export const SECTOR_TAGS: SectorTag[] = [
  'ai',
  'crypto',
  'defi',
  'infrastructure',
  'frontier-tech',
  'consumer',
  'desci',
  'robotics',
  'neurotech',
  'fintech',
  'biotech',
  'climate',
  'gaming',
  'saas',
  'other',
];

export const SECTOR_TAG_LABEL: Record<SectorTag, string> = {
  ai: 'AI',
  crypto: 'Crypto',
  defi: 'DeFi',
  infrastructure: 'Infrastructure',
  'frontier-tech': 'Frontier tech',
  consumer: 'Consumer',
  desci: 'DeSci',
  robotics: 'Robotics',
  neurotech: 'Neurotech',
  fintech: 'Fintech',
  biotech: 'Biotech',
  climate: 'Climate',
  gaming: 'Gaming',
  saas: 'SaaS',
  other: 'Other',
};

/** UI-facing label for the `sector_tags` field. */
export const INDUSTRY_SECTOR_LABEL = 'Industry / Sector';

export const ENGAGEMENT_TIERS: EngagementTier[] = ['T1_registered', 'T2_clicked', 'T3_opened', 'T4_cold'];

export const ENGAGEMENT_TIER_LABEL: Record<EngagementTier, string> = {
  T1_registered: 'T1 Registered',
  T2_clicked: 'T2 Clicked',
  T3_opened: 'T3 Opened',
  T4_cold: 'T4 Cold',
};

// Higher tier (lower index) = stronger prior signal.
export const ENGAGEMENT_TIER_RANK: Record<EngagementTier, number> = {
  T1_registered: 0,
  T2_clicked: 1,
  T3_opened: 2,
  T4_cold: 3,
};

export const ENRICHMENT_STATUSES: EnrichmentStatus[] = [
  'pending',
  'in_progress',
  'enriched',
  'partial',
  'failed',
  'skipped',
];

export const ENRICHMENT_NOTE_PREFIXES = [
  { prefix: 'exa', label: 'Exa person finder' },
  { prefix: 'brave', label: 'Brave search' },
  { prefix: 'ddg', label: 'DuckDuckGo search' },
  { prefix: 'hunter', label: 'Hunter' },
  { prefix: 'firm_team', label: 'Firm team page' },
  { prefix: 'verify', label: 'Email verify' },
  { prefix: 'firecrawl', label: 'Firecrawl scrape' },
  { prefix: 'title', label: 'Title source' },
  { prefix: 'thesis', label: 'Thesis source' },
  { prefix: 'person_finder', label: 'Person finder result' },
  { prefix: 'validation', label: 'Validation' },
  { prefix: 'triangulate', label: 'LLM triangulation' },
  { prefix: 'rotation', label: 'Rotation' },
  { prefix: 'deep', label: 'Deep enrichment' },
  { prefix: 'upgrade', label: 'Upgrade' },
  { prefix: 'manual', label: 'Manual note' },
];

export const INVESTOR_COLUMN_GROUPS = [
  {
    group: 'Identity',
    columns: ['investor_id', 'canonical_id', 'dedupe_key'],
  },
  {
    group: 'Provenance',
    columns: ['source'],
  },
  {
    group: 'Person',
    columns: ['first_name', 'last_name', 'email', 'linkedin_url'],
  },
  {
    group: 'Email quality',
    columns: ['email_status'],
  },
  {
    group: 'Firm',
    columns: ['firm', 'firm_domain', 'title'],
  },
  {
    group: 'Investor profile',
    columns: [
      'investor_type',
      'fund_thesis',
      'aum_range',
      'check_size_range',
      'stage_focus',
      'sector_tags',
      'geo_focus',
      'recent_deals',
    ],
  },
  {
    group: 'Outreach history',
    columns: [
      'outreach_touches',
      'outreach_campaigns',
      'opened',
      'clicked',
      'registered',
      'first_sent_date',
      'last_sent_date',
      'engagement_tier',
    ],
  },
  {
    group: 'Pipeline meta',
    columns: ['enrichment_status', 'enrichment_date', 'last_enrichment_attempt', 'enrichment_notes'],
  },
  {
    group: 'LabOS',
    columns: ['lab_os_profile', 'co_invested_team_ids'],
  },
] as const;

export const DEFAULT_VISIBLE_COLUMNS = [
  'name', // synthetic: first_name + last_name + role inline + lab_os_profile badge
  'firm', // displayed as "Team"
  'sector_tags', // "Industry / Sector"
  'stage_focus',
  'investor_type',
  'co_invested_team_ids', // chips for portfolio teams
];

export const ENRICHMENT_QA_VISIBLE_COLUMNS = [
  ...DEFAULT_VISIBLE_COLUMNS,
  'enrichment_status',
  'enrichment_date',
  'last_enrichment_attempt',
  'enrichment_notes',
  'dedupe_key',
  'canonical_id',
];

export const COLUMN_PRESETS = {
  outreach: DEFAULT_VISIBLE_COLUMNS,
  enrichment_qa: ENRICHMENT_QA_VISIBLE_COLUMNS,
} as const;

export type ColumnPresetKey = keyof typeof COLUMN_PRESETS;

// ---- Tabs (2 tabs over the same dataset, different default filters) ----
//
// "In Network" was dropped — it's just a filter on All Investors (`in_lab_os`).
// Co-investors is its own tab because the filter scope (`is_co_investor=true`)
// is the canonical entry point for the warm-intros workflow.

export const INVESTOR_TAB_VALUES = ['all', 'co-investors'] as const;
export type InvestorTab = (typeof INVESTOR_TAB_VALUES)[number];

export const INVESTOR_TAB_LABEL: Record<InvestorTab, string> = {
  all: 'All Investors',
  'co-investors': 'Co-investors',
};

// Co-investors tab modes. Default = list (investor table); warm-intros swaps
// to the workspace UI in-place.
export const CO_INVESTOR_MODE_VALUES = ['list', 'warm-intros'] as const;
export type CoInvestorMode = (typeof CO_INVESTOR_MODE_VALUES)[number];
