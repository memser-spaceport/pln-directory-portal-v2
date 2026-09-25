import DOMPurify from 'isomorphic-dompurify';

/**
 * Allowlist for a forum post's FULL body (ForumPostModal). Wider than
 * COMMENT_SANITIZE_CONFIG because a post really does carry headings, images,
 * lists, code and quotes — the formatting /forum renders — but the same
 * principle: NodeBB's HTML is unauthored-by-us markup and the app ships no
 * CSP, so this sanitizer is the only defense layer.
 *
 * No `style`: processPostContent inlines one on its <img>, but the equivalent
 * rules live in ForumPostModal's stylesheet, so dropping the attribute costs
 * nothing and keeps CSS out of the untrusted channel.
 */
export const FORUM_POST_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'a',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'img',
    'span',
    'hr',
  ],
  // Mention anchors keep their identity in class/data-* (same as comments).
  // `width`/`height` carry an author's image size (RichTextEditor writes width
  // as a percentage): layout hints with no script surface, and without them a
  // resized image renders here at full width instead of the size it was saved
  // at.
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'class',
    'target',
    'rel',
    'width',
    'height',
    'data-uid',
    'data-name',
    'data-external-id',
  ],
  // Root-relative allowed (mention hrefs, forum-hosted uploads) but not
  // protocol-relative `//evil.example`, and never `javascript:`.
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/))/i,
  // DOMPurify runs ALLOWED_URI_REGEXP against the value of EVERY attribute
  // that isn't one of its own URI-safe names, and `width="45%"` is not a URL,
  // so listing width/height above is not on its own enough to keep them —
  // that regexp would reject the value and drop the attribute. (It is the same
  // trap the hook below exists for: `target="_blank"` has to be set after
  // sanitizing for exactly this reason.)
  ADD_URI_SAFE_ATTR: ['width', 'height'],
};

// Registered at module scope: DOMPurify hooks are global and stack if added
// per call. Identical and idempotent alongside the same hook registered by
// sanitizeCommentHtml, NewsDetailModal and PrdContent.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function sanitizeForumPostHtml(html: string): string {
  return DOMPurify.sanitize(html ?? '', FORUM_POST_SANITIZE_CONFIG);
}
