import type { SpvSpotlight, SpvSpotlightStatus, SpvViewerAccess } from '@/services/spv-spotlight/types';

// Jest fixture for the SPV Spotlight page; nothing in the app imports it.
// Netholabs' public directory profile, copied on 2026-09-28 (it was the page's
// mock backend until LAB-2670 shipped).

export const SPV_FIXTURE_SLUG = 'netholabs-spv';

const NETHOLABS: Omit<SpvSpotlight, 'slug' | 'status' | 'viewerAccess' | 'docSendUrl'> = {
  uid: 'spv-netholabs',
  title: 'SPV Spotlight: Netholabs',
  description:
    'Netholabs builds digital mammals for neuroscience, drug discovery and mind uploading. Protocol Labs is leading an SPV into their round and opening it to a small group of outside investors.',
  supportEmail: 'spotlight@protocol.ai',
  closesAt: '2026-10-31T00:00:00.000Z',
  team: {
    uid: 'cm4a4qvi70008wt023l05k4q5',
    name: 'Netholabs',
    logoUrl: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/a4a5cdb88798acfd.webp',
    shortDescription: 'Digital mammals for neuroscience, drug discovery, and mind uploading.',
    longDescription:
      '<p>Netholabs is a London, UK based neuroscience startup at the frontier of neurotechnology + AI, advancing longitudinal neuroethology — i.e. capturing brain activity across natural behavior over extended timescales.</p><p>We build naturalistic environments, automate neural and behavioral data capture, and deploy AI models to analyze complex neural time series. Our work drives deeper insight into neural computation, disease ontology, and the foundational mechanisms of agency.</p><p>Our ultimate ambition: to derive scaling laws for whole-brain emulation and mind uploading in humans and achieve the first human mind upload.</p><p><strong>Traction &amp; Credibility</strong></p><ul><li>Incorporated mid-2024 in London (Netholabs Ltd)</li><li>Recognized for leadership in the WBE / neurotech space (via external funding, alliances, etc.)</li></ul>',
    summary:
      'Netholabs is a London neuroscience startup working where neurotechnology meets AI. It builds naturalistic environments that record neural and behavioural data continuously, and AI models that read those long time series. The goal is scaling laws for whole-brain emulation, and in time the first human mind upload.',
    website: 'https://netholabs.com/',
    location: 'London, UK',
    teamSize: '2–10',
    fundingStage: 'Pre-seed',
    tags: ['Frontier Tech', 'AI', 'Decentralized Identity', 'BCI'],
    founders: [
      {
        uid: 'clw5ak4ee000nxd02kwld3w3v',
        name: 'Catalin Mitelut',
        imageUrl: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/3c0499373b7e46a3.webp',
        role: 'Founder & CEO',
      },
      {
        uid: 'cm69jb6xs0001v002flwq6r2r',
        name: 'Christian Larsen',
        imageUrl: 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/d7ba09b98dbbea45.jpg',
        role: 'Co-Founder & COO',
      },
    ],
  },
  media: [
    {
      url: 'https://netholabs.com/gifs/musculoskeletal.gif',
      alt: 'Musculoskeletal model reconstructed from tracked keypoints',
      fit: 'cover',
    },
    {
      url: 'https://netholabs.com/gifs/raster.gif',
      alt: 'Spike raster, 384 channels, recorded continuously',
      fit: 'contain',
    },
    {
      url: 'https://netholabs.com/gifs/lenia-1.gif',
      alt: 'Continuous cellular automaton, many organisms interacting',
      fit: 'cover',
    },
  ],
};

export function buildSpvSpotlight(
  status: SpvSpotlightStatus = 'OPEN',
  viewerAccess: SpvViewerAccess = 'NONE',
): SpvSpotlight {
  return {
    ...NETHOLABS,
    slug: SPV_FIXTURE_SLUG,
    status,
    viewerAccess,
    // As the API: the link only reaches approved viewers of an open spotlight.
    docSendUrl: viewerAccess === 'APPROVED' && status === 'OPEN' ? 'https://docsend.com/view/x' : null,
  };
}
