import type { StaticImageData } from 'next/image';
import type { FeedComment } from '../newsfeed-v0/mocks';

import avatarJohn from './assets/avatar-john.png';
import avatarSarah from './assets/avatar-sarah.png';
import filecoinFlywheel from './assets/filecoin-flywheel.png';
import opToken from './assets/op-token.png';
import techcrunch from './assets/techcrunch.png';

/** Copy is mock, transcribed from Figma 13282:445 (Personalized) and extended with full bodies. */

export type Feedback = 'more' | 'less';

export interface DigestStory {
  id: string;
  topStory?: boolean;
  /** Which side the image sits on, as the email alternates them. */
  imageSide: 'right' | 'left';
  image: StaticImageData;
  title: string;
  /** The email's two-line summary; the first paragraph on the page. */
  summary: string;
  /** The rest of the story, which the email cuts off with Read More. */
  body: string[];
  topic: string;
  source: string;
  /** The team the story is about: the page's Follow button follows it. */
  team: string;
  /** Where the story was reported; the page lists them under the story. */
  sources: { name: string; url: string }[];
}

export interface DigestForumPost {
  id: string;
  author: string;
  role: string;
  avatar: StaticImageData;
  title: string;
  body: string[];
  /** For the forum post modal Home uses (newsfeed-v0 ForumPostModal). */
  category: string;
  createdAt: string;
  views: number;
  tags: string[];
  /** Replies in the forum thread (mock), for the digest row's "N replies". */
  replies: number;
}

export const DIGEST_ISSUE = {
  id: '2026-11-09',
  greetingName: 'Polina',
  intro: 'Picked for you from subscribed tags and the teams you follow.',
};

/**
 * The rail's "Your topics" card, from the real tag list (digest-topics `TOPICS`).
 * Subscribed: the tags this issue's stories carry (Proprio → ai-robotics, Starknet and
 * Optimism → blockchain-protocols, Lattice → decentralized-compute, Filecoin →
 * decentralized-storage) plus two more. Suggested: a few the reader doesn't follow yet;
 * the other tags stay behind See all topics.
 */
export const DIGEST_TOPICS = [
  'ai',
  'ai-robotics',
  'blockchain-protocols',
  'decentralized-compute',
  'decentralized-storage',
  'network-programs',
];
export const DIGEST_SUGGESTED_TOPICS = ['cryptographic-proofs', 'defi', 'desci', 'public-goods-funding'];

export const DIGEST_STORIES: DigestStory[] = [
  {
    id: 'proprio-labs',
    topStory: true,
    imageSide: 'right',
    image: techcrunch,
    title: 'Proprio Labs raises $26M to train a shared robot manipulation model',
    summary:
      'The round funds a shared manipulation model trained on pooled teleoperation data, with contributors keeping rights to their own recordings. Weights ship under Apache 2.0.',
    body: [
      'Proprio Labs will use the money to grow its teleoperation fleet from 40 to 300 stations across three labs, and to pay contributors per hour of usable recording. Contributors keep the rights to their own recordings and can withdraw them from future training runs.',
      'The first checkpoint is planned for March. The team says it will publish the evaluation suite before the weights, so other labs can check the numbers on their own hardware.',
      'The round was led by two network funds, with angels from four portfolio robotics teams. Proprio Labs is hiring a data platform lead and two research engineers.',
    ],
    topic: 'ai',
    source: 'TechCrunch',
    team: 'Proprio Labs',
    sources: [
      { name: 'TechCrunch', url: 'https://techcrunch.com' },
      { name: 'The Robot Report', url: 'https://www.therobotreport.com' },
    ],
  },
  {
    id: 'starknet-l1',
    imageSide: 'left',
    image: filecoinFlywheel,
    // Figma's title and summary are cut mid-sentence; finished here so the full page reads.
    title: 'Starknet Considers Becoming Sovereign L1 to Achieve Full Quantum Resistance by 2028',
    summary:
      'A new proposal would move Starknet from Ethereum settlement to its own base layer, so it can upgrade its cryptography on its own schedule.',
    body: [
      'The proposal argues that STARK proofs are already hash-based and quantum resistant, but settlement on Ethereum ties the network to signature schemes that are not. Running its own base layer would let Starknet replace them without waiting for Ethereum.',
      'Critics in the forum thread say the move would split liquidity and weaken the security Starknet borrows from Ethereum today. A community vote is planned for January.',
    ],
    topic: 'crypto',
    source: 'The Block',
    team: 'Starknet',
    sources: [
      { name: 'The Block', url: 'https://www.theblock.co' },
      { name: 'CryptoBriefing', url: 'https://cryptobriefing.com' },
    ],
  },
  {
    id: 'op-token',
    imageSide: 'right',
    image: opToken,
    title: 'Optimism’s OP Token Climbs Nearly 20% as Unichain Shifts to OP Enterprise',
    summary:
      'Unichain is moving to OP Enterprise, and the token rose as the chain committed to staying in the OP Stack ecosystem.',
    body: [
      'OP Enterprise is the paid support tier Optimism launched in September for chains that want guaranteed upgrade timelines. Unichain is its largest customer so far.',
      'Analysts linked the price move to the revenue share: chains on OP Enterprise pay a share of sequencer fees to the Optimism Collective, which some read as the first durable demand for the token.',
    ],
    topic: 'crypto',
    source: 'CoinDesk',
    team: 'Optimism',
    sources: [
      { name: 'CoinDesk', url: 'https://www.coindesk.com' },
      { name: 'Decrypt', url: 'https://decrypt.co' },
    ],
  },
  {
    id: 'open-ai-models',
    imageSide: 'left',
    image: techcrunch,
    title: 'Founders at TechCrunch Disrupt make the case for open AI models',
    summary:
      'Three founders argued that shared weights and open data will beat closed labs on cost and trust over the next two years.',
    body: [
      'The panel included founders from two network teams. Their main argument: buyers in regulated industries want to inspect the weights and the training data, and closed labs cannot offer that.',
      'They also pointed to cost. Fine-tuning an open model on a customer’s own data was, in their numbers, a tenth of the price of a closed API at the same volume.',
      'The moderator pushed back on safety. The panel agreed that open release needs staged access for the most capable models, but not for the models most companies actually deploy.',
    ],
    topic: 'ai',
    source: 'TechCrunch',
    team: 'Lattice Compute',
    sources: [{ name: 'TechCrunch', url: 'https://techcrunch.com' }],
  },
  {
    id: 'filecoin-flywheel',
    imageSide: 'right',
    image: filecoinFlywheel,
    title: 'How the Filecoin flywheel turns storage payments into network growth',
    summary:
      'Each storage deal pays providers, and that revenue funds more capacity and lower prices for the next developer.',
    body: [
      'The piece walks through the six steps of the flywheel: paid deals, provider revenue, new capacity, lower prices, more developers, and more paid deals.',
      'The weak step today is the second: most provider revenue still comes from block rewards, not deals. The authors expect that to flip as paid storage grows past 30% of capacity.',
    ],
    topic: 'filecoin',
    source: 'Filecoin Foundation blog',
    team: 'Filecoin Foundation',
    sources: [{ name: 'Filecoin Foundation blog', url: 'https://fil.org/blog' }],
  },
];

export const DIGEST_FORUM_POSTS: DigestForumPost[] = [
  {
    id: 'retrieval-latency',
    author: 'John Smith',
    role: 'Developer @Aave',
    avatar: avatarJohn,
    title: 'How we reduced retrieval latency in a decentralized data pipeline by 45%',
    category: 'Engineering',
    createdAt: '2026-11-06T15:20:00Z',
    views: 214,
    replies: 14,
    tags: ['retrieval', 'filecoin'],
    body: [
      'Our pipeline pulls a few terabytes a day from storage providers, and the slowest step was always the first byte. Here is what brought the median from 1.8s to under a second.',
      'We moved hot content to a regional cache in front of the retrieval providers and batched our CID lookups. Most of the gain came from the batching, not the cache.',
    ],
  },
  {
    id: 'cross-chain',
    author: 'Sarah Kamau',
    role: 'Developer @Aave',
    avatar: avatarSarah,
    title: 'Introducing a new model for cross-chain data coordination',
    category: 'Research',
    createdAt: '2026-11-07T10:05:00Z',
    views: 138,
    replies: 9,
    tags: ['interop'],
    body: [
      'Cross-chain apps today stitch together bridges and relayers, and every new chain adds another integration to maintain. We have been testing a simpler model.',
      'The model treats each chain as a reader of one shared log instead of passing messages between chains. We are looking for two teams to try it on testnet.',
    ],
  },
];

/**
 * Seeded comments on the page's stories, in the feed's comment shape (newsfeed-v0
 * `FeedComment`), so a story's thread here is the same thread Home shows. Stories
 * absent here open an empty thread. New comments are held for the visit only.
 */
export const DIGEST_COMMENTS: Record<string, FeedComment[]> = {
  'proprio-labs': [
    {
      uid: 'c-proprio-1',
      author: 'Devon Okoro',
      role: 'Protocol Engineer @ libp2p',
      text: 'Pooled teleop data with contributors keeping their rights is a big deal. Is the recording format open too?',
      createdAt: '2026-11-09T10:20:00.000Z',
      likes: 5,
    },
    {
      uid: 'c-proprio-2',
      author: 'Mira Chen',
      role: 'Founder @ Lattice Compute',
      text: 'Yes, the spec is on their GitHub. We are looking at it for our own fleet.',
      createdAt: '2026-11-09T11:05:00.000Z',
      parentUid: 'c-proprio-1',
      likes: 2,
    },
  ],
  'starknet-l1': [
    {
      uid: 'c-starknet-1',
      author: 'Sasha Rao',
      role: 'Research Lead @ Filecoin Foundation',
      text: 'Curious how they plan to handle bridged assets during the move. Anyone seen the migration plan?',
      createdAt: '2026-11-09T14:40:00.000Z',
      likes: 3,
    },
  ],
};
