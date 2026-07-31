import { classifyCommentFailure } from '@/services/feed/commentFailure';
import { FeedWriteError } from '@/services/feed/feed.service';
import { ForumWriteError, classifyForumMessage, forumErrorMessage } from '@/services/forum/forum.service';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

describe('classifyCommentFailure — status mapping', () => {
  it.each([
    [401, 'session-expired'],
    [403, 'no-permission'],
    [429, 'rate-limited'],
    [400, 'rejected'],
    [409, 'rejected'],
    [413, 'rejected'],
    [500, 'server-error'],
    [503, 'server-error'],
  ])('maps HTTP %i to %s', (status, reason) => {
    expect(classifyCommentFailure(new FeedWriteError('Failed to post feed comment', status)).reason).toBe(reason);
  });

  it('always carries the numeric status, so rejected and unknown stay diagnosable', () => {
    expect(classifyCommentFailure(new FeedWriteError('nope', 409)).status).toBe(409);
  });

  it('classifies a 429 that carries no message at all — the message regexes alone would miss it', () => {
    expect(classifyCommentFailure(new ForumWriteError(429, undefined)).reason).toBe('rate-limited');
  });
});

describe('classifyCommentFailure — the no-status case', () => {
  it('treats a write error with no status as session-expired, NOT unknown', () => {
    // customFetch returns undefined only when it gave up on auth (it logs out
    // and reloads). Filing that as `unknown` turns the unknown bucket into
    // "logged out mid-write" and invites chasing a backend bug that isn't there.
    expect(classifyCommentFailure(new FeedWriteError('Failed to post feed comment', undefined)).reason).toBe(
      'session-expired',
    );
    expect(classifyCommentFailure(new ForumWriteError(undefined, undefined)).reason).toBe('session-expired');
  });

  it('treats a rejected fetch as network — that is the real no-response case', () => {
    expect(classifyCommentFailure(new TypeError('Failed to fetch')).reason).toBe('network');
  });
});

describe('classifyCommentFailure — NodeBB messages', () => {
  it.each([
    ['[[error:content-too-short, Content too short]]', 'too-short', 'content-too-short'],
    ['[[error:too-many-posts, 10]]', 'rate-limited', 'too-many-posts'],
    ['[[error:no-privileges]]', 'no-permission', 'no-privileges'],
  ])('reads %s as %s and extracts the slug', (message, reason, errorKey) => {
    const result = classifyCommentFailure(new ForumWriteError(400, message));
    expect(result.reason).toBe(reason);
    expect(result.errorKey).toBe(errorKey);
  });

  it('prefers the error key over the status — a rate limit served as 403 is not a permission problem', () => {
    const result = classifyCommentFailure(new ForumWriteError(403, '[[error:too-many-posts, 10]]'));
    expect(result.reason).toBe('rate-limited');
    expect(result.status).toBe(403);
  });

  it('extracts the slug WITHOUT the arguments', () => {
    // `[[error:content-too-short, Content too short]]` — the part after the
    // comma is server-supplied prose and must not ride along.
    expect(
      classifyCommentFailure(new ForumWriteError(400, '[[error:content-too-short, Content too short]]')).errorKey,
    ).toBe('content-too-short');
  });
});

describe('classifyCommentFailure — nothing user-authored may escape', () => {
  it('never echoes a server message that embeds an email address', () => {
    // NodeBB spam/URL plugins put the offending content in the message.
    const error = new ForumWriteError(400, 'Blocked: contact jane.doe@example.com for access');
    const result = classifyCommentFailure(error);

    expect(JSON.stringify(result)).not.toContain('jane.doe@example.com');
    expect(result.reason).toBe('rejected');
  });

  it('never echoes a server message that embeds a URL', () => {
    const error = new ForumWriteError(400, 'Link not allowed: https://internal.example.com/doc?token=abc123');
    const result = classifyCommentFailure(error);

    expect(JSON.stringify(result)).not.toContain('internal.example.com');
    expect(JSON.stringify(result)).not.toContain('abc123');
  });

  it('emits no errorKey when the message carries no bracketed key', () => {
    expect(classifyCommentFailure(new ForumWriteError(400, 'Something went sideways')).errorKey).toBeUndefined();
  });

  it('puts a bare unrecognised error in unknown, carrying nothing from it', () => {
    const result = classifyCommentFailure(new Error('Failed to look up the forum topic'));
    expect(result).toEqual({ reason: 'unknown', errorKey: undefined });
  });

  it('handles a non-Error throw without exploding', () => {
    expect(classifyCommentFailure('just a string').reason).toBe('unknown');
    expect(classifyCommentFailure(undefined).reason).toBe('unknown');
  });
});

describe('classifyForumMessage agrees with the copy it was extracted from', () => {
  // The regression guard for the Phase 0 extraction: every input the display
  // tests pin must still classify to the reason that produces that copy.
  const FALLBACK = 'Couldn’t post — try again.';

  it.each([
    ['[[error:content-too-short, Content too short]]', 'too-short', /too short for the forum/],
    ['[[error:too-many-posts, 10]]', 'rate-limited', /posting a little fast/],
    ['[[error:no-privileges]]', 'no-permission', /permission to reply/],
  ])('%s', (message, reason, copy) => {
    expect(classifyForumMessage(message)).toBe(reason);
    expect(forumErrorMessage(new Error(message), FALLBACK)).toMatch(copy);
  });

  it('leaves an unrecognised message unclassified, which is what makes the copy fall through', () => {
    expect(classifyForumMessage('Something went sideways')).toBeUndefined();
    expect(forumErrorMessage(new Error('Something went sideways'), FALLBACK)).toBe('Something went sideways');
  });
});
