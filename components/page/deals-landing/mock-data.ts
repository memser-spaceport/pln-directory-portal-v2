import type { FAQItem } from '@/app/constants/demoday';

export type { FAQItem };

export interface MockDeal {
  id: string;
  logo: string;
  company: string;
  offer: string;
  description: string;
  tags: string[];
  category: string;
  redemptions: number;
}

export interface MockLogo {
  name: string;
  logo: string;
}

export interface ValueProp {
  icon: string;
  title: string;
  description: string;
  stat?: string;
  statLabel?: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  timeEstimate: string;
}

export const mockDeals: MockDeal[] = [
  {
    id: 'deal-001',
    logo: 'https://cdn.simpleicons.org/vercel/000000',
    company: 'Vercel',
    offer: '$3,000 in Cloud Credits',
    description: 'Deploy faster on the world\'s leading frontend platform. Free credits to run your production workloads for a full year.',
    tags: ['Infrastructure', 'Developer Tools'],
    category: 'Cloud & Hosting',
    redemptions: 47,
  },
  {
    id: 'deal-002',
    logo: 'https://cdn.simpleicons.org/stripe/000000',
    company: 'Stripe',
    offer: 'Zero fees on first $500K',
    description: 'Start accepting payments with waived processing fees on your first $500,000 in revenue. Built for fast-moving startups.',
    tags: ['Payments', 'Fintech'],
    category: 'Payments',
    redemptions: 38,
  },
  {
    id: 'deal-003',
    logo: 'https://cdn.simpleicons.org/linear/000000',
    company: 'Linear',
    offer: '12 Months Free on Standard',
    description: 'Ship faster with the issue tracker trusted by world-class engineering teams. Free for your entire team, no credit card needed.',
    tags: ['Project Management', 'Developer Tools'],
    category: 'Engineering',
    redemptions: 29,
  },
];

export const mockTrustLogos: MockLogo[] = [
  { name: 'Vercel', logo: 'https://placehold.co/120x40/f8fafc/94a3b8?text=Vercel' },
  { name: 'GitHub', logo: 'https://placehold.co/120x40/f8fafc/94a3b8?text=GitHub' },
  { name: 'Notion', logo: 'https://placehold.co/120x40/f8fafc/94a3b8?text=Notion' },
  { name: 'Figma', logo: 'https://placehold.co/120x40/f8fafc/94a3b8?text=Figma' },
];

export const vendorLogoItems = [
  { src: '/icons/deals/aws.png', alt: 'AWS' },
  { src: '/icons/deals/openai.png', alt: 'OpenAI' },
  { src: '/icons/deals/azure.png', alt: 'Microsoft Azure' },
  { src: 'https://cdn.simpleicons.org/linear/000000', alt: 'Linear' },
];

export interface MockExampleDeal {
  logoUrl: string;
  vendorName: string;
  shortDescription: string;
  offer: string;
  category: string;
  audience: string;
  isHighValue?: boolean;
  teamsUsingCount: number;
}

export const mockExampleDeals: MockExampleDeal[] = [
  {
    logoUrl: 'https://cdn.simpleicons.org/vercel/000000',
    vendorName: 'Vercel',
    shortDescription: 'Deploy web projects with the best frontend developer experience and global edge network.',
    offer: '12 months free on Pro plan',
    category: 'Cloud Infrastructure',
    audience: 'Founders',
    isHighValue: true,
    teamsUsingCount: 48,
  },
  {
    logoUrl: 'https://cdn.simpleicons.org/notion/000000',
    vendorName: 'Notion',
    shortDescription: 'The connected workspace for notes, docs, wikis, and project management.',
    offer: '6 months free on Business plan',
    category: 'Productivity',
    audience: 'Teams',
    teamsUsingCount: 31,
  },
  {
    logoUrl: 'https://cdn.simpleicons.org/linear/5E6AD2',
    vendorName: 'Linear',
    shortDescription: 'Streamline software projects, sprints, tasks, and bug tracking for high-velocity teams.',
    offer: '12 months free on Standard',
    category: 'Dev Tools',
    audience: 'Developers',
    teamsUsingCount: 22,
  },
  {
    logoUrl: 'https://cdn.simpleicons.org/stripe/635BFF',
    vendorName: 'Stripe',
    shortDescription: 'The financial infrastructure platform built for fast-moving startups and scaleups.',
    offer: 'Zero fees on first $500K processed',
    category: 'Payments',
    audience: 'Startups',
    isHighValue: true,
    teamsUsingCount: 19,
  },
];

export const mockFaqItems: FAQItem[] = [
  {
    question: 'What is the PL Deals program?',
    answer:
      'Deals are exclusive discounts or offers that companies can provide to the 700+ teams in the Protocol Labs network. Teams use these deals when adopting new tools, scaling infrastructure, or launching new products.',
  },
  {
    question: 'What are the minimum requirements for a deal?',
    answer:
      'We look for offers that provide real, exclusive value — not deals already available publicly. Minimum: $1,000+ in value or 3+ months free on a paid plan. More generous offers get more engagement from our network.',
  },
  {
    question: 'Who can see and redeem deals?',
    answer:
      'Deals are available to verified members of the PL network — primarily founders, CXOs, and select team leads across 700+ teams. Access is managed by PL admins to ensure deals remain exclusive.',
  },
  {
    question: 'How long does approval take?',
    answer:
      'Our team reviews submissions within 3–5 business days. We may reach out with questions or suggestions to make your offer more compelling. You will be notified once your deal is live.',
  },
  {
    question: 'Can I track how my deal is performing?',
    answer:
      'Yes. You will receive periodic reports on deal views, redemptions, and the number of teams actively using your product through the deal.',
  },
] as FAQItem[];

export const mockValueProps: ValueProp[] = [
  {
    icon: 'users',
    title: 'Direct access to verified builders',
    description: 'Your deal is visible to 700+ teams actively building and spending on tools.',
  },
  {
    icon: 'zap',
    title: 'High-intent distribution',
    description: 'Deals are surfaced inside the platform where founders already work — not buried in newsletters.',
  },
  {
    icon: 'chart',
    title: 'Measurable engagement',
    description: 'Track redemptions and interest. Every claim is a warm lead from your target audience.',
  },
  {
    icon: 'shield',
    title: 'Curated ecosystem',
    description: 'Join a trusted group of tools used by top teams in Web3, AI, and deep tech.',
  },
];

export const mockHowItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: 'Submit Your Deal',
    description: 'Share your offer, eligibility, and redemption details.',
    timeEstimate: '~5 min',
  },
  {
    step: 2,
    title: 'Review & Approval',
    description: 'Our team reviews within 3–5 business days. We may reach out with questions.',
    timeEstimate: '3–5 days',
  },
  {
    step: 3,
    title: 'Go Live',
    description: 'Your deal is published and discoverable by relevant founders.',
    timeEstimate: 'Same week',
  },
  {
    step: 4,
    title: 'Get Engagement',
    description: 'Founders view, save, and redeem your offer. You get high-intent traffic and leads.',
    timeEstimate: 'Ongoing',
  },
];
