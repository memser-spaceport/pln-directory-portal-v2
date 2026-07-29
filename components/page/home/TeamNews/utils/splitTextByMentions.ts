import type { IFeedCommentMention } from '@/types/feed.types';

export type CommentSegment =
  | { kind: 'text'; text: string }
  | { kind: 'mention'; uid: string; name: string; text: string };

/** Directory uids are url-safe slugs; anything else must never reach an href
 *  (a uid containing `/`, `..`, `?` or `#` would steer the profile link). */
const SAFE_UID = /^[A-Za-z0-9_-]+$/;

const MAX_MENTIONS = 50;

/**
 * Split a comment's text into plain/mention segments for JSX rendering
 * (dangerouslySetInnerHTML is banned in the comment thread — mentions render
 * as <Link> elements over these segments).
 *
 * Defensive by contract: `mentions` is a future server-supplied payload, so
 * ANY malformed input — offset out of bounds, overlapping ranges, `name` not
 * matching `text` at `offset`, unsafe uid shape, oversized array — falls back
 * to a single plain-text segment. Rendering must never crash or mislink over
 * a bad payload.
 */
export function splitTextByMentions(text: string, mentions: IFeedCommentMention[] | undefined): CommentSegment[] {
  if (!mentions || mentions.length === 0) return [{ kind: 'text', text }];
  if (mentions.length > MAX_MENTIONS) return [{ kind: 'text', text }];

  const ordered = [...mentions].sort((a, b) => a.offset - b.offset);

  let cursor = 0;
  const segments: CommentSegment[] = [];

  for (const mention of ordered) {
    const token = `@${mention.name}`;
    const end = mention.offset + token.length;
    const valid =
      Number.isInteger(mention.offset) &&
      mention.offset >= cursor && // in bounds AND non-overlapping (ordered)
      end <= text.length &&
      text.startsWith(token, mention.offset) &&
      SAFE_UID.test(mention.uid);
    if (!valid) return [{ kind: 'text', text }];

    if (mention.offset > cursor) {
      segments.push({ kind: 'text', text: text.slice(cursor, mention.offset) });
    }
    segments.push({ kind: 'mention', uid: mention.uid, name: mention.name, text: token });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ kind: 'text', text: text.slice(cursor) });
  }

  return segments;
}
