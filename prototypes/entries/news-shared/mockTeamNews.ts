import type { ITeamNewsItem } from '@/types/team-news.types';

// The curated week the newsfeed prototype renders — the fallback source for teams
// these fixtures don't cover. Data only (mocks.ts imports nothing back), so there
// is no cycle with the prototype that imports this file.
import { ALL_CURATED_ITEMS } from '../newsfeed/mocks';

/**
 * Mock team news for the surfaces that show a team's updates: the job board's
 * TeamUpdateStrip, and the "N new updates" badge on the teams grid and profiles.
 *
 * Shape is the real `ITeamNewsItem` so those surfaces can render the production
 * NewsCard's own type layer verbatim — no re-created news row.
 *
 * Dates are relative to "now" for the same reason the job mocks are (see
 * mocks.ts): the prototype only renders after mount, so there's no SSR/CSR
 * hydration mismatch, and the "N new" window stays live.
 */

/** An update counts as "new" if it landed within this many days. */
export const NEWS_WINDOW_DAYS = 30;

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

type MockNews = Pick<ITeamNewsItem, 'uid' | 'eventType' | 'title' | 'summary' | 'sourceUrl' | 'sourceDomain'> & {
  ageDays: number;
};

const NEWS_BY_TEAM: Record<string, MockNews[]> = {
  'protocol-labs': [
    {
      uid: 'pl-news-1',
      eventType: 'LAUNCH',
      title: 'Protocol Labs ships v2 of its developer toolkit',
      summary:
        'The release folds the CLI, local testnet and tracing tools into a single install, and adds first-class support for private networks. Teams running their own deployments get a migration path that leaves existing configs in place.',
      sourceUrl: 'https://techcrunch.com/protocol-labs-toolkit-v2',
      sourceDomain: 'techcrunch.com',
      ageDays: 3,
    },
    {
      uid: 'pl-news-2',
      eventType: 'PARTNERSHIP',
      title: 'Protocol Labs partners with three national research labs on data preservation',
      summary:
        'A three-year programme to move archival scientific datasets onto content-addressed storage. The first cohort covers climate and genomics archives that currently sit on tape.',
      sourceUrl: 'https://theverge.com/protocol-labs-research-partnership',
      sourceDomain: 'theverge.com',
      ageDays: 11,
    },
    {
      uid: 'pl-news-3',
      eventType: 'MILESTONE',
      title: 'Network crosses 5 exabytes of committed storage',
      summary:
        'Capacity roughly doubled year over year, with the fastest growth coming from Asia-Pacific providers. Paid storage deals now account for a bigger share of new commitments than incentive programmes do.',
      sourceUrl: 'https://coindesk.com/protocol-labs-5eb',
      sourceDomain: 'coindesk.com',
      ageDays: 21,
    },
  ],
  'filecoin-foundation': [
    {
      uid: 'ff-news-1',
      eventType: 'FUNDING',
      title: 'Filecoin Foundation commits $12M to a new public-goods grants round',
      summary:
        'Applications open next month, with a dedicated track for archival and civic-data projects. Grants run from $25k to $500k, and the foundation says it wants to fund more work outside the core protocol.',
      sourceUrl: 'https://fortune.com/filecoin-foundation-grants',
      sourceDomain: 'fortune.com',
      ageDays: 2,
    },
    {
      uid: 'ff-news-2',
      eventType: 'ANNOUNCEMENT',
      title: 'Foundation names a new head of governance',
      summary:
        'The role oversees the grant council and the annual community review process. It is the first governance hire since the council was expanded to nine seats last year.',
      sourceUrl: 'https://theblock.co/filecoin-foundation-governance-lead',
      sourceDomain: 'theblock.co',
      ageDays: 16,
    },
  ],
  libp2p: [
    {
      uid: 'lp-news-1',
      eventType: 'LAUNCH',
      title: 'libp2p 1.0 lands with a stable transport API',
      summary:
        'QUIC and WebTransport are now default transports, and the hole-punching stack leaves beta. The Go and Rust implementations ship the same API surface for the first time.',
      sourceUrl: 'https://thenewstack.io/libp2p-1-0',
      sourceDomain: 'thenewstack.io',
      ageDays: 6,
    },
  ],
  drand: [
    {
      uid: 'drand-news-1',
      eventType: 'MILESTONE',
      title: 'drand beacon passes five years of uninterrupted randomness',
      summary:
        'The league of entropy network now spans 22 independent operators across 14 countries. No operator holds enough of the threshold to reconstruct a beacon on its own.',
      sourceUrl: 'https://arstechnica.com/drand-five-years',
      sourceDomain: 'arstechnica.com',
      ageDays: 9,
    },
  ],
  bacalhau: [
    {
      uid: 'bac-news-1',
      eventType: 'FUNDING',
      title: 'Bacalhau raises a $9M seed to run compute where the data already lives',
      summary:
        'The round is led by an infrastructure fund, with participation from several storage-provider operators. The team says the money goes to a managed offering and roughly doubling headcount.',
      sourceUrl: 'https://techcrunch.com/bacalhau-seed',
      sourceDomain: 'techcrunch.com',
      ageDays: 1,
    },
    {
      uid: 'bac-news-2',
      eventType: 'PARTNERSHIP',
      title: 'Bacalhau joins a genomics consortium to process sequencing data in place',
      summary:
        'Pilot sites in Lisbon and Singapore will run jobs next to the sequencers instead of shipping data out. Keeping patient data in place is what let the consortium clear its own review board.',
      sourceUrl: 'https://wired.com/bacalhau-genomics',
      sourceDomain: 'wired.com',
      ageDays: 27,
    },
  ],
  // 'ipfs-collective' deliberately has no recent news — its card renders
  // without a banner, which is the state most cards will be in.
};

/**
 * Display names for the teams above, so a caller holding only a uid (the feed
 * resolving `?team=`) can label the scope without threading a name through.
 */
const TEAM_NAME_BY_UID: Record<string, string> = {
  'protocol-labs': 'Protocol Labs',
  'filecoin-foundation': 'Filecoin Foundation',
  libp2p: 'libp2p',
  'ipfs-collective': 'IPFS Collective',
  drand: 'drand',
  bacalhau: 'Bacalhau',
};

export const teamNameFor = (teamUid: string): string => TEAM_NAME_BY_UID[teamUid] ?? teamUid;

function toNewsItem(teamUid: string, teamName: string, n: MockNews): ITeamNewsItem {
  const { ageDays, ...rest } = n;
  const iso = daysAgo(ageDays);
  return {
    ...rest,
    teamUid,
    teamName,
    teamLogoUrl: null,
    eventDate: iso,
    createdAt: iso,
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    discussion: { count: 0, latestTopicUrl: null },
  };
}

/**
 * Recent updates for a team, newest first. Empty when the team has none.
 *
 * Two sources, one answer: the fixtures above, and — for teams they don't cover —
 * the curated week the newsfeed prototype itself renders. Every surface that shows
 * a badge and the feed that badge links to therefore count the same stories; a
 * badge reading 3 lands on 3.
 */
/**
 * Where a single story should link.
 *
 * `?news=<uid>` opens that story in the feed, but only resolves for stories the
 * feed actually holds. A fixture-only story has no card there, so it falls back
 * to its team's scope — which does render it. Never a dead link either way.
 */
export function newsHref(item: ITeamNewsItem): string {
  const inFeed = ALL_CURATED_ITEMS.some((i) => i.uid === item.uid);
  return inFeed ? `/prototypes/newsfeed?news=${item.uid}` : `/prototypes/newsfeed?team=${item.teamUid}`;
}

/** Within the "new" window — the test for whether the feed still carries a story. */
export const isNewsRecent = (item: ITeamNewsItem): boolean =>
  Date.now() - new Date(item.eventDate).getTime() <= NEWS_WINDOW_DAYS * 86_400_000;

/**
 * The feed, scrolled to this team's card — what "+N more updates" and the story
 * modal's "Open in newsfeed" both want.
 *
 * Deliberately not `?team=`: scoping the feed to one team answers "what has this
 * team been up to" and leaves a filter to undo. Scrolling shows the team's news
 * *in* the feed, with everything else still around it. Not `?news=` either — that
 * opens a modal on arrival, and someone who asked to see the feed should get the
 * feed.
 */
export function feedFocusHref(item: ITeamNewsItem): string {
  return `/prototypes/newsfeed?focus=${item.teamUid}`;
}

export function getTeamNews(teamUid: string, teamName: string = teamNameFor(teamUid)): ITeamNewsItem[] {
  // The feed wins where it has the team. It is what `?team=` actually renders, so
  // counting anything else here is how a badge reading 3 lands on a list of 5.
  const curated = ALL_CURATED_ITEMS.filter((i) => i.teamUid === teamUid).sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
  if (curated.length) return curated;

  return (NEWS_BY_TEAM[teamUid] ?? [])
    .filter((n) => n.ageDays <= NEWS_WINDOW_DAYS)
    .slice()
    .sort((a, b) => a.ageDays - b.ageDays)
    .map((n) => toNewsItem(teamUid, teamName, n));
}
