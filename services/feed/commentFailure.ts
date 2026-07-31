import { ForumWriteError, classifyForumMessage } from '@/services/forum/forum.service';
import { FeedWriteError } from './feed.service';

/**
 * Why a comment write failed, in terms a dashboard can group on.
 *
 * `too-long-client` never reaches a backend — it is our own wire-length guard,
 * and it is worth counting separately because it is the one failure that is
 * ours rather than the server's.
 */
export type CommentFailureReason =
  | 'too-long-client'
  | 'too-short'
  | 'rate-limited'
  | 'no-permission'
  | 'session-expired'
  | 'rejected'
  | 'server-error'
  | 'network'
  | 'unknown';

export interface CommentFailure {
  reason: CommentFailureReason;
  /** HTTP status when there was a response. Always emitted when known, so
   *  `rejected` and `unknown` stay diagnosable without a code change. */
  status?: number;
  /** NodeBB's error SLUG only — `content-too-short`, never the arguments and
   *  never the message. `ForumWriteError.forumMessage` is whatever the server
   *  chose to send, and NodeBB's spam and URL plugins embed the offending
   *  content in it, so nothing else from that string may reach analytics. */
  errorKey?: string;
  /** `too-long-client` only: the serialised length that breached the cap, and
   *  how much of it was mention markup. Plain numbers — no content. Without
   *  them there is no telling a long comment from a mention-heavy short one,
   *  which is the whole question that reason raises. */
  length?: number;
  mentionsCount?: number;
}

const ERROR_KEY = /\[\[error:([a-z0-9_-]+)/i;

function statusToReason(status: number): CommentFailureReason {
  if (status === 401) return 'session-expired';
  if (status === 403) return 'no-permission';
  if (status === 429) return 'rate-limited';
  if (status >= 500) return 'server-error';
  // 400 / 409 / 413 and friends: refused on the merits, not broken. `rejected`
  // rather than `server-error`, which would point the finger at the backend.
  if (status >= 400) return 'rejected';
  return 'unknown';
}

/**
 * Classify a comment write failure for analytics.
 *
 * The one non-obvious rule: a `*WriteError` with no status means `customFetch`
 * gave up on auth and returned nothing — it logs out and reloads the page. A
 * genuine network failure makes `fetch` REJECT, which arrives here as a
 * TypeError instead. So "no status" is `session-expired`, not `unknown`;
 * leaving it in `unknown` turns that bucket into "logged out mid-write" and
 * invites diagnosing a backend problem that isn't there.
 */
export function classifyCommentFailure(error: unknown): CommentFailure {
  const isWriteError = error instanceof ForumWriteError || error instanceof FeedWriteError;

  if (isWriteError && error.status === undefined) {
    return { reason: 'session-expired' };
  }

  const raw = error instanceof Error ? error.message : '';
  const errorKey = ERROR_KEY.exec(raw)?.[1];

  // NodeBB says WHY in the message far more often than in the status, so the
  // key wins where it is recognisable — a rate limit served as 403 should not
  // be filed as a permission problem.
  //
  // This DIVERGES from forumErrorMessage on purpose: the copy a member sees
  // checks status first, so a 403-served rate limit reads as "no permission"
  // there. Reordering the copy would change shipped wording, which does not
  // belong in an analytics change — but the recorded reason should still be
  // the true one. The two agree on every input the display tests pin, since
  // those carry no status at all.
  const fromMessage = classifyForumMessage(raw);
  if (fromMessage) {
    return { reason: fromMessage, status: isWriteError ? error.status : undefined, errorKey };
  }

  if (isWriteError && error.status !== undefined) {
    return { reason: statusToReason(error.status), status: error.status, errorKey };
  }

  // fetch itself rejected: no response was ever produced.
  if (error instanceof TypeError) return { reason: 'network' };

  return { reason: 'unknown', errorKey };
}
