/**
 * Does this HTML render as nothing a reader can see?
 *
 * Two callers, two reasons:
 * - Quill's "empty" value is `<p><br></p>`, which is truthy, so a plain
 *   `!value.trim()` submit guard would happily post an empty comment.
 * - A forum comment whose content sanitizes down to nothing has to fall back to
 *   "shared an image or file" rather than render a blank row.
 *
 * Note what "visible" means here: tags are stripped, so an `<img>` reads as
 * blank. That is right for the submit guard and wrong for the fallback, which
 * is why hasRenderableContent asks this AND checks for an image rather than
 * this alone.
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
