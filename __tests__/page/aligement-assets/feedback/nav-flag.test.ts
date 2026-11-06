import { readFileSync } from 'fs';
import { join } from 'path';

const ORIGINAL = process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD;

/** The flag is read at call time, so each case needs a fresh module. */
function loadUtils(flag: string | undefined) {
  jest.resetModules();
  if (flag === undefined) delete process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD;
  else process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD = flag;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@/components/page/aligement-assets/feedback/feedback.utils');
}

afterAll(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD;
  else process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD = ORIGINAL;
});

describe('AC-T8.1 flag off', () => {
  it.each([undefined, '', 'false', 'TRUE', '1', 'yes'])('keeps the Google Form when the flag is %p', (flag) => {
    const { isFeedbackBoardEnabled, feedbackNavTarget } = loadUtils(flag);
    expect(isFeedbackBoardEnabled()).toBe(false);
    expect(feedbackNavTarget()).toEqual({ url: 'https://forms.gle/NAKxJ8RUqmUf9fmQ9', isExternal: true });
  });
});

describe('AC-T8.2 flag on', () => {
  it('points the nav at the board and marks it internal', () => {
    const { isFeedbackBoardEnabled, feedbackNavTarget } = loadUtils('true');
    expect(isFeedbackBoardEnabled()).toBe(true);
    expect(feedbackNavTarget()).toEqual({ url: '/alignment-asset/feedback', isExternal: false });
  });

  it('leaves no hard-coded Google Form link in the PLAA menu source', () => {
    // The menu must derive its target, not carry a second copy of the URL.
    const source = readFileSync(
      join(process.cwd(), 'components/page/aligement-assets/plaa-menu.tsx'),
      'utf8',
    );
    expect(source).not.toContain('forms.gle');
    expect(source).toContain('feedbackNavTarget');
  });
});

describe('§8 compliance: no Linear secret reaches the portal', () => {
  it('has no Linear API key anywhere in portal source', () => {
    // AC-T2.7. Scans the feedback surface, which is the only place that could
    // plausibly have picked one up.
    const { execSync } = require('child_process');
    const hits = execSync(
      'grep -rln "LINEAR_API_KEY\\|lin_api_" app components services analytics || true',
      { cwd: process.cwd(), encoding: 'utf8' },
    ).trim();
    expect(hits).toBe('');
  });
});

describe('§8 compliance: PLAA vocabulary', () => {
  it('uses no banned verb in any feedback UI string', () => {
    const { execSync } = require('child_process');
    const hits = execSync(
      'grep -rniE "\\\\be[a]rn(s|ed|ing)?\\\\b" components/page/aligement-assets/feedback services/plaa/feedback || true',
      { cwd: process.cwd(), encoding: 'utf8' },
    ).trim();
    expect(hits).toBe('');
  });
});
