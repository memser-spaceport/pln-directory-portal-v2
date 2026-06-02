// Mirrors SCHEMA.md (v1.0). 32 columns; field ORDER matters for CSV export
// and column visibility presets.
// Three additive fields beyond the canonical schema (columns 33+):
// lab_os_profile, tags, co_invested_team_ids.
//
// Style note: data/request/response shapes use `type`.
// `interface` is reserved for component Props and store state.

export type InvestorSource =
  | 'W26'
  | 'OpenVC'
  | 'Ramp'
  | 'Visible'
  | 'AlphaGrowth'
  | 'Dealroom'
  | 'RootData'
  | 'Exa'
  | 'Manual'
  | 'Pitchbook'
  | 'Tracxn'
  | 'Foundersuite'
  | 'Crunchbase'
  | 'SecEdgar'
  | 'GitHub'
  | 'FirmTeam';

export type EmailStatus = 'verified' | 'catch_all' | 'unverified' | 'invalid' | 'unknown';

export type InvestorType = 'fund' | 'angel' | 'hybrid' | 'family_office' | 'syndicate' | 'unknown';

export type StageFocus = 'pre-seed' | 'seed' | 'series-a' | 'series-b+' | 'all' | 'unknown';
export type RaisingNow = 'yes' | 'unknown';

export type AumRange = '<50M' | '50-100M' | '100-500M' | '500M-1B' | '1B+' | 'unknown';

export type CheckSizeRange = '<100K' | '100-500K' | '500K-1M' | '1M-5M' | '5M+' | 'unknown';

// SCHEMA.md calls this `sector_tags`; we surface it in UI as "Industry / Sector"
// per LabOS naming convention.
export type SectorTag =
  | 'ai'
  | 'crypto'
  | 'defi'
  | 'infrastructure'
  | 'frontier-tech'
  | 'consumer'
  | 'desci'
  | 'robotics'
  | 'neurotech'
  | 'fintech'
  | 'biotech'
  | 'climate'
  | 'gaming'
  | 'saas'
  | 'other';

export type EngagementTier = 'T1_registered' | 'T2_clicked' | 'T3_opened' | 'T4_cold';

export type EnrichmentStatus = 'pending' | 'in_progress' | 'enriched' | 'partial' | 'failed' | 'skipped';

/** Resolved LabOS profile when an investor's email matches a member or a
 *  fund-team profile in LabOS. Backend ask: include this in the API response
 *  so the frontend doesn't have to do a per-row join. */
export type LabOsProfileRef = {
  type: 'member' | 'team';
  uid: string;
  slug: string;
  name: string;
  /** ISO datetime of last login (for "active" indicator). */
  last_active_at?: string;
};

export type OutreachInvestor = {
  // Identity
  investor_id: string;
  canonical_id: string;
  dedupe_key: string;
  // Provenance
  source: InvestorSource;
  // Person
  first_name: string;
  last_name: string;
  email: string;
  linkedin_url: string;
  // Email quality
  email_status: EmailStatus;
  // Firm
  firm: string;
  firm_domain: string;
  title: string;
  // Investor profile
  investor_type: InvestorType;
  fund_thesis: string;
  aum_range: AumRange;
  check_size_range: CheckSizeRange;
  stage_focus: StageFocus;
  sector_tags: SectorTag[]; // serialized comma-separated in source; deserialized to array here
  geo_focus: string;
  recent_deals: string;
  // Outreach history
  outreach_touches: number;
  outreach_campaigns: string;
  opened: number;
  clicked: number;
  registered: number;
  first_sent_date: string;
  last_sent_date: string;
  engagement_tier: EngagementTier;
  // Pipeline meta
  enrichment_status: EnrichmentStatus;
  enrichment_date: string;
  last_enrichment_attempt: string;
  enrichment_notes: string;

  // ---- Additive fields (frontend-injected for V1 mock; backend ask for Vova) ----

  /** Resolved LabOS profile if this investor's email matches a network user.
   *  null = not in network. */
  lab_os_profile: LabOsProfileRef | null;

  /** Free-form user-applied tags (multi-value). Write path (PATCH /investors/:id/tags)
   *  is Phase 2; for now tags are read from the API and mutated optimistically via
   *  the Zustand overlay. */
  tags: string[];

  /** PL portfolio team_ids this investor has co-invested with PL on.
   *  Empty array = not a co-investor. Derived server-side from cap-table data
   *  (InvestorPortfolioOverlap); populated by the ingest pipeline in Phase 2. */
  co_invested_team_ids: string[];
};

/** A "Network investor" is just an OutreachInvestor with a non-null
 *  lab_os_profile. Kept as a type alias for clarity. */
export type NetworkInvestor = OutreachInvestor & { lab_os_profile: LabOsProfileRef };

export type PlPortfolioTeam = {
  team_id: string;
  team_name: string;
  logo_url: string;
  pl_invested_at: string;
  pl_invested_stage: StageFocus;
  raising_now?: RaisingNow;
  raising_stage?: StageFocus;
  last_round_stage?: StageFocus;
  last_round_date?: string;
  raising_as_of?: string;
  raising_source?: string;
  sectors: SectorTag[];
  geo: string;
  co_investors: Array<{
    investor_id: string;
    deal_amount?: number;
    deal_date?: string;
  }>;
};

export type InvestorListParams = {
  q?: string;
  source?: InvestorSource[];
  investor_type?: InvestorType[];
  stage_focus?: StageFocus[];
  sector_tags?: SectorTag[];
  geo_focus?: string;
  email_status?: EmailStatus[];
  engagement_tier?: EngagementTier[];
  enrichment_status?: EnrichmentStatus[];
  /** Filter to investors with non-null lab_os_profile. */
  in_lab_os?: boolean;
  /** Filter to investors that have co-invested with PL on at least one team. */
  is_co_investor?: boolean;
  /** Filter to investors who have co-invested on a specific PL portfolio team. */
  co_invested_team_id?: string;
  /** Filter by user-applied tags (matches if investor has ANY of these tags). */
  tags?: string[];
  sort?: string; // "field:asc|desc"
  page?: number;
  limit?: number;
};

/**
 * Standard PLN backend pagination envelope (per AGENTS.md rule #19).
 * Consumers compute "has more" as `page * limit < total`.
 */
export type InvestorListResponse<T = OutreachInvestor> = {
  page: number;
  limit: number;
  total: number;
  items: T[];
};

/** Warm-intros search input. Either pick a portfolio team (auto-fills criteria)
 *  or set criteria manually. */
export type WarmIntrosParams = {
  /** PL portfolio team to find warm intros for. When set, the team's stage,
   *  sectors, and geo are pre-filled (but can be overridden). */
  team_id?: string;
  stage_focus?: StageFocus;
  sector_tags?: SectorTag[];
  check_size_range?: CheckSizeRange;
  geo_focus?: string;
};

export type WarmIntroTier = 'co_invested' | 'engaged' | 'cold_match';

export type WarmIntroCandidate = {
  investor: OutreachInvestor;
  tier: WarmIntroTier;
  /** Human-readable reason for ranking, e.g. "Co-invested on Modular Globe (Seed, 2025-03)". */
  reason: string;
  /** 0–100 score. Higher = better fit (combined warmth + sector + stage signal). */
  fit_score: number;
  /** Short evidence chips for the row. */
  evidence: string[];
};

export type WarmIntrosResponse = {
  team?: PlPortfolioTeam; // populated if team_id was passed
  total: number;
  candidates: WarmIntroCandidate[];
};

/** A user-saved filter combination for quick recall, like Linear views. */
export type SavedView = {
  id: string;
  name: string;
  /** Tab the view applies to. */
  tab: 'all' | 'co-investors';
  /** Filter values stored as URL-search-param-style strings. */
  params: Partial<InvestorListParams>;
  created_at: string;
};
