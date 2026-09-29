import type { FAQItem } from '@/app/constants/demoday';
import { spvFaqItems } from '../spv-spotlight/mocks';

// Mocked data for the Explore PL Network landing — the page an SPV Spotlight's
// "Explore PL Network" button opens for investors who don't know the network.
// The portfolio itself is marketing's logo-islands data, in islands.ts.

export const EXPLORE_COPY = {
  supportEmail: 'spotlight@protocol.ai',
};

// ---- Protocol Labs context (2026-09-29 sync: both directions need it) --------
// Marketing's "General Info +" panel on logo-islands.vercel.app, word for word
// (read 2026-09-29). The same text is protocol.ai's About and plnetwork.io/about.
export const PL_CONTEXT = {
  mission: 'Protocol Labs drives breakthroughs in computing to push humanity forward.',
  about:
    'We are an innovation network that connects over 760 tech startups, service providers, investment funds, accelerators, foundations, and other organizations developing breakthrough technologies and products in the frontiers of computing: web3, AI, AR, VR, BCI, hardware, and more. Organizations collaborate across the network to solve common problems, share knowledge and resources, and accelerate the R&D process for a wide range of technological fields.',
  // protocol.ai, the paragraph under the Innovation Network bar (2026-09-29).
  origin:
    'Originally formed as the team behind IPFS, Filecoin, and libp2p, Protocol Labs continues to support those projects while expanding into additional emerging technologies.',
  source: { label: 'protocol.ai', href: 'https://protocol.ai/' },
};

// The four areas, in the panel's order, with its own one-liners (the site's
// /focus-areas route, linked from General Info). Ids match islands.ts so the
// Visual direction can colour them like the map.
export const FOCUS_AREAS = [
  {
    island: 'digital-human-rights',
    name: 'Digital Human Rights',
    line: 'Building decentralized infrastructure that enshrines freedom and safety in the digital age.',
  },
  {
    island: 'economies--governance',
    name: 'Economies & Governance',
    line: 'Crypto-native tools for more efficient, equitable coordination at global scale.',
  },
  {
    island: 'ai--robotics',
    name: 'AI & Robotics',
    line: 'Responsible advancement in AGI, robotics, and immersive technologies that reshape how we interact with the world.',
  },
  {
    island: 'neurotech',
    name: 'Neurotechnology',
    line: 'Accelerating brain-computer interfaces and NeuroAI to expand human cognition and treat brain disorders.',
  },
] as const;

// Key numbers. Only ones a source backs: the portfolio count is islands.ts
// (filled in by the page); the rest are marketing's own, as published. Sources
// are named as an investor can check them, not by our internal panel names.
// `source` is provenance only — the page no longer prints it (Anuj, 2026-09-29).
// protocol.ai also claims 3k contributors and a $40B combined valuation — left
// out until someone signs off on showing them to investors. The network count
// is protocol.ai's 750+, which Anuj asked to keep consistent with the SPV
// page's Explore tile (2026-09-29); General Info (PL_CONTEXT) still says 760.
export const PL_FACTS = [
  { value: '2014', label: 'Founded', source: 'pl.xyz/about' },
  { value: '750+', label: 'Organizations in the network', source: 'protocol.ai' },
  { value: 'portfolio', label: 'Portfolio teams', source: 'Listed below' },
  { value: '4', label: 'Focus areas', source: 'protocol.ai' },
] as const;

// The PL entities. Each line is the entity's own meta description or headline,
// trimmed; every URL answered 200 on 2026-09-29 (curl -sIL). PLVS has no site of
// its own — its page lives on PL Capital's.
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

// Linked from protocol.ai as "Our Vision: PL Summit 2024", on the Protocol Labs
// YouTube channel; oEmbed confirms it is public and embeddable (2026-09-29).
export const PL_VIDEO = {
  id: 'N9lQx9ijv88',
  title: 'PL Summit 2024 — A Year of Impact in the Innovation Network',
  channel: 'Protocol Labs on YouTube',
  poster: 'https://img.youtube.com/vi/N9lQx9ijv88/maxresdefault.jpg',
};

// Hero copy per direction. Ours, not marketing's — flagged for rewrite.
export const DIRECTION_COPY = {
  editorial: {
    overline: 'About Protocol Labs',
    title: 'The Protocol Labs Network',
  },
  visual: {
    overline: 'For investors',
    title: 'Explore the PL Network',
    body: (teams: number) => `${teams} teams across four frontiers of computing, with Protocol Labs at the centre.`,
  },
};

// What an investor new to PL asks first, then the Spotlight questions carried
// over from the deal page (which no longer holds an FAQ). Placeholder copy.
export const exploreFaqItems: FAQItem[] = [
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
  ...spvFaqItems,
];
