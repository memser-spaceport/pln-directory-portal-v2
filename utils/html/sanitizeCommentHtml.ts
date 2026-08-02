import DOMPurify from 'isomorphic-dompurify';

/**
 * The allowlist for feed comment content, applied at BOTH boundaries: on the
 * way out to a backend, and again on the way in to the screen.
 *
 * Sanitizing on write is not belt-and-braces here. A comment written on a forum
 * card becomes a real NodeBB post that other members read on /forum, through a
 * renderer we don't control — so whatever we send has to already be safe. And
 * sanitizing on read is what protects us from everything NodeBB sends back,
 * which nobody in this codebase authored.
 *
 * Three tags. A no-toolbar composer can't produce anything richer, and a forum
 * post's images and headings have no business inside a feed card.
 */
export const COMMENT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'a'],
  // NewsDetailModal's config allows `href` alone. A mention keeps its identity
  // in `class` + `data-uid` (see RichTextEditor's MentionBlot), so both have to
  // survive or the mention degrades into an ordinary link.
  ALLOWED_ATTR: ['href', 'class', 'target', 'rel', 'data-uid', 'data-name', 'data-external-id'],
  // NewsDetailModal's /^https?:/i would reject a mention's own relative
  // /members/<uid> href. Anything outside these three schemes — `javascript:`
  // above all — still goes.
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/members\/)/i,
};

// Registered at module scope: DOMPurify hooks are global and stack if added per
// call. Identical to the hook NewsDetailModal and PrdContent register, and
// idempotent alongside them — setting the same two attributes twice is a no-op.
// Registering it here too means neither consumer depends on one of those
// modules happening to load first.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function sanitizeCommentHtml(html: string): string {
  return DOMPurify.sanitize(html ?? '', COMMENT_SANITIZE_CONFIG);
}
