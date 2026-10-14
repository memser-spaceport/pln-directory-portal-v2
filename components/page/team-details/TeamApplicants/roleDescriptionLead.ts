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
  const paragraphs = stripHtmlPreservingBreaks(descriptionHtml).split(/\n{2,}/);
  for (const paragraph of paragraphs) {
    const flat = paragraph.replace(/\s+/g, ' ').trim();
    if (flat) return flat;
  }
  return '';
}
