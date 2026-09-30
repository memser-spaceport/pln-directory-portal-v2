import type {
  SpvAccessRequestPayload,
  SpvAccessRequestResult,
  SpvSpotlight,
  SpvSpotlightStatus,
  SpvViewerAccess,
} from './types';
import { SpvAccessRequestBlockedError } from './types';

/**
 * Stand-in backend for SPV Spotlight until LAB-2670 ships. Only used when
 * NEXT_PUBLIC_SPV_MOCK=true. Delete this file at cutover.
 *
 * - One spotlight, slug `netholabs-spv`. Any other slug is "not found".
 * - `?mockStatus=DRAFT|OPEN|CLOSED` and `?mockViewer=NONE|PENDING|APPROVED|REJECTED`
 *   force a state. Default: OPEN, and NONE until this tab submits a request.
 * - Request-access emails that hit the 409 branches:
 *   applied@example.com, rejected@example.com, preapproved@example.com.
 * - A mocked request creates no account: signing in afterwards is real Privy.
 *
 * Team data is Netholabs' public directory profile, copied on 2026-09-28.
 */

export const MOCK_SPV_SLUG = 'netholabs-spv';

export const MOCK_BLOCKED_EMAILS: Record<string, SpvAccessRequestBlockedError['reason']> = {
  'applied@example.com': 'ALREADY_APPLIED',
  'rejected@example.com': 'REJECTED',
  'preapproved@example.com': 'PRE_APPROVED',
};

export type SpvMockOverrides = {
  status?: SpvSpotlightStatus;
  access?: SpvViewerAccess;
};

const STATUSES: SpvSpotlightStatus[] = ['DRAFT', 'OPEN', 'CLOSED'];
const ACCESSES: SpvViewerAccess[] = ['NONE', 'PENDING', 'APPROVED', 'REJECTED'];

export function readSpvMockOverrides(params: { get(name: string): string | null } | null): SpvMockOverrides {
  const status = params?.get('mockStatus')?.toUpperCase() as SpvSpotlightStatus | undefined;
  const access = params?.get('mockViewer')?.toUpperCase() as SpvViewerAccess | undefined;
  return {
    status: status && STATUSES.includes(status) ? status : undefined,
    access: access && ACCESSES.includes(access) ? access : undefined,
  };
}

// Requests submitted from this tab while signed in. In-memory on purpose: a
// reload is a fresh backend.
const mockRequestedSlugs = new Set<string>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const NETHOLABS_SPOTLIGHT: Omit<SpvSpotlight, 'status' | 'viewerAccess' | 'docSendUrl'> = {
  uid: 'mock-spv-netholabs',
  slug: MOCK_SPV_SLUG,
  title: 'SPV Spotlight: Netholabs',
  description:
    'Netholabs builds digital mammals for neuroscience, drug discovery and mind uploading. Protocol Labs is leading an SPV into their round and opening it to a small group of outside investors.',
  supportEmail: 'spotlight@protocol.ai',
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

const MOCK_DOCSEND_URL = 'https://docsend.com/view/netholabs-spv';

export async function getMockSpvSpotlight(
  slug: string,
  authenticated: boolean,
  overrides: SpvMockOverrides = {},
): Promise<SpvSpotlight | null> {
  await delay(250);
  if (slug !== MOCK_SPV_SLUG) return null;

  const status = overrides.status ?? 'OPEN';
  const access: SpvViewerAccess =
    overrides.access ?? (authenticated && mockRequestedSlugs.has(slug) ? 'PENDING' : 'NONE');

  return {
    ...NETHOLABS_SPOTLIGHT,
    status,
    viewerAccess: access,
    // Mirrors the contract: the link only reaches approved viewers of an open spotlight.
    docSendUrl: access === 'APPROVED' && status === 'OPEN' ? MOCK_DOCSEND_URL : null,
  };
}

export async function mockRequestSpvAccess(
  slug: string,
  payload: SpvAccessRequestPayload,
  authenticated: boolean,
): Promise<SpvAccessRequestResult> {
  await delay(700);
  const blocked = MOCK_BLOCKED_EMAILS[payload.email.trim().toLowerCase()];
  if (blocked && !authenticated) {
    throw new SpvAccessRequestBlockedError(blocked);
  }
  if (authenticated) {
    mockRequestedSlugs.add(slug);
  }
  return { memberUid: 'mock-member-uid', isNewMember: !authenticated };
}
