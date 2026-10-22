import type { ITeamNewsItem } from '@/types/team-news.types';

import { ALL_CURATED_ITEMS, HIRING_SIGNALS, TOP_STORY } from '../newsfeed/mocks';
import { FORUM_POSTS } from '../newsfeed-v0/mocks';

/* ---------- News: the week's pick plus a few rows ----------
   The Home prototype's own editorial week (newsfeed/mocks), so a story opened
   here is the same story the feed shows. */
const byUid = (uid: string) => ALL_CURATED_ITEMS.find((i) => i.uid === uid);

export const NEWS_LEAD: ITeamNewsItem = byUid(TOP_STORY.uid)!;
/** The pick's two runner-ups plus two more, so the band reads as "the week", not one story. */
export const NEWS_ALSO: ITeamNewsItem[] = [...TOP_STORY.alsoUids, 'x3', 'n2']
  .map(byUid)
  .filter((i): i is ITeamNewsItem => Boolean(i));

/* ---------- Forum: four threads, author on top ---------- */
export const FORUM_PICKS = FORUM_POSTS.slice(0, 4);

/* ---------- Jobs: a handful of roles across teams ----------
   Flattened from the feed's hiring roll-ups (production `IJobTeamGroup` shape),
   one role per team first so the list doesn't read as one team's board. */
export interface HomeJob {
  title: string;
  location: string;
  applyUrl: string;
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
}

const firstPass = HIRING_SIGNALS.map((sig) => ({ sig, role: sig.roles[0] }));
const secondPass = HIRING_SIGNALS.map((sig) => ({ sig, role: sig.roles[1] })).filter((x) => x.role);

export const HOME_JOBS: HomeJob[] = [...firstPass, ...secondPass].slice(0, 5).map(({ sig, role }) => ({
  ...role,
  teamUid: sig.teamUid,
  teamName: sig.teamName,
  teamLogoUrl: sig.teamLogoUrl,
}));

/** Open roles across the whole board (mocked) — the "See all" count, larger than the teams sampled above. */
export const TOTAL_OPEN_ROLES = 64;

/* ---------- Selected GitHub repos (new) ----------
   Shape = production `IMemberRepository` (name, description, url) plus the
   fields a curated card needs that the GitHub API returns per repo
   (language, stargazers_count, pushed_at) and the owning team from the
   directory. Repo names are real public repos of network teams; the numbers
   and dates are mocked. */
export interface CuratedRepo {
  name: string;
  description: string;
  url: string;
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
  language: string;
  /** GitHub linguist colour for the language dot — data, not palette. */
  languageColor: string;
  stars: number;
  /** ISO — last push. */
  updatedAt: string;
}

export const CURATED_REPOS: CuratedRepo[] = [
  {
    name: 'ipfs/kubo',
    description: 'An IPFS implementation in Go — the reference node most of the network runs.',
    url: 'https://github.com/ipfs/kubo',
    teamUid: 'ipfs',
    teamName: 'IPFS',
    teamLogoUrl: '/icons/technology/ipfs.svg',
    language: 'Go',
    languageColor: '#00ADD8',
    stars: 16400,
    updatedAt: '2026-10-20T09:00:00.000Z',
  },
  {
    name: 'libp2p/rust-libp2p',
    description: 'The Rust implementation of the libp2p networking stack.',
    url: 'https://github.com/libp2p/rust-libp2p',
    teamUid: 'libp2p',
    teamName: 'libp2p',
    teamLogoUrl: '/icons/technology/libp2p.svg',
    language: 'Rust',
    languageColor: '#dea584',
    stars: 4900,
    updatedAt: '2026-10-19T15:30:00.000Z',
  },
  {
    name: 'filecoin-project/lotus',
    description: 'Reference implementation of the Filecoin protocol, written in Go.',
    url: 'https://github.com/filecoin-project/lotus',
    teamUid: 'filecoin',
    teamName: 'Filecoin',
    teamLogoUrl: '/icons/technology/filecoin.svg',
    language: 'Go',
    languageColor: '#00ADD8',
    stars: 2900,
    updatedAt: '2026-10-18T11:00:00.000Z',
  },
  {
    name: 'ipfs/helia',
    description: 'An implementation of IPFS in TypeScript, for browsers and Node.js.',
    url: 'https://github.com/ipfs/helia',
    teamUid: 'ipfs',
    teamName: 'IPFS',
    teamLogoUrl: '/icons/technology/ipld.svg',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 1100,
    updatedAt: '2026-10-16T08:00:00.000Z',
  },
  {
    name: 'drand/drand',
    description: 'A distributed randomness beacon daemon — public, verifiable, unbiasable randomness.',
    url: 'https://github.com/drand/drand',
    teamUid: 'drand',
    teamName: 'drand',
    teamLogoUrl: '/icons/technology/drand.svg',
    language: 'Go',
    languageColor: '#00ADD8',
    stars: 760,
    updatedAt: '2026-10-11T13:00:00.000Z',
  },
  {
    name: 'filecoin-project/ref-fvm',
    description: 'Reference implementation of the Filecoin Virtual Machine.',
    url: 'https://github.com/filecoin-project/ref-fvm',
    teamUid: 'fvm',
    teamName: 'Filecoin Virtual Machine',
    teamLogoUrl: '/icons/technology/fvm.svg',
    language: 'Rust',
    languageColor: '#dea584',
    stars: 420,
    updatedAt: '2026-10-07T10:00:00.000Z',
  },
];

/** Who picked the repos — shown under the section title. Open question in the README. */
export const REPOS_ATTRIBUTION = 'Picked by the network team · updated weekly';

/* ---------- Events: the next few dated gatherings ----------
   Under the jobs rail. Dated events, not cities: the old Home's dated event
   cards drew ~4–5% of visitors a month vs ~1% for city cards. Mocked, all after
   2026-10-21 so the list reads as "upcoming". */
export interface HomeEvent {
  uid: string;
  name: string;
  /** ISO date of the first day. */
  startDate: string;
  /** Short range label when it runs over several days, e.g. "Nov 3–7". */
  range?: string;
  location: string;
  host: string;
}

export const HOME_EVENTS: HomeEvent[] = [
  {
    uid: 'ev1',
    name: 'Decentralized AI Founders Dinner',
    startDate: '2026-10-28',
    location: 'Berlin',
    host: 'Protocol Labs',
  },
  {
    uid: 'ev2',
    name: 'LabWeek Lisbon',
    startDate: '2026-11-03',
    range: 'Nov 3–7',
    location: 'Lisbon',
    host: 'Protocol Labs',
  },
  {
    uid: 'ev3',
    name: 'libp2p Day',
    startDate: '2026-11-05',
    location: 'Lisbon',
    host: 'libp2p',
  },
  {
    uid: 'ev4',
    name: 'Filecoin Builders Meetup',
    startDate: '2026-11-12',
    location: 'New York',
    host: 'Filecoin Foundation',
  },
];

export const TOTAL_UPCOMING_EVENTS = 18;
