export const POST_LOGIN_REDIRECT_KEY = 'auth:postLoginRedirect';

function getCurrentUrlWithHash(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * Persists the current URL (including hash) so the user can be returned after authentication.
 */
export function stashPostLoginRedirect(targetUrl?: string): void {
  const target = targetUrl ?? getCurrentUrlWithHash();
  const hash = window.location.hash;

  if (!target.startsWith('/')) {
    return;
  }

  if (!targetUrl && (!hash || hash === '#login')) {
    return;
  }

  try {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, target);
  } catch {
    // sessionStorage unavailable — login can still proceed without a post-auth redirect.
  }
}

/**
 * Reads and clears a stashed post-login redirect target.
 */
export function consumePostLoginRedirect(): string | null {
  try {
    const target = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (target) {
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    }
    return target?.startsWith('/') ? target : null;
  } catch {
    return null;
  }
}

interface NavigateToLoginOptions {
  /** When true (default), stash the current URL if it contains a non-login hash. */
  preserveReturnUrl?: boolean;
}

/**
 * Opens the authentication flow via the #login hash route.
 *
 * Uses `window.location.hash` instead of `router.push` so hash changes are applied
 * reliably when replacing an existing anchor (e.g. activity deep links).
 */
export function navigateToLogin(options: NavigateToLoginOptions = {}): void {
  const { preserveReturnUrl = true } = options;

  if (preserveReturnUrl) {
    stashPostLoginRedirect();
  }

  window.location.hash = 'login';
}
