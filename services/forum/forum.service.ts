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

/** A forum write that was refused, carrying the HTTP status so callers can tell
 *  "you're not signed in to the forum" apart from "the forum didn't like this". */
export class ForumWriteError extends Error {
  constructor(
    readonly status: number | undefined,
    /** The forum's own message, when it sent one. Never invented. */
    readonly forumMessage: string | undefined,
  ) {
    super(forumMessage ?? `Forum write failed${status ? ` (${status})` : ''}`);
    this.name = 'ForumWriteError';
  }
}

/**
 * Post a reply to a topic. Shared by the /forum page's composer and the /home
 * feed's forum-post thread, which write the same reply through the same route.
 *
 * Rejections throw a ForumWriteError; run it through `forumErrorMessage` before
 * showing anything to a member. Not every failure comes from NodeBB itself — an
 * auth layer in front of it answers 401 `{"error":"Invalid token"}`, which has
 * none of NodeBB's error shape — so the status matters as much as the message.
 */
export async function postForumReply({ tid, toPid, content }: PostForumReplyParams) {
  const response = await forumFetch(`/api/v3/topics/${tid}`, {
    method: 'POST',
    body: JSON.stringify({ content, toPid }),
  });

  if (!response?.ok) {
    const body = await response?.json().catch(() => undefined);
    throw new ForumWriteError(response?.status, body?.status?.message ?? body?.error);
  }

  return await response.json();
}

/**
 * Turn a forum rejection into something worth showing a member.
 *
 * NodeBB's rejections are often translation KEYS, not sentences —
 * `[[error:content-too-short, Content too short]]`, `[[error:too-many-posts]]`.
 * Showing one raw is worse than showing nothing, so anything still in that form
 * is replaced with the caller's fallback, and so is any message we made up
 * ourselves rather than received.
 *
 * Rejections members hit routinely and cannot diagnose from a generic line get
 * spelled out: NodeBB's `minimumPostLength` (8 characters by default, so
 * "nice!" is refused), its post-rate limit, and a rejected session — which in
 * practice means an expired forum token, and is otherwise indistinguishable from
 * the composer just not working.
 */
export function forumErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ForumWriteError) {
    if (error.status === 401) return 'The forum didn’t accept your session — try signing in again.';
    if (error.status === 403) return 'You don’t have permission to reply on the forum.';
    // Anything we synthesised is internal wording, not a message for a member.
    if (!error.forumMessage) return fallback;
  }

  const raw = error instanceof Error ? error.message : '';
  if (!raw) return fallback;

  switch (classifyForumMessage(raw)) {
    case 'too-short':
      return 'That’s too short for the forum — try a few more words.';
    case 'rate-limited':
      return 'You’re posting a little fast for the forum — try again shortly.';
    case 'no-permission':
      return 'You don’t have permission to reply on the forum.';
    case 'session-expired':
      return 'The forum didn’t accept your session — try signing in again.';
  }

  // Any remaining bracketed key is machine text, not a message for a member.
  return /^\[\[.*\]\]$/.test(raw.trim()) || raw.includes('[[') ? fallback : raw;
}

/** What a forum rejection actually was, for analytics and for the copy above.
 *  `undefined` = the message says nothing recognisable. */
export type ForumMessageReason = 'too-short' | 'rate-limited' | 'no-permission' | 'session-expired';

/**
 * The message half of classifying a forum rejection — shared so the reason a
 * member is shown and the reason we record can never drift apart. Order is
 * load-bearing and matches what forumErrorMessage did before it was extracted.
 */
export function classifyForumMessage(raw: string): ForumMessageReason | undefined {
  if (/content-too-short|too-short/i.test(raw)) return 'too-short';
  if (/too-many-posts|rate-limit/i.test(raw)) return 'rate-limited';
  if (/no-privileges|not-allowed|privileges/i.test(raw)) return 'no-permission';
  if (/invalid token|unauthori[sz]ed/i.test(raw)) return 'session-expired';
  return undefined;
}
