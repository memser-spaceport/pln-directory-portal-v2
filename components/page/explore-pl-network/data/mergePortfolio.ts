import type { PortfolioApiTeam } from '@/services/explore-pl-network/portfolio.service';
import { ISLANDS } from './islands';
import type { PortfolioRow, PortfolioTeam } from './portfolio';

const ISLAND_IDS = new Set<string>(ISLANDS.map((i) => i.id));

// An empty DB value keeps the file's.
const filled = (v: string | null | undefined): v is string => typeof v === 'string' && v.trim() !== '';

/**
 * The map's teams: the fallback rows in their own order (MAP_STATES indexes
 * them), with the Directory's values over them where the API returned the uid.
 * - Name, one-liner, stage, website and the white map logo win when non-empty.
 * - Years win when the DB has a start year; the end year then follows the DB, null included.
 * - The island stays the file's: tile positions assume it. A different DB island is only logged.
 * - API teams with no fallback row get no tile.
 */
export function mergePortfolio(fallback: PortfolioRow[], apiTeams: PortfolioApiTeam[]): PortfolioTeam[] {
  const byUid = new Map(apiTeams.map((t) => [t.teamUid, t]));

  return fallback.map((row) => {
    const api = row.uid ? byUid.get(row.uid) : undefined;
    if (!api) return { ...row, source: 'fallback' };

    if (api.island !== null && (!ISLAND_IDS.has(api.island) || api.island !== row.island)) {
      console.warn(
        `[mergePortfolio] Team ${row.uid} has island '${api.island}' in the Directory; keeping '${row.island}'`,
      );
    }

    return {
      ...row,
      name: filled(api.name) ? api.name : row.name,
      logo: filled(api.mapLogoUrl) ? api.mapLogoUrl : row.logo,
      oneLiner: filled(api.oneLiner) ? api.oneLiner : row.oneLiner,
      stage: filled(api.stage) ? api.stage : row.stage,
      website: filled(api.website) ? api.website : row.website,
      ...(api.startYear !== null && { startYear: api.startYear, endYear: api.endYear }),
      source: 'db',
    };
  });
}
