type TabCaptureOptions = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  monitorTypeSurfaces?: 'include' | 'exclude';
  controller?: unknown;
};

/**
 * Why a capture did not happen, as a thing the caller can act on.
 *
 * Six causes used to collapse into two messages, and the two they collapsed
 * into were wrong for four of them: a policy block read as "grant permission"
 * (the user cannot), and a lost user-activation read as "not available in this
 * browser" (a second click works). The reason travels with the error so the
 * dialog can pick copy, decide whether to offer the upload fallback, and record
 * which cause it actually was.
 */
export type CaptureFailureReason =
  /** No `getDisplayMedia` at all: iPadOS Safari, in-app browsers, insecure context. */
  | 'unsupported'
  /** Browser or OS refuses without ever showing a picker — enterprise policy, per-site block. */
  | 'blocked'
  /** The picker opened and the user dismissed it. Not an error. */
  | 'cancelled'
  /** No transient activation, or the tab lost focus. Clicking again works. */
  | 'retry'
  /** The stream exists but yields nothing usable — typically macOS Screen Recording denied. */
  | 'unreadable'
  /** Anything we could not place. */
  | 'failed';

/**
 * Reasons that will still be true on the next click, so the dialog swaps the
 * button for the upload fallback rather than inviting a second failure.
 * `cancelled` and `retry` are deliberately absent: both are transient.
 */
export type PersistentCaptureReason = 'unsupported' | 'blocked' | 'unreadable';

const PERSISTENT_REASONS: ReadonlySet<CaptureFailureReason> = new Set<CaptureFailureReason>([
  'unsupported',
  'blocked',
  'unreadable',
]);

/** Type guard, so a caller storing the reason keeps the narrower type. */
export function isPersistentReason(reason: CaptureFailureReason): reason is PersistentCaptureReason {
  return PERSISTENT_REASONS.has(reason);
}

export class CaptureError extends Error {
  readonly reason: CaptureFailureReason;
  /** The underlying `DOMException.name`, for analytics. Empty when there wasn't one. */
  readonly errorName: string;

  constructor(reason: CaptureFailureReason, message: string, errorName = '') {
    super(message);
    this.name = 'CaptureError';
    this.reason = reason;
    this.errorName = errorName;
  }

  /** Whether re-pressing the same button could plausibly succeed. */
  get isPersistent(): boolean {
    return isPersistentReason(this.reason);
  }
}

const MACOS_HINT =
  'Allow your browser under System Settings → Privacy & Security → Screen & System Audio Recording, then restart it.';

function messageFor(reason: CaptureFailureReason): string {
  switch (reason) {
    case 'unsupported':
      return 'Screenshots aren’t available in this browser.';
    case 'blocked':
      return isFirefox()
        ? 'Screen sharing is turned off. Check Page Info → Permissions → Share the Screen.'
        : isSafari()
          ? 'Screen sharing is turned off. Check Safari → Settings → Websites → Screen Sharing.'
          : 'Screen sharing is turned off by your browser or organisation.';
    case 'retry':
      return 'Click Take screenshot again.';
    case 'unreadable':
      return `Your browser couldn’t read the screen. ${MACOS_HINT}`;
    case 'cancelled':
      return '';
    default:
      return 'Could not capture a screenshot. Please try again.';
  }
}

function ua(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

function isFirefox(): boolean {
  return /firefox/i.test(ua());
}

/** Safari proper — Chrome and Edge on macOS both carry "Safari" in their UA. */
function isSafari(): boolean {
  const s = ua();
  return /safari/i.test(s) && !/chrome|chromium|edg\//i.test(s);
}

/**
 * Chromium has no per-site screen-capture permission, so a `NotAllowedError`
 * there is either the user dismissing the picker or a policy/OS refusal — and
 * the only signal separating them is how long it took. A refusal rejects before
 * anything is painted; a dismissal needs a human to see a dialog and act.
 *
 * 300 ms is comfortably below human reaction time to a dialog that has to
 * render first, and comfortably above the synchronous-ish rejection path. A
 * false positive costs one slightly-wrong toast; the alternative is telling
 * somebody whose IT department disabled screen capture that they "cancelled".
 */
const BLOCK_VS_CANCEL_MS = 300;

export function isCaptureSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return Boolean(window.isSecureContext && navigator.mediaDevices?.getDisplayMedia);
}

function getCaptureController(): unknown {
  const Ctor = (
    window as unknown as { CaptureController?: new () => { setFocusBehavior?: (behavior: string) => void } }
  ).CaptureController;
  if (!Ctor) return undefined;
  const controller = new Ctor();
  controller.setFocusBehavior?.('no-focus-change');
  return controller;
}

export async function requestTabCapture(): Promise<MediaStream> {
  if (!isCaptureSupported()) {
    throw new CaptureError('unsupported', messageFor('unsupported'));
  }

  /* Preflight the two conditions the spec rejects on before it ever paints a
     picker. Asking first turns an opaque InvalidStateError into a message that
     names the fix, and costs nothing when both are true. */
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
  if (activation && !activation.isActive) {
    throw new CaptureError('retry', messageFor('retry'));
  }
  if (typeof document !== 'undefined' && document.hasFocus && !document.hasFocus()) {
    throw new CaptureError('retry', messageFor('retry'));
  }

  const options: TabCaptureOptions = {
    video: true,
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    surfaceSwitching: 'exclude',
    monitorTypeSurfaces: 'exclude',
  };
  const controller = getCaptureController();
  if (controller) options.controller = controller;

  const startedAt = Date.now();
  try {
    return await navigator.mediaDevices.getDisplayMedia(options);
  } catch (error) {
    if (error instanceof CaptureError) throw error;
    const errorName = error instanceof DOMException ? error.name : '';
    const elapsed = Date.now() - startedAt;

    if (errorName === 'NotAllowedError') {
      /* See BLOCK_VS_CANCEL_MS: too fast for a human means no picker was shown. */
      const reason: CaptureFailureReason = elapsed < BLOCK_VS_CANCEL_MS ? 'blocked' : 'cancelled';
      throw new CaptureError(reason, messageFor(reason), errorName);
    }
    /* AbortError arrives when the page or the picker goes away mid-request —
       nothing the user did wrong, and nothing a message can fix. */
    if (errorName === 'AbortError') {
      throw new CaptureError('cancelled', '', errorName);
    }
    if (errorName === 'InvalidStateError') {
      throw new CaptureError('retry', messageFor('retry'), errorName);
    }
    if (errorName === 'NotReadableError') {
      throw new CaptureError('unreadable', messageFor('unreadable'), errorName);
    }
    if (errorName === 'NotFoundError' || errorName === 'NotSupportedError') {
      throw new CaptureError('unsupported', messageFor('unsupported'), errorName);
    }
    throw new CaptureError('failed', messageFor('failed'), errorName);
  }
}

export function stopCaptureStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Timed out waiting for a video frame')), 5000);
    const finish = (ok: boolean) => {
      window.clearTimeout(timeout);
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('error', onError);
      if (ok) resolve();
      else reject(new Error('Could not read the captured tab'));
    };
    const onLoaded = () => finish(video.videoWidth > 0);
    const onError = () => finish(false);
    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('error', onError);
  });
}

/** Sample grid for the blank-frame check — 256 points across the frame. */
const BLANK_GRID = 16;
/**
 * The brightest any channel may be for the frame to count as dead.
 *
 * Far below anything legible: even a "black" dark-mode surface sits around 17,
 * and the text on it is brighter still.
 */
const BLANK_MAX_CHANNEL = 12;

/**
 * Whether the frame is a dead capture rather than a dark screenshot.
 *
 * macOS without the Screen Recording grant hands back a stream that decodes to
 * a flat black picture, and the old code attached it happily — the user learned
 * nothing had been captured only when a reviewer opened a black image.
 *
 * The rule is "nothing anywhere is brighter than near-black", not "most of it
 * is dark". That distinction is what keeps a dark-mode app safe: it is dark, but
 * it has text, a nav, a border, and any one of those samples lands far above the
 * ceiling. Rejecting on average brightness would fail exactly the apps most
 * likely to be dark.
 *
 * One sample above the ceiling is enough to stop, so a normal screenshot costs
 * two reads rather than 256.
 */
export function isBlankFrame(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  for (let row = 0; row < BLANK_GRID; row++) {
    for (let col = 0; col < BLANK_GRID; col++) {
      const x = Math.min(width - 1, Math.floor(((col + 0.5) / BLANK_GRID) * width));
      const y = Math.min(height - 1, Math.floor(((row + 0.5) / BLANK_GRID) * height));
      let pixel: Uint8ClampedArray;
      try {
        pixel = ctx.getImageData(x, y, 1, 1).data;
      } catch {
        /* A tainted canvas cannot be sampled. Nothing here taints it, but a
           read that throws must not cost the user their screenshot. */
        return false;
      }
      if (Math.max(pixel[0], pixel[1], pixel[2]) > BLANK_MAX_CHANNEL) return false;
    }
  }
  return true;
}

export async function grabVideoFrame(stream: MediaStream): Promise<string> {
  const video = document.createElement('video');
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;
  video.srcObject = stream;
  video.setAttribute('aria-hidden', 'true');
  video.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(video);

  try {
    await video.play();
    await waitForVideoFrame(video);
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new CaptureError('unreadable', messageFor('unreadable'));
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new CaptureError('failed', messageFor('failed'));
    }
    ctx.drawImage(video, 0, 0);
    if (isBlankFrame(ctx, canvas.width, canvas.height)) {
      throw new CaptureError('unreadable', messageFor('unreadable'));
    }
    return canvas.toDataURL('image/png');
  } finally {
    video.pause();
    video.srcObject = null;
    video.remove();
  }
}

export function cropImageToDataUrl(
  image: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number },
  crop: { x: number; y: number; width: number; height: number },
): string {
  const sourceWidth = 'naturalWidth' in image && image.naturalWidth ? image.naturalWidth : Number(image.width) || 0;
  const sourceHeight =
    'naturalHeight' in image && image.naturalHeight ? image.naturalHeight : Number(image.height) || 0;
  const x = Math.max(0, Math.round(crop.x));
  const y = Math.max(0, Math.round(crop.y));
  const width = Math.max(1, Math.min(Math.round(crop.width), sourceWidth - x));
  const height = Math.max(1, Math.min(Math.round(crop.height), sourceHeight - y));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not crop the screenshot');
  }
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}
