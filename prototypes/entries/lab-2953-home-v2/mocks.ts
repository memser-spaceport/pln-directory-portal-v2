// LAB-2953 home-v2 — mock data only. News, forum, jobs and events come from the
// home-refactor entry (itself built on newsfeed / newsfeed-v0), so a story or
// thread opened here is the same one the other Home prototypes show. The
// portfolio is the explore page's own static fallback file (no API merge).

import type { ITeamNewsItem } from '@/types/team-news.types';
import { PORTFOLIO_FALLBACK, type PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';
import { FOCUS_AREAS as EXPLORE_FOCUS_AREAS } from '@/components/page/explore-pl-network/data/content';

import { ALL_CURATED_ITEMS } from '../newsfeed/mocks';
import { NEWS_ALSO, NEWS_LEAD } from '../home-refactor/mocks';

export {
  FORUM_PICKS,
  HOME_EVENTS,
  HOME_JOBS,
  TOTAL_OPEN_ROLES,
  TOTAL_UPCOMING_EVENTS,
} from '../home-refactor/mocks';

/* ---------- Review states (?state=) ---------- */
export const REVIEW_STATES = ['signed-out', 'signed-in', 'signed-in-no-deals', 'email-not-found'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

/* ---------- The signed-in member (sample person, not a real member) ---------- */
export const MEMBER = { firstName: 'Sam' };

/** The address the visitor typed in the sign-in window (email-not-found state). */
export const TYPED_EMAIL = 'sam.rivera@example.com';

/* ---------- Portfolio: the explore page's static list, as the map reads it ---------- */
export const PORTFOLIO_TEAMS: PortfolioTeam[] = PORTFOLIO_FALLBACK.map((row) => ({ ...row, source: 'fallback' }));

/* ---------- Focus areas -> directory filters ----------
   Marketing's four areas, each with a link into the directory filtered by it.
   The directory's focus-area titles are not checked against marketing's names
   yet (README, open questions), so the filter value is the marketing name. */
export const FOCUS_AREA_LINKS = EXPLORE_FOCUS_AREAS.map((a) => ({
  id: a.id,
  name: a.name,
  teamsHref: `/teams?focusAreas=${encodeURIComponent(a.name)}`,
  projectsHref: `/projects?focusAreas=${encodeURIComponent(a.name)}`,
}));

/* ---------- News ----------
   Signed in: a short curated pick of five (14 people clicked a news card in
   90 days, so not the full feed). Signed out: a preview of three. */
const picks = [NEWS_LEAD, ...NEWS_ALSO, ...ALL_CURATED_ITEMS];
const unique = picks.filter((item, i) => item && picks.findIndex((p) => p?.uid === item.uid) === i);
export const NEWS_SELECTION: ITeamNewsItem[] = unique.slice(0, 5);
export const NEWS_PREVIEW: ITeamNewsItem[] = unique.slice(0, 3);

/* ---------- Deals ----------
   Shape = production `IDeal` (types/deals.types.ts), trimmed to what the card
   shows. Vendor names are invented. */
export interface HomeDeal {
  uid: string;
  vendorName: string;
  shortDescription: string;
  category: string;
  audience: string;
  teamsUsingCount: number;
  isHighValue?: boolean;
}

export const HOME_DEALS: HomeDeal[] = [
  {
    uid: 'd1',
    vendorName: 'Northwind Cloud',
    shortDescription: '$25,000 in cloud credits for 12 months.',
    category: 'Infrastructure',
    audience: 'Founders',
    teamsUsingCount: 41,
    isHighValue: true,
  },
  {
    uid: 'd2',
    vendorName: 'Ledgerly',
    shortDescription: '50% off bookkeeping and tax filing for the first year.',
    category: 'Finance',
    audience: 'All teams',
    teamsUsingCount: 18,
  },
  {
    uid: 'd3',
    vendorName: 'Brightdesk',
    shortDescription: 'Free design system audit and 3 months of the Pro plan.',
    category: 'Design',
    audience: 'Founders',
    teamsUsingCount: 9,
  },
];

export const TOTAL_DEALS = 23;
