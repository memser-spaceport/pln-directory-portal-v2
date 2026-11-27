/**
 * Browser-side calls to LabOS's own session routes (`app/api/auth/*`). The refresh token is httpOnly, so the browser
 * starts, renews and ends a session through the server. No imports: this module sits under the fetch wrapper and the
 * cookie helpers, which both depend on it.
 */

export interface RefreshedSession {
  accessToken: string;
  userInfo: { uid: string; email?: string; name?: string };
}

export type RefreshSessionResult =
  | { status: 'ok'; session: RefreshedSession }
  | { status: 'expired' }
  | { status: 'unavailable' };

/**
 * Browser only. Hands the tokens the API just issued to LabOS's server, which stores them as the session cookies
 * (refreshToken httpOnly). Resolves false when the server refuses them.
 */
export const establishSession = async (tokens: {
  accessToken: string;
  refreshToken: string;
  userInfo: unknown;
}): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(tokens),
    });
    return response.ok;
  } catch {
    return false;
  }
};

let refreshInFlight: Promise<RefreshSessionResult> | null = null;

/**
 * Browser only. Renews the session from the httpOnly refresh token. `expired` is a rejected token (HTTP 401).
 * `unavailable` is an outage: the caller must keep the session. Concurrent callers in a tab share one request,
 * so parallel 401s never rotate the refresh token twice.
 */
export const refreshSession = (): Promise<RefreshSessionResult> => {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return { status: 'expired' as const };
        if (!response.ok) return { status: 'unavailable' as const };
        const data = await response.json().catch(() => null);
        if (data?.accessToken && data?.userInfo?.uid) {
          return { status: 'ok' as const, session: data as RefreshedSession };
        }
        return { status: 'unavailable' as const };
      })
      .catch(() => ({ status: 'unavailable' as const }))
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

const END_SESSION_TIMEOUT_MS = 3000;

/** Browser only. Clears the session cookies on the server, including the httpOnly refresh token. Never throws. */
export const endSession = async (): Promise<void> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), END_SESSION_TIMEOUT_MS);
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      signal: controller.signal,
    });
  } catch {
    // Sign-out goes on; the proxy clears a session whose refresh fails.
  } finally {
    clearTimeout(timer);
  }
};
