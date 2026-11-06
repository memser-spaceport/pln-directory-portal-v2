import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AuthInvalidUser } from '@/components/core/login/components/modals/AuthInvalidUser';
import { authEvents } from '@/components/core/login/utils';
import type { AuthErrorCode, InvalidEmailPayload } from '@/components/core/login/utils';

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
const mockOnInvalidUserTryAnotherEmailClicked = jest.fn();
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
    onInvalidUserTryAnotherEmailClicked: mockOnInvalidUserTryAnotherEmailClicked,
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

async function emitAuthError(payload: InvalidEmailPayload) {
  await act(async () => {
    authEvents.emit('auth:invalid-email', payload);
  });
}

const NEW_TITLE = "This email isn't in the directory yet";
const ADVICE =
  "If you're new, sign up and we'll set up your profile. If you're a member, try the email on your profile.";

/** The dialog's text with whitespace collapsed, for copy that spans elements. */
const dialogText = () => (screen.getByText(NEW_TITLE).parentElement?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('AuthInvalidUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/members';
    mockDemoDayState = undefined;
    window.history.replaceState({}, '', '/members?tab=all');
  });

  it('names the email and offers Sign up and Try another email when the email is not found', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError({ code: 'email_not_found', email: 'new.person@example.com' });

    await waitFor(() => {
      expect(screen.getByText(NEW_TITLE)).toBeInTheDocument();
    });

    expect(screen.getByText('new.person@example.com').tagName).toBe('STRONG');
    expect(dialogText()).toBe(`${NEW_TITLE}No member profile uses new.person@example.com. ${ADVICE}`);
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try another email' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Contact Support' })).not.toBeInTheDocument();
    expect(screen.queryByText('Email Not Found')).not.toBeInTheDocument();
    expect(mockOnInvalidUserModalShown).toHaveBeenCalledWith({ reason: 'email_not_found' });
  });

  it('leaves the address out when the email is unknown', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError('email_not_found');

    await waitFor(() => {
      expect(screen.getByText(NEW_TITLE)).toBeInTheDocument();
    });

    expect(dialogText()).toBe(`${NEW_TITLE}No member profile uses this email. ${ADVICE}`);
    expect(dialogText()).not.toContain('undefined');
  });

  it('treats a blank email as unknown', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError({ code: 'email_not_found', email: '  ' });

    await waitFor(() => {
      expect(screen.getByText(NEW_TITLE)).toBeInTheDocument();
    });

    expect(dialogText()).toBe(`${NEW_TITLE}No member profile uses this email. ${ADVICE}`);
  });

  it('takes Sign up to the existing sign-up flow with returnTo', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError({ code: 'email_not_found', email: 'new.person@example.com' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(mockOnSignUpBtnClicked).toHaveBeenCalledTimes(1);
    expect(mockOnInvalidUserSignUpClicked).toHaveBeenCalledWith({ reason: 'email_not_found' });
    expect(mockRouter.push).toHaveBeenCalledWith(`/sign-up?returnTo=${encodeURIComponent('/members?tab=all')}`);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('reopens sign-in through the #login gate on Try another email and closes the dialog', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError({ code: 'email_not_found', email: 'new.person@example.com' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Try another email' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Try another email' }));

    expect(mockOnInvalidUserTryAnotherEmailClicked).toHaveBeenCalledWith({ reason: 'email_not_found' });
    expect(mockOnSignUpBtnClicked).not.toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/members?tab=all#login', { scroll: false });
    await waitFor(() => {
      expect(screen.queryByText(NEW_TITLE)).not.toBeInTheDocument();
    });
  });

  it('closes on the ✕ without navigating', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError({ code: 'email_not_found', email: 'new.person@example.com' });

    await waitFor(() => {
      expect(screen.getByText(NEW_TITLE)).toBeInTheDocument();
    });

    // The ✕ is ModalBase's only icon-only button.
    const close = screen.getAllByRole('button').find((button) => !button.textContent?.trim());
    expect(close).toBeDefined();
    fireEvent.click(close!);

    await waitFor(() => {
      expect(screen.queryByText(NEW_TITLE)).not.toBeInTheDocument();
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('keeps the old content for unexpected_error', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError('unexpected_error');

    await waitFor(() => {
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "We couldn't complete your request due to a technical issue. Please try again or contact our support team for help.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact Support' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try another email' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('ignores an email sent with another code', async () => {
    render(<AuthInvalidUser />);

    await emitAuthError({ code: 'rejected_access_level', email: 'someone@example.com' });

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    expect(screen.queryByText('someone@example.com')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact Support' })).toBeInTheDocument();
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
