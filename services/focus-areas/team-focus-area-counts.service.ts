// Counts move slowly; an hour of ISR, and a slow API never holds the page up.
const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 5000;

/**
 * Teams per focus-area title, as `/teams?focusAreas=<title>` lists them, for Home's focus-area cards (LAB-3162: the card
 * counted the marketing map's teams on that island, 199 for Digital Human Rights, while its Teams link opened 360).
 *
 * Read from the same `GET /v1/teams-search` the Teams page reads its total from, one `limit=1` call per title. Not from
 * `/v1/focus-areas?type=Team`: that also counts teams the list leaves out (396 there against 360 on the list).
 *
 * Public, no token. All or nothing: any failed call returns null, so no card shows a number the others can't back up.
 */
export const getTeamFocusAreaCounts = async (titles: readonly string[]): Promise<Record<string, number> | null> => {
  try {
    const totals = await Promise.all(
      titles.map(async (title) => {
        const response = await fetch(
          `${process.env.DIRECTORY_API_URL}/v1/teams-search?page=1&limit=1&focusAreas=${encodeURIComponent(title)}`,
          { next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(TIMEOUT_MS) },
        );
        if (!response.ok) throw new Error(`teams-search responded with ${response.status} for "${title}"`);
        const { total } = (await response.json()) as { total?: unknown };
        if (typeof total !== 'number') throw new Error(`teams-search sent no total for "${title}"`);
        return [title, total] as const;
      }),
    );
    return Object.fromEntries(totals);
  } catch (error) {
    console.warn('[team-focus-area-counts] Failed; the focus-area cards show no team count:', error);
    return null;
  }
};
