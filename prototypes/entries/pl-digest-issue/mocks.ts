/**
 * PL Network Digest No. 07, v2: one edition, one voice, for everyone in the network.
 *
 * Shaped like the edition the backend would serve from
 * `GET /v1/labos-digest/editions/:slug` (LabosDigestSend / SendStory with
 * edition fields): an edition with a slug and date, and stories that each carry
 * a kind, a team, sources and actions. The layout follows YC's "This Week at
 * YC" (8 Nov): "The Latest" (short full stories with a visual), team launches
 * as cards ("New from network teams"), external press links ("Network news"),
 * a numbered forum list and a closing link to explore all teams.
 *
 * Copy comes from the No. 07 demo pool (pl-network-digest repo, issues/no07)
 * plus three LabOS pool items with their own sources (Goldsky, Tiger Data,
 * Hypercerts). Teams and public news only. No member names or photos anywhere.
 * Held items (security incidents, leadership changes, settlements) are not here.
 *
 * Mock, not data: the network-signal counts, the forum threads and "most read
 * last issue". Each is marked `mock` so the page can say so.
 */

export interface TeamRef {
  /** Directory uid, so the name links to `/teams/:uid`. */
  uid: string;
  name: string;
}

export interface Source {
  label: string;
  href: string;
}

/**
 * What a reader can do on a story, in the order they render.
 * No "Request an intro" here: intro requests stay on team profiles, where
 * eligibility is checked (owner feedback, story actions).
 */
export type StoryAction = 'follow' | 'share';

/** `lead`: the first story of The Latest, with a larger visual. `story`: the others. */
export type StoryKind = 'lead' | 'story';

/**
 * A story in "The Latest": one linked headline, one short paragraph, one line
 * of "Why it matters" and one next step. The visual is a team logo placeholder.
 */
export interface Story {
  id: string;
  kind: StoryKind;
  /** Announcement date, shown on every item (A6). */
  date: string;
  team: TeamRef;
  headline: string;
  /**
   * Mock uid of the aggregated news item in LabOS. The headline, the next
   * step and the share link all go to `/home?news=<uid>` (see `newsHref`).
   * Outside sources stay in `sources`.
   */
  newsUid: string;
  /** One paragraph, four or five short sentences. */
  paragraph: string;
  /** One line, one voice for every reader: no audience tag. */
  whyItMatters: string;
  /** The lead's counterweight, one line. */
  yesBut?: string;
  /** The story's one next step. It opens the news item in LabOS. */
  nextLabel: string;
  sources: Source[];
  actions: StoryAction[];
}

/** A launch or release card: "Team — tagline", one line, a focus badge. Links to the team page. */
export interface Launch {
  id: string;
  date: string;
  team: TeamRef;
  tagline: string;
  line: string;
  focus: string;
  source: Source;
}

/** An external press link: a thumbnail placeholder, a linked headline and the outlet. */
export interface PressLink {
  id: string;
  date: string;
  headline: string;
  outlet: string;
  href: string;
}

export interface DealRow {
  team: TeamRef;
  round: string;
  amount: string;
  what: string;
  announced: string;
  sources: Source[];
}

/** A run of editor's-take text; `ref` points at a story id on this page. */
export type TakeSegment = string | { text: string; ref: string } | { text: string; href: string };

export interface EventItem {
  id: string;
  dates: string;
  title: string;
  note: string;
}

/** A compact count row that opens a LabOS page. */
export interface NetworkSignal {
  id: 'jobs' | 'events' | 'teams' | 'deals';
  figure: string;
  label: string;
  href: string;
  mock: boolean;
  /** Example rows under the count (the jobs row lists a few roles). */
  examples?: { label: string; meta: string; href: string }[];
}

/** A forum thread, by title and reply count only. No author, no avatars. */
export interface ForumThread {
  id: string;
  title: string;
  replies: number;
  href: string;
}

export interface Edition {
  slug: string;
  number: string;
  /** ISO date and the display form. */
  date: string;
  dateLabel: string;
  readMinutes: number;
  subject: string;
  preheader: string;
  stories: Story[];
  launches: Launch[];
  news: PressLink[];
  deals: { rows: DealRow[]; catchUpNote: string };
  /**
   * The optional signals block. Signals change slowly from week to week
   * (decision D-3), so production makes this block configurable per issue:
   * off, monthly or quarterly. The prototype has a review switch, Off / Monthly.
   */
  signals: NetworkSignal[];
  /** Top threads since the last issue. The section renders only with forum access and at least one thread. */
  forum: { threads: ForumThread[]; href: string; mock: boolean };
  take: { title: string; paragraphs: TakeSegment[][] };
  events: EventItem[];
  eventsHref: string;
  mostReadLastIssue: { number: string; title: string; mock: boolean };
}

const TEAMS = {
  zama: { uid: 'cldvnyrhz01wju21kbfisksrs', name: 'Zama' },
  gensyn: { uid: 'cliuw30fu0002w502nq7ezyvn', name: 'Gensyn' },
  coinlist: { uid: 'cldvnvr0400vxu21kdzs1q4s4', name: 'CoinList' },
  starkware: { uid: 'cldvnuf9d00i1u21k2mpznj2n', name: 'StarkWare' },
  lido: { uid: 'cldvnvsj700whu21kbjc1i02d', name: 'Lido' },
  optimism: { uid: 'cluirunzy000csi02q6z869gp', name: 'Optimism' },
  aria: { uid: 'cly4ypxxz002e3l022n0nm4bx', name: 'ARIA' },
  precision: { uid: 'cmmfgpjlb0omdpi4forj6rdgi', name: 'Precision Neuroscience' },
  hypercerts: { uid: 'clnez5ttg00021h02he9ljx5m', name: 'Hypercerts' },
  goldsky: { uid: 'cldvnxhe301gzu21k1hug2g42', name: 'Goldsky' },
  tigerData: { uid: 'cldvnvv0o00x9u21kk5sacswo', name: 'Tiger Data' },
} satisfies Record<string, TeamRef>;

const SRC = {
  theBlockRaycash: {
    label: 'The Block',
    href: 'https://www.theblock.co/news/defi/2026-11-09-zama-spin-off-raycash-launches-confidential-stablecoin-payments-private-yield-ethereum-435909',
  },
  cryptoBriefingRaycash: {
    label: 'CryptoBriefing',
    href: 'https://cryptobriefing.com/raycash-confidential-stablecoin-payments-ethereum/',
  },
  gensynBlog: { label: 'Gensyn', href: 'https://www.gensyn.ai/news/open-8b-an-auditable-model-in-training' },
  coinlistBlog: { label: 'CoinList', href: 'https://blog.coinlist.co/passage-formation-securities/' },
  cryptoBriefingFormation: {
    label: 'CryptoBriefing',
    href: 'https://cryptobriefing.com/formation-securities-sec-solana-tokenized-venue/',
  },
  tokenpostStarknet: { label: 'TokenPost', href: 'https://www.tokenpost.com/news/technology/52068' },
  tokenpostLido: { label: 'TokenPost', href: 'https://www.tokenpost.com/news/technology/50210' },
  optimismVote: {
    label: 'Optimism Agora',
    href: 'https://vote.optimism.io/proposals/18704058920168992233750266034048958164367667396985967653465644941701644737084',
  },
  optimismDocs: { label: 'Optimism docs', href: 'https://docs.optimism.io/notices/upgrade-21' },
  hypercertsRelease: { label: 'Hypercerts docs', href: 'https://docs.hypercerts.org/releases/protocol' },
  goldskyBlog: { label: 'Goldsky', href: 'https://goldsky.com/blog/goldsky-real-time-data-elysium' },
  infoqTiger: { label: 'InfoQ', href: 'https://www.infoq.com/news/2026/11/postgresql-vector-search/' },
  ariaProgramme: {
    label: 'ARIA',
    href: 'https://aria.org.uk/opportunity-spaces/scalable-neural-interfaces/massively-scalable-neurotechnologies/funded-projects',
  },
  medtechDive: {
    label: 'MedTech Dive',
    href: 'https://www.medtechdive.com/news/precision-neuroscience-raises-250m-for-brain-computer-interface-work/831344/',
  },
  fierce: {
    label: 'Fierce Biotech',
    href: 'https://www.fiercebiotech.com/medtech/precision-neuroscience-taps-250m-series-d-funding-brain-computer-interface',
  },
} satisfies Record<string, Source>;

const ALL_ACTIONS: StoryAction[] = ['follow', 'share'];

export const EDITION: Edition = {
  slug: 'no-07',
  number: 'No. 07',
  date: '2026-11-11',
  dateLabel: '11 Nov 2026',
  readMinutes: 5,
  subject: 'Confidential stablecoin payments reached retail on Ethereum',
  preheader: 'Also: an 8B model anyone can audit, post-quantum hashing on Starknet, and four team launches.',

  stories: [
    {
      id: 'lead',
      kind: 'lead',
      date: '9 Nov',
      team: TEAMS.zama,
      headline: 'Zama spin-off Raycash brought confidential stablecoin payments to Ethereum',
      newsUid: 'mock-news-zama-raycash',
      paragraph:
        'On 9 Nov, Raycash, a spin-off of Zama, opened a private beta on Ethereum mainnet. People can hold dollars, send payments and earn yield through Morpho, while the amounts stay encrypted. It is the first retail payment product on the Zama Protocol, which uses fully homomorphic encryption. Raycash does not issue a new stablecoin: it wraps the USDC people already hold, one to one, into confidential ERC-7984 tokens. The company says more than 75,000 people joined the waitlist.',
      whyItMatters: 'Teams on stablecoin rails can now offer payments where the amounts are not public.',
      yesBut: 'The app has no freeze or seize function at the token layer, and regulators will ask about that first.',
      nextLabel: 'Read the full story in LabOS',
      sources: [SRC.theBlockRaycash, SRC.cryptoBriefingRaycash],
      actions: ALL_ACTIONS,
    },
    {
      id: 'gensyn',
      kind: 'story',
      date: '9 Nov',
      team: TEAMS.gensyn,
      headline: 'Gensyn opened a training run anyone can audit on ordinary hardware',
      newsUid: 'mock-news-gensyn-open-8b',
      paragraph:
        'Open-8b is an 8-billion-parameter model that trains in public. It is five times the size of open-1b. Every training step is committed publicly and can be replayed on ordinary hardware. Gensyn says the audit overhead fell from 5.5x the GPU-hours of a standard run for open-1b to about 1.3x for open-8b. After post-training, the model will judge markets on Delphi, Gensyn’s information-market platform.',
      whyItMatters: 'A claim about how a model was trained is now cheap to check.',
      nextLabel: 'Read the full story in LabOS',
      sources: [SRC.gensynBlog],
      actions: ALL_ACTIONS,
    },
    {
      id: 'starkware',
      kind: 'story',
      date: '7 Nov',
      team: TEAMS.starkware,
      headline: 'StarkWare shipped post-quantum hashing into Starknet',
      newsUid: 'mock-news-starknet-v0143',
      paragraph:
        'Starknet v0.14.3 replaces Pedersen with BLAKE2s-256 for operating-system hashes. The change is part of the move to post-quantum security. It changes how proofs are hashed at the protocol level. Accounts can migrate one by one, without a chain-wide signing upgrade.',
      whyItMatters: 'Teams on Starknet must check what the change does to their code before the next deploy.',
      nextLabel: 'Read the full story in LabOS',
      sources: [SRC.tokenpostStarknet],
      actions: ALL_ACTIONS,
    },
    {
      id: 'coinlist',
      kind: 'story',
      date: '9 Nov',
      team: TEAMS.coinlist,
      headline: 'CoinList became a day-one partner for a tokenized-securities venue on Solana',
      newsUid: 'mock-news-coinlist-formation',
      paragraph:
        'CoinList’s Passage will connect to Formation Securities. Formation told the SEC it plans to run a venue for tokenized stocks and bonds on Solana. Trading is expected in early 2027. Verified investors will get access through Passage partner apps and coinlist.co.',
      whyItMatters: 'It is a second track toward regulated on-chain securities, and it does not run through Ethereum.',
      nextLabel: 'Read the full story in LabOS',
      sources: [SRC.coinlistBlog, SRC.cryptoBriefingFormation],
      actions: ALL_ACTIONS,
    },
  ],

  // Launches and releases from the No. 07 pool. Each card opens the team page.
  launches: [
    {
      id: 'optimism',
      date: '11 Nov',
      team: TEAMS.optimism,
      tagline: 'The OP Stack for Ethereum layer 2s',
      line: 'Upgrade 21 passed governance on 11 Nov. Mainnet execution is targeted for 16 Nov.',
      focus: 'Layer 2',
      source: SRC.optimismVote,
    },
    {
      id: 'goldsky',
      date: '9 Nov',
      team: TEAMS.goldsky,
      tagline: 'Real-time blockchain data',
      line: 'Went live on Elysium mainnet with its full data stack from day one.',
      focus: 'Data infrastructure',
      source: SRC.goldskyBlog,
    },
    {
      id: 'lido',
      date: '5 Nov',
      team: TEAMS.lido,
      tagline: 'Liquid staking for Ethereum',
      line: 'Built token swaps into its staking app on Ethereum, Arbitrum and Base.',
      focus: 'DeFi',
      source: SRC.tokenpostLido,
    },
    {
      id: 'hypercerts',
      date: '3 Nov',
      team: TEAMS.hypercerts,
      tagline: 'Open records of impact work',
      line: 'Released Lexicons 2.0 for the modern AT Protocol client. Existing records stay valid.',
      focus: 'Public goods',
      source: SRC.hypercertsRelease,
    },
  ],

  // External press about network teams. Headlines are ours; the outlet is the link target.
  news: [
    {
      id: 'precision-press',
      date: '25 Sep',
      headline: 'Precision Neuroscience raised $250M for brain-computer interface work',
      outlet: 'MedTech Dive',
      href: SRC.medtechDive.href,
    },
    {
      id: 'formation-press',
      date: '9 Nov',
      headline: 'Formation Securities plans an SEC-registered venue for tokenized securities on Solana',
      outlet: 'CryptoBriefing',
      href: SRC.cryptoBriefingFormation.href,
    },
    {
      id: 'tiger-press',
      date: '7 Nov',
      headline: 'Tiger Data (formerly Timescale) released pg_vectorsearch for PostgreSQL in alpha',
      outlet: 'InfoQ',
      href: SRC.infoqTiger.href,
    },
    {
      id: 'aria-press',
      date: '5 Nov',
      headline: 'ARIA funded ten teams in its £50M programme to reach the brain without surgery',
      outlet: 'ARIA',
      href: SRC.ariaProgramme.href,
    },
  ],

  deals: {
    rows: [
      {
        team: TEAMS.precision,
        round: 'Series D',
        amount: '$250M',
        what: 'Oversubscribed round co-led by Pershing Square, the Ackman Oxman Institute and a life sciences fund. Brings total funding to about $430M (per MedTech Dive). Moves the Layer 7 implant through FDA review.',
        announced: '25 Sep',
        sources: [SRC.medtechDive, SRC.fierce],
      },
    ],
    catchUpNote:
      'Catch-up: no network team announced an equity round in the past two weeks. Precision’s round was announced six weeks ago and has not been covered here before.',
  },

  signals: [
    {
      id: 'jobs',
      figure: '42',
      label: 'new open roles across 17 network teams',
      href: '/jobs',
      mock: true,
      // Placeholder roles: no team named, so no real opening is implied.
      examples: [
        { label: 'Senior Rust engineer, ZK proving', meta: 'Remote', href: '/jobs' },
        { label: 'Head of business development', meta: 'New York', href: '/jobs' },
        { label: 'ML research engineer, verifiable training', meta: 'London or remote', href: '/jobs' },
      ],
    },
    { id: 'events', figure: '9', label: 'network events in the next 30 days', href: '/events', mock: true },
    { id: 'teams', figure: '6', label: 'teams joined the network in the past month', href: '/teams', mock: true },
    { id: 'deals', figure: '$250M', label: 'Series D for Precision Neuroscience, the largest round in the window', href: '/deals', mock: false },
  ],

  forum: {
    mock: true,
    href: '/forum',
    threads: [
      {
        id: 'fhe-keys',
        title: 'How are teams handling key management for FHE in production?',
        replies: 14,
        href: '/forum',
      },
      {
        id: 'pq-first',
        title: 'Post-quantum migration: what did you change first?',
        replies: 9,
        href: '/forum',
      },
      {
        id: 'first-bd',
        title: 'What worked when you hired your first BD lead?',
        replies: 22,
        href: '/forum',
      },
    ],
  },

  take: {
    title: 'The durable advantage is making verification cheap enough to ship in a product',
    paragraphs: [
      ['Three items in this issue point the same way.'],
      [
        { text: 'Raycash', ref: 'lead' },
        ' does not ask anyone to trust a new stablecoin issuer; it wraps the USDC people already hold, so the only new assumption is the wrapper. ',
        { text: 'Gensyn', ref: 'gensyn' },
        ' cut the cost of auditing a training run from 5.5 times a standard run to about 1.3 times, by its own account, which moves verifiable training from a research expense to something a product can absorb. And ',
        { text: 'Precision', ref: 'deals' },
        ' raised $250M in a brain-computer-interface surge in which the comparable rounds were $230M at Science Corporation and $252M at Merge Labs (',
        { text: 'per MedTech Dive', href: SRC.medtechDive.href },
        ').',
      ],
      [
        'None of these is a breakthrough in cryptography or neuroscience. Each one removed a cost. The opinion: the companies that matter in this network are no longer the ones publishing another whitepaper about trustless systems. They are the ones that made trusting unnecessary and put the result in a consumer app. That is harder to copy than a protocol, and slower to lose.',
      ],
    ],
  },

  events: [
    {
      id: 'das-london',
      dates: '10–11 Nov',
      title: 'Digital Asset Summit London 2026',
      note: 'Runs in London, organized by the DAS team.',
    },
    {
      id: 'proof-of-talk',
      dates: '2–3 Dec',
      title: 'Proof of Talk, Abu Dhabi',
      note: 'A two-day summit for the crypto and Web3 industry, run by its own organizing team.',
    },
  ],
  eventsHref: 'https://events.plnetwork.io/program',

  mostReadLastIssue: {
    number: 'No. 06',
    title: 'If your app fetches from ipfs.io or dweb.link, retrieval is changing under you',
    mock: true,
  },
};

/** Section headings and their anchors, in page order. `forum` drops out when the section does not render. */
export const SECTIONS = [
  { id: 'latest', label: 'The Latest' },
  { id: 'launches', label: 'New from network teams' },
  { id: 'news', label: 'Network news' },
  { id: 'deals', label: 'Capital & deals' },
  { id: 'signals', label: 'Network signals' },
  { id: 'forum', label: 'From the forum' },
  { id: 'take', label: 'The editor’s take' },
  { id: 'dates', label: 'Where the network will be' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/** The forum section's rule: access AND something new to show. */
export const showForum = (forumAccess: boolean) => forumAccess && EDITION.forum.threads.length > 0;

/** The sender line, the same as the current LabOS digest email (6 Nov). */
export const EMAIL_FROM = 'Protocol Labs - Member Services <labos@plnetwork.io>';
export const EMAIL_TO = 'member@example.com';
/** Mock first name for the greeting. Not a real person. Production uses the member's first name. */
export const EMAIL_FIRST_NAME = 'Alex';

export const teamHref = (uid: string) => `/teams/${uid}`;
/** The aggregated news item in LabOS, the same deep link as NewsShareMenu. */
export const newsHref = (uid: string) => `/home?news=${encodeURIComponent(uid)}`;
export const issueHref = (anchor?: string, forum = true) =>
  `/prototypes/pl-digest-issue?view=page${forum ? '' : '&forum=off'}${anchor ? `#${anchor}` : ''}`;
