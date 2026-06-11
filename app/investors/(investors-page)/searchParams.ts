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
  /** Co-investors tab mode: 'list' (default investor table) | 'warm-intros' (workspace). */
  mode: parseAsStringLiteral(CO_INVESTOR_MODE_VALUES).withDefault('list'),

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
  /** Connector-lens label — when set, only members whose paths route through
   *  this founder/team node are shown. */
  wi_connector: parseAsString.withDefault(''),
};

export const investorsFilterCache = createSearchParamsCache(investorsFilterParsers);
