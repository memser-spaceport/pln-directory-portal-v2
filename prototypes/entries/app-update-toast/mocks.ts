/**
 * Mocked content for the page the toast floats over. Nothing here is the
 * subject — the page exists so the toast is judged in situ (against real
 * chrome, over content that scrolls) rather than on an empty canvas.
 */

export const mockMember = {
  name: 'Maya Ferreira',
  role: 'Protocol Engineer',
  team: 'libp2p',
};

/** The one real editable field, so "unsaved changes" is a real state. */
export const mockAboutDraft =
  'Working on transport encryption and NAT traversal. Previously on the networking team at Filecoin, where I looked after relay reservations.';

export const mockFillerSections = [
  {
    title: 'Teams',
    rows: ['libp2p — Protocol Engineer', 'IPFS — Contributor'],
  },
  {
    title: 'Projects',
    rows: ['Relay v2 reservations', 'QUIC transport parity', 'Hole punching telemetry'],
  },
  {
    title: 'Office hours',
    rows: ['Thursdays, 15:00–16:00 UTC'],
  },
  {
    title: 'Events',
    rows: ['IPFS Camp — Lisbon', 'libp2p Day — Brussels', 'Protocol Berg — Berlin'],
  },
  {
    title: 'Focus areas',
    rows: ['Networking', 'Cryptography', 'Developer tooling'],
  },
  {
    title: 'Links',
    rows: ['github.com/mferreira', 'mferreira.dev'],
  },
];

/**
 * What the page is showing.
 *
 * A *review* state, not a product one — which is why it opens on `required`,
 * the state that draws the thing this entry exists to judge, rather than on
 * `optional`, which is what almost every real deploy is and draws nothing.
 */
export type DemoState = 'required' | 'optional' | 'chunk';

export const DEMO_STATES: { value: DemoState; label: string }[] = [
  { value: 'required', label: 'Required update' },
  { value: 'optional', label: 'Optional update' },
  { value: 'chunk', label: 'Failed chunk' },
];

/** What the editor is filled with when the failed-chunk state opens it. */
export const mockHalfTypedDraft =
  'Working on transport encryption and NAT traversal. Previously on the networking team at Filecoin, where I looked after relay reservations. Currently writing up the QUIC';
