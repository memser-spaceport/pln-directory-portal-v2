import type { IFeedCommentMention } from '@/types/feed.types';
import type { SelectedMention } from '@/components/page/home/TeamNews/hooks/useFeedCommentMentions';

/**
 * Compute wire-contract mention offsets at submit time by scanning `text`
 * (the exact string being sent) for each selected mention's `@Name`.
 *
 * Rules:
 * - Longest name first, so "@Anna Lee" can't be claimed by a selected "@Anna".
 * - Left-to-right, each occurrence consumed exactly once — the same member
 *   selected twice yields two entries at two offsets.
 * - Mentions whose `@Name` no longer appears (the user edited it away) are
 *   silently dropped: no ghost mentions in the payload.
 * - `indexOf` only, never `new RegExp(name)` — member names are user-set and
 *   may contain regex metacharacters.
 *
 * Offsets are UTF-16 code-unit indices (plain JS string indices), matching
 * the IFeedCommentMention contract.
 */
export function deriveMentionOffsets(text: string, selected: SelectedMention[]): IFeedCommentMention[] {
  const byLongestName = [...selected].sort((a, b) => b.name.length - a.name.length);
  const claimed: Array<{ start: number; end: number }> = [];
  const found: IFeedCommentMention[] = [];

  for (const mention of byLongestName) {
    const token = `@${mention.name}`;
    let from = 0;
    while (from <= text.length) {
      const at = text.indexOf(token, from);
      if (at === -1) break;
      const end = at + token.length;
      const overlaps = claimed.some((range) => at < range.end && end > range.start);
      if (!overlaps) {
        claimed.push({ start: at, end });
        found.push({ uid: mention.uid, name: mention.name, offset: at });
        break;
      }
      from = at + 1;
    }
  }

  return found.sort((a, b) => a.offset - b.offset);
}
