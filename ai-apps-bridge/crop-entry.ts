import { domToPng } from 'modern-screenshot';

/**
 * Bundled to `public/ai-apps/bridge/v1-crop.js` and loaded by the bridge on the
 * first crop only — the renderer is several times the size of the bridge itself.
 *
 * Redraws ONE element from its DOM. Known gaps, by design of any DOM redraw:
 * cross-origin images without CORS come out blank, <canvas>/WebGL keep only
 * what toDataURL allows, <video> and nested iframes are empty.
 */

const MAX_EDGE = 1600;
/** Input types whose value is the author's, not something the member typed. */
const AUTHOR_VALUE_TYPES = new Set([
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
  'range',
  'color',
  'image',
  'hidden',
]);

/**
 * The crop is a picture of what's on screen, so without this it would show
 * whatever the member typed — the one thing the structured payload redacts.
 * Runs on the renderer's CLONE after it copied the live values in; the page
 * itself is never touched. The field keeps its shape so the picture still
 * shows that something was entered.
 */
function maskTypedValue(node: Node) {
  const mask = (value: string) => '•'.repeat(Math.min(value.length, 24));
  if (node instanceof HTMLInputElement && !AUTHOR_VALUE_TYPES.has(node.type)) {
    node.setAttribute('value', mask(node.getAttribute('value') ?? ''));
  } else if (node instanceof HTMLTextAreaElement) {
    const typed = node.getAttribute('value') ?? node.textContent ?? '';
    node.textContent = mask(typed);
    node.removeAttribute('value');
  }
}

function backgroundBehind(el: Element): string {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    if (color && color !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(color)) return color;
  }
  return '#ffffff';
}

(window as Window & { __plnBridgeCrop?: (el: Element) => Promise<string> }).__plnBridgeCrop = (el) => {
  const rect = el.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2, MAX_EDGE / Math.max(rect.width, rect.height, 1));
  return domToPng(el, {
    scale,
    backgroundColor: backgroundBehind(el),
    timeout: 8000,
    filter: (node) => !(node instanceof Element && node.hasAttribute('data-pln-bridge')),
    onCloneEachNode: maskTypedValue,
  });
};
