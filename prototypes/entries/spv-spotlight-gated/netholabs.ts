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

// The agreed description (UX updates doc, 2026-10-09). It replaces the
// directory's About, which put London and the UK entity back on the page.
const NETHOLABS_DESCRIPTION =
  'Netholabs is building foundation models of living organisms from longitudinal, multimodal data spanning neural activity, physiology, behavior and environment. The thesis is that living systems contain learning rules and priors that current AI has not recovered from scale alone. Netholabs turns those signals into proprietary training data for frontier models today, while using the same data to train cross-species models of organisms. As those models become more predictive and individualized, they create a path toward new AI architectures, in-silico biology, and ultimately deeply individualized models of humans.';

// "Incorporated mid-2024 in London" and "Recognized for leadership in the WBE /
// neurotech space" are gone (location and the UK entity; unspecific). The first
// line sits above "Show more", the other two behind it.
const NETHOLABS_TRACTION = [
  'Signed commercial agreements with a top-5 Asian frontier AI lab and a US biotech.',
  'In scoping discussions toward a paid agreement with a leading US AI lab.',
  'Qualified sales discussions with neurotech and BCI companies.',
];

const team = {
  ...MOCK_TEAM,
  id: UID,
  name: 'Netholabs',
  logo: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/a4a5cdb88798acfd.webp',
  shortDescription:
    'Netholabs is building foundation models of whole organisms to bring biological intelligence into the deep-learning era.',
  // The agreed description and traction (UX updates doc, 2026-10-09), not the
  // directory's About. The page renders NETHOLABS_ABOUT; this mirrors it.
  longDescription: `<p>${NETHOLABS_DESCRIPTION}</p><p><strong>Traction &amp; Credibility</strong></p><ul>${NETHOLABS_TRACTION.map((l) => `<li>${l}</li>`).join('')}</ul>`,
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
  shortDescription:
    'Netholabs is building foundation models of whole organisms to bring biological intelligence into the deep-learning era.',
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

// The key facts strip. "Headquarters" became "Offices" with both cities (UX
// updates doc, 2026-10-09): two lines, no flags.
export const NETHOLABS_FACTS = { teamSize: '2–10', offices: ['San Francisco, US', 'London, UK'] };

// The About block. Collapsed, the first two sentences of the description and
// the first traction line sit above "Show more", so the strongest lines read
// first; the rest is behind it.
export const NETHOLABS_ABOUT = {
  description: NETHOLABS_DESCRIPTION,
  collapsedSentences: 2,
  traction: NETHOLABS_TRACTION,
  tractionCollapsed: 1,
};

// "Backed by" under the carousel: PLC Neurotech's logo (from the deck, via the
// UX updates doc), linking to the PL Capital neurotech site in a new tab.
// The URL is PL Neuro's (explore-pl-network/mocks), the neurotech site we
// know; confirm it is the page legal and PL Capital mean.
export const NETHOLABS_BACKED_BY = {
  name: 'PLC Neurotech',
  href: 'https://www.plneuro.xyz/',
};

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
