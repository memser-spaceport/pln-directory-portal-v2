import { navigateToLogin, POST_LOGIN_REDIRECT_KEY, stashPostLoginRedirect } from '@/components/core/login/utils/navigateToLogin';

describe('navigateToLogin', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    try {
      window.sessionStorage.clear();
    } catch {
      /* noop */
    }

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        pathname: '/alignment-asset/activities',
        search: '',
        hash: '',
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('sets the login hash without stashing when there is no anchor', () => {
    navigateToLogin();

    expect(window.location.hash).toBe('login');
    expect(window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull();
  });

  it('stashes the full activity deep link and switches to the login hash', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        pathname: '/alignment-asset/activities',
        search: '',
        hash: '#update-directory-profile',
      },
    });

    navigateToLogin();

    expect(window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBe(
      '/alignment-asset/activities#update-directory-profile',
    );
    expect(window.location.hash).toBe('login');
  });

  it('does not stash unsafe redirect targets', () => {
    stashPostLoginRedirect('https://evil.example/phish');

    expect(window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull();
  });
});
