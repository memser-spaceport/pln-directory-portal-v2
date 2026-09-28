import type { FAQItem } from '@/app/constants/demoday';
import { SEED_PROFILE } from '../member-profile-edit/mocks';
import { EMPTY_CONTACTS, type ProfileRecord } from '../profile-shared/SectionEditor/types';
import type { InvestorRecord } from './SpvInvestorProfileDrawer';

// Mocked data for the investor-facing SPV Spotlight (LAB-2669). Nothing here is
// fetched. The page is the completed Demo Day template, so the spotlight has
// the same fields that page reads from DemoDayState (title, description,
// teams, supportEmail), plus the SPV-only DocSend URL the admin sets.

export type SpvStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

// Who is looking. `signedOut` and `notApplied` both see the landing; the rest
// are application states the back office moves an investor through.
export type SpvViewer = 'signedOut' | 'notApplied' | 'pending' | 'approved' | 'rejected';

// The "Discover PL Network" CTA is one fixed global link, not per spotlight.
// TBD from product — placeholder until the URL is agreed.
export const DISCOVER_PL_NETWORK_URL = 'https://www.protocol.ai/';

export const mockSpotlight = {
  slug: 'pl-spotlight-spv-q4',
  title: "PL Spotlight Q4'26",
  // Admin-configurable hero copy. Rich text in production (Quill), rendered the
  // way the completed Demo Day renders its description.
  description:
    'PL Spotlight opens a Protocol Labs–led SPV to outside investors. One vehicle and a hand-picked set of teams from the PL Network — across AI, crypto, DeSci and infrastructure.',
  // Placeholder — the SPV's reply-to is set per spotlight in the back office.
  supportEmail: 'spotlight@protocol.ai',
};

export const mockSignedInUser = {
  name: 'Maya Chen',
  email: 'maya@northfield.vc',
  org: 'Northfield Ventures',
};

// What the investor-profile drawer opens on. The header card and contacts are
// what applying collected (name, email, organization) plus a photo and a
// LinkedIn; Investor Details starts empty, which is where a new applicant is —
// Demo Day's "+ Add startup stages" state.
export const mockInvestorProfile: ProfileRecord = {
  ...SEED_PROFILE,
  name: mockSignedInUser.name,
  role: 'Partner',
  team: mockSignedInUser.org,
  location: 'New York, United States',
  skills: ['Venture Capital', 'Infrastructure', 'DeSci'],
  bio: '<p>Partner at Northfield Ventures, investing at seed and Series A in open infrastructure and decentralized science.</p>',
  contacts: {
    ...EMPTY_CONTACTS,
    email: mockSignedInUser.email,
    linkedin: 'mayachen',
  },
  experiences: [],
};

export const mockInvestorDetails: InvestorRecord = {
  angel: false,
  stages: [],
  checkSize: '',
  focus: [],
  viaFund: false,
  fundId: null,
};

// Emails the mocked backend already has an application for. Typing one of these
// into the signed-out Apply form swaps the modal to the sign-in prompt.
export const APPLIED_EMAILS = ['maya@northfield.vc', 'applied@example.com'];

// The teams (with their full team-page data and DocSend links) live in teams.ts.

// "What is PL Spotlight" lives in the FAQ, the same slot the completed Demo Day
// uses for its explainer. Placeholder copy for PL to rewrite.
export const spvFaqItems: FAQItem[] = [
  {
    question: 'What is PL Spotlight?',
    answer:
      'PL Spotlight is how Protocol Labs brings a small set of PL Network teams to outside investors. Each Spotlight is one SPV (special purpose vehicle) led by Protocol Labs: you invest once into the vehicle, and the vehicle invests in the teams.',
  },
  {
    question: 'Who can apply?',
    answer:
      'Accredited investors, and people investing on behalf of a VC fund or institution. Applying takes your email, name and organization. If you are new, it also creates a free PL Network account.',
  },
  {
    question: 'What happens after I apply?',
    answer:
      'The PL team reviews every application. We email you when you are approved. After that, every team on this page gets a View materials button that opens its DocSend.',
  },
  {
    question: 'I was invited — do I still need to apply?',
    answer:
      'It depends on the invitation. If it says you are pre-approved, sign in with that email address and you will see the materials once the Spotlight opens. If it asks you to apply, use the Apply button with that email.',
  },
  {
    question: 'What happens when a Spotlight closes?',
    answer: 'The SPV stops taking commitments and its materials are no longer available on this page.',
  },
];

export const STATUS_OPTIONS: { value: SpvStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
];

export const VIEWER_OPTIONS: { value: SpvViewer; label: string }[] = [
  { value: 'signedOut', label: 'Signed out' },
  { value: 'notApplied', label: 'Signed in, not applied' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
