import DOMPurify from 'isomorphic-dompurify';

/**
 * The allowlist for a scraped job posting body (`IJobRole.descriptionHtml`).
 *
 * The backend documents the field as "sanitized posting HTML from ingest", and
 * we sanitize it again anyway: the app ships no CSP, so this is the only
 * defense layer on the page, and the ingest pipeline is not ours. Same
 * sanitize-on-read rule the comment and forum-post bodies follow.
 *
 * **Not `FORUM_POST_SANITIZE_CONFIG` reused**, for two reasons specific to this
 * data:
 *
 * - That config allows `class` and `data-uid`/`data-name`/`data-external-id`,
 *   which exist so NodeBB mention anchors keep their identity. Handing scraped
 *   third-party markup our `class` attribute buys nothing here and lets someone
 *   else's HTML borrow our stylesheet.
 * - Its `ALLOWED_URI_REGEXP` permits root-relative hrefs so forum-hosted uploads
 *   resolve. Job bodies are scraped from someone else's site and carry their
 *   site's links: a real posting in the corpus has `href="founder-pe"` and
 *   `href="#full-stack-pe"`, which would resolve against OUR origin and point at
 *   directory pages that do not exist. Absolute or nothing — DOMPurify drops the
 *   href and keeps the text, which is the right outcome for a link we cannot
 *   honour.
 *
 * No `img`: no body in the live corpus contains one, and a scraped remote image
 * is an uncontrolled third-party request fired from a job panel.
 *
 * **This is half the pipeline.** Job bodies also carry converter artifacts that
 * an allowlist cannot see — double-escaped entities, markdown link syntax left
 * as text, one `<ul>` per `<li>` — so a caller wants
 * `sanitizeJobDescriptionHtml(normalizeJobDescriptionHtml(raw))`, in that order.
 * See `normalizeJobDescriptionHtml` for why the order is not negotiable.
 */
export const JOB_DESCRIPTION_SANITIZE_CONFIG = {
  // Everything the live corpus actually uses (br, li, span, strong, ul, a, p,
  // b, h2-h4, i, em) plus the near neighbours a posting could reasonably carry.
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
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'span',
    'hr',
    'blockquote',
    'code',
    'pre',
  ],
  // No `class`, no `data-*`, no `style` — see above. `target`/`rel` are here so
  // the hook below can set them.
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
};

// Registered at module scope: DOMPurify hooks are global and stack if added per
// call. Identical and idempotent alongside the same hook registered by
// sanitizeCommentHtml, sanitizeForumPostHtml, NewsDetailBody and PrdContent —
// setting the same two attributes twice is a no-op, and registering it here too
// means this module does not depend on one of those happening to load first.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function sanitizeJobDescriptionHtml(html: string): string {
  return DOMPurify.sanitize(html ?? '', JOB_DESCRIPTION_SANITIZE_CONFIG);
}
