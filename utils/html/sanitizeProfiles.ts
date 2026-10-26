import type { Config } from 'dompurify';

/**
 * Every allowlist member- or AI-written HTML is rendered through, by name.
 * `sanitizeHtml(html, profile)` is the only caller; the app ships no CSP, so
 * these are the page's only defense layer.
 *
 * `styleProperties` is not a DOMPurify option: it names the inline CSS
 * properties `sanitizeHtml` keeps on a `style` attribute. A profile without it
 * keeps no `style` at all.
 */
export type SanitizeProfile = Config & { styleProperties?: readonly string[] };

/**
 * Default for profile and listing content written in the directory's rich-text
 * editors: member bios and experience, team About and asks, project
 * descriptions, event and demo day descriptions, deals, Gantry items, guide
 * comments, founder methodology.
 *
 * - `class` stays because Quill formatting is class-based (`ql-align-*`,
 *   `ql-indent-*`) and mentions carry one. A class can change layout, not run code.
 * - Tables stay for founder methodology.
 * - `style` keeps text and background color from the editor's color picker and
 *   nothing else (see `styleProperties`).
 * - No `img`: these editors are text-only, and a remote image is an
 *   uncontrolled third-party request.
 */
export const RICH_TEXT_SANITIZE_CONFIG: SanitizeProfile = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'a',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'code',
    'pre',
    'span',
    'hr',
    'div',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'class',
    'style',
    'data-mention',
    'data-uid',
    'data-name',
    'data-external-id',
    'colspan',
    'rowspan',
  ],
  // Root-relative stays for mention links (/members/<uid>); protocol-relative
  // `//evil.example` and `javascript:` do not.
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/))/i,
  // DOMPurify runs ALLOWED_URI_REGEXP against every attribute it does not know
  // to be URI-safe, and `colspan="2"` is not a URL.
  ADD_URI_SAFE_ATTR: ['colspan', 'rowspan'],
  styleProperties: ['color', 'background-color'],
};

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
export const COMMENT_SANITIZE_CONFIG: SanitizeProfile = {
  ALLOWED_TAGS: ['p', 'br', 'a', 'img'],
  // A mention keeps its identity in `class` + `data-uid` (see RichTextEditor's
  // MentionBlot), so both have to survive or the mention degrades into an
  // ordinary link.
  //
  // `width` is the size the author saved on the forum, which survives NodeBB's
  // markdown storage in the src fragment — see decodeImageLayoutFromSrc. Their
  // text wrap arrives as a `class`, which mentions already needed.
  ALLOWED_ATTR: ['href', 'class', 'target', 'rel', 'data-uid', 'data-name', 'data-external-id', 'src', 'alt', 'width'],
  // Root-relative in general, not just /members/: that is also how a
  // forum-hosted upload is addressed (/assets/uploads/…). Protocol-relative
  // `//evil.example` is not root-relative and still goes, and `javascript:`
  // above all.
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/))/i,
  // DOMPurify runs ALLOWED_URI_REGEXP against every attribute it doesn't know
  // to be URI-safe, and `width="50%"` is not a URL — so listing it above is not
  // on its own enough to keep it. Same trap, same escape hatch, as
  // FORUM_POST_SANITIZE_CONFIG.
  ADD_URI_SAFE_ATTR: ['width'],
};

/**
 * Allowlist for a forum post's FULL body (ForumPostModal, /forum). Wider than
 * COMMENT_SANITIZE_CONFIG because a post really does carry headings, images,
 * lists, code and quotes — the formatting /forum renders — but the same
 * principle: NodeBB's HTML is unauthored-by-us markup.
 *
 * No `style`: processPostContent inlines one on its <img>, but the equivalent
 * rules live in the forum stylesheets, so dropping the attribute costs nothing
 * and keeps CSS out of the untrusted channel.
 */
export const FORUM_POST_SANITIZE_CONFIG: SanitizeProfile = {
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
  // trap the link hook in sanitizeHtml exists for: `target="_blank"` has to be
  // set after sanitizing for exactly this reason.)
  ADD_URI_SAFE_ATTR: ['width', 'height'],
};

/** A forum post body plus the element-pin annotations AI app feedback carries in `data-*`. */
export const AI_APP_FEEDBACK_SANITIZE_CONFIG: SanitizeProfile = {
  ...FORUM_POST_SANITIZE_CONFIG,
  ALLOWED_ATTR: [...(FORUM_POST_SANITIZE_CONFIG.ALLOWED_ATTR as string[]), 'data-annotations'],
  ALLOW_DATA_ATTR: true,
};

/**
 * The allowlist for a scraped job posting body (`IJobRole.descriptionHtml`).
 *
 * The backend documents the field as "sanitized posting HTML from ingest", and
 * we sanitize it again anyway: the ingest pipeline is not ours.
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
 * an allowlist cannot see — double-escaped entities, a whole body stored as
 * `&lt;p&gt;…` instead of tags, markdown link syntax left as text, one `<ul>`
 * per `<li>` — so a caller wants
 * `sanitizeJobDescriptionHtml(normalizeJobDescriptionHtml(raw))`, in that order.
 * See `normalizeJobDescriptionHtml` for why the order is not negotiable.
 */
export const JOB_DESCRIPTION_SANITIZE_CONFIG: SanitizeProfile = {
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
  // the link hook can set them.
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
};

/**
 * Allowlist for SPV Spotlight's HTML fields: the admin-written hero description
 * (Quill) and the team's directory About. Formatting and links only; no images,
 * no `class`.
 */
export const SPV_SANITIZE_CONFIG: SanitizeProfile = {
  ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'b', 'i', 'u', 's', 'ul', 'ol', 'li', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
};

/**
 * An AI app one-pager that arrived as a full HTML document. Beyond DOMPurify's
 * defaults (scripts, iframes, event handlers, javascript: URLs), drop: SVG/MathML
 * (mutation vectors), CSS (overlay spoofing / exfiltration), form controls
 * (phishing UI inside a trusted modal), id/name (DOM clobbering), and
 * data:/relative URLs.
 */
export const PRD_SANITIZE_CONFIG: SanitizeProfile = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'base', 'meta', 'link'],
  FORBID_ATTR: ['style', 'id', 'name'],
  SANITIZE_NAMED_PROPS: true,
  ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i,
};

/**
 * Team news `contentHtml` from the AI enrichment pipeline — the least trusted
 * markup in the app. Enrichment output is 2–5 paragraphs with inline emphasis
 * and the odd link/list — allow exactly that, nothing else.
 */
export const TEAM_NEWS_SANITIZE_CONFIG: SanitizeProfile = {
  ALLOWED_TAGS: ['p', 'strong', 'em', 'b', 'i', 'a', 'ul', 'ol', 'li', 'br'],
  ALLOWED_ATTR: ['href'],
  ALLOWED_URI_REGEXP: /^https?:/i,
};

/** Search result snippets: the matched text plus the backend's highlight markup, no attributes. */
export const SEARCH_HIGHLIGHT_SANITIZE_CONFIG: SanitizeProfile = {
  ALLOWED_TAGS: ['em', 'mark', 'b', 'strong'],
  ALLOWED_ATTR: [],
};

export const SANITIZE_PROFILES = {
  richText: RICH_TEXT_SANITIZE_CONFIG,
  comment: COMMENT_SANITIZE_CONFIG,
  forumPost: FORUM_POST_SANITIZE_CONFIG,
  aiAppFeedback: AI_APP_FEEDBACK_SANITIZE_CONFIG,
  jobDescription: JOB_DESCRIPTION_SANITIZE_CONFIG,
  spv: SPV_SANITIZE_CONFIG,
  prd: PRD_SANITIZE_CONFIG,
  teamNews: TEAM_NEWS_SANITIZE_CONFIG,
  searchHighlight: SEARCH_HIGHLIGHT_SANITIZE_CONFIG,
} satisfies Record<string, SanitizeProfile>;

export type SanitizeProfileName = keyof typeof SANITIZE_PROFILES;
