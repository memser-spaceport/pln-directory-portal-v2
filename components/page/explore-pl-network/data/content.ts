import type { FAQItem } from '@/app/constants/demoday';
import { SPV_FAQ_ITEMS } from '@/components/page/spv-spotlight/faq';
import { PL_NETWORK_ORGANIZATIONS_LABEL } from '@/services/explore-pl-network/constants';

// Editorial copy for the Explore PL Network landing, copied from the approved
// prototype (prototypes/entries/explore-pl-network/mocks.ts, 2026-09-29).
// Marketing's own words where noted; the rest is placeholder copy flagged for
// a marketing pass.

export const EXPLORE_SUPPORT_EMAIL = 'spotlight@protocol.ai';

export const EDITORIAL_HEADER = {
  overline: 'About Protocol Labs',
  title: 'The Protocol Labs Network',
};

// Marketing's "General Info" text on logo-islands.vercel.app, word for word
// (the same text as protocol.ai's About and plnetwork.io/about).
export const PL_CONTEXT = {
  mission: 'Protocol Labs drives breakthroughs in computing to push humanity forward.',
  about:
    'We are an innovation network that connects over 760 tech startups, service providers, investment funds, accelerators, foundations, and other organizations developing breakthrough technologies and products in the frontiers of computing: web3, AI, AR, VR, BCI, hardware, and more. Organizations collaborate across the network to solve common problems, share knowledge and resources, and accelerate the R&D process for a wide range of technological fields.',
  origin:
    'Originally formed as the team behind IPFS, Filecoin, and libp2p, Protocol Labs continues to support those projects while expanding into additional emerging technologies.',
};

// The four areas, in marketing's order, with its own one-liners.
export const FOCUS_AREAS = [
  {
    id: 'digital-human-rights',
    name: 'Digital Human Rights',
    line: 'Building decentralized infrastructure that enshrines freedom and safety in the digital age.',
  },
  {
    id: 'economies--governance',
    name: 'Economies & Governance',
    line: 'Crypto-native tools for more efficient, equitable coordination at global scale.',
  },
  {
    id: 'ai--robotics',
    name: 'AI & Robotics',
    line: 'Responsible advancement in AGI, robotics, and immersive technologies that reshape how we interact with the world.',
  },
  {
    id: 'neurotech',
    name: 'Neurotechnology',
    line: 'Accelerating brain-computer interfaces and NeuroAI to expand human cognition and treat brain disorders.',
  },
] as const;

// Only figures a public source backs. `portfolio` is filled in from the map's
// own data so the two can't disagree.
export const PL_FACTS = [
  { value: '2014', label: 'Founded', source: 'Source: pl.xyz/about' },
  {
    value: PL_NETWORK_ORGANIZATIONS_LABEL,
    label: 'Organizations in the network',
    source: 'Source: plnetwork.io/about',
  },
  { value: 'portfolio', label: 'Portfolio teams', source: 'Listed below' },
  { value: '4', label: 'Focus areas', source: 'Source: protocol.ai' },
] as const;

// Each line is the entity's own meta description, trimmed.
export const PL_ENTITIES = [
  {
    name: 'Protocol Labs',
    line: 'The innovation network driving breakthroughs in computing to push humanity forward.',
    href: 'https://protocol.ai/',
    domain: 'protocol.ai',
  },
  {
    name: 'PL R&D',
    line: 'Funds pre-commercial invention and de-risks frontier ideas from open research to deployment.',
    href: 'https://www.plrd.org/',
    domain: 'plrd.org',
  },
  {
    name: 'PL Capital',
    line: 'A family of venture funds backing extraordinary founders scaling breakthrough R&D.',
    href: 'https://plcapital.xyz/',
    domain: 'plcapital.xyz',
  },
  {
    name: 'PL Venture Studio',
    line: 'Partners with founders translating cutting-edge R&D into groundbreaking startups.',
    href: 'https://plcapital.xyz/plvs',
    domain: 'plcapital.xyz/plvs',
  },
  {
    name: 'PL Neuro',
    line: 'Breaks through bottlenecks in neurotechnology and NeuroAI through investment and research.',
    href: 'https://www.plneuro.xyz/',
    domain: 'plneuro.xyz',
  },
] as const;

export const PL_CAPITAL_URL = 'https://plcapital.xyz/';

// What an investor new to PL asks first, then the Spotlight questions.
export const EXPLORE_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is the PL Network?',
    answer:
      'The PL Network is the group of teams Protocol Labs has founded, funded or accelerated, plus the people who work in them. Teams share infrastructure, events and talent, and many build on each other’s work.',
  },
  {
    question: 'Which teams are listed here?',
    answer:
      'Every team in the Protocol Labs portfolio with a public directory profile. Each profile is maintained by the team itself and by PL — founders, focus areas, projects and recent news.',
  },
  // The Spotlight questions, shared with the SPV Spotlight page's own Q&A.
  ...SPV_FAQ_ITEMS,
];
