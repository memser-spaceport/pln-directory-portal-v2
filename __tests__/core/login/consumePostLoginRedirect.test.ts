import { consumePostLoginRedirect, POST_LOGIN_REDIRECT_KEY } from '@/components/core/login/utils/navigateToLogin';

describe('consumePostLoginRedirect', () => {
  beforeEach(() => {
    try {
      window.sessionStorage.clear();
    } catch {
      /* noop */
    }
  });

  it('returns and clears a stashed relative redirect target', () => {
    window.sessionStorage.setItem(
      POST_LOGIN_REDIRECT_KEY,
      '/alignment-asset/activities#update-directory-profile',
    );

    expect(consumePostLoginRedirect()).toBe('/alignment-asset/activities#update-directory-profile');
    expect(window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull();
  });

  it('returns null for unsafe redirect targets', () => {
    window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, 'https://evil.example/phish');

    expect(consumePostLoginRedirect()).toBeNull();
    expect(window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)).toBeNull();
  });
});
