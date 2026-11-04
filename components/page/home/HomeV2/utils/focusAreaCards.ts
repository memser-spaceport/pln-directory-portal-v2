import { FOCUS_AREAS } from '@/components/page/explore-pl-network/data/content';
import { ISLANDS } from '@/components/page/explore-pl-network/data/islands';
import type { PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';

type FocusAreaId = (typeof FOCUS_AREAS)[number]['id'];

/**
 * Marketing's four island ids mapped to the directory's own top-level focus-area titles, which is what
 * `/teams?focusAreas=` and `/projects?focusAreas=` match. Marketing calls one of them "Neurotechnology"; the directory
 * calls it "Neurotech" (read from `GET /v1/focus-areas` on dev, 2026-11-04).
 */
export const FOCUS_AREA_DIRECTORY_TITLE: Record<FocusAreaId, string> = {
  'digital-human-rights': 'Digital Human Rights',
  'economies--governance': 'Economies & Governance',
  'ai--robotics': 'AI & Robotics',
  neurotech: 'Neurotech',
};

/** How many logos the card's pile shows. */
export const FOCUS_LOGO_PILE = 4;

const ISLAND_COLOR: Record<string, string> = Object.fromEntries(ISLANDS.map((i) => [i.id, i.color]));

export interface FocusAreaCard {
  id: FocusAreaId;
  /** Marketing's name and line, as the card shows them. */
  name: string;
  line: string;
  /** The directory title the links filter by. */
  directoryTitle: string;
  teamsHref: string;
  /** Null when the directory has no project in this area, so the card offers no door to an empty list. */
  projectsHref: string | null;
  /** The island's colour, which the logo pile sits on. */
  color: string;
  /** The merged portfolio's teams on this island. */
  count: number;
  logos: { name: string; logo: string }[];
}

/**
 * One card per focus area, in marketing's order: the name and line, the links, and the island's portfolio teams.
 * `projectCounts` (projects per directory title) drops the Projects link for an area with none; without it (the
 * counts failed to load) every card keeps its link.
 */
export function buildFocusAreaCards(
  teams: PortfolioTeam[],
  projectCounts?: Record<string, number> | null,
): FocusAreaCard[] {
  return FOCUS_AREAS.map((area) => {
    const directoryTitle = FOCUS_AREA_DIRECTORY_TITLE[area.id];
    const inArea = teams.filter((t) => t.island === area.id);
    const hasProjects = !projectCounts || (projectCounts[directoryTitle] ?? 0) > 0;
    return {
      id: area.id,
      name: area.name,
      line: area.line,
      directoryTitle,
      teamsHref: `/teams?focusAreas=${encodeURIComponent(directoryTitle)}`,
      projectsHref: hasProjects ? `/projects?focusAreas=${encodeURIComponent(directoryTitle)}` : null,
      color: ISLAND_COLOR[area.id] ?? 'var(--foreground-brand-primary, #1b4dff)',
      count: inArea.length,
      logos: inArea.slice(0, FOCUS_LOGO_PILE).map((t) => ({ name: t.name, logo: t.logo })),
    };
  });
}
