import { stripHtmlPreservingBreaks } from '@/utils/forum/stripHtml';

/**
 * The first paragraph of a posting, as plain text (LAB-2853), for the head of
 * the candidates list. `''` for a posting with no body.
 *
 * Breaks are kept while stripping and only then split into paragraphs. Plain
 * `stripHtml` fuses "<h2>About</h2><p>Build" into "AboutBuild" and leaves
 * nothing to split on. Line breaks inside the paragraph become spaces, and the
 * list head clamps the result to three lines in CSS.
 */
export function roleDescriptionLead(descriptionHtml: string | null | undefined): string {
  if (!descriptionHtml) return '';
  const paragraphs = stripHtmlPreservingBreaks(descriptionHtml)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  // Postings often open with a heading ("About", "Who we are"); the lead is the first paragraph that reads as prose.
  return paragraphs.find(isProse) ?? paragraphs[0] ?? '';
}

const isProse = (text: string): boolean => text.length >= 40 || /[.!?:]$/.test(text);
