/**
 * Strips HTML tags from a string and decodes the entities NodeBB escapes on the
 * way in, so a post that was typed as `a < b & "quoted"` reads that way again
 * instead of as `a &lt; b &amp; &quot;quoted&quot;`.
 *
 * Entity decoding happens AFTER tag stripping (so an escaped `&lt;script&gt;`
 * can never become a live tag) and `&amp;` is decoded LAST (so a doubly-escaped
 * `&amp;lt;` ends up as the literal text `&lt;`, not as `<`).
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;| /g, ' ')
    .replace(/&amp;/g, '&');
}

export function stripHtml(html: string): string {
  return decodeEntities(
    html.replace(/<[^>]*>/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Like stripHtml, but block boundaries survive as newlines instead of the text
 * fusing into one run-on line: paragraph-level closers (`</p>`, headings,
 * `</blockquote>`, …) become a blank line, `<br>`/`</li>` a single break.
 * For text rendered with `white-space: pre-line`. Same decode-after-strip
 * ordering as stripHtml, so an escaped tag still can never come back to life.
 */
export function stripHtmlPreservingBreaks(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:li|tr)\s*>/gi, '\n')
      .replace(/<\/(?:p|div|h[1-6]|blockquote|pre|ul|ol|table)\s*>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' '),
  )
    .replace(/[^\S\n]+/g, ' ') // collapse spaces/tabs, keep the breaks
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // at most one blank line between paragraphs
    .trim();
}
