import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AuthBox } from '@/components/core/login/components/AuthBox';
import { authEvents, privyDemand } from '@/components/core/login/utils';
import type { AuthErrorCode } from '@/components/core/login/utils';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

// useRouter must return a stable object here: the real app router instance is a module
// singleton, and the subscription effect is keyed on it.
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/members',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

jest.mock('@privy-io/react-auth', () => ({
  PrivyProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="privy-provider">{children}</div>,
}));

// AuthBox loads the Privy layer with next/dynamic (LAB-3092); resolved synchronously here so the tests can see it.
jest.mock('next/dynamic', () => () => {
  const DynamicPrivyLayer = (props: { isLoginPopup: boolean }) => {
    const { PrivyLayer } = jest.requireActual('@/components/core/login/components/PrivyLayer');
    return <PrivyLayer {...props} />;
  };
  return DynamicPrivyLayer;
});

// Children are stubbed out — this suite is about the #login gate in AuthBox itself.
// AuthInfo stands in as a marker for "the blocking overlay is mounted"; the real one
// clears localStorage and hits the auth API on mount.
jest.mock('@/components/core/login/components/AuthInfo', () => ({
  AuthInfo: () => <div data-testid="auth-info-overlay" />,
}));
jest.mock('@/components/core/login/components/PrivyModals', () => ({ PrivyModals: () => null }));
jest.mock('@/components/core/login/components/modals/AuthInvalidUser', () => ({ AuthInvalidUser: () => null }));
jest.mock('@/components/core/login/components/LoginTokenRedeemer', () => ({ LoginTokenRedeemer: () => null }));

const setUrl = (url: string) => window.history.replaceState({}, '', url);

/** Stand in for the navigation the mocked router would otherwise perform. */
const applyReplaceToUrl = () =>
  mockRouter.replace.mockImplementation((url: string) => {
    setUrl(url);
    window.dispatchEvent(new Event('hashchange'));
  });

describe('AuthBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    privyDemand.reset();
    authEvents.clear();
    setUrl('/members?tab=all#login');
  });

  /* LAB-3092: Privy's SDK is the largest script on every page. A signed-out visitor gets it only when a sign-in starts,
     or when a sign-in, account link or sign-out reaches the auth bus with nothing loaded to carry it out. */
  describe('loading the sign-in system', () => {
    it('does not load Privy for a signed-out visitor who has not started to sign in', () => {
      setUrl('/members');
      render(<AuthBox isLoggedIn={false} />);
      expect(screen.queryByTestId('privy-provider')).not.toBeInTheDocument();
    });

    it('loads Privy for a signed-in member, as before', () => {
      setUrl('/members');
      render(<AuthBox isLoggedIn />);
      expect(screen.getByTestId('privy-provider')).toBeInTheDocument();
    });

    it('loads Privy when a sign-in starts, and keeps it after the #login gate is cleared', () => {
      applyReplaceToUrl();
      render(<AuthBox isLoggedIn={false} />);
      expect(screen.getByTestId('privy-provider')).toBeInTheDocument();

      act(() => {
        authEvents.emit('auth:login-error', { error: 'exited_auth_flow' });
      });

      expect(window.location.hash).toBe('');
      expect(screen.getByTestId('privy-provider')).toBeInTheDocument();
    });

    /* Google and GitHub sign-in leave the site and come back with privy_oauth_* in the address; Privy completes the
       sign-in from them only if it loads. Without this the visitor came back signed out (found on the lab-3083 env). */
    it('loads Privy when Google or GitHub sign-in returns to the site', () => {
      setUrl('/home?privy_oauth_state=s&privy_oauth_provider=google&privy_oauth_code=c');
      render(<AuthBox isLoggedIn={false} />);
      expect(screen.getByTestId('privy-provider')).toBeInTheDocument();
      expect(privyDemand.isRequested()).toBe(true);
    });

    it('loads Privy when a sign-out reaches the bus with nothing to carry it out', () => {
      setUrl('/members');
      render(<AuthBox isLoggedIn={false} />);
      expect(screen.queryByTestId('privy-provider')).not.toBeInTheDocument();

      act(() => {
        authEvents.emit('auth:logout');
      });

      expect(screen.getByTestId('privy-provider')).toBeInTheDocument();
      expect(authEvents.pendingEvents().map(({ event }) => event)).toEqual(['auth:logout']);
    });
  });

  it('renders the login overlay for a signed-out visitor on #login', () => {
    render(<AuthBox isLoggedIn={false} />);

    expect(screen.getByTestId('auth-info-overlay')).toBeInTheDocument();
  });

  it('takes the overlay down when the attempt ends without a session', () => {
    applyReplaceToUrl();
    render(<AuthBox isLoggedIn={false} />);
    expect(screen.getByTestId('auth-info-overlay')).toBeInTheDocument();

    act(() => {
      authEvents.emit('auth:invalid-email', 'email_not_found');
    });

    // The overlay is z-index 99999; left up it paints over the error modal that replaces it.
    expect(screen.queryByTestId('auth-info-overlay')).not.toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  // Every auth error modal funnels through this one event, so all of them strand the
  // overlay the same way — not just the reported email_not_found case.
  const errorCodes: AuthErrorCode[] = [
    'email_not_found',
    'rejected_access_level',
    'unexpected_error',
    'no_demo_day_access',
    // deleteUser('') emits an empty code, which still opens the modal via the fall-through.
    '',
  ];

  it.each(errorCodes)('clears the #login gate for the %p error code', (code) => {
    render(<AuthBox isLoggedIn={false} />);

    act(() => {
      authEvents.emit('auth:invalid-email', code);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/members?tab=all', { scroll: false });
  });

  it('clears the #login gate when the visitor dismisses the Privy modal', () => {
    render(<AuthBox isLoggedIn={false} />);

    // Privy reports a dismissed login modal through useLogin's onError.
    act(() => {
      authEvents.emit('auth:login-error', { error: 'exited_auth_flow' });
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/members?tab=all', { scroll: false });
  });

  it('leaves other hashes alone', () => {
    setUrl('/home?news=abc#comments');
    render(<AuthBox isLoggedIn={false} />);

    act(() => {
      authEvents.emit('auth:invalid-email', 'email_not_found');
    });

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#comments');
  });

  it('stops listening once unmounted', () => {
    const { unmount } = render(<AuthBox isLoggedIn={false} />);
    unmount();

    act(() => {
      authEvents.emit('auth:invalid-email', 'email_not_found');
    });

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('still pushes signed-in visitors off the login gate', () => {
    render(<AuthBox isLoggedIn />);

    expect(screen.queryByTestId('auth-info-overlay')).not.toBeInTheDocument();
    expect(mockRouter.push).toHaveBeenCalledWith('/members?tab=all', { scroll: false });
  });
});
