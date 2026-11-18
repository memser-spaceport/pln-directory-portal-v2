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
    note: 'The same button. The form opens with "Post as" on top (the LAB-3202 picker). Post stays off until a team is picked.',
  },
  {
    value: 'member',
    label: 'Not a lead',
    note: 'A signed-in member who leads no team. No button, and the header keeps only the search, so no gap.',
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

/** Invented teams. "Team lead" = the member's `leadingTeams` is not empty (active teams only). */
export const LEAD_TEAMS: Record<'one-team' | 'several-teams', { uid: string; name: string }[]> = {
  'one-team': [{ uid: 'lattice-compute', name: 'Lattice Compute' }],
  'several-teams': [
    { uid: 'lattice-compute', name: 'Lattice Compute' },
    { uid: 'driftwood-labs', name: 'Driftwood Labs' },
    { uid: 'northwind-bio', name: 'Northwind Bio' },
  ],
};

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
