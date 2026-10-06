import { resolveSpvViewState, type SpvViewState } from '@/services/spv-spotlight/resolveSpvViewState';
import type { SpvSpotlightStatus, SpvViewerAccess } from '@/services/spv-spotlight/types';

// Every status × access pair, written out rather than derived, so a change to
// the precedence has to change these tables on purpose.

const REQUEST_FLOW: [SpvSpotlightStatus, SpvViewerAccess, SpvViewState][] = [
  ['DRAFT', 'NONE', 'landing'],
  ['DRAFT', 'PENDING', 'pending'],
  ['DRAFT', 'APPROVED', 'openingSoon'],
  ['DRAFT', 'REJECTED', 'rejected'],
  ['OPEN', 'NONE', 'landing'],
  ['OPEN', 'PENDING', 'pending'],
  ['OPEN', 'APPROVED', 'open'],
  ['OPEN', 'REJECTED', 'rejected'],
  ['CLOSED', 'NONE', 'closed'],
  ['CLOSED', 'PENDING', 'closed'],
  ['CLOSED', 'APPROVED', 'closed'],
  ['CLOSED', 'REJECTED', 'closed'],
];

// Signed in. Only an approved viewer sees the spotlight, whatever its status.
const GATED_SIGNED_IN: [SpvSpotlightStatus, SpvViewerAccess, SpvViewState][] = [
  ['DRAFT', 'NONE', 'lockedNoAccess'],
  ['DRAFT', 'PENDING', 'lockedNoAccess'],
  ['DRAFT', 'APPROVED', 'openingSoon'],
  ['DRAFT', 'REJECTED', 'lockedNoAccess'],
  ['OPEN', 'NONE', 'lockedNoAccess'],
  ['OPEN', 'PENDING', 'lockedNoAccess'],
  ['OPEN', 'APPROVED', 'open'],
  ['OPEN', 'REJECTED', 'lockedNoAccess'],
  ['CLOSED', 'NONE', 'lockedNoAccess'],
  ['CLOSED', 'PENDING', 'lockedNoAccess'],
  ['CLOSED', 'APPROVED', 'closed'],
  ['CLOSED', 'REJECTED', 'lockedNoAccess'],
];

const combinations = (matrix: [SpvSpotlightStatus, SpvViewerAccess, SpvViewState][]) =>
  new Set(matrix.map(([status, access]) => `${status}:${access}`)).size;

describe('resolveSpvViewState', () => {
  describe('request flow', () => {
    it.each(REQUEST_FLOW)('%s + %s → %s', (status, access, expected) => {
      expect(resolveSpvViewState(status, access, { signedIn: true, requestFlow: true })).toBe(expected);
    });

    it('reads a signed-out viewer the same way (the backend says NONE)', () => {
      expect(resolveSpvViewState('OPEN', 'NONE', { signedIn: false, requestFlow: true })).toBe('landing');
    });

    it('covers every combination', () => {
      expect(combinations(REQUEST_FLOW)).toBe(3 * 4);
    });
  });

  describe('gated', () => {
    it.each(GATED_SIGNED_IN)('signed in, %s + %s → %s', (status, access, expected) => {
      expect(resolveSpvViewState(status, access, { signedIn: true, requestFlow: false })).toBe(expected);
    });

    it.each(['DRAFT', 'OPEN', 'CLOSED'] as SpvSpotlightStatus[])('signed out, %s → lockedSignedOut', (status) => {
      expect(resolveSpvViewState(status, 'NONE', { signedIn: false, requestFlow: false })).toBe('lockedSignedOut');
    });

    it('covers every combination', () => {
      expect(combinations(GATED_SIGNED_IN)).toBe(3 * 4);
    });
  });
});
