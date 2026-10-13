import { resolveSpvViewState, type SpvViewState } from '@/services/spv-spotlight/resolveSpvViewState';
import type { SpvSpotlightStatus, SpvViewerAccess } from '@/services/spv-spotlight/types';

// Every status × access pair, written out rather than derived, so a change to
// the precedence has to change this table on purpose.
const MATRIX: [SpvSpotlightStatus, SpvViewerAccess, SpvViewState][] = [
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

describe('resolveSpvViewState', () => {
  it.each(MATRIX)('%s + %s → %s', (status, access, expected) => {
    expect(resolveSpvViewState(status, access)).toBe(expected);
  });

  it('covers every combination', () => {
    expect(new Set(MATRIX.map(([status, access]) => `${status}:${access}`)).size).toBe(3 * 4);
  });
});
