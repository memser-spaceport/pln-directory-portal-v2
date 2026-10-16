/** A team from `GET /v1/explore-pl-network/portfolio`; missing values are null. */
export type PortfolioApiTeam = {
  id: string;
  teamUid: string;
  name: string | null;
  logoUrl: string | null;
  mapLogoUrl: string | null;
  island: string | null;
  startYear: number | null;
  endYear: number | null;
  oneLiner: string | null;
  stage: string | null;
  website: string | null;
};

// The page is mostly static: an hour of ISR, and a slow API never holds it up.
const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 5000;

/**
 * The Directory's PL Portfolio teams for the Networks Map. Public, no token.
 * Returns [] on any failure, so the map renders from its fallback file.
 */
export const getPortfolioTeams = async (): Promise<PortfolioApiTeam[]> => {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/explore-pl-network/portfolio`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`[portfolio.service] API responded with ${response.status}; using the fallback`);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data?.teams) ? data.teams : [];
  } catch (error) {
    console.warn('[portfolio.service] Failed to fetch the portfolio; using the fallback:', error);
    return [];
  }
};
