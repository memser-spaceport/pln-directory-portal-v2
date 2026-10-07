import { hostDataUriImages } from '@/utils/html';
import type { AiAppEnvironment, FeedbackPinInput } from '@/services/ai-app-feedback/ai-app-feedback.service';
import type { ElementPin } from './types';

/**
 * Pins travel inside the feedback's Quill HTML, the way annotated screenshots
 * do (`data-annotations`), so the spike needs no backend change:
 *
 * - a readable `<ol class="ai-app-element-pins">` — note, selector, component,
 *   page — for anyone reading the feedback today;
 * - the full structured payload as URL-encoded JSON in `data-pins` on that list,
 *   for tools (a coding agent) that want the element back. `ALLOW_DATA_ATTR` in
 *   the feedback sanitizer keeps it;
 * - each crop as a hosted `<img alt="Pin N: …">` after the list. The feedback
 *   viewer lifts every image into its gallery, so the alt is what ties a crop
 *   back to its pin there.
 */

export const ELEMENT_PINS_CLASS = 'ai-app-element-pins';
export const ELEMENT_PINS_ATTR = 'data-pins';
export const PIN_CROP_CLASS = 'ai-app-pin-crop';

/**
 * Budget for the encoded `data-pins` attribute. The whole submission is capped
 * at 200k by the server; screenshots' annotations and the member's own text
 * need the rest. Over budget, the `html` excerpts go first — they are the
 * largest field and the least needed to find the element again.
 */
export const PINS_PAYLOAD_BUDGET = 60_000;

export type SerializedPin = {
  n: number;
  note: string;
  detached: boolean;
  crop: string | null;
  selector: string;
  tag: string;
  text: string;
  html?: string;
  role: string | null;
  ariaLabel: string | null;
  component: string | null;
  source: string | null;
  rect: { x: number; y: number; w: number; h: number };
  page: { path: string; title: string; viewportW: number; viewportH: number };
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function serializePins(pins: ElementPin[], crops: (string | null)[]): string {
  const full: SerializedPin[] = pins.map((pin, i) => ({
    n: i + 1,
    note: pin.note.trim(),
    detached: pin.rect === null,
    crop: crops[i] ?? null,
    ...pin.element,
  }));
  let encoded = encodeURIComponent(JSON.stringify({ version: 1, pins: full }));
  if (encoded.length > PINS_PAYLOAD_BUDGET) {
    const lean = full.map(({ html: _html, ...rest }) => rest);
    encoded = encodeURIComponent(JSON.stringify({ version: 1, pins: lean }));
  }
  return encoded;
}

export function pinsHtml(pins: ElementPin[], crops: (string | null)[]): string {
  const items = pins
    .map((pin, i) => {
      const note = pin.note.trim() || '(no note)';
      const where = [
        `<code>${escapeHtml(pin.element.selector)}</code>`,
        pin.element.component ? escapeHtml(pin.element.component) : null,
        escapeHtml(pin.element.page.path),
      ]
        .filter(Boolean)
        .join(' · ');
      return `<li><p><strong>${escapeHtml(note)}</strong></p><p>${where}</p></li>`;
    })
    .join('');
  const list = `<ol class="${ELEMENT_PINS_CLASS}" ${ELEMENT_PINS_ATTR}="${serializePins(pins, crops)}">${items}</ol>`;
  const images = crops
    .map((url, i) =>
      url
        ? `<p><img src="${escapeHtml(url)}" alt="${escapeHtml(`Pin ${i + 1}: ${pins[i].note.trim() || pins[i].element.tag}`.slice(0, 200))}" class="${PIN_CROP_CLASS}"></p>`
        : '',
    )
    .join('');
  return `<p><strong>Pinned elements</strong></p>${list}${images}`;
}

/** Hosts one picture; `null` when it couldn't be hosted. */
export async function hostImage(dataUrl: string): Promise<string | null> {
  const hosted = await hostDataUriImages(`<img src="${dataUrl}">`);
  const match = hosted.match(/\bsrc=["']([^"']+)["']/i);
  return match?.[1] && !match[1].startsWith('data:') ? match[1] : null;
}

/** Hosts every finished crop once, in pin order. A crop that failed or is still rendering is `null`. */
export async function hostPinCrops(pins: ElementPin[]): Promise<(string | null)[]> {
  return Promise.all(pins.map((pin) => (pin.crop.status === 'done' ? hostImage(pin.crop.dataUrl) : null)));
}

/** Appends the readable pin block, using crops already hosted by `hostPinCrops`. */
export function appendPinsHtml(html: string, pins: ElementPin[], crops: (string | null)[]): string {
  if (pins.length === 0) return html;
  return [html.trim(), pinsHtml(pins, crops)].filter(Boolean).join('');
}

/** Hosts every finished crop, then appends the pin block. A crop that failed or is still rendering is left out. */
export async function appendPins(html: string, pins: ElementPin[]): Promise<string> {
  if (pins.length === 0) return html;
  return appendPinsHtml(html, pins, await hostPinCrops(pins));
}

/**
 * The same pins as data, for the feedback-in-context overlay: what
 * POST /:uid/feedback stores as rows. Shares `crops` with `pinsHtml`, so the
 * row and the readable list point at the same hosted image. The bridge reports
 * the page without its query; `pageQuery` stays null.
 */
export function toPinInputs(pins: ElementPin[], crops: (string | null)[], env: AiAppEnvironment): FeedbackPinInput[] {
  return pins.map((pin, i) => ({
    n: i + 1,
    env,
    pagePath: pin.element.page.path.startsWith('/') ? pin.element.page.path : `/${pin.element.page.path}`,
    pageQuery: null,
    selector: pin.element.selector,
    tag: pin.element.tag,
    text: pin.element.text,
    role: pin.element.role,
    ariaLabel: pin.element.ariaLabel,
    component: pin.element.component,
    source: pin.element.source,
    rect: pin.element.rect,
    viewportW: Math.max(1, Math.round(pin.element.page.viewportW)),
    viewportH: Math.max(1, Math.round(pin.element.page.viewportH)),
    note: pin.note.trim(),
    cropUrl: crops[i] ?? null,
  }));
}
