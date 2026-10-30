import type { ScreenshotAttachment } from './types';

/**
 * Reads what a member dropped on the feedback note, so a screenshot dragged
 * there opens the annotator instead of sitting in the text as a plain picture.
 *
 * A preview in the screenshot strip names itself under `SHOT_DRAG_TYPE` when a
 * drag starts from it. A browser that drags the picture natively still gives
 * its data URL (in `text/uri-list` or `text/html`), and that is matched to the
 * screenshot by its picture. Anything else that is a picture comes in as a new
 * one: an image file, or a data URL from elsewhere on the page.
 */

/** The drag type a screenshot preview sets; its value is the screenshot's id. */
export const SHOT_DRAG_TYPE = 'application/x-labos-feedback-shot';

export type DroppedImage =
  | { kind: 'shot'; shot: ScreenshotAttachment }
  | { kind: 'file'; file: File }
  | { kind: 'src'; src: string };

const DATA_IMAGE = /^data:image\/[a-z0-9.+-]+[;,]/i;

function readType(data: DataTransfer, type: string): string {
  try {
    return data.getData(type) ?? '';
  } catch {
    return '';
  }
}

/** The first data-URL picture in the drag, from its URI list or its HTML. */
function droppedDataUrl(data: DataTransfer): string | null {
  const uris = readType(data, 'text/uri-list')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  const fromList = uris.find((uri) => DATA_IMAGE.test(uri));
  if (fromList) return fromList;

  const html = readType(data, 'text/html');
  if (!html || typeof DOMParser === 'undefined') return null;
  /* Parsed inert (no scripts run, no images load) only to read a src. */
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const src = doc.querySelector('img')?.getAttribute('src') ?? '';
  return DATA_IMAGE.test(src) ? src : null;
}

export function readDroppedImage(
  data: DataTransfer | null | undefined,
  shots: ScreenshotAttachment[],
): DroppedImage | null {
  if (!data) return null;

  const shotId = readType(data, SHOT_DRAG_TYPE);
  if (shotId) {
    const shot = shots.find((item) => item.id === shotId);
    if (shot) return { kind: 'shot', shot };
  }

  const file = Array.from(data.files ?? []).find((item) => item.type.startsWith('image/'));
  if (file) return { kind: 'file', file };

  const src = droppedDataUrl(data);
  if (!src) return null;
  const shot = shots.find((item) => item.imageDataUrl === src);
  return shot ? { kind: 'shot', shot } : { kind: 'src', src };
}
