import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server';
import { CO_INVESTOR_MODE_VALUES, INVESTOR_TAB_VALUES } from '@/services/investors/constants';

export const investorsFilterParsers = {
  // Top-level + sub-navigation
  tab: parseAsStringLiteral(INVESTOR_TAB_VALUES).withDefault('all'),
  /** Workspace mode: 'warm-intros' (default) | 'list' (All Investors table). */
  mode: parseAsStringLiteral(CO_INVESTOR_MODE_VALUES).withDefault('warm-intros'),

  // Shared filters across tabs
  q: parseAsString.withDefault(''),
  source: parseAsArrayOf(parseAsString, ',').withDefault([]),
  investor_type: parseAsArrayOf(parseAsString, ',').withDefault([]),
  stage_focus: parseAsArrayOf(parseAsString, ',').withDefault([]),
  sector_tags: parseAsArrayOf(parseAsString, ',').withDefault([]),
  geo_focus: parseAsString.withDefault(''),
  email_status: parseAsArrayOf(parseAsString, ',').withDefault([]),
  engagement_tier: parseAsArrayOf(parseAsString, ',').withDefault([]),
  enrichment_status: parseAsArrayOf(parseAsString, ',').withDefault([]),

  // Cross-cutting flags (toggleable on All Investors; default-on for Co-investors tab)
  in_lab_os: parseAsBoolean.withDefault(false),
  is_co_investor: parseAsBoolean.withDefault(false),
  co_invested_team_id: parseAsString.withDefault(''),

  // User-applied tags (multi-value)
  tags: parseAsArrayOf(parseAsString, ',').withDefault([]),

  // Saved view (mutually exclusive with raw filters in URL — picking a view replaces them)
  view: parseAsString.withDefault(''),

  // List state
  sort: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),

  // Drawer
  investorId: parseAsString.withDefault(''),

  // Warm intros workspace (only used when mode=warm-intros)
  /** Selected target list id (Lists IA). Drives the ranked member table. */
  wi_list_id: parseAsString.withDefault(''),
  wi_stage: parseAsString.withDefault(''),
  wi_sectors: parseAsArrayOf(parseAsString, ',').withDefault([]),
  wi_check_size: parseAsString.withDefault(''),
  /** Connector-lens display label (chip). */
  wi_connector: parseAsString.withDefault(''),
  /** Exact hop-chain node labels sent to connector-matches. */
  wi_connector_labels: parseAsArrayOf(parseAsString, '|').withDefault([]),
  /** Substring hop-chain node labels (team names embedded in longer labels). */
  wi_connector_contains: parseAsArrayOf(parseAsString, '|').withDefault([]),
  /** PL member UIDs to filter by (from facets). Empty = no filter. */
  wi_pl_members: parseAsArrayOf(parseAsString, ',').withDefault([]),
  /** null = off, true = show any founder. */
  wi_any_founder: parseAsBoolean,
  /** Specific founder member UIDs (from facets). Empty = no filter. */
  wi_founder_uids: parseAsArrayOf(parseAsString, ',').withDefault([]),
  /** null = off, true = direct-path only (no intermediary hops). */
  wi_direct_only: parseAsBoolean,
  /** Path data source: absent/empty = all; `affinity` | `linkedin` (single-select). */
  wi_source: parseAsString.withDefault(''),
};

export const investorsFilterCache = createSearchParamsCache(investorsFilterParsers);
