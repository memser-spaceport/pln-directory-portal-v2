export const FEED_COMMENT_PARAM = 'comment';

/** Stable DOM id for a feed comment row — notification deep links target this. */
export function feedCommentDomId(commentUid: string): string {
  return `feed-comment-${commentUid}`;
}

/**
 * Scroll to and briefly highlight a feed comment. Returns false when the row
 * is not in the DOM yet (caller can retry once the thread finishes loading).
 */
export function scrollToFeedComment(commentUid: string): boolean {
  const el = document.getElementById(feedCommentDomId(commentUid));
  if (!el) return false;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('feed-comment-highlighted');
  window.setTimeout(() => {
    el.classList.remove('feed-comment-highlighted');
  }, 3000);
  return true;
}
