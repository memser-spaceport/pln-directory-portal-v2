import type { IslandId } from './islands';
import fallback from './portfolio.fallback.json';

/**
 * One map tile's team. The fallback file holds one row per tile, in the order
 * MAP_STATES indexes them (generated on 2026-10-13 from marketing's PORTFOLIO
 * and the 2026-09-29 directory name-match snapshot; edit by hand from now on).
 * `uid` is the Directory team when matched; `name` is the Directory name when
 * matched and marketing's otherwise. `projectUid` is the Directory project for
 * an entry that is a project, not a team.
 */
export type PortfolioRow = {
  id: string;
  uid?: string;
  projectUid?: string;
  name: string;
  island: IslandId;
  logo: string;
  startYear: number;
  endYear: number | null;
  oneLiner?: string;
  stage?: string;
  website?: string;
};

/** A row after the merge: `db` when the portfolio API returned its uid. */
export type PortfolioTeam = PortfolioRow & { source: 'db' | 'fallback' };

export const PORTFOLIO_FALLBACK = fallback as PortfolioRow[];
