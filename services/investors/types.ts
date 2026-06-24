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

/** Aggregated "who is this investor/LP" background + verifiable sources, from the
 *  Phase-1 / prestige enrichment pass. bio/thesis may carry [1], [2]… markers
 *  that index into `sources`. */
export type InvestorEnrichment = {
  bio: string | null;
  fund_focus: string | null;
  aum: string | null;
  notable_investments: string[];
  thesis: string | null;
  sources: string[];
  enriched_via: string | null;
  fetched_at: string | null;
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

  /** PL Path Finder proximity code from ingest (e.g. "VC+1A"). null when not set. */
  proximity_code: string | null;

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

  // ---- Path Finder summary (additive; denormalized from PathfinderPath) ----

  /** Best (rank 1) proximity code for this investor, e.g. "F+2B". Denormalized
   *  onto the record by the pathfinder ingest so the list can render the
   *  proximity axis without fetching the full path list. Undefined/null until a
   *  pathfinder run has covered this investor. */
  best_proximity_code?: string | null;

  /** Whether any warm path exists. false/undefined = cold (no path). */
  has_path?: boolean;

  /** Nodes of the best (rank 1) path, denormalized from the pathfinder for
   *  inline table display. Populated when the list endpoint includes bestRouteNodes. */
  best_route_nodes?: PathHopNode[];

  /** Warmth score (0–1) of the best path, e.g. 0.9 → "90%". */
  best_route_score?: number;

  /** Total count of computed paths for this investor (for "View all (N)"). */
  path_count?: number;

  /** Aggregated background + sources ("who is this investor"); null until enriched. */
  enrichment?: InvestorEnrichment | null;

  /** Affinity "Last Email Date" (ISO). Surfaced under the warm-path summary graph
   *  as a relative time ("last email ~3 weeks ago"). null/undefined until the
   *  backend sends it — the clause is omitted when absent. */
  last_email_date?: string | null;
};

/** A "Network investor" is just an OutreachInvestor with a non-null
 *  lab_os_profile. Kept as a type alias for clarity. */
export type NetworkInvestor = OutreachInvestor & { lab_os_profile: LabOsProfileRef };

/** A founder on a PL portfolio team — used for the unified search (founder/team
 *  → connector-lens filter). Sourced from the `founders[]` array now included on
 *  `/co-investors/by-team`. */
export type TeamFounder = {
  name: string;
  member_uid: string;
};

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
  /** Founders of this team (name + LabOS member uid). Used as connector nodes
   *  in the unified search. Empty if the team has no resolved founders. */
  founders: TeamFounder[];
  co_investors: Array<{
    investor_id: string;
    deal_amount?: number;
    deal_date?: string;
  }>;
};

// ─── Investor Lists (Lists IA) ──────────────────────────────────────────────
//
// A curated, pre-created target set the warm-intros workspace operates over.
// Proximity is only meaningful within a graphed list. v1: lists are seeded /
// imported (not user-created) — see "Lists IA — DECISIONS LOCKED".

export type InvestorList = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Whether a pathfinder run has graphed this list's members (proximity codes
   *  only render for graphed lists). */
  is_graphed: boolean;
  member_count: number;
  /** Present when lists were fetched with ?investorId= for membership context. */
  is_member?: boolean;
};

/** Filters for the in-list member refinement (server-side). */
export type ListMembersParams = {
  q?: string;
  sector_tags?: SectorTag[];
  stage_focus?: StageFocus[];
  check_size_range?: CheckSizeRange[];
  /** Relationship lens: co-invested / engaged / cold. */
  relationship?: WarmIntroTier[];
  /** Connector lens (task 04): exact / substring connector labels — server-side
   *  filter to members reachable through that connector across the whole list. */
  connector_labels?: string[];
  connector_labels_contains?: string[];
  page?: number;
  limit?: number;
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

// ─── PL Path Finder ─────────────────────────────────────────────────────────
//
// Proximity (reachability) is a SEPARATE axis from `fit_score` (sector/stage
// fit). The path engine answers "how warmly can PL reach this investor", not
// "should PL want them" — keep the two axes distinct in the UI.

/** Connector category — which "door" the path goes through. Categorical, NOT a
 *  ladder: F = portfolio founder, VC = co-investor / known VC, JB / PL =
 *  rolodex, O = other, C = cold (no path). */
export type PathConnectorType = 'F' | 'VC' | 'JB' | 'PL' | 'O' | 'C';

/** Caliber gate result: A = relationship AND contact prestige; B = either. */
export type PathCaliber = 'A' | 'B';

export type PathHopNode =
  | { id: string; label: string; type: 'person'; member_uid: string } // pl_member — in PL network
  | { id: string; label: string; type: 'person'; member_uid?: never } // external_person
  | { id: string; label: string; type: 'org'; team_uid: string } // portfolio_org — in PL network
  | { id: string; label: string; type: 'org'; team_uid?: never }; // vc_org — external firm

/** Person to reach when the direct contact is known (additive; from pathfinder v2 API). */
export type PathContact = {
  id?: string;
  name: string;
  role?: string;
  email?: string;
  image_url?: string;
  linkedin_url?: string;
  telegram?: string;
  /** Set when the contact is a PL network member. */
  member_uid?: string;
};

/** Firm to route through when the specific person is unknown (additive; from pathfinder v2 API). */
export type PathOrgConnector = {
  id?: string;
  name: string;
  domain?: string;
  website_url?: string;
  logo_url?: string;
  /** Set when the org is a PL portfolio team. */
  team_uid?: string;
};

export type PathHopEdge = {
  from: string;
  to: string;
  connector_type: string;
  probability: number;
  evidence: string | null;
};

/** A richer path node from the v2 pathfinder API — replaces generic org/person
 *  labels with actual named people and their contact details. */
export type RouteNode = {
  label: string;
  role?: string;
  email?: string;
  variant: 'member' | 'external';
  imageUrl?: string;
  linkedin?: string;
  memberUid?: string;
  contacts?: Array<{
    name: string;
    role?: string;
    email?: string;
    source?: string;
    imageUrl?: string;
    linkedin?: string;
    memberUid?: string;
  }>;
};

export type PathHopChain = {
  nodes: PathHopNode[];
  /** Rich per-hop contacts (v2 API). When present, prefer over `nodes` for display. */
  routeNodes?: RouteNode[];
  edges: PathHopEdge[];
  /** Plain-English description of the path, surfaced in the expanded row. */
  explanation: string;
};

/** A single ranked warm path to a target investor (one PathfinderPath row). */
export type PathfinderPath = {
  id: number;
  target_investor_id: string;
  /** Slug of the investor list this path was computed for (e.g. "neuro-fund-i"). */
  target_set?: string;
  connector_type: PathConnectorType;
  /** Social distance: 1 = direct, 2 = one intermediary, 3 = hard ceiling. */
  hops: number;
  /** null when cold. */
  caliber: PathCaliber | null;
  /** Denormalized human-facing code, e.g. "JB+1A", "F+2B", "C". */
  proximity_code: string;
  /** 0–1 success-probability score (product of edge probabilities). Warmer = higher. */
  score: number;
  /** 0–1 confidence in the computed caliber/code; null when the model abstains. */
  caliber_confidence: number | null;
  hop_chain: PathHopChain;
  /** Rank within this target's path list (1 = best). */
  rank: number;
  computed_at?: string;
  /** Pending (not yet recomputed) human overrides already submitted for this
   *  path — shown so admins don't submit the same correction twice. */
  corrections: PathCorrection[];
  // ── People-first path data (additive; from pathfinder v2 API) ────────────────
  /** Direct person to reach when known. Null/absent = contact not resolved. */
  contact?: PathContact;
  /** Firm to route through when the specific person is unknown. */
  org_connector?: PathOrgConnector;
};

/** A pending correction on a path, as returned by GET /pathfinder/paths/:investorId. */
export type PathCorrection = {
  id: number;
  field: PathCorrectionField | string;
  old_value: unknown;
  new_value: unknown;
  note: string | null;
  actor_email: string | null;
  created_at: string;
};

export type PathsForTargetResponse = {
  target_investor_id: string;
  total: number;
  paths: PathfinderPath[];
};

/** ID domain of a correction's subject_id (mirrors backend CreateCorrectionDto):
 *  subject_type says what kind of thing subject_id identifies; `field` says which
 *  attribute is being corrected. A caliber override on a path is subject_type
 *  'path' + field 'caliber'. */
export type CorrectionSubjectType = 'path' | 'crosswalk' | 'entity' | 'action' | 'curation';

/** Attributes correctable on a PathfinderPath (mirrors backend PATH_CORRECTION_FIELDS). */
export type PathCorrectionField = 'caliber' | 'connector_type' | 'valid' | 'note';

/** A persisted investment-team override; feeds the next recompute and seeds the
 *  future Affinity write-back. */
export type CorrectionInput = {
  subject_type: CorrectionSubjectType;
  subject_id: string;
  field: string;
  old_value?: unknown;
  new_value?: unknown;
  note?: string;
};

// ─── Crosswalk review queue ─────────────────────────────────────────────────
//
// Entity-resolution candidates the pathfinder could not auto-link (fuzzy
// name/firm match). A curator confirms (link) or rejects (keep separate); the
// resolution is logged as a PathfinderCorrection and feeds the next recompute.

export type CrosswalkReviewItem = {
  id: string;
  /** The Directory/Affinity entity being resolved. */
  source_label: string;
  /** The candidate it might be the same as. */
  candidate_label: string;
  /** 0–1 fuzzy match confidence. */
  match_confidence: number;
  /** Why it landed in review, e.g. "name match, firm differs". */
  reason: string;
  source_domain?: string;
  candidate_domain?: string;
};

export type CrosswalkReviewResponse = {
  page: number;
  limit: number;
  total: number;
  items: CrosswalkReviewItem[];
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
