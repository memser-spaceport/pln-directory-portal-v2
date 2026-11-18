/**
 * Mock data for LAB-3316 (Post news on the signed-in Home). No real member data:
 * the viewer has no name on screen, and the teams they lead are invented.
 */

import { STREAM_CATEGORIES } from '@/components/page/home/TeamNews/constants';
import type { TeamNewsCategoryId } from '@/components/page/home/TeamNews/constants';

export type Viewer = 'one-team' | 'several-teams' | 'member' | 'signed-out';
export type ButtonState = 'default' | 'hover' | 'form' | 'posting' | 'posted';

type Option<T extends string> = { value: T; label: string; note: string };

export const VIEWER_OPTIONS: Option<Viewer>[] = [
  {
    value: 'one-team',
    label: 'Lead of one team',
    note: 'Default. The button sits at the end of the Network Updates header. A press opens the post-news form for Lattice Compute.',
  },
  {
    value: 'several-teams',
    label: 'Lead of several teams',
    note: 'The same button. The form opens with "Post as" on top (the LAB-3202 picker), set to the main team (Driftwood Labs). Each team shows its logo.',
  },
  {
    value: 'member',
    label: 'Not a lead',
    note: 'A signed-in member who leads no team, admins included. No button, and the header keeps only the search, so no gap.',
  },
  {
    value: 'signed-out',
    label: 'Signed out',
    note: 'The signed-out Home. It has no Network Updates header, so there is no button and no gap.',
  },
];

export const STATE_OPTIONS: Option<ButtonState>[] = [
  { value: 'default', label: 'Default', note: 'The button at rest: DS filled primary, small, with the plus glyph.' },
  {
    value: 'hover',
    label: 'Hover',
    note: 'The DS primary hover (one step darker brand). Shown here without the pointer.',
  },
  {
    value: 'form',
    label: 'Form open',
    note: 'The press opens the existing Post news modal. Nothing else on the page changes.',
  },
  {
    value: 'posting',
    label: 'Posting',
    note: 'The loading state. Post and Cancel are off and Post reads "Posting…" until the publish call returns.',
  },
  {
    value: 'posted',
    label: 'Posted',
    note: 'Success: the modal closes, a toast confirms, and the new story leads the stream with the team page’s brief blue wash.',
  },
];

export const isViewer = (v: string | null): v is Viewer => VIEWER_OPTIONS.some((o) => o.value === v);
export const isButtonState = (v: string | null): v is ButtonState => STATE_OPTIONS.some((o) => o.value === v);

/** A mock logo: a plain tile with a glyph, as an inline SVG. No real team art. */
const mockLogo = (bg: string, glyph: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="${bg}"/>${glyph}</svg>`,
  )}`;

export type LeadTeam = { uid: string; name: string; logoUrl: string; isMain?: boolean };

const LATTICE: LeadTeam = {
  uid: 'lattice-compute',
  name: 'Lattice Compute',
  logoUrl: mockLogo(
    '#1b4dff',
    '<path d="M10 10h6v6h-6zM24 10h6v6h-6zM17 17h6v6h-6zM10 24h6v6h-6zM24 24h6v6h-6z" fill="#fff"/>',
  ),
};
const DRIFTWOOD: LeadTeam = {
  uid: 'driftwood-labs',
  name: 'Driftwood Labs',
  logoUrl: mockLogo('#0f766e', '<path d="M8 24c6-8 10 4 16-4s8 0 8 0v6c-6-4-8 6-16 2S10 30 8 30z" fill="#fff"/>'),
};
const NORTHWIND: LeadTeam = {
  uid: 'northwind-bio',
  name: 'Northwind Bio',
  logoUrl: mockLogo('#b45309', '<circle cx="20" cy="20" r="9" fill="none" stroke="#fff" stroke-width="4"/>'),
};

/**
 * Invented teams. "Team lead" = the member's `leadingTeams` is not empty (active
 * teams only). Admin rights do not count: an admin who leads no team sees no
 * button (Polina, PR #3613). `isMain` marks the team "Post as" preselects. The
 * build reads it from the member's main team; here it is mocked on Driftwood
 * Labs, not the first row, so the preselect is visible as a choice.
 */
export const LEAD_TEAMS: Record<'one-team' | 'several-teams', LeadTeam[]> = {
  'one-team': [LATTICE],
  'several-teams': [LATTICE, { ...DRIFTWOOD, isMain: true }, NORTHWIND],
};

/** The team "Post as" opens on: the main team, else the first team. */
export const mainTeamUid = (teams: LeadTeam[]) => (teams.find((t) => t.isMain) ?? teams[0])?.uid ?? '';

/** The story the review states "Posting" and "Posted" show. */
export const SAMPLE_POST = {
  title: 'Our testnet is open to outside operators',
  body: '<p>Operators can now join the testnet with one command. The first 50 get support from the core team.</p>',
  url: 'https://example.com/lattice-testnet',
};

/** The week stories the stream shows (home-refactor-b's re-dated news). */
export const STREAM_UIDS = ['n1', 'x1', 'x2', 'n10'];

/** The pill row under the header, with mock counts (production hides a pill with nothing under it). */
const MOCK_COUNTS: Partial<Record<string, number>> = {
  FUNDING: 3,
  LAUNCH: 2,
  ANNOUNCEMENT: 5,
  discussions: 4,
  top: 3,
};

export const MOCK_CATEGORIES: Array<{ id: TeamNewsCategoryId; label: string; count: number }> = STREAM_CATEGORIES.map(
  (c) => ({ ...c, count: MOCK_COUNTS[String(c.id)] ?? 0 }),
).filter((c) => c.id === 'all' || c.count > 0);
