type TabCaptureOptions = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  monitorTypeSurfaces?: 'include' | 'exclude';
  controller?: unknown;
};

export class CaptureUnavailableError extends Error {
  constructor() {
    super('Screenshots aren’t available in this browser.');
    this.name = 'CaptureUnavailableError';
  }
}

export class CaptureDeniedError extends Error {
  constructor() {
    super('Screenshot permission is needed to capture the page.');
    this.name = 'CaptureDeniedError';
  }
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
  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices?.getDisplayMedia) {
    throw new CaptureUnavailableError();
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

  try {
    return await mediaDevices.getDisplayMedia(options);
  } catch (error) {
    if (error instanceof CaptureUnavailableError || error instanceof CaptureDeniedError) {
      throw error;
    }
    const name = error instanceof DOMException ? error.name : '';
    if (name === 'NotAllowedError' || name === 'AbortError') {
      throw new CaptureDeniedError();
    }
    if (name === 'NotFoundError' || name === 'NotSupportedError') {
      throw new CaptureUnavailableError();
    }
    throw new CaptureUnavailableError();
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
      throw new Error('Could not read the captured tab');
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not read the captured tab');
    }
    ctx.drawImage(video, 0, 0);
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
