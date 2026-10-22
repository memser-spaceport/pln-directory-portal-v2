import type { ITeamNewsItem } from '@/types/team-news.types';

import { ALL_CURATED_ITEMS, HIRING_SIGNALS } from '../newsfeed/mocks';
import { FORUM_POSTS, type ForumPost } from '../newsfeed-v0/mocks';
import { CURATED_REPOS, TOTAL_OPEN_ROLES, type CuratedRepo } from '../home-refactor/mocks';

/*
 * home-refactor-b — the same week as version A, re-dated.
 *
 * A reads its stories straight from the newsfeed mocks, which are dated July
 * 2026, so "This week in the network" said "3 months ago". B keeps the same
 * stories, threads, roles and repos (so the two versions compare like for
 * like) but gives every item an age in HOURS, resolved against the viewer's
 * clock on the client. Whenever the prototype is opened, the week is this week.
 *
 * Engagement numbers are B's own: varied, and in the range the forum's real
 * numbers sit in (reads in the hundreds to low thousands, likes in the tens).
 */

/** No Protocol Labs mark ships in public/icons/technology, so PL rows draw the monogram fallback. */
const PL_LOGO: string | null = null;

/* ---------- Scopes: the chip inside the composer ---------- */

export type AskScope = 'anything' | 'people' | 'teams' | 'jobs' | 'repos';

export const SCOPES: { value: AskScope; label: string; placeholder: string }[] = [
  { value: 'anything', label: 'Anything', placeholder: 'Ask about people, teams, jobs or repos in the network' },
  { value: 'people', label: 'People', placeholder: 'Find people by skill, team or what they are working on' },
  { value: 'teams', label: 'Teams', placeholder: 'Find teams by focus area, stage or what they shipped' },
  { value: 'jobs', label: 'Jobs', placeholder: 'Find open roles by skill, location or team' },
  { value: 'repos', label: 'Repos', placeholder: 'Ask about repos, releases and who maintains them' },
];

/* ---------- The week's rows ---------- */

export type WeekKind = 'news' | 'forum' | 'job' | 'repo' | 'event';

export const KIND_LABEL: Record<WeekKind, string> = {
  news: 'News',
  forum: 'Forum',
  job: 'Job',
  repo: 'Repo',
  event: 'Event',
};

export interface WeekRow {
  id: string;
  kind: WeekKind;
  title: string;
  /** Team (rounded logo) or person (round avatar). */
  source: { name: string; logo: string | null; person?: boolean };
  /** Second half of the type label: "News · Funding", "Job · Remote". */
  subtype?: string;
  /** The meta line after the source name, already formatted. */
  meta: string[];
  /** Past items: how long ago. */
  hoursAgo?: number;
  /** Events: how many days from today it starts. */
  inDays?: number;
  /** Rows that open a modal carry the uid it needs; the rest are links. */
  newsUid?: string;
  forumUid?: string;
  href?: string;
  external?: boolean;
}

const fmt = new Intl.NumberFormat('en');
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/* News: A's lead + rows (x1, x2, n1, x3, n2) plus libp2p's release, re-dated. */
const NEWS_PLAN: { uid: string; hoursAgo: number; reads: number; likes: number; subtype: string }[] = [
  { uid: 'n1', hoursAgo: 9, reads: 864, likes: 31, subtype: 'Announcement' },
  { uid: 'x1', hoursAgo: 30, reads: 1240, likes: 46, subtype: 'Funding' },
  { uid: 'x2', hoursAgo: 52, reads: 512, likes: 17, subtype: 'Partnership' },
  { uid: 'n10', hoursAgo: 75, reads: 388, likes: 22, subtype: 'Release' },
  { uid: 'x3', hoursAgo: 98, reads: 297, likes: 9, subtype: 'Launch' },
  { uid: 'n2', hoursAgo: 121, reads: 174, likes: 4, subtype: 'Announcement' },
];

const newsItem = (uid: string): ITeamNewsItem => ALL_CURATED_ITEMS.find((i) => i.uid === uid)!;

/* Forum: A's four threads, re-dated, with their own view counts. */
const FORUM_PLAN: { uid: string; hoursAgo: number; views: number; likes: number }[] = [
  { uid: 'f2', hoursAgo: 5, views: 612, likes: 19 },
  { uid: 'f1', hoursAgo: 20, views: 342, likes: 8 },
  { uid: 'f3', hoursAgo: 46, views: 207, likes: 6 },
  { uid: 'f4', hoursAgo: 94, views: 1180, likes: 27 },
];

/** Forum posts with this week's dates and view counts, for the forum modal. */
export function weekForumPosts(now: Date): Record<string, ForumPost> {
  return Object.fromEntries(
    FORUM_PLAN.map((p) => {
      const post = FORUM_POSTS.find((f) => f.uid === p.uid)!;
      return [p.uid, { ...post, createdAt: isoHoursAgo(now, p.hoursAgo), views: p.views }];
    }),
  );
}

/** News stories with this week's dates, for the detail modal. */
export function weekNewsItem(uid: string, now: Date): ITeamNewsItem {
  const plan = NEWS_PLAN.find((n) => n.uid === uid);
  const item = newsItem(uid);
  return plan ? { ...item, eventDate: isoHoursAgo(now, plan.hoursAgo) } : item;
}

/** B's seed likes: varied, and the same number the modal starts from. */
export const WEEK_LIKES: Record<string, number> = Object.fromEntries([
  ...NEWS_PLAN.map((n) => [n.uid, n.likes]),
  ...FORUM_PLAN.map((f) => [f.uid, f.likes]),
]);

const lattice = HIRING_SIGNALS.find((h) => h.teamUid === 'lattice-compute')!;
const prime = HIRING_SIGNALS.find((h) => h.teamUid === 'prime-intellect')!;
const filf = HIRING_SIGNALS.find((h) => h.teamUid === 'filecoin-foundation')!;

/* Jobs: posted this week. Three Rust roles on purpose — the prompt cards ask
   "Who's hiring Rust engineers this week?" and the answer should be true here. */
const JOBS: WeekRow[] = [
  {
    id: 'job-prime-ml',
    kind: 'job',
    title: prime.roles[0].title,
    source: { name: prime.teamName, logo: prime.teamLogoUrl },
    subtype: 'Full-time',
    meta: [prime.roles[0].location, 'Python, CUDA'],
    hoursAgo: 14,
    href: prime.roles[0].applyUrl,
    external: true,
  },
  {
    id: 'job-libp2p-rust',
    kind: 'job',
    title: 'Rust Engineer, rust-libp2p',
    source: { name: 'libp2p', logo: '/icons/technology/libp2p.svg' },
    subtype: 'Full-time',
    meta: ['Remote · EU', 'Rust'],
    hoursAgo: 38,
    href: 'https://libp2p.io/careers/rust-engineer',
    external: true,
  },
  {
    id: 'job-lattice-dist',
    kind: 'job',
    title: lattice.roles[0].title,
    source: { name: lattice.teamName, logo: lattice.teamLogoUrl },
    subtype: 'Full-time',
    meta: [lattice.roles[0].location, 'Rust, Go'],
    hoursAgo: 61,
    href: lattice.roles[0].applyUrl,
    external: true,
  },
  {
    id: 'job-fvm-rust',
    kind: 'job',
    title: 'Senior Rust Engineer, FVM',
    source: { name: 'Filecoin Virtual Machine', logo: '/icons/technology/fvm.svg' },
    subtype: 'Full-time',
    meta: ['Remote', 'Rust, WebAssembly'],
    hoursAgo: 84,
    href: 'https://github.com/filecoin-project/ref-fvm',
    external: true,
  },
  {
    id: 'job-filf-data',
    kind: 'job',
    title: filf.roles[0].title,
    source: { name: filf.teamName, logo: filf.teamLogoUrl },
    subtype: 'Contract',
    meta: [filf.roles[0].location],
    hoursAgo: 110,
    href: filf.roles[0].applyUrl,
    external: true,
  },
];

/* Repos: what shipped this week (releases), not the evergreen pick — that is
   the "Picked repos" strip under the module. Version numbers are mocked. */
const repo = (name: string): CuratedRepo => CURATED_REPOS.find((r) => r.name === name)!;
const RELEASES: { repo: CuratedRepo; version: string; note: string; gained: number; hoursAgo: number }[] = [
  { repo: repo('ipfs/kubo'), version: 'v0.38.0', note: 'faster provider records', gained: 212, hoursAgo: 26 },
  { repo: repo('libp2p/rust-libp2p'), version: 'v0.56.0', note: 'QUIC hole punching', gained: 87, hoursAgo: 49 },
  { repo: repo('filecoin-project/lotus'), version: 'v1.34.0', note: 'network upgrade build', gained: 41, hoursAgo: 72 },
  { repo: repo('ipfs/helia'), version: 'v5.4.0', note: 'browser retrieval fixes', gained: 33, hoursAgo: 117 },
];

const REPO_ROWS: WeekRow[] = RELEASES.map((r) => ({
  id: `repo-${r.repo.name}`,
  kind: 'repo',
  title: `${r.repo.name} ${r.version}: ${r.note}`,
  source: { name: r.repo.teamName, logo: r.repo.teamLogoUrl },
  subtype: 'Release',
  meta: [r.repo.language, `★ ${compact.format(r.repo.stars)}`, `+${r.gained} this week`],
  hoursAgo: r.hoursAgo,
  href: `${r.repo.url}/releases`,
  external: true,
}));

/* Events: two this week (they ride the All tab), three later (Events tab only).
   The later three are the newsfeed rail's own events. */
const EVENTS: WeekRow[] = [
  {
    id: 'ev-office-hours',
    kind: 'event',
    title: 'Founder office hours: fundraising in Q4',
    source: { name: 'Protocol Labs', logo: PL_LOGO },
    subtype: 'Virtual',
    meta: ['Online', '31 going'],
    inDays: 2,
    href: '/events',
  },
  {
    id: 'ev-ipfs-berlin',
    kind: 'event',
    title: 'IPFS Berlin meetup',
    source: { name: 'IPFS', logo: '/icons/technology/ipfs.svg' },
    subtype: 'Meetup',
    meta: ['Berlin, Germany', '58 going'],
    inDays: 4,
    href: '/events',
  },
  {
    id: 'ev-desci',
    kind: 'event',
    title: 'DeSci Summit',
    source: { name: 'Protocol Labs', logo: PL_LOGO },
    subtype: 'Conference',
    meta: ['Berlin, Germany', '2 days', '140 going'],
    inDays: 7,
    href: '/events',
  },
  {
    id: 'ev-labweek',
    kind: 'event',
    title: 'LabWeek26: Protocol Labs network gathering',
    source: { name: 'Protocol Labs', logo: PL_LOGO },
    subtype: 'Conference',
    meta: ['Lisbon, Portugal', '5 days', '410 going'],
    inDays: 18,
    href: '/events',
  },
  {
    id: 'ev-ftc',
    kind: 'event',
    title: 'Funding the Commons',
    source: { name: 'Funding the Commons', logo: null },
    subtype: 'Conference',
    meta: ['Singapore', '2 days', '96 going'],
    inDays: 22,
    href: '/events',
  },
];

export const EVENTS_THIS_WEEK_MAX_DAYS = 5;

const NEWS_ROWS: WeekRow[] = NEWS_PLAN.map((n) => {
  const item = newsItem(n.uid);
  return {
    id: `news-${n.uid}`,
    kind: 'news',
    title: item.title,
    source: { name: item.teamName, logo: item.teamLogoUrl },
    subtype: n.subtype,
    meta: [`${fmt.format(n.reads)} reads`],
    hoursAgo: n.hoursAgo,
    newsUid: n.uid,
  };
});

const FORUM_ROWS: WeekRow[] = FORUM_PLAN.map((p) => {
  const post = FORUM_POSTS.find((f) => f.uid === p.uid)!;
  return {
    id: `forum-${p.uid}`,
    kind: 'forum',
    title: post.title,
    source: { name: post.author, logo: null, person: true },
    subtype: post.category,
    meta: [`${fmt.format(p.views)} views`],
    hoursAgo: p.hoursAgo,
    forumUid: p.uid,
  };
});

export const WEEK_ROWS: Record<WeekKind, WeekRow[]> = {
  news: NEWS_ROWS,
  forum: FORUM_ROWS,
  job: JOBS,
  repo: REPO_ROWS,
  event: EVENTS,
};

/** The All tab's "Latest" list: every past row, newest first, capped. */
export const ALL_LATEST_CAP = 8;

/** Counts behind each tab's "See all" door — the whole surface, not the week. */
export const SEE_ALL: Record<WeekKind, { label: string; href: string }> = {
  news: { label: 'See all news', href: '/prototypes/newsfeed' },
  forum: { label: 'See all forum posts', href: '/forum' },
  job: { label: `See all ${TOTAL_OPEN_ROLES} jobs`, href: '/prototypes/job-board' },
  /* No repos page exists; the full curated set lives in version A's grid. */
  repo: { label: 'See all picked repos', href: '/prototypes/home-refactor#home-repos-title' },
  event: { label: 'See all events', href: '/events' },
};

/* ---------- "Start with a question": prompt cards from this week ---------- */

export interface PromptCard {
  question: string;
  kind: WeekKind;
  /** The piece of this week the question comes from. */
  from: string;
}

export const PROMPTS: Record<AskScope, PromptCard[]> = {
  anything: [
    { kind: 'job', question: "Who's hiring Rust engineers this week?", from: '3 new roles: libp2p, Lattice Compute, FVM' },
    { kind: 'news', question: 'What changed in IPFS retrieval?', from: 'Mainnet upgrade cuts latency by a third' },
    {
      kind: 'forum',
      question: 'How are compute teams pricing verifiable GPU work?',
      from: "Mira Chen's thread in Compute",
    },
    { kind: 'repo', question: "What's new in kubo v0.38?", from: 'ipfs/kubo · released yesterday' },
  ],
  people: [
    {
      kind: 'forum',
      question: "Who's proposing a shared DHT for rollup discovery?",
      from: "Devon Okoro's thread in Networking",
    },
    {
      kind: 'news',
      question: 'Who works on decentralized training at Prime Intellect?',
      from: 'Prime Intellect raised $18M',
    },
    { kind: 'event', question: "Who's going to the IPFS Berlin meetup?", from: 'Saturday · 58 going' },
  ],
  teams: [
    { kind: 'news', question: 'Which teams announced funding this week?', from: 'Prime Intellect, $18M' },
    {
      kind: 'news',
      question: 'Which teams are building decentralized inference?',
      from: 'Ritual × Lattice Compute marketplace',
    },
    { kind: 'repo', question: 'Which teams shipped a release this week?', from: 'kubo, rust-libp2p, lotus, helia' },
  ],
  jobs: [
    { kind: 'job', question: "Who's hiring Rust engineers this week?", from: '3 new roles: libp2p, Lattice Compute, FVM' },
    { kind: 'job', question: 'Which teams that just raised are hiring?', from: 'Prime Intellect: ML Infrastructure' },
    { kind: 'job', question: 'Remote roles in distributed systems', from: '4 remote roles posted this week' },
  ],
  repos: [
    { kind: 'repo', question: "What's new in kubo v0.38?", from: 'ipfs/kubo · released yesterday' },
    { kind: 'repo', question: 'What changed in rust-libp2p 0.56?', from: 'QUIC hole punching' },
    { kind: 'repo', question: 'Which network repos gained the most stars this week?', from: 'kubo +212, rust-libp2p +87' },
  ],
};

/* ---------- Picked repos strip ---------- */

/** A's curated six, re-dated to this week's pushes so "Updated" agrees with the heading. */
export function pickedRepos(now: Date): CuratedRepo[] {
  const pushed = [26, 49, 72, 117, 140, 160];
  return CURATED_REPOS.map((r, i) => ({ ...r, updatedAt: isoHoursAgo(now, pushed[i] ?? 150) }));
}

/* ---------- Time ---------- */

export function isoHoursAgo(now: Date, hours: number): string {
  return new Date(now.getTime() - hours * 3600_000).toISOString();
}

export function inDaysDate(now: Date, days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d;
}
