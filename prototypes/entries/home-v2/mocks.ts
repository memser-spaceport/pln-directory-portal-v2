import type { IDeal } from '@/types/deals.types';
import type { ISuggestedTeam } from '@/types/team-news.types';
import { SUGGESTED_TEAMS as V0_SUGGESTED_TEAMS } from '../newsfeed-v0/mocks';
import { FOCUS_AREAS } from '@/components/page/explore-pl-network/data/content';
import { PORTFOLIO_FALLBACK, type PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';

import {
  HOME_EVENTS,
  HOME_JOBS,
  NEWS_ALSO,
  NEWS_LEAD,
  TOTAL_OPEN_ROLES,
  TOTAL_UPCOMING_EVENTS,
} from '../home-refactor/mocks';

/* ---------- Review states (?state=) ---------- */

export type HomeState = 'signed-out' | 'signed-in' | 'signed-in-no-deals' | 'email-not-found';

export const HOME_STATES: { value: HomeState; label: string; note: string }[] = [
  {
    value: 'signed-out',
    label: 'Signed out',
    note: 'Who PL is, the figures, this week beside roles + events, the portfolio, focus areas, entities, the investor wall.',
  },
  {
    value: 'signed-in',
    label: 'Signed in',
    note: 'A portfolio founder with deals.read: one stream of news + forum, beside roles, events, teams, deals, popular.',
  },
  {
    value: 'signed-in-no-deals',
    label: 'No deals access',
    note: 'Most members (deals are for portfolio founders only): the deals module is gone, not locked.',
  },
  {
    value: 'email-not-found',
    label: 'Email not found',
    note: 'Signed out, after Sign in with an email the directory does not know. The modal now has a way forward.',
  },
];

export const isHomeState = (v: string | null): v is HomeState => HOME_STATES.some((s) => s.value === v);

/* ---------- Signed out ---------- */

/** The static portfolio file the live page falls back to: no API call, every row as 'fallback'. */
export const PORTFOLIO_TEAMS: PortfolioTeam[] = PORTFOLIO_FALLBACK.map((row) => ({ ...row, source: 'fallback' }));

/**
 * Marketing's four focus areas, each pointing at the directory filtered by it.
 * The directory filters by focus-area *title* (`?focusAreas=<title>`, the same
 * URL the old Home FocusAreaSection opened). Marketing's names are not
 * guaranteed to be directory titles: README open question.
 */
export const FOCUS_AREA_LINKS = FOCUS_AREAS.map((a) => ({
  ...a,
  teamsHref: `/teams?focusAreas=${encodeURIComponent(a.name)}`,
  projectsHref: `/projects?focusAreas=${encodeURIComponent(a.name)}`,
}));

/** The mocked visitor typed this into Privy on the email-not-found state. */
export const UNKNOWN_EMAIL = 'sam@northwind.vc';

/* ---------- Shared ---------- */

export const ROLES = HOME_JOBS.slice(0, 4);
export { TOTAL_OPEN_ROLES, HOME_EVENTS, TOTAL_UPCOMING_EVENTS };

/* Roles and events share one column (2026-11-02 standup): three of each when
   events are coming up; with none in the next 30 days the events section is
   gone and roles take the room. */
export const UPCOMING_EVENTS = HOME_EVENTS.slice(0, 3);
export const rolesBesideEvents = (hasEvents: boolean) => HOME_JOBS.slice(0, hasEvents ? 3 : 5);

export type EventsState = 'upcoming' | 'none';
export const EVENTS_STATES: { value: EventsState; label: string; note: string }[] = [
  { value: 'upcoming', label: 'Upcoming', note: 'Default. Three events in the next 30 days, under three open roles.' },
  { value: 'none', label: 'None', note: 'No events in the next 30 days: the section is gone and roles take the room (five).' },
];

export type ReposState = 'picks' | 'none';
export const REPOS_STATES: { value: ReposState; label: string; note: string }[] = [
  { value: 'picks', label: 'Picks', note: 'Default. The week’s open-source picks under the feed, then the focus areas.' },
  { value: 'none', label: 'None', note: 'No curated repos yet: nothing in their place, the focus areas follow the feed.' },
];

/** Signed out: three stories. (Signed in, news and forum come from home-refactor-b's week rows.) */
export const NEWS_PREVIEW = { lead: NEWS_LEAD, also: NEWS_ALSO.slice(0, 2) };

/* ---------- Signed in ---------- */

/**
 * The For You pill's slice of this week (home-refactor-b's week uids). Mocked:
 * production builds it from the member's focus areas, skills and followed teams.
 */
export const FOR_YOU_UIDS = ['n1', 'x1', 'n10', 'f2', 'f1'];

/**
 * The week's six stories, re-tagged with production's real news tags
 * (`ITeamNewsItem.tags`; production searches them but renders none). Vocabulary
 * from the live grouped feed (api-directory, 90 days, read 2026-10-30: 677
 * stories, 603 tagged): a verb for what happened (announce 223, launch 210,
 * publish 205, fund 132, partner 82, integrate 74, release 43…), then topics
 * (blockchain-protocols 13, blockchain-security 12, ai 11, frontier-tech 11…).
 * A bare `$` (117) is left out.
 */
export const PROD_TAGS_BY_UID: Record<string, string[]> = {
  n1: ['release', 'deploy', 'development-infrastructure'], // IPFS mainnet upgrade cuts retrieval latency
  x1: ['fund', 'raise', 'ai', 'decentralized-compute'], // Prime Intellect raises $18M
  x2: ['partner', 'integrate', 'ai'], // Ritual + Lattice Compute inference marketplace
  n10: ['release', 'blockchain-protocols'], // libp2p v0.40 shared peer-routing
  x3: ['launch', 'ai', 'frontier-tech'], // Exo on-device model sharding
  n2: ['announce', 'join', 'cryptographic-proofs'], // League of Entropy grows to 24 operators
};

/**
 * The Join card's facepile: three network founders, with the photo each one
 * published on their own directory profile (live members API, read
 * 2026-10-30: /v1/members?name__icontains=…&select=uid,name,image.url).
 */
export const FOUNDER_FACES = [
  {
    uid: 'cldvu9zjf04ont40ya1r9j7wz',
    name: 'Juan Benet',
    image: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/362f9d92f96cc54f.webp',
  },
  {
    uid: 'cldvo0jfu02hpu21klg3te9b7',
    name: 'Molly Mackinlay',
    image: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/3217a82823eb50b8.webp',
  },
  {
    uid: 'cldvud0ye05lrt40yekae95ig',
    name: 'Vincent Weisser',
    image: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/b16306f921a8dba9.webp',
  },
];

/** Teams to follow: newsfeed-v0's suggestions, in production's ISuggestedTeam shape. */
export const SUGGESTED_TEAMS: ISuggestedTeam[] = V0_SUGGESTED_TEAMS.slice(0, 3).map((t) => ({
  uid: t.uid,
  name: t.name,
  logo: t.logo,
  reason: t.followers,
  shortDescription: t.description,
}));

/** Production IDeal shape; vendors chosen from DEAL_ICONS so the cards show real glyphs. */
const deal = (d: Pick<IDeal, 'uid' | 'vendorName' | 'shortDescription' | 'category' | 'audience'> & Partial<IDeal>): IDeal => ({
  vendorTeamUid: null,
  logoUid: null,
  status: 'ACTIVE',
  createdAt: '2026-10-20T12:00:00.000Z',
  updatedAt: '2026-10-20T12:00:00.000Z',
  isRedeemed: false,
  isUsing: false,
  teamsRedemptionCount: 0,
  teamsUsingCount: 0,
  logoUrl: null,
  ...d,
});

export const LATEST_DEALS: IDeal[] = [
  deal({
    uid: 'deal-vercel',
    vendorName: 'Vercel',
    shortDescription: 'Pro plan free for 12 months, then 20% off for network teams.',
    category: 'Infrastructure & Hosting',
    audience: 'ALL_FOUNDERS',
    teamsUsingCount: 23,
    isHighValue: true,
  }),
  deal({
    uid: 'deal-linear',
    vendorName: 'Linear',
    shortDescription: 'Six months of Linear Business for teams up to 25 seats.',
    category: 'Productivity',
    audience: 'FOUNDERS',
    teamsUsingCount: 11,
  }),
  deal({
    uid: 'deal-posthog',
    vendorName: 'PostHog',
    shortDescription: '$50k in credits for product analytics, replays and flags.',
    category: 'AI & Developer Tools',
    audience: 'PL_FUNDED_FOUNDERS',
    teamsUsingCount: 7,
  }),
];

export const TOTAL_DEALS = 38;
