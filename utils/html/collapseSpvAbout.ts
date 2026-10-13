const SENTENCE = /[^.!?]+[.!?]+(?:\s+|$)/g;

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const matches = normalized.match(SENTENCE) ?? [];
  const consumed = matches.join('').trimEnd();
  const rest = normalized.slice(consumed.length).trim();
  return rest ? [...matches, rest] : matches.length ? matches : [normalized];
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isTractionHeading(element: Element): boolean {
  const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  return /^traction\b/i.test(text);
}

/**
 * Collapsed About from the team's long description.
 * First two sentences, then a "Traction…" heading and its first list item, when those blocks exist.
 * `hasMore` is true when Show more would reveal more sentences or list items.
 */
export function collapseSpvAbout(html: string): { html: string; hasMore: boolean } {
  const trimmed = html.trim();
  if (!trimmed || typeof DOMParser === 'undefined') return { html: trimmed, hasMore: false };

  const root = new DOMParser().parseFromString(`<div>${trimmed}</div>`, 'text/html').body.firstElementChild;
  if (!root) return { html: trimmed, hasMore: false };

  const blocks = [...root.children];
  const tractionIndex = blocks.findIndex(isTractionHeading);
  const descriptionBlocks = tractionIndex === -1 ? blocks : blocks.slice(0, tractionIndex);
  const descriptionText = descriptionBlocks.map((block) => block.textContent ?? '').join(' ');
  const sentences = splitSentences(descriptionText);
  const preview = sentences.slice(0, 2).join('').trim();

  const heading = tractionIndex === -1 ? null : blocks[tractionIndex];
  const list = heading
    ? blocks.slice(tractionIndex + 1).find((block) => block.tagName === 'UL' || block.tagName === 'OL')
    : null;
  const items = list ? [...list.children].filter((child) => child.tagName === 'LI') : [];
  const firstItem = items[0];

  const parts = [
    preview ? `<p>${escapeHtml(preview)}</p>` : '',
    heading?.outerHTML ?? '',
    firstItem && list ? `<${list.tagName.toLowerCase()}><li>${firstItem.innerHTML}</li></${list.tagName.toLowerCase()}>` : '',
  ].filter(Boolean);

  const hasMore = sentences.length > 2 || items.length > 1;
  return { html: parts.join('') || trimmed, hasMore };
}
