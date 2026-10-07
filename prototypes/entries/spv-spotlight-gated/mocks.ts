import type { FAQItem } from '@/app/constants/demoday';
import { SEED_PROFILE } from '../member-profile-edit/mocks';
import { EMPTY_CONTACTS, type ProfileRecord } from '../profile-shared/SectionEditor/types';
import type { InvestorRecord, SpvFund } from './SpvInvestorProfileDrawer';

// Mocked data for the investor-facing SPV Spotlight (LAB-2669). Nothing here is
// fetched. One SPV Spotlight = one team (confirmed on the 2026-09-28 sync), so
// the spotlight is a title, a description and one DocSend URL the admin sets.
// Slides and video are no longer hosted.

export type SpvStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

// The 2026-10-01 standup moved this page from "anyone requests access" to "a
// whitelisted link opens it": outreach emails go straight to DocSend, and only
// investors the PL team adds get a tokenised link to this page. Who is looking:
// - `signedOut`: no token, not logged in → locked.
// - `notInvited`: logged in as somebody who is not on the list → locked.
// - `invited`: the token link logged them in, they are on the list → the page.
// The last four are the old request-access flow, kept behind the flag below.
export type SpvViewer = 'signedOut' | 'notInvited' | 'invited' | 'notApplied' | 'pending' | 'approved' | 'rejected';

// "Request access" no longer makes sense (2026-10-01: investors arrive by
// token link), but Anuj: "feature flag it, don't completely remove it" — Demo
// Day taught us a flow like this comes back. Off: the request modal, pending
// stepper and approval states are unreachable. On: they return for locked
// viewers, as in the `spv-spotlight` prototype.
export const REQUEST_FLOW_ENABLED = false;

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

// Two investors (review 2026-10-05), switched in the preview bar:
// - `new`: never told us how they invest. Investor Details is empty, so the
//   drawer opens on Demo Day's "+ Add startup stages" state with the amber
//   incomplete strip, and the page card says "Set up investor profile".
// - `existing`: has a profile from Demo Day or a past deal. It is partly
//   filled (no check size), which is common, so the one field still to fill
//   is marked amber; the page card says "Review and update investor profile".
export type InvestorKind = 'new' | 'existing';

export const INVESTOR_KIND_OPTIONS: { value: InvestorKind; label: string }[] = [
  { value: 'new', label: 'New investor' },
  { value: 'existing', label: 'Has a profile' },
];

export const mockInvestorDetails: Record<InvestorKind, InvestorRecord> = {
  new: {
    angel: false,
    stages: [],
    checkSize: '',
    focus: [],
    viaFund: false,
    fundId: null,
    fundRole: '',
    dealEmails: true,
  },
  existing: {
    angel: true,
    stages: ['Seed', 'Series A'],
    checkSize: '',
    focus: ['Infrastructure', 'DeSci', 'Neurotech'],
    viaFund: true,
    fundId: 'fund-northfield',
    fundRole: 'Partner',
    dealEmails: true,
  },
};

// Mocked directory teams marked as investment funds (production's select lists
// every directory team). Maya leads Northfield, so she edits its details, and
// is a member of Lattice, so she can't: picking it shows production's "You
// don't have access to edit team information" box.
export const MOCK_FUNDS: SpvFund[] = [
  {
    id: 'fund-northfield',
    name: 'Northfield Ventures',
    logo: '',
    website: 'https://northfield.vc',
    teamLead: true,
    investorProfile: {
      investInFundTypes: ['Early stage'],
      typicalCheckSize: '500000',
      investInStartupStages: ['Seed', 'Series A'],
      investmentFocus: ['Infrastructure', 'DeSci', 'AI'],
    },
  },
  {
    id: 'fund-lattice',
    name: 'Lattice Capital',
    logo: '',
    website: 'https://lattice.capital',
    teamLead: false,
    investorProfile: {
      investInFundTypes: ['Late stage', 'Growth'],
      typicalCheckSize: '1500000',
      investInStartupStages: ['Series A', 'Series B'],
      investmentFocus: ['Crypto', 'Fintech'],
    },
  },
];

// Emails the mocked backend already has an application for. Typing one of these
// into the signed-out Apply form swaps the modal to the sign-in prompt.
export const APPLIED_EMAILS = ['maya@northfield.vc', 'applied@example.com'];

// The teams (with their full team-page data and DocSend links) live in teams.ts.

// The deal page's FAQ, for invited viewers only: the locked states show none
// (2026-10-01: "you should have questions once you see the pitch"; logged out
// it is just Contact us). Written for the token model; with the request flow
// flag on, the request questions would need adding back. Placeholder copy.
export const spvFaqItems: FAQItem[] = [
  {
    question: 'What is PL Spotlight?',
    answer:
      "PL Spotlight is how Protocol Labs brings a small set of PL Network teams to outside investors. Each Spotlight is one SPV (special purpose vehicle) led by Protocol Labs into one team's round.",
  },
  {
    question: 'How do I see the materials?',
    answer:
      "Request data room access takes you to the team's DocSend, where you ask for access and then read the pitch and the SPV terms. Nothing is uploaded to this page.",
  },
  {
    question: 'What does the investor profile do?',
    answer:
      'It tells us your check size, stages and focus, so we only send you deals that fit. You can change it any time from the avatar menu.',
  },
  {
    question: 'The page says I do not have access.',
    answer:
      'Spotlights are shared by invitation, so a forwarded link opens only for the people it was sent to. Use Contact us on that page and we will check the invitation list.',
  },
  {
    question: 'What happens when a Spotlight closes?',
    answer: 'The SPV stops taking commitments and its data room is no longer available on this page.',
  },
];

const TOKEN_VIEWERS: { value: SpvViewer; label: string }[] = [
  { value: 'invited', label: 'Invited (token link)' },
  { value: 'signedOut', label: 'Signed out' },
  { value: 'notInvited', label: 'Signed in, not invited' },
];

const REQUEST_VIEWERS: { value: SpvViewer; label: string }[] = [
  { value: 'notApplied', label: 'Signed in, no request' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export const VIEWER_OPTIONS = REQUEST_FLOW_ENABLED ? [...TOKEN_VIEWERS, ...REQUEST_VIEWERS] : TOKEN_VIEWERS;
