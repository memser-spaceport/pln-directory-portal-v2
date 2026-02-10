import { processPostContent } from '@/components/page/forum/Post';

/**
 * Strips HTML markup from a string, returning plain text
 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';

  const { processedContent } = processPostContent(html);

  const div = document.createElement('div');
  div.innerHTML = processedContent;
  return div.textContent || div.innerText || '';
}
