/**
 * Does this HTML render as nothing a reader can see?
 *
 * Two callers, two reasons:
 * - Quill's "empty" value is `<p><br></p>`, which is truthy, so a plain
 *   `!value.trim()` submit guard would happily post an empty comment.
 * - A forum comment that was only an image sanitizes down to nothing under the
 *   feed's three-tag allowlist, and has to fall back to "shared an image"
 *   rather than render a blank row. That check has to run on the SANITIZED
 *   string — the raw one is a perfectly truthy `<img src=…>`.
 */
export function isBlankHtml(html: string): boolean {
  return (
    (html ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      // Any other entity is real content (&amp;, &lt;, an emoji escape …).
      .trim().length === 0
  );
}
