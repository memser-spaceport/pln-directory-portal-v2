/**
 * Strips HTML tags from a string and decodes the entities NodeBB escapes on the
 * way in, so a post that was typed as `a < b & "quoted"` reads that way again
 * instead of as `a &lt; b &amp; &quot;quoted&quot;`.
 *
 * Entity decoding happens AFTER tag stripping (so an escaped `&lt;script&gt;`
 * can never become a live tag) and `&amp;` is decoded LAST (so a doubly-escaped
 * `&amp;lt;` ends up as the literal text `&lt;`, not as `<`).
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;| /g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
