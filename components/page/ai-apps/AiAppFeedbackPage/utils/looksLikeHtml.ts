/**
 * Feedback stored as Quill HTML, which always opens with one of Quill's block tags. Newer notes are
 * markdown, which may open with inline HTML of its own; legacy plain text is read as markdown too.
 */
export function looksLikeHtml(text: string): boolean {
  return /^\s*<(p|h[1-6]|ol|ul|blockquote|pre)[\s>]/i.test(text);
}
