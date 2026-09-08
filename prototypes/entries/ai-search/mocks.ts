import type { FoundItem, ForumFoundItem, SearchResult } from '@/services/search/types';

/**
 * Mocked corpus for the AI search prototype.
 *
 * Everything here is fictional. Names, teams and events are invented so the
 * prototype can be shared without leaking real member data; the *shapes* are
 * production's (`FoundItem` / `ForumFoundItem` from services/search/types), so
 * the real result rows render them unchanged.
 */

export type CorpusIndex = 'members' | 'teams' | 'projects' | 'events';

export interface CorpusItem {
  uid: string;
  index: CorpusIndex;
  name: string;
  /** Field → content, in the order production lists matches under the name. */
  fields: { field: string; content: string }[];
  /** Words the keyword search should hit that aren't in any visible field. */
  keywords?: string[];
  availableToConnect?: boolean;
  eventUrl?: string;
}

export const CORPUS: CorpusItem[] = [
  {
    uid: 'amara-okafor',
    index: 'members',
    name: 'Amara Okafor',
    fields: [
      { field: 'skills', content: 'Zero-knowledge proofs, Cryptography, Rust' },
      { field: 'location', content: 'Berlin, Germany' },
      { field: 'teamMemberRoles.role', content: 'Research Engineer at Fenix Labs' },
    ],
    keywords: ['zk', 'snark', 'office hours'],
    availableToConnect: true,
  },
  {
    uid: 'jonas-weber',
    index: 'members',
    name: 'Jonas Weber',
    fields: [
      { field: 'skills', content: 'Filecoin, Storage deals, Go' },
      { field: 'location', content: 'Lisbon, Portugal' },
      { field: 'teamMemberRoles.role', content: 'Protocol Engineer at Lumen Storage' },
    ],
    keywords: ['fil', 'storage provider'],
  },
  {
    uid: 'priya-raman',
    index: 'members',
    name: 'Priya Raman',
    fields: [
      { field: 'skills', content: 'IPFS, Developer relations, Community' },
      { field: 'location', content: 'Bengaluru, India' },
      { field: 'teamMemberRoles.role', content: 'Developer Advocate at Orbit Data' },
    ],
    keywords: ['devrel', 'office hours'],
    availableToConnect: true,
  },
  {
    uid: 'tomas-silva',
    index: 'members',
    name: 'Tomás Silva',
    fields: [
      { field: 'skills', content: 'libp2p, Networking, TypeScript' },
      { field: 'location', content: 'Lisbon, Portugal' },
      { field: 'teamMemberRoles.role', content: 'Core Developer at Orbit Data' },
    ],
    keywords: ['p2p', 'office hours'],
    availableToConnect: true,
  },
  {
    uid: 'lumen-storage',
    index: 'teams',
    name: 'Lumen Storage',
    fields: [
      { field: 'shortDescription', content: 'Storage provider tooling on Filecoin for enterprise archives.' },
      { field: 'location', content: 'Berlin, Germany' },
      { field: 'industryTags', content: 'Filecoin, Storage, Infrastructure' },
    ],
    keywords: ['fil', 'storage provider'],
  },
  {
    uid: 'fenix-labs',
    index: 'teams',
    name: 'Fenix Labs',
    fields: [
      { field: 'shortDescription', content: 'Zero-knowledge proof systems for verifiable compute.' },
      { field: 'location', content: 'Zürich, Switzerland' },
      { field: 'industryTags', content: 'Zero-knowledge, Cryptography, Research' },
    ],
    keywords: ['zk', 'snark'],
  },
  {
    uid: 'orbit-data',
    index: 'teams',
    name: 'Orbit Data',
    fields: [
      { field: 'shortDescription', content: 'Pinning and gateway services on IPFS for media companies.' },
      { field: 'location', content: 'Lisbon, Portugal' },
      { field: 'industryTags', content: 'IPFS, Infrastructure, Media' },
    ],
  },
  {
    uid: 'saturn-grid',
    index: 'teams',
    name: 'Saturn Grid',
    fields: [
      { field: 'shortDescription', content: 'Retrieval network built on Filecoin, run from Berlin.' },
      { field: 'location', content: 'Berlin, Germany' },
      { field: 'industryTags', content: 'Filecoin, Retrieval, CDN' },
    ],
    keywords: ['fil'],
  },
  {
    uid: 'zk-bridge',
    index: 'projects',
    name: 'ZK Bridge',
    fields: [
      { field: 'description', content: 'Cross-chain bridge with zero-knowledge validity proofs.' },
      { field: 'tags', content: 'Zero-knowledge, Bridges' },
    ],
    keywords: ['zk'],
  },
  {
    uid: 'filecoin-retrieval-network',
    index: 'projects',
    name: 'Filecoin Retrieval Network',
    fields: [
      { field: 'description', content: 'Open retrieval layer so Filecoin data is fast to fetch anywhere.' },
      { field: 'tags', content: 'Filecoin, Retrieval' },
    ],
    keywords: ['fil'],
  },
  {
    uid: 'ipfs-desktop',
    index: 'projects',
    name: 'IPFS Desktop',
    fields: [
      { field: 'description', content: 'A desktop app for running an IPFS node with no terminal.' },
      { field: 'tags', content: 'IPFS, Tooling' },
    ],
  },
  {
    uid: 'fil-dev-summit-lisbon',
    index: 'events',
    name: 'FIL Dev Summit Lisbon',
    fields: [
      { field: 'description', content: 'Two days of Filecoin protocol work sessions with core developers.' },
      { field: 'location', content: 'Lisbon, Portugal' },
    ],
    keywords: ['filecoin', 'summit'],
    eventUrl: 'https://fildev.io/',
  },
  {
    uid: 'zk-week-berlin',
    index: 'events',
    name: 'ZK Week Berlin',
    fields: [
      { field: 'description', content: 'A week of zero-knowledge talks, workshops and office hours.' },
      { field: 'location', content: 'Berlin, Germany' },
    ],
    keywords: ['zk', 'zero-knowledge'],
    eventUrl: 'https://zkweek.example',
  },
  {
    uid: 'ipfs-camp-lisbon',
    index: 'events',
    name: 'IPFS Camp Lisbon',
    fields: [
      { field: 'description', content: 'Hands-on IPFS sessions; PL members host the office-hours track.' },
      { field: 'location', content: 'Lisbon, Portugal' },
    ],
    eventUrl: 'https://camp.ipfs.tech/',
  },
];

/** One forum thread so the Forum chip has something to count. */
const FORUM_THREAD = {
  uid: 'forum-1',
  index: 'forumThreads',
  kind: 'forum_thread',
  name: 'Best practices for Filecoin storage deals',
  image: '',
  lastReplyAt: '2026-08-30T10:00:00.000Z',
  replyCount: 4,
  topicSlug: 'best-practices-for-filecoin-storage-deals',
  topicTitle: 'Best practices for Filecoin storage deals',
  topicUrl: '/forum/topics/2/41',
  keywords: ['filecoin', 'storage', 'deals', 'fil', 'best practices'],
  fields: [{ field: 'rootPost.content', content: 'How are teams sizing storage deals for archives over 1 PiB?' }],
  source: {
    cid: '2',
    tid: 41,
    uid: 'forum-1',
    name: 'Best practices for Filecoin storage deals',
    image: null,
    lastReplyAt: '2026-08-30T10:00:00.000Z',
    replyCount: 4,
    topicSlug: 'best-practices-for-filecoin-storage-deals',
    topicTitle: 'Best practices for Filecoin storage deals',
    topicUrl: '/forum/topics/2/41',
    name_suggest: { input: [] },
    replies: [],
    rootPost: {
      author: { name: 'Jonas Weber', username: 'jonas', slug: 'jonas-weber', image: null },
      image: '',
      name: 'Jonas Weber',
      slug: 'jonas-weber',
      username: 'jonas',
      content: 'How are teams sizing storage deals for archives over 1 PiB?',
      pid: 410,
      timestamp: '2026-08-21T09:12:00.000Z',
      uidAuthor: 7,
      url: '/forum/topics/2/41',
    },
  },
};

/* ------------------------------------------------------------------------ */
/* Keyword search                                                             */
/* ------------------------------------------------------------------------ */

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wraps every token in `<em>`, the way the backend highlights matches. */
export function highlight(text: string, tokens: string[]) {
  return tokens.reduce((acc, token) => {
    if (!token) return acc;
    return acc.replace(new RegExp(`(${escapeRegExp(token)})`, 'gi'), '<em>$1</em>');
  }, text);
}

const tokenize = (q: string) =>
  q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

function itemHaystack(item: { name: string; fields: { content: string }[]; keywords?: string[] }) {
  return [item.name, ...item.fields.map((f) => f.content), ...(item.keywords ?? [])].join(' ').toLowerCase();
}

function hitsFor(item: { name: string; fields: { content: string }[]; keywords?: string[] }, tokens: string[]) {
  const hay = itemHaystack(item);
  return tokens.filter((t) => hay.includes(t)).length;
}

/**
 * AND first, then OR: "zk berlin" should prefer things that are both, and only
 * fall back to either when nothing is both. Mirrors what a reader expects from
 * a directory search rather than what Elasticsearch does by default.
 */
function pick<T extends { name: string; fields: { content: string }[]; keywords?: string[] }>(
  items: T[],
  tokens: string[],
): T[] {
  if (!tokens.length) return [];
  const all = items.filter((i) => hitsFor(i, tokens) === tokens.length);
  if (all.length) return all;
  return items
    .map((i) => ({ i, n: hitsFor(i, tokens) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.i);
}

function toFoundItem(item: CorpusItem, tokens: string[]): FoundItem {
  const nameHit = tokens.some((t) => item.name.toLowerCase().includes(t));
  const fieldHits = item.fields.filter((f) => tokens.some((t) => f.content.toLowerCase().includes(t)));
  // Production only lists the fields that matched; a keyword-only hit shows the
  // first field so the row is never a bare name.
  const shown = fieldHits.length ? fieldHits : item.fields.slice(0, 1);
  return {
    uid: item.uid,
    name: item.name,
    index: item.index,
    image: undefined,
    availableToConnect: item.availableToConnect,
    matches: [
      ...(nameHit ? [{ field: 'name', content: highlight(item.name, tokens) }] : []),
      ...shown.map((f) => ({ field: f.field, content: highlight(f.content, tokens) })),
    ],
    source: item.eventUrl
      ? {
          additionalInfo: null,
          description: item.fields[0]?.content ?? '',
          eventUrl: item.eventUrl,
          image: '',
          location: item.fields.find((f) => f.field === 'location')?.content ?? '',
          name: item.name,
          shortDescription: item.fields[0]?.content ?? '',
          uid: item.uid,
        }
      : undefined,
  };
}

export function searchCorpus(query: string): SearchResult {
  const tokens = tokenize(query);
  const found = pick(CORPUS, tokens).map((i) => toFoundItem(i, tokens));
  const forum = pick([FORUM_THREAD], tokens).map(
    (t) =>
      ({
        ...t,
        matches: [
          ...(tokens.some((tok) => t.name.toLowerCase().includes(tok))
            ? [{ field: 'name', content: highlight(t.name, tokens) }]
            : []),
          ...t.fields.map((f) => ({ field: f.field, content: highlight(f.content, tokens) })),
        ],
      }) as unknown as ForumFoundItem,
  );
  const by = (index: CorpusIndex) => found.filter((f) => f.index === index);
  return {
    top: [...found, ...forum] as FoundItem[],
    members: by('members'),
    teams: by('teams'),
    projects: by('projects'),
    events: by('events'),
    forumThreads: forum,
  };
}

export function countResults(r: SearchResult) {
  return (
    (r.members?.length ?? 0) +
    (r.teams?.length ?? 0) +
    (r.projects?.length ?? 0) +
    (r.events?.length ?? 0) +
    (r.forumThreads?.length ?? 0)
  );
}

/* ------------------------------------------------------------------------ */
/* Idle state                                                                 */
/* ------------------------------------------------------------------------ */

export const RECENT_SEARCHES = ['libp2p', 'Fenix Labs', 'FIL Dev Summit'];

/**
 * Prompts phrased as directory *finds*, not questions about the product.
 * Production's `AI_SEARCH_SUGGESTIONS` asks "What are the latest features in
 * the Protocol Labs Directory" — nobody opens search to ask that. Apollo's
 * people search suggests "Find Account Executives in Chicago"; these follow it.
 * The glyph is the per-type Husky icon production already draws on its result
 * cards, so a prompt says what kind of thing it finds before it is read.
 */
export const SUGGESTED_PROMPTS: { text: string; icon: string }[] = [
  { text: 'Find teams building on Filecoin in Berlin', icon: '/icons/husky/husky-team.svg' },
  { text: 'Who works on zero-knowledge proofs and offers office hours?', icon: '/icons/husky/husky-member.svg' },
  { text: 'Which events in Lisbon have PL members attending?', icon: '/icons/husky/husky-event.svg' },
];

/* ------------------------------------------------------------------------ */
/* Answers                                                                    */
/* ------------------------------------------------------------------------ */

export interface DirectoryHit {
  name: string;
  type: 'member' | 'team' | 'project' | 'event';
  source: string;
}

export interface CannedAnswer {
  answer: string;
  sources: string[];
  sql: DirectoryHit[];
  followUpQuestions: string[];
}

const link = (item: CorpusItem) => `/${item.index}/${item.uid}`;
const hit = (item: CorpusItem): DirectoryHit => ({
  name: item.name,
  type:
    item.index === 'members'
      ? 'member'
      : item.index === 'teams'
        ? 'team'
        : item.index === 'projects'
          ? 'project'
          : 'event',
  source: item.eventUrl ?? link(item),
});
const byUid = (uid: string) => CORPUS.find((c) => c.uid === uid)!;

const CANNED: Record<string, CannedAnswer> = {
  'find teams building on filecoin in berlin': {
    answer: [
      'Two teams in the directory build on Filecoin and list Berlin as their location:',
      '',
      '- **[Lumen Storage](/teams/lumen-storage)** — storage provider tooling for enterprise archives. Jonas Weber is their protocol engineer (he is in Lisbon, the team is registered in Berlin).',
      '- **[Saturn Grid](/teams/saturn-grid)** — a retrieval network on Filecoin, run from Berlin.',
      '',
      'If you widen to Filecoin anywhere, the [Filecoin Retrieval Network](/projects/filecoin-retrieval-network) project is the shared layer both teams contribute to.',
    ].join('\n'),
    sources: ['https://directory.plnetwork.io/teams/lumen-storage', 'https://directory.plnetwork.io/teams/saturn-grid'],
    sql: [byUid('lumen-storage'), byUid('saturn-grid'), byUid('filecoin-retrieval-network'), byUid('jonas-weber')].map(
      hit,
    ),
    followUpQuestions: [
      'Who at Lumen Storage offers office hours?',
      'Are any of these teams hiring?',
      'Which Filecoin teams are in Lisbon instead?',
    ],
  },
  'who works on zero-knowledge proofs and offers office hours?': {
    answer: [
      'One member matches both: **[Amara Okafor](/members/amara-okafor)**, Research Engineer at Fenix Labs in Berlin. Her skills list zero-knowledge proofs, cryptography and Rust, and she has office hours open.',
      '',
      'Related, without office hours: the **[Fenix Labs](/teams/fenix-labs)** team page and the **[ZK Bridge](/projects/zk-bridge)** project both list zero-knowledge as a focus.',
    ].join('\n'),
    sources: ['https://directory.plnetwork.io/members/amara-okafor', 'https://directory.plnetwork.io/teams/fenix-labs'],
    sql: [byUid('amara-okafor'), byUid('fenix-labs'), byUid('zk-bridge'), byUid('zk-week-berlin')].map(hit),
    followUpQuestions: [
      'Is Amara speaking at ZK Week Berlin?',
      'Who else at Fenix Labs is in the directory?',
      'Find members with office hours in Berlin',
    ],
  },
  'which events in lisbon have pl members attending?': {
    answer: [
      'Two upcoming events in Lisbon have PL members on the attendee list:',
      '',
      '- **FIL Dev Summit Lisbon** — protocol work sessions; Jonas Weber and Tomás Silva are attending.',
      '- **IPFS Camp Lisbon** — PL members host the office-hours track; Priya Raman is on the schedule.',
      '',
      "Both are external events, so the links open the organiser's site.",
    ].join('\n'),
    sources: ['https://fildev.io/', 'https://camp.ipfs.tech/'],
    sql: [
      byUid('fil-dev-summit-lisbon'),
      byUid('ipfs-camp-lisbon'),
      byUid('jonas-weber'),
      byUid('tomas-silva'),
      byUid('priya-raman'),
    ].map(hit),
    followUpQuestions: [
      'Who from Orbit Data is going to IPFS Camp?',
      'Are there events in Berlin the same month?',
      'Which Lisbon members offer office hours?',
    ],
  },
  'who at lumen storage offers office hours?': {
    answer:
      'Nobody at **[Lumen Storage](/teams/lumen-storage)** has office hours open right now. Their only listed member, Jonas Weber, has not enabled them. The closest match with office hours and Filecoin experience is **[Tomás Silva](/members/tomas-silva)** at Orbit Data.',
    sources: ['https://directory.plnetwork.io/teams/lumen-storage'],
    sql: [byUid('jonas-weber'), byUid('tomas-silva')].map(hit),
    followUpQuestions: ['Find members with office hours in Lisbon', 'What does Lumen Storage work on?'],
  },
};

const norm = (q: string) => q.trim().toLowerCase().replace(/\s+/g, ' ');

const TYPE_WORD: Record<CorpusIndex, string> = {
  members: 'member',
  teams: 'team',
  projects: 'project',
  events: 'event',
};

/**
 * A canned answer when we have one, otherwise an answer assembled from the
 * keyword hits — so any query typed into the prototype gets a grounded reply
 * rather than a canned one that ignores it.
 */
export function buildAnswer(query: string): CannedAnswer {
  const canned = CANNED[norm(query)];
  if (canned) return canned;

  const tokens = tokenize(query);
  const found = pick(CORPUS, tokens).slice(0, 5);

  if (!found.length) {
    return {
      answer: `I couldn't find anything in the directory about **${query.trim()}**. It may be indexed under a different name, or it isn't in the network yet. Try a team, a technology or a city, or browse the [Teams](/teams) and [Members](/members) lists.`,
      sources: [],
      sql: [],
      followUpQuestions: ['Find teams building on Filecoin in Berlin', 'Who offers office hours this week?'],
    };
  }

  const lines = found.map((item) => {
    const first = item.fields[0]?.content ?? '';
    const href = item.eventUrl ?? link(item);
    return `- **[${item.name}](${href})** (${TYPE_WORD[item.index]}) — ${first}`;
  });

  /* Follow-ups name a thing from the answer, never the question verbatim — a
     follow-up to a follow-up would otherwise nest the whole sentence. "Who
     at …" only makes sense of a team. */
  const team = found.find((i) => i.index === 'teams');
  const topic = tokens.length <= 3 ? query.trim() : found[0].name;
  const followUpQuestions = [
    team ? `Who at ${team.name} offers office hours?` : `What does ${found[0].name} work on?`,
    `Are there events related to ${topic}?`,
    'Narrow this to teams in Berlin',
  ];

  return {
    answer: [`Here is what the directory has on **${query.trim()}**:`, '', ...lines].join('\n'),
    sources: found.slice(0, 2).map((i) => i.eventUrl ?? `https://directory.plnetwork.io${link(i)}`),
    sql: found.map(hit),
    followUpQuestions,
  };
}

/** Reasons offered after a thumbs-down. Reddit Answers' set, re-worded for a directory. */
export const FEEDBACK_REASONS = ['Wrong matches', 'Out of date', "Didn't answer", 'No sources'];
