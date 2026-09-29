import type { FAQItem } from '@/app/constants/demoday';
import { SEED_PROFILE } from '../member-profile-edit/mocks';
import { EMPTY_CONTACTS, type ProfileRecord } from '../profile-shared/SectionEditor/types';
import type { InvestorRecord } from './SpvInvestorProfileDrawer';

// Mocked data for the investor-facing SPV Spotlight (LAB-2669). Nothing here is
// fetched. One SPV Spotlight = one team (confirmed on the 2026-09-28 sync), so
// the spotlight is a title, a description and one DocSend URL the admin sets.
// Slides and video are no longer hosted.

export type SpvStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

// Who is looking. `signedOut` and `notApplied` both see the landing; the rest
// are application states the back office moves an investor through.
export type SpvViewer = 'signedOut' | 'notApplied' | 'pending' | 'approved' | 'rejected';

// "Explore PL Network" is one fixed global link, not per spotlight: the
// separate landing for investors who don't know the network yet.
export const EXPLORE_PL_NETWORK_URL = '/prototypes/explore-pl-network';

export const mockSpotlight = {
  slug: 'netholabs-spv',
  // Named "SPV Spotlight: <team>" in the 2026-09-29 review.
  title: 'SPV Spotlight: Netholabs',
  // Admin-configurable hero copy. Rich text in production (Quill), rendered the
  // way the completed Demo Day renders its description. Placeholder wording;
  // the team facts under it come from Netholabs' real directory profile.
  description:
    'Netholabs builds digital mammals for neuroscience, drug discovery and mind uploading. Protocol Labs is leading an SPV into their round and opening it to a small group of outside investors.',
  docSendUrl: 'https://docsend.com/view/netholabs-spv',
  // Placeholder — the SPV's reply-to is set per spotlight in the back office.
  supportEmail: 'spotlight@protocol.ai',
};

export const mockSignedInUser = {
  name: 'Maya Chen',
  email: 'maya@northfield.vc',
  role: 'Partner',
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

// "What is PL Spotlight" — the FAQ lives on the Explore PL Network landing; the
// deal page itself is title, description and CTAs only. Placeholder copy.
export const spvFaqItems: FAQItem[] = [
  {
    question: 'What is PL Spotlight?',
    answer:
      "PL Spotlight is how Protocol Labs brings a small set of PL Network teams to outside investors. Each Spotlight is one SPV (special purpose vehicle) led by Protocol Labs into one team's round.",
  },
  {
    question: 'Who can request access?',
    answer:
      'Accredited investors, and people investing on behalf of a VC fund or institution. A request takes your email, name, role and organization. If you are new, it also creates a free PL Network account.',
  },
  {
    question: 'What happens after I request access?',
    answer:
      "The PL team reviews every request. We email you when you are approved. After that, the Spotlight page shows Open data room, which opens the team's DocSend.",
  },
  {
    question: 'I was invited — do I still need to request access?',
    answer:
      'No. The link in your invitation email signs you in and takes you straight to the data room. If you were sent the public link, request access with your email — that creates your account.',
  },
  {
    question: 'What happens when a Spotlight closes?',
    answer: 'The SPV stops taking commitments and its data room is no longer available on this page.',
  },
];

export const VIEWER_OPTIONS: { value: SpvViewer; label: string }[] = [
  { value: 'signedOut', label: 'Signed out' },
  { value: 'notApplied', label: 'Signed in, no request' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
