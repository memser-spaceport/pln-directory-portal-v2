/**
 * Member-written HTML (a bio, a team long description, an experience description) as one line of plain text, for a
 * place that shows text and not markup, such as the LabOS agent action card (LAB-3299).
 *
 * - Inline tags join their neighbours ("<b>labs</b>." is "labs."). Any other tag separates words.
 * - Entities are decoded AFTER the tags go, so an escaped `&lt;b&gt;` stays text and never becomes a tag. `&amp;`
 *   is decoded last, so `&amp;lt;` reads `&lt;`.
 * - With `max`, the text is cut at `max` characters and ends with "…".
 *
 * The result is text. Render it as text, never as HTML.
 */
export function htmlToPlainText(html: string | null | undefined, max?: number): string {
  if (!html) return '';
  const text = html
    .replace(/<\/?(?:a|abbr|b|code|em|i|mark|s|small|span|strong|sub|sup|u)\b[^>]*>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (max === undefined || text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
