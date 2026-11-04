import { envelope, isEnvelope } from '@/ai-apps-bridge/protocol';
import { toCaptureKey, toCaptureResult } from '../element-pins/validate';
import type { PageCapture } from './capturePage';

/**
 * A host redraw cannot see inside a cross-origin iframe, so that rectangle is
 * blank. An iframe marked `data-feedback-bridge` runs the same bridge as an
 * AI app. This asks it for the picture it already shows and paints that
 * picture where the iframe sits. A frame that does not answer leaves the
 * page picture unchanged.
 */
export const FEEDBACK_BRIDGE_ATTR = 'data-feedback-bridge';

const IGNORE_ATTR = 'data-feedback-capture-ignore';
const READY_MS = 1500;
const CAPTURE_MS = 8000;
const HELLO_RETRY_MS = [400, 800];

type FrameShot = { iframe: HTMLIFrameElement; dataUrl: string; width: number; height: number };

let captureSeq = 0;

function frameOrigin(iframe: HTMLIFrameElement): string | null {
  const src = iframe.getAttribute('src');
  if (!src) return null;
  try {
    return new URL(src, window.location.href).origin;
  } catch {
    return null;
  }
}

function visibleBridgedFrames(): HTMLIFrameElement[] {
  return [...document.querySelectorAll<HTMLIFrameElement>(`iframe[${FEEDBACK_BRIDGE_ATTR}]`)].filter((iframe) => {
    if (iframe.closest(`[${IGNORE_ATTR}]`)) return false;
    const box = iframe.getBoundingClientRect();
    return (
      box.width > 0 &&
      box.height > 0 &&
      box.bottom > 0 &&
      box.right > 0 &&
      box.top < window.innerHeight &&
      box.left < window.innerWidth
    );
  });
}

function canCapture(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const capabilities = (payload as { capabilities?: unknown }).capabilities;
  return Array.isArray(capabilities) && capabilities.includes('capture');
}

function captureFrame(iframe: HTMLIFrameElement): Promise<FrameShot | null> {
  const origin = frameOrigin(iframe);
  const target = iframe.contentWindow;
  if (!origin || !target) return Promise.resolve(null);

  return new Promise((resolve) => {
    let key: string | null = null;
    let captureTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = (shot: FrameShot | null) => {
      clearTimeout(readyTimer);
      retryTimers.forEach(clearTimeout);
      if (captureTimer) clearTimeout(captureTimer);
      window.removeEventListener('message', onMessage);
      resolve(shot);
    };
    const readyTimer = setTimeout(() => finish(null), READY_MS);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== target || !isEnvelope(event.data)) return;
      if (event.data.type === 'ready') {
        if (key) return;
        if (!canCapture(event.data.payload)) {
          finish(null);
          return;
        }
        captureSeq += 1;
        key = `cap-${captureSeq}`;
        captureTimer = setTimeout(() => finish(null), CAPTURE_MS);
        try {
          target.postMessage(envelope({ type: 'capture', payload: { key } }), origin);
        } catch {
          finish(null);
        }
        return;
      }
      if (event.data.type !== 'capture:result' || !key) return;
      const payload = event.data.payload;
      if (!payload || typeof payload !== 'object') return;
      const body = payload as Record<string, unknown>;
      if (toCaptureKey(body.key) !== key) return;
      const result = toCaptureResult(body);
      finish(result ? { iframe, ...result } : null);
    };
    const hello = () => {
      try {
        target.postMessage(envelope({ type: 'hello' }), origin);
      } catch {
        finish(null);
      }
    };
    const retryTimers = HELLO_RETRY_MS.map((ms) => setTimeout(hello, ms));
    window.addEventListener('message', onMessage);
    hello();
  });
}

export function requestBridgedFrameShots(): Promise<FrameShot[]> {
  const frames = visibleBridgedFrames();
  if (frames.length === 0) return Promise.resolve([]);
  return Promise.all(frames.map(captureFrame)).then((shots) =>
    shots.filter((shot): shot is FrameShot => shot !== null),
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the frame shot'));
    image.src = src;
  });
}

/** Draws each frame shot onto the page picture at the iframe's place on screen. */
export async function paintBridgedFrames(page: PageCapture, shots: FrameShot[]): Promise<PageCapture> {
  if (shots.length === 0) return page;
  try {
    const pageImage = await loadImage(page.dataUrl);
    const scale = pageImage.naturalWidth / page.width;
    if (!pageImage.naturalWidth || !pageImage.naturalHeight || !Number.isFinite(scale) || scale <= 0) return page;
    const canvas = document.createElement('canvas');
    canvas.width = pageImage.naturalWidth;
    canvas.height = pageImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return page;
    ctx.drawImage(pageImage, 0, 0);
    for (const shot of shots) {
      const rect = shot.iframe.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const image = await loadImage(shot.dataUrl);
      ctx.drawImage(image, rect.left * scale, rect.top * scale, rect.width * scale, rect.height * scale);
    }
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), width: page.width, height: page.height };
  } catch {
    return page;
  }
}
