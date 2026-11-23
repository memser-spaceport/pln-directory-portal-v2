import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/alignment-asset',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));
jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => ({ canView: true, isLoading: false, isError: false }),
}));

const ORIGINAL = process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD;
const BOARD = '/alignment-asset/feedback';

// The menu reads the flag once, when its module loads, so each case loads it afresh.
// It must keep the React that the renderer uses, or its hooks find no dispatcher.
function fresh<T>(flag: string | undefined, load: () => T): T {
  if (flag === undefined) delete process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD;
  else process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD = flag;
  let loaded: T | undefined;
  jest.isolateModules(() => {
    jest.doMock('react', () => React);
    loaded = load();
  });
  return loaded as T;
}

function clickFeedbackInMenu(flag: string | undefined) {
  const PlaaMenu = fresh(
    flag,
    () =>
      require('@/components/page/aligement-assets/plaa-menu').default as React.ComponentType<{ isLoggedIn?: boolean }>,
  );
  const open = jest.spyOn(window, 'open').mockImplementation(() => null);
  render(<PlaaMenu isLoggedIn />);
  fireEvent.click(screen.getByRole('button', { name: /feedback/i }));
  return open;
}

beforeEach(() => mockPush.mockClear());
afterEach(() => jest.restoreAllMocks());
afterAll(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD;
  else process.env.NEXT_PUBLIC_PLAA_FEEDBACK_BOARD = ORIGINAL;
});

describe('the Feedback entry in the PLAA menu', () => {
  it('opens the board inside the app when the flag is on', () => {
    const open = clickFeedbackInMenu('true');

    expect(mockPush).toHaveBeenCalledWith(BOARD);
    expect(open).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'false', 'TRUE', '1', 'yes'])(
    'opens the old form in a new tab, not the board, when the flag is %p',
    (flag) => {
      const open = clickFeedbackInMenu(flag);

      expect(open).toHaveBeenCalledTimes(1);
      expect(open.mock.calls[0][0]).not.toContain(BOARD);
      expect(open.mock.calls[0][1]).toBe('_blank');
      expect(mockPush).not.toHaveBeenCalled();
    },
  );
});

describe('the board pages', () => {
  it.each([
    ['true', true],
    ['false', false],
    [undefined, false],
  ] as const)('are served only when the flag is exactly "true" (%p)', (flag, served) => {
    const { isFeedbackBoardEnabled } = fresh(
      flag,
      () =>
        require('@/components/page/aligement-assets/feedback/feedback.utils') as typeof import('@/components/page/aligement-assets/feedback/feedback.utils'),
    );
    expect(isFeedbackBoardEnabled()).toBe(served);
  });
});
