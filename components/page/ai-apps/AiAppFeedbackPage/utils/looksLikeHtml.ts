/** Legacy feedback was stored as plain text; anything newer arrives as Quill HTML. */
export function looksLikeHtml(text: string): boolean {
  return /^\s*</.test(text);
}
