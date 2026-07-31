const URL_REGEX = /(https?:\/\/[^\s<]+)/g;
// Trailing characters that are almost always punctuation, not part of the URL
// (e.g. a sentence-ending period or a closing bracket around the link).
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

/** Escape a matched URL before it goes into an attribute value or text node.
 *  URL_REGEX accepts everything up to whitespace, `"` included, so a URL like
 *  `https://x.test/"onmouseover="alert(1)` would otherwise close the href and
 *  add an event handler. Callers that sanitize afterwards are covered anyway;
 *  this makes the function safe for the ones that don't. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Wrap bare URLs in anchor tags so links typed into an editor (which Quill
 * leaves as plain text) render as clickable links. Only text outside of
 * existing tags and existing <a> elements is touched, so already-linked URLs
 * — including mention anchors — and tag attributes are left untouched.
 *
 * Extracted from QuillContent, which still uses it, so the feed's comment
 * pipeline and long-form Quill content linkify identically.
 *
 * Run it BEFORE sanitizing, not after: it emits markup, and letting the
 * sanitizer see that markup means a malformed URL can't smuggle an attribute
 * past it. (QuillContent renders the result directly with no sanitizer at all,
 * which is why the escaping above is not optional.)
 */
export function linkifyHtml(html: string): string {
  let anchorDepth = 0;

  return html
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<a[\s>]/i.test(part)) anchorDepth += 1;
        else if (/^<\/a>/i.test(part)) anchorDepth = Math.max(0, anchorDepth - 1);
        return part;
      }

      if (anchorDepth > 0) return part;

      return part.replace(URL_REGEX, (url) => {
        const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? '';
        const href = escapeHtml(trailing ? url.slice(0, -trailing.length) : url);
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>${trailing}`;
      });
    })
    .join('');
}
