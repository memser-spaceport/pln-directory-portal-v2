/**
 * A short, human name for a picked element: its kind and its words, e.g.
 * `Button “Generate draft”` or `Card “92% match score”`. It is stored on the
 * thread when the pin is dropped, so the thread still says what it was about
 * after a redeploy removes the element (dev's bridge spike sends the same kind
 * of descriptor, minus typed values and secrets).
 */
const KIND: Record<string, string> = {
  A: 'Link',
  BUTTON: 'Button',
  INPUT: 'Field',
  TEXTAREA: 'Field',
  SELECT: 'Dropdown',
  IMG: 'Image',
  SVG: 'Icon',
  CANVAS: 'Chart',
  VIDEO: 'Video',
  H1: 'Heading',
  H2: 'Heading',
  H3: 'Heading',
  P: 'Text',
  SPAN: 'Text',
  LABEL: 'Label',
  TABLE: 'Table',
  TR: 'Row',
  LI: 'Item',
};

const MAX = 48;

export function describeElement(el: Element): string {
  const tag = el.tagName.toUpperCase();
  const kind = KIND[tag] ?? (el.children.length > 0 ? 'Card' : 'Text');
  // Typed values never leave the app: a field is named by its label, not its contents.
  const isField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  const raw = isField
    ? el.getAttribute('aria-label') || el.getAttribute('placeholder') || ''
    : el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.textContent || '';
  // A card's innerText is every line in it; its first line (usually its heading) names it.
  const firstLine = raw.split('\n').find((line) => line.trim()) ?? '';
  const words = firstLine.replace(/\s+/g, ' ').trim();
  if (!words) return kind;
  const clipped = words.length > MAX ? `${words.slice(0, MAX - 1).trimEnd()}…` : words;
  return `${kind} “${clipped}”`;
}
