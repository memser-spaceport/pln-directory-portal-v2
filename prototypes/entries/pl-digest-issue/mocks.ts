/**
 * PL Network Digest No. 07, as one edition for founders and investors.
 *
 * Shaped like the edition the backend would serve from
 * `GET /v1/labos-digest/editions/:slug` (LabosDigestSend / SendStory with
 * edition fields): an edition with a slug and date, and stories that each carry
 * a section, a team, sources and actions. Copy is the No. 07 demo's two views
 * merged into one (pl-network-digest repo, issues/no07); each story appears once.
 *
 * Teams and public news only. No member names or photos anywhere. Held items
 * (security incidents, leadership changes, settlements) are not in this file.
 */

export type SectionKey = 'lead' | 'founders' | 'investors';

/** Where a story sits inside its cohort section. */
export type Group = 'Heads-up' | 'Wins' | 'Signals';

export interface TeamRef {
  /** Directory uid (`dw_company_id`), so the name links to `/teams/:uid`. */
  uid: string;
  name: string;
}

export interface Source {
  label: string;
  href: string;
}

/** What a reader can do on a story, in the order they render. */
export type StoryAction = 'follow' | 'intro' | 'share';

/** A labelled line under a story body. `cohort` marks a line written for one reader. */
export interface Takeaway {
  label: string;
  text: string;
  cohort?: 'founders' | 'investors';
}

export interface Story {
  id: string;
  section: SectionKey;
  group?: Group;
  /** Announcement date, shown on every item (A6). */
  date: string;
  team: TeamRef;
  /**
   * Headline after the team name, which renders as the team-page link (B3).
   * A story whose headline does not start with the team (the lead) sets
   * `headline` instead, and the team's first mention in the body is the link.
   */
  headlineRest?: string;
  headline?: string;
  body: string[];
  takeaways: Takeaway[];
  sources: Source[];
  actions: StoryAction[];
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
  deals: { rows: DealRow[]; catchUpNote: string };
  take: { title: string; paragraphs: TakeSegment[][] };
  events: EventItem[];
  eventsHref: string;
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
  optimismGov: { label: 'Optimism governance forum', href: 'https://gov.optimism.io/t/upgrade-21-interop-readiness/10948' },
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

const ALL_ACTIONS: StoryAction[] = ['follow', 'intro', 'share'];

export const EDITION: Edition = {
  slug: 'no-07',
  number: 'No. 07',
  date: '2026-11-11',
  dateLabel: '11 Nov 2026',
  readMinutes: 4,
  subject: 'Confidential stablecoin payments reached retail on Ethereum',
  preheader: 'Also: a $250M neurotech round, an 8B model anyone can audit, and a Starknet change to check before you deploy.',

  stories: [
    {
      id: 'lead',
      section: 'lead',
      date: '9 Nov',
      team: TEAMS.zama,
      headline: 'Confidential stablecoin payments reached retail on Ethereum',
      body: [
        'On November 9, Raycash, a spin-off of Zama, opened a private beta on Ethereum mainnet. The app lets people hold dollars, send and receive payments, and earn yield through Morpho, while the amounts stay encrypted. It is the first retail payment product built on the Zama Protocol, which uses fully homomorphic encryption to keep balances and transaction values hidden on a public chain.',
        'Raycash does not issue a new stablecoin. It wraps the USDC people already hold, one to one, into confidential ERC-7984 tokens. The user does not have to trust a new issuer, only the wrapper.',
      ],
      takeaways: [
        {
          label: 'Why it matters',
          cohort: 'investors',
          text: 'Fully homomorphic encryption has lived in research papers and testnets. This is the first attempt to put it in the hands of people who are not cryptographers. The company says more than 75,000 people joined the waitlist before launch.',
        },
        {
          label: 'What to do',
          cohort: 'founders',
          text: 'If you build on stablecoin rails, your users can now pay each other without the amounts being public. If your product depends on reading stablecoin flows, that assumption now has a competitor.',
        },
        {
          label: 'Yes, but',
          text: 'The app is self-custodial and has no freeze or seize function at the token layer. That is a design choice, and it is the one regulators will ask about first.',
        },
      ],
      sources: [SRC.theBlockRaycash, SRC.cryptoBriefingRaycash],
      actions: ALL_ACTIONS,
    },

    // ---- For founders ----
    {
      id: 'gensyn',
      section: 'founders',
      group: 'Heads-up',
      date: '9 Nov',
      team: TEAMS.gensyn,
      headlineRest: ' opened a training run you can audit on your own machine',
      body: [
        'Open-8b is an 8-billion-parameter model training in public, five times the size of open-1b. Every step is committed and can be replayed on ordinary hardware. Gensyn says the audit overhead fell from 5.5x the GPU-hours of a standard run for open-1b to about 1.3x for open-8b.',
      ],
      takeaways: [
        {
          label: 'What to do',
          text: 'If your product depends on saying how a model was trained, this is the first time that claim has been cheap to check.',
        },
      ],
      sources: [SRC.gensynBlog],
      actions: ALL_ACTIONS,
    },
    {
      id: 'starkware',
      section: 'founders',
      group: 'Heads-up',
      date: '7 Nov',
      team: TEAMS.starkware,
      headlineRest: ' shipped BLAKE2s-256 hashing into Starknet',
      body: [
        'Starknet v0.14.3 replaces Pedersen with BLAKE2s-256 for operating-system hashes, part of the move to post-quantum security. Accounts can migrate one by one, without a chain-wide signing upgrade.',
      ],
      takeaways: [
        {
          label: 'What to do',
          text: 'If you build on Starknet, this is a protocol-level change to how proofs are hashed. Read the changelog before your next deploy.',
        },
      ],
      sources: [SRC.tokenpostStarknet],
      actions: ALL_ACTIONS,
    },
    {
      id: 'lido',
      section: 'founders',
      group: 'Wins',
      date: '5 Nov',
      team: TEAMS.lido,
      headlineRest: ' built token swaps into its staking product',
      body: ['Stakers can now swap tokens inside the app on Ethereum, Arbitrum and Base, through CoW Swap.'],
      takeaways: [],
      sources: [SRC.tokenpostLido],
      actions: ALL_ACTIONS,
    },
    {
      id: 'aria',
      section: 'founders',
      group: 'Wins',
      date: '5 Nov',
      team: TEAMS.aria,
      headlineRest: ' funded ten teams in a £50M neurotechnology programme',
      body: [
        'The Massively Scalable Neurotechnologies programme backs ten teams testing ways to reach the brain without surgery. Each project is a 36-month feasibility study.',
      ],
      takeaways: [],
      sources: [SRC.ariaProgramme],
      actions: ALL_ACTIONS,
    },

    // ---- For investors ----
    {
      id: 'coinlist',
      section: 'investors',
      group: 'Signals',
      date: '9 Nov',
      team: TEAMS.coinlist,
      headlineRest: ' is a day-one partner for a tokenized-securities venue on Solana',
      body: [
        'Passage will connect to Formation Securities, which told the SEC it plans to run a venue for tokenized stocks, with trading expected in early 2027.',
      ],
      takeaways: [
        {
          label: 'Why it matters',
          text: 'It is a second track toward regulated on-chain securities, and it does not run through Ethereum.',
        },
      ],
      sources: [SRC.coinlistBlog, SRC.cryptoBriefingFormation],
      actions: ALL_ACTIONS,
    },
    {
      id: 'optimism',
      section: 'investors',
      group: 'Signals',
      date: '4 Nov',
      team: TEAMS.optimism,
      headlineRest: ' proposed Upgrade 21 to prepare OP Stack chains for interop',
      body: [
        'The governance proposal puts in place the L1 contract changes OP Stack chains need before they can talk to each other directly. It does not switch interop on.',
      ],
      takeaways: [
        {
          label: 'What’s next',
          text: 'If interop follows, a rollup becomes less a standalone chain and more a member of a network.',
        },
      ],
      sources: [SRC.optimismGov],
      actions: ALL_ACTIONS,
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
      note: 'Runs in London, organized by the DAS team. Network teams are on the ground this week.',
    },
    {
      id: 'proof-of-talk',
      dates: '2–3 Dec',
      title: 'Proof of Talk, Abu Dhabi',
      note: 'A two-day summit for the crypto and Web3 industry, run by its own organizing team.',
    },
  ],
  eventsHref: 'https://events.plnetwork.io/program',
};

/** Section headings and their anchors, in page order. One list feeds the rail and the email. */
export const SECTIONS = [
  { id: 'lead', label: 'The lead' },
  { id: 'deals', label: 'Capital & deals' },
  { id: 'founders', label: 'For founders' },
  { id: 'investors', label: 'For investors' },
  { id: 'take', label: 'The editor’s take' },
  { id: 'dates', label: 'Where the network will be' },
] as const;

/** The sender line in the mock inbox. A placeholder address, not a person. */
export const EMAIL_FROM = 'PL Network Digest <digest@plnetwork.io>';
export const EMAIL_TO = 'member@example.com';

export const teamHref = (uid: string) => `/teams/${uid}`;
export const issueHref = (anchor?: string) =>
  `/prototypes/pl-digest-issue?view=page${anchor ? `#${anchor}` : ''}`;
