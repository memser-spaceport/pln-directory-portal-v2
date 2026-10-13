import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';

/**
 * Where a comment is pinned inside the app. `anchor` is a CSS path to the
 * element that was clicked and (ox, oy) is the click as a fraction of that
 * element's box — so the pin follows the element across resizes and re-renders
 * instead of sitting at a pixel that no longer means anything. `x`/`y` (document
 * coordinates at the time of the click) are the fallback when the element is
 * gone, which is also how the author learns a comment may be stale.
 */
export interface CommentAnchor {
  anchor: string;
  ox: number;
  oy: number;
  x: number;
  y: number;
}

export interface CommentReply {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  minutesAgo: number;
}

/**
 * One pinned comment = one production `AiAppFeedback` row, plus the three
 * things the row does not have today: where it points, what it looked like,
 * and the replies under it. `status` is production's own enum, so the author's
 * triage on the pin is the same triage the feedback table already does.
 */
export interface AppComment extends CommentAnchor {
  id: string;
  appUid: string;
  authorUid: string;
  authorName: string;
  text: string;
  status: AiAppFeedbackStatus;
  minutesAgo: number;
  /**
   * JPEG data URL of the anchored element, captured when the pin was dropped and
   * possibly marked up before posting. `null` means not captured yet (a seeded
   * thread takes its picture the first time it opens); `''` means it was sent
   * without one — the person took it off, or nothing could be captured — and
   * must not be captured again.
   */
  shot: string | null;
  replies: CommentReply[];
}
