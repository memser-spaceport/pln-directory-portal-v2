/**
 * Monogram stand-ins for teams with no logo.
 *
 * WHY GENERATED, NOT FILES: prototypes may not add assets outside `prototypes/`,
 * and `public/` is outside. An inline SVG data URI keeps the whole thing in this
 * folder and needs no loader config — `next/image` sets `unoptimized` itself for
 * `data:` sources, so the card's existing <Image> takes these unchanged.
 *
 * WHY ONE COLOUR: the obvious move is a different hue per team, and it's wrong
 * here. Twelve tinted tiles turn the grid into a colour wheel that competes with
 * the industry tags and the brand-blue updates badge — and colour would be
 * saying something (category? status?) that it doesn't actually know. These are
 * placeholders; the honest signal is "no logo yet, here's who it is". The
 * initials carry the identity, the tile stays quiet.
 *
 * The pair is production's most-repeated soft-surface/brand combination —
 * `--background-brand-soft-surface, #f2f5ff` under `--foreground-brand-primary,
 * #1b4dff` (FileUploader, DetailsSection, PitchDeckDetails). Literal hex is
 * unavoidable inside an SVG document: it has no access to the page's custom
 * properties, so the token layer can't reach in here.
 */

const TILE = '#f2f5ff';
const INK = '#1b4dff';

/**
 * "Protocol Labs" → "PL", "libp2p" → "LI". Two letters from two words, else the
 * first two of a single word. Uppercase throughout: mixing "PL" with "li" reads
 * as two different systems, and a monogram set only works when it's one.
 */
export function teamInitials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** A 72px monogram tile as a data URI, sized to the card's own logo slot. */
export function placeholderLogo(name: string | null | undefined): string {
  const initials = teamInitials(name ?? '');
  // 30px in a 72 box leaves the letters room to breathe at full size and still
  // resolves at the 36px the card renders on mobile.
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">',
    `<rect width="72" height="72" fill="${TILE}"/>`,
    '<text x="50%" y="50%" dy="0.35em" text-anchor="middle"',
    ' font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="600"',
    ` letter-spacing="0.5" fill="${INK}">${initials}</text>`,
    '</svg>',
  ].join('');

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
