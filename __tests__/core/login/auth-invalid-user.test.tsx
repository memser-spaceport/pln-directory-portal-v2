import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AuthInvalidUser } from '@/components/core/login/components/modals/AuthInvalidUser';
import { authEvents } from '@/components/core/login/utils';
import type { AuthErrorCode } from '@/components/core/login/utils';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

let mockPathname = '/members';
let mockDemoDayState: { status?: string; slugURL?: string; title?: string } | undefined;

const mockOnSignUpBtnClicked = jest.fn();
const mockOnInvalidUserModalShown = jest.fn();
const mockOnInvalidUserSignUpClicked = jest.fn();
const mockOpenModal = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => ({
    onSignUpBtnClicked: mockOnSignUpBtnClicked,
    onInvalidUserModalShown: mockOnInvalidUserModalShown,
    onInvalidUserSignUpClicked: mockOnInvalidUserSignUpClicked,
  }),
}));

jest.mock('@/analytics/demoday.analytics', () => ({
  useDemoDayAnalytics: () => ({
    onAccessDeniedModalShown: jest.fn(),
    onAccessDeniedUserNotWhitelistedModalShown: jest.fn(),
  }),
}));

jest.mock('@/services/demo-day/hooks/useReportAnalyticsEvent', () => ({
  useReportAnalyticsEvent: () => ({ mutate: jest.fn() }),
}));

jest.mock('@/services/demo-day/hooks/useGetDemoDayState', () => ({
  useGetDemoDayState: () => ({ data: mockDemoDayState }),
}));

jest.mock('@/services/contact-support/store', () => ({
  useContactSupportStore: (selector: (state: { actions: { openModal: typeof mockOpenModal } }) => unknown) =>
    selector({ actions: { openModal: mockOpenModal } }),
}));

jest.mock('@/utils/third-party.helper', () => ({
  clearAllAuthCookies: jest.fn(),
}));

jest.mock('@/components/core/login/components/BroadcastChannel', () => ({
  broadcastLogout: jest.fn(),
}));

async function emitAuthError(code: AuthErrorCode) {
  await act(async () => {
    authEvents.emit('auth:invalid-email', code);
  });
}

describe('AuthInvalidUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/members';
    mockDemoDayState = undefined;
    window.history.replaceState({}, '', '/members?tab=all');
  });

  it('shows Sign up as the primary action when the email is not found', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError('email_not_found');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    });

    expect(screen.getByText('Email Not Found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact Support' })).toBeInTheDocument();
    expect(mockOnInvalidUserModalShown).toHaveBeenCalledWith({ reason: 'email_not_found' });
  });

  it('takes Sign up to the existing sign-up flow with returnTo', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError('email_not_found');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(mockOnSignUpBtnClicked).toHaveBeenCalledTimes(1);
    expect(mockOnInvalidUserSignUpClicked).toHaveBeenCalledWith({ reason: 'email_not_found' });
    expect(mockRouter.replace).toHaveBeenCalledWith(`/sign-up?returnTo=${encodeURIComponent('/members?tab=all')}`);
  });

  it.each(['unexpected_error', 'rejected_access_level'] as AuthErrorCode[])(
    'keeps Contact Support as the primary action for %p',
    async (code) => {
      render(<AuthInvalidUser />);

      await emitAuthError(code);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Contact Support' })).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: 'Sign up' })).not.toBeInTheDocument();
    },
  );

  it('keeps Apply (not Sign up) for email_not_found on a demo day page', async () => {
    mockPathname = '/demoday/labweek';
    mockDemoDayState = { status: 'ACTIVE', slugURL: 'labweek', title: 'LabWeek' };

    render(<AuthInvalidUser />);

    await emitAuthError('email_not_found');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    });

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign up' })).not.toBeInTheDocument();
  });
});
