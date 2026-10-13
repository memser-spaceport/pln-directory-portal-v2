/**
 * Native screenshot: the page as it is on screen right now, rendered by our own
 * code — no browser "Choose what to share" prompt, no screen-share permission,
 * nothing for the person to pick.
 *
 * Production's feedback capture asks the browser for the tab
 * (`getDisplayMedia`) and freezes a video frame; this replaces only that first
 * step. The result is handed to production's `RegionSelectOverlay` exactly as
 * the tab frame would be, so dragging an area and annotating are unchanged.
 *
 * In production the app itself is a cross-origin iframe the host cannot paint,
 * so the app's part of the picture comes from inside the app (dev's
 * starter-kit bridge already crops elements there) and is composited with the
 * host page. Here the frame is `srcDoc`, same-origin, so html2canvas renders it
 * in place.
 *
 * html2canvas comes from the CDN on first use, as the shared comment layer and
 * the vendored review widget load it — it is not an app dependency.
 */

const HTML2CANVAS_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

/** Anything carrying this attribute (and its children) is left out of the picture. */
export const CAPTURE_IGNORE_ATTR = 'data-native-capture-ignore';

type Html2Canvas = (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;

let loading: Promise<Html2Canvas> | null = null;

function loadHtml2Canvas(): Promise<Html2Canvas> {
  const w = window as unknown as { html2canvas?: Html2Canvas };
  if (w.html2canvas) return Promise.resolve(w.html2canvas);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = HTML2CANVAS_CDN;
      script.async = true;
      script.onload = () => (w.html2canvas ? resolve(w.html2canvas) : reject(new Error('html2canvas missing')));
      script.onerror = () => reject(new Error('html2canvas failed to load'));
      document.head.appendChild(script);
    });
  }
  return loading;
}

/**
 * The visible viewport as a PNG data URL, in two passes.
 *
 * 1. The host page, with every iframe left out — html2canvas cannot paint a
 *    frame's document from the outside, it would come back blank.
 * 2. Each visible same-origin frame, rendered from its own document at its own
 *    scroll, and drawn into the first picture where the frame sits.
 *
 * That composition is the production shape too: the host renders the page, and
 * the app's part comes from inside the app (the starter-kit bridge), because
 * the real app is cross-origin.
 *
 * portal-v2 scrolls the body rather than the document, so the page offset is
 * read from both. `ignore` — extra elements to leave out (the popover that
 * asked for the screenshot), on top of anything marked `CAPTURE_IGNORE_ATTR`.
 */
export async function captureViewport(ignore: (Element | null | undefined)[] = []): Promise<string> {
  return render({ fullPage: false, ignore });
}

/**
 * The whole page — the scrolled-away parts too — as a PNG data URL. Same two
 * passes as `captureViewport`; the frames are drawn where they sit on the page,
 * not on the screen.
 */
export async function captureWholePage(ignore: (Element | null | undefined)[] = []): Promise<string> {
  return render({ fullPage: true, ignore });
}

/** A rectangle of the screen (CSS px, viewport coordinates), as a PNG data URL. */
export async function captureArea(
  area: { x: number; y: number; width: number; height: number },
  ignore: (Element | null | undefined)[] = [],
): Promise<string> {
  const full = await render({ fullPage: false, ignore });
  const img = new Image();
  img.src = full;
  await img.decode();
  const ratio = img.naturalWidth / window.innerWidth;
  const out = document.createElement('canvas');
  out.width = Math.round(area.width * ratio);
  out.height = Math.round(area.height * ratio);
  out
    .getContext('2d')
    ?.drawImage(
      img,
      area.x * ratio,
      area.y * ratio,
      area.width * ratio,
      area.height * ratio,
      0,
      0,
      out.width,
      out.height,
    );
  return out.toDataURL('image/png');
}

async function render({ fullPage, ignore }: { fullPage: boolean; ignore: (Element | null | undefined)[] }) {
  const html2canvas = await loadHtml2Canvas();
  const scale = Math.min(2, window.devicePixelRatio || 1);
  const skip = (node: Element) =>
    node.tagName === 'IFRAME' ||
    !!node.closest?.(`[${CAPTURE_IGNORE_ATTR}]`) ||
    ignore.some((el) => !!el && (el === node || el.contains(node)));

  const scrollX = window.scrollX + document.body.scrollLeft;
  const scrollY = window.scrollY + document.body.scrollTop;
  const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight);
  // Where page-space starts in the picture: 0 for the whole page, the scroll for a viewport.
  const originX = fullPage ? 0 : scrollX;
  const originY = fullPage ? 0 : scrollY;

  const page = await html2canvas(document.body, {
    x: originX,
    y: originY,
    width: window.innerWidth,
    height: fullPage ? pageHeight : window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: fullPage ? pageHeight : window.innerHeight,
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    ignoreElements: skip,
  });
  const ctx = page.getContext('2d');

  for (const frame of Array.from(document.querySelectorAll('iframe'))) {
    const rect = frame.getBoundingClientRect();
    const visible =
      rect.width > 0 &&
      rect.height > 0 &&
      (fullPage ||
        (rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth));
    let doc: Document | null = null;
    try {
      doc = frame.contentDocument;
    } catch {
      doc = null; // cross-origin: in production the bridge supplies this part
    }
    if (!ctx || !visible || !doc?.body || skip(frame.parentElement ?? frame)) continue;
    const win = doc.defaultView;
    const shot = await html2canvas(doc.body, {
      x: win?.scrollX ?? 0,
      y: win?.scrollY ?? 0,
      width: frame.clientWidth,
      height: frame.clientHeight,
      windowWidth: frame.clientWidth,
      windowHeight: frame.clientHeight,
      scale,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });
    // clientLeft/Top: the frame's content box starts inside its border.
    // Screen position → picture position: add the page scroll, take off the origin.
    ctx.drawImage(
      shot,
      (rect.left + scrollX - originX + frame.clientLeft) * scale,
      (rect.top + scrollY - originY + frame.clientTop) * scale,
      frame.clientWidth * scale,
      frame.clientHeight * scale,
    );
  }
  return page.toDataURL('image/png');
}
