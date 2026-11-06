/** One focus area from `GET /v1/focus-areas?type=Project`; only what the counts need. */
type ProjectFocusAreaApiItem = {
  title?: string | null;
  parentUid?: string | null;
  projectAncestorFocusAreas?: unknown[] | null;
};

// Counts move slowly; an hour of ISR, and a slow API never holds the page up.
const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 5000;

/**
 * Projects per top-level focus-area title, as `/projects?focusAreas=<title>` would list them: a top-level area counts
 * every project tagged with it or with one of its children (`projectAncestorFocusAreas`).
 */
export function countProjectsByTopFocusArea(items: unknown): Record<string, number> {
  if (!Array.isArray(items)) return {};
  const counts: Record<string, number> = {};
  for (const item of items as ProjectFocusAreaApiItem[]) {
    if (!item?.title || item.parentUid) continue;
    counts[item.title] = Array.isArray(item.projectAncestorFocusAreas) ? item.projectAncestorFocusAreas.length : 0;
  }
  return counts;
}

/**
 * Projects per top-level focus area, for Home's focus-area cards (a card hides "Projects →" for an area with none).
 * Public, no token. Returns null on any failure, so every card keeps its Projects link.
 */
export const getProjectFocusAreaCounts = async (): Promise<Record<string, number> | null> => {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/focus-areas?type=Project`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`[project-focus-area-counts] API responded with ${response.status}; showing every Projects link`);
      return null;
    }
    return countProjectsByTopFocusArea(await response.json());
  } catch (error) {
    console.warn('[project-focus-area-counts] Failed to fetch; showing every Projects link:', error);
    return null;
  }
};
