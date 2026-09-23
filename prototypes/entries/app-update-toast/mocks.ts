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
 * What the review line says the page is in the middle of.
 *
 * One state, so it is a sentence rather than a picker: the page is always
 * showing the toast, which is the thing this entry exists to judge.
 */
export const reviewNote =
  'A new build is live and the deploy marked it required. The toast stands until it is reloaded or dismissed — try Reload, and try it again after typing in About.';
