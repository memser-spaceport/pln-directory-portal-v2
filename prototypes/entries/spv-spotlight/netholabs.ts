import type { ITeam } from '@/types/teams.types';
import type { IMember } from '@/types/members.types';
import { MOCK_TEAM } from '../team-profile/mocks';
import type { SpvTeam } from './teams';

// The one team this SPV Spotlight is for: Netholabs, copied from its public
// directory profile (os.pl.xyz/teams/cm4a4qvi70008wt023l05k4q5) on 2026-09-28.
// Everything below is the real record except the DocSend link, which the admin
// sets per Spotlight. Fields the directory leaves empty (Twitter, LinkedIn,
// projects, news, event contributions) stay empty, so the page shows what an
// investor would really see today.

const UID = 'cm4a4qvi70008wt023l05k4q5';

const team = {
  ...MOCK_TEAM,
  id: UID,
  name: 'Netholabs',
  logo: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/a4a5cdb88798acfd.webp',
  shortDescription: 'Digital mammals for neuroscience, drug discovery, and mind uploading.',
  longDescription:
    '<p>Netholabs is a London, UK based neuroscience startup at the frontier of neurotechnology + AI, advancing longitudinal neuroethology — i.e. capturing brain activity across natural behavior over extended timescales.</p><p>We build naturalistic environments, automate neural and behavioral data capture, and deploy AI models to analyze complex neural time series. Our work drives deeper insight into neural computation, disease ontology, and the foundational mechanisms of agency.</p><p>Our ultimate ambition: to derive scaling laws for whole-brain emulation and mind uploading in humans and achieve the first human mind upload.</p><p><strong>Traction &amp; Credibility</strong></p><ul><li>Incorporated mid-2024 in London (Netholabs Ltd)</li><li>Recognized for leadership in the WBE / neurotech space (via external funding, alliances, etc.)</li></ul>',
  website: 'https://netholabs.com/',
  twitter: null,
  linkedinHandle: null,
  telegramHandler: null,
  blog: null,
  contactMethod: 'contact@netholabs.com',
  fundingStage: { title: 'Pre-seed' },
  isFund: false,
  priority: 1,
  industryTags: [
    { uid: 'nl-t1', title: 'Frontier Tech' },
    { uid: 'nl-t2', title: 'AI' },
    { uid: 'nl-t3', title: 'Decentralized Identity' },
    { uid: 'nl-t4', title: 'BCI' },
  ],
  membershipSources: [
    { uid: 'nl-m1', title: 'Edge Esmeralda' },
    { uid: 'nl-m2', title: 'IRL Events Bangkok 2024' },
  ],
  communityAffiliations: [{ uid: 'nl-c1', title: 'Edge City' }],
  technologies: [],
  // The team's own investor profile is not what an SPV investor came for.
  investorProfile: undefined,
} as unknown as ITeam;

const member = (id: string, name: string, role: string, profile: string, skills: string[]) =>
  ({
    id,
    name,
    profile,
    teamLead: true,
    skills: skills.map((title, k) => ({ uid: `${id}-s${k}`, title })),
    teams: [{ id: UID, name: 'Netholabs', role, teamLead: true, mainTeam: true }],
  }) as unknown as IMember;

export const netholabs: SpvTeam = {
  uid: UID,
  name: 'Netholabs',
  logoUrl: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/a4a5cdb88798acfd.webp',
  shortDescription: 'Digital mammals for neuroscience, drug discovery, and mind uploading.',
  docSendUrl: 'https://docsend.com/view/netholabs-spv',
  team,
  members: [
    member(
      'clw5ak4ee000nxd02kwld3w3v',
      'Catalin Mitelut',
      'Founder & CEO',
      'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/3c0499373b7e46a3.webp',
      ['Engineering', 'Research', 'AI', 'Analysis', 'Consulting'],
    ),
    member(
      'cm69jb6xs0001v002flwq6r2r',
      'Christian Larsen',
      'Co-Founder & COO',
      'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/d7ba09b98dbbea45.jpg',
      ['Engineering', 'Product', 'Strategy', 'Operations', 'Fundraising', 'People', 'AI'],
    ),
  ],
  projects: [],
  contributions: [],
  news: [],
  // The directory's own focus-area records for the team. They sit outside the
  // prototype's placeholder tree, so the Focus Areas section lists them flat.
  teamFocusAreas: [
    { uid: 'clv6p47g2001af5t6o1qq8frb', title: 'AI' },
    { uid: 'clv6p4b69001gf5t6jjtlnyy0', title: 'WBE' },
    { uid: 'clv6p4cgg001if5t6g99xqokv', title: 'Frontier Tech' },
    { uid: 'cl-fa-whole-brain-emulation', title: 'Whole Brain Emulation' },
  ] as SpvTeam['teamFocusAreas'],
  leadFocusArea: 'Neurotech',
  cardTags: [{ title: 'Frontier Tech' }, { title: 'AI' }, { title: 'BCI' }],
};

// The card's facts line under the one-liner (the directory's size band and city).
export const NETHOLABS_FACTS = { teamSize: '2–10', location: 'London, UK' };

// The brief team card's summary: the directory About above, cut to three
// sentences in the Spotlight's voice (third person, no traction list).
export const NETHOLABS_SUMMARY =
  'Netholabs is a London neuroscience startup working where neurotechnology meets AI. It builds naturalistic environments that record neural and behavioural data continuously, and AI models that read those long time series. The goal is scaling laws for whole-brain emulation, and in time the first human mind upload.';

export type WebsiteImage = {
  src: string;
  alt: string;
  // `contain` for figures whose edges carry labels (the raster's axes);
  // `cover` for footage that can lose a margin.
  fit: 'cover' | 'contain';
};

// Hotlinked from netholabs.com on 2026-09-29. The homepage has exactly three
// images (all animated GIFs, dark grounds, 660×250 and 2 × 340×191); the
// careers page adds only the logo and wordmark SVGs, skipped. Each URL checked
// with `curl -I`: 200, image/gif. Alt text is the site's own.
export const NETHOLABS_WEBSITE_IMAGES: WebsiteImage[] = [
  {
    src: 'https://netholabs.com/gifs/musculoskeletal.gif',
    alt: 'Musculoskeletal model reconstructed from tracked keypoints',
    fit: 'cover',
  },
  {
    src: 'https://netholabs.com/gifs/raster.gif',
    alt: 'Spike raster, 384 channels, recorded continuously',
    fit: 'contain',
  },
  {
    src: 'https://netholabs.com/gifs/lenia-1.gif',
    alt: 'Continuous cellular automaton, many organisms interacting',
    fit: 'cover',
  },
];
