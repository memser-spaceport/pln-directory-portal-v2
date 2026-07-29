import { AiAppStatus, AiAppServing, deployFailureKind } from '@/services/ai-apps/ai-apps.service';

describe('deployFailureKind', () => {
  // The full status × serving matrix — the blanket rule ("anything outside the
  // two defined ERROR states behaves as legacy/absent") is proven here once,
  // not via DOM assertions across component tests.
  const matrix: Array<[AiAppStatus, AiAppServing | 'absent' | 'unknown', ReturnType<typeof deployFailureKind>]> = [
    ['ERROR', 'previous', 'warning'],
    ['ERROR', 'none', 'danger'],
    ['ERROR', 'latest', 'legacy'],
    ['ERROR', 'absent', 'legacy'],
    ['ERROR', 'unknown', 'legacy'],
    ['READY', 'previous', null],
    ['READY', 'none', null],
    ['READY', 'absent', null],
    ['DEPLOYING', 'none', null],
    ['DEPLOYING', 'absent', null],
    ['DRAFT', 'previous', null],
    ['DRAFT', 'absent', null],
  ];

  it.each(matrix)('status=%s serving=%s → %s', (status, serving, expected) => {
    const deployment = serving === 'absent' ? undefined : { serving: serving as AiAppServing };
    expect(deployFailureKind({ status, deployment })).toBe(expected);
  });
});
