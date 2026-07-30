import { customFetch } from '@/utils/fetch-wrapper';

/**
 * One place that knows how to call NodeBB.
 *
 * Every forum hook was repeating the same four lines (base URL, JSON header,
 * optional `CUSTOM_FORUM_AUTH_TOKEN` bearer, `credentials: 'include'`, and the
 * "send the directory token only when there's no forum token" rule). The feed
 * now calls NodeBB too — the directory backend stopped proxying forum posts in
 * BE PR #3293 — so this is shared rather than copied a fifth time.
 *
 * Returns customFetch's response, which may be `undefined` when the wrapper
 * logs the user out mid-flight: callers must guard with `response?.ok`.
 */
export function forumFetch(path: string, init: RequestInit = {}) {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;

  return customFetch(
    `${process.env.FORUM_API_URL}${path}`,
    {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      credentials: 'include',
    },
    !token,
  );
}
