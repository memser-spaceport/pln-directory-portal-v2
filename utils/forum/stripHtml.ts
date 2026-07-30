/**
 * Strips HTML tags from a string.
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
    .replace(/&amp;/g, '&') // decoded last so `&amp;lt;` doesn't become `<`
    .replace(/\s+/g, ' ')
    .trim();
}
