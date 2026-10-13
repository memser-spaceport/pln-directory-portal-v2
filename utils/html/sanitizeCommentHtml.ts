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
 * Four tags. A no-toolbar composer can't produce anything richer than the first
 * three, and a forum post's headings still have no business inside a feed card
 * — but its IMAGES do: a forum comment is very often nothing but one, and
 * dropping it left the markdown showing as text (FeedCommentContent converts
 * `![alt](src)` before this runs).
 */
export const COMMENT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'a', 'img'],
  // NewsDetailModal's config allows `href` alone. A mention keeps its identity
  // in `class` + `data-uid` (see RichTextEditor's MentionBlot), so both have to
  // survive or the mention degrades into an ordinary link.
  //
  // `width` is the size the author saved on the forum, which survives NodeBB's
  // markdown storage in the src fragment — see decodeImageLayoutFromSrc. Their
  // text wrap arrives as a `class`, which mentions already needed.
  ALLOWED_ATTR: ['href', 'class', 'target', 'rel', 'data-uid', 'data-name', 'data-external-id', 'src', 'alt', 'width'],
  // NewsDetailModal's /^https?:/i would reject a mention's own relative
  // /members/<uid> href. Root-relative in general now, not just /members/:
  // that is also how a forum-hosted upload is addressed (/assets/uploads/…).
  // Protocol-relative `//evil.example` is not root-relative and still goes,
  // and `javascript:` above all.
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/))/i,
  // DOMPurify runs ALLOWED_URI_REGEXP against every attribute it doesn't know
  // to be URI-safe, and `width="50%"` is not a URL — so listing it above is not
  // on its own enough to keep it. Same trap, same escape hatch, as
  // FORUM_POST_SANITIZE_CONFIG.
  ADD_URI_SAFE_ATTR: ['width'],
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
