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

export interface PostForumReplyParams {
  tid: number;
  /** The post being replied to: a topic's `mainPid` for a top-level reply, or
   *  another reply's `pid` to nest under it. */
  toPid: number;
  /** HTML — NodeBB stores post content as markup. */
  content: string;
}

/**
 * Post a reply to a topic. Shared by the /forum page's composer and the /home
 * feed's forum-post thread, which write the same reply through the same route.
 *
 * Throws with NodeBB's own message when it has one. Callers should route that
 * through `forumErrorMessage` before showing it: NodeBB frequently answers with
 * an untranslated `[[error:…]]` key.
 */
export async function postForumReply({ tid, toPid, content }: PostForumReplyParams) {
  const response = await forumFetch(`/api/v3/topics/${tid}`, {
    method: 'POST',
    body: JSON.stringify({ content, toPid }),
  });

  if (!response?.ok) {
    const body = await response?.json().catch(() => undefined);
    throw new Error(body?.status?.message || 'Failed to add comment');
  }

  return await response.json();
}

/**
 * NodeBB's rejections are often translation KEYS, not sentences —
 * `[[error:content-too-short, Content too short]]`, `[[error:too-many-posts]]`.
 * Showing one raw is worse than showing nothing, so anything still in that form
 * is replaced with the caller's fallback.
 *
 * Two rejections members hit routinely and cannot diagnose from a generic
 * message get spelled out instead: NodeBB's `minimumPostLength` (8 characters
 * by default, so "nice!" is refused) and its post-rate limit.
 */
export function forumErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : '';
  if (!raw) return fallback;

  if (/content-too-short|too-short/i.test(raw)) return 'That’s too short for the forum — try a few more words.';
  if (/too-many-posts|rate-limit/i.test(raw)) return 'You’re posting a little fast for the forum — try again shortly.';
  if (/no-privileges|not-allowed|privileges/i.test(raw)) return 'You don’t have permission to reply on the forum.';

  // Any remaining bracketed key is machine text, not a message for a member.
  return /^\[\[.*\]\]$/.test(raw.trim()) || raw.includes('[[') ? fallback : raw;
}
