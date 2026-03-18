// Client-safe utility — no fs / Node.js dependencies.
// Shared between ArticleBody (heading id generation) and TableOfContents (link generation).

export interface ITOCHeading {
  level: 2 | 3;
  text: string;
  id: string;
}

/** Converts a heading string to a URL-safe anchor id. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // strip non-word chars (keep hyphens)
    .trim()
    .replace(/\s+/g, '-')     // spaces → hyphens
    .replace(/-+/g, '-');     // collapse double hyphens
}

/**
 * Extracts H2 and H3 headings from a raw markdown string.
 * Used server-side in page.tsx to pass headings[] as a prop,
 * and client-side in TableOfContents to build anchor links.
 */
export function extractHeadings(markdown: string): ITOCHeading[] {
  const lines = markdown.split('\n');
  const headings: ITOCHeading[] = [];

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);

    if (h2) {
      const text = h2[1].replace(/\*\*/g, '').replace(/`/g, '').trim();
      headings.push({ level: 2, text, id: slugifyHeading(text) });
    } else if (h3) {
      const text = h3[1].replace(/\*\*/g, '').replace(/`/g, '').trim();
      headings.push({ level: 3, text, id: slugifyHeading(text) });
    }
  }

  return headings;
}
