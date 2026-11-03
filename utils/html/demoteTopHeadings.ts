/**
 * The opening and closing tags of an `h1` or `h2` in sanitized markup, whose tags DOMPurify writes in lowercase.
 * Escaped text (`&lt;h1`) never matches.
 */
const TOP_HEADING_TAG = /<(\/?)h[12](?=[\s>])/g;

/**
 * A profile's or posting's own `h1` and `h2` as `h3` (LAB-3089). The page around them already has its `h1` (the
 * profile or role name) and its section `h2`s, so a description written with top-level headings gave the page more
 * than one `h1`. Only for sanitized output.
 */
export function demoteTopHeadings(sanitizedHtml: string): string {
  return sanitizedHtml.replace(TOP_HEADING_TAG, '<$1h3');
}
