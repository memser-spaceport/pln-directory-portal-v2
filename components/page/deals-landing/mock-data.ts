import type { FAQItem } from '@/app/constants/demoday';

export type { FAQItem };

export interface ValueProp {
  icon: string;
  title: string;
  description: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  timeEstimate: string;
}

export const vendorLogoItems = [
  { src: '/icons/deals/aws.png', alt: 'AWS' },
  { src: '/icons/deals/openai.png', alt: 'OpenAI' },
  { src: '/icons/deals/azure.png', alt: 'Microsoft Azure' },
  { src: '/icons/deals/linear.png', alt: 'Linear' },
];

export const mockFaqItems: FAQItem[] = [
  {
    question: 'What is the PL Deals program?',
    answer:
      'Deals are exclusive discounts or offers that companies provide to PL funded teams. Teams use these deals when adopting new tools, scaling infrastructure, or launching new products.',
  },
  {
    question: 'What are the minimum requirements for a deal?',
    answer:
      'We look for offers that provide real, exclusive value — not deals already available publicly. Minimum: $1,000+ in value or 3+ months free on a paid plan. More generous offers get more engagement from our teams.',
  },
  {
    question: 'Who can see and redeem deals?',
    answer:
      'Deals are available exclusively to PL funded teams. Access is managed by PL admins to ensure deals remain exclusive to portfolio companies.',
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
    description: 'Your deal is visible to PL funded teams actively building and spending on tools.',
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
