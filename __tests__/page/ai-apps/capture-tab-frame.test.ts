import {
  CaptureError,
  isBlankFrame,
  isCaptureSupported,
  requestTabCapture,
  stopCaptureStream,
} from '@/components/page/ai-apps/components/screenshot-feedback/captureTabFrame';

const setMediaDevices = (value: unknown) => {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value });
};

const setSecureContext = (value: boolean) => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value });
};

/** The reason a rejection carried, or the thrown value if it wasn't ours. */
const reasonOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return error instanceof CaptureError ? error.reason : error;
  }
};

describe('requestTabCapture', () => {
  const originalMedia = navigator.mediaDevices;
  const originalSecure = window.isSecureContext;

  beforeEach(() => {
    setSecureContext(true);
    /* jsdom has neither; the code treats both as "fine, proceed". */
    Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { isActive: true } });
    jest.spyOn(document, 'hasFocus').mockReturnValue(true);
  });

  afterEach(() => {
    setMediaDevices(originalMedia);
    setSecureContext(originalSecure);
    jest.restoreAllMocks();
  });

  it('reports an unsupported browser when getDisplayMedia is missing', async () => {
    setMediaDevices({});
    await expect(reasonOf(requestTabCapture())).resolves.toBe('unsupported');
  });

  /* `getDisplayMedia` is only exposed in a secure context, so an http:// page
     is the same dead end as an old browser — and used to be indistinguishable
     from one in the data. */
  it('reports an unsupported browser in an insecure context', async () => {
    setSecureContext(false);
    setMediaDevices({ getDisplayMedia: jest.fn() });
    await expect(reasonOf(requestTabCapture())).resolves.toBe('unsupported');
  });

  /**
   * The bug this whole change exists for: the spec rejects before painting a
   * picker when the click's user activation has expired, and the old code
   * reported that as "not available in this browser" — telling somebody their
   * browser can't do it when a second click would have worked.
   */
  it('asks for a retry when user activation has expired', async () => {
    Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { isActive: false } });
    const getDisplayMedia = jest.fn();
    setMediaDevices({ getDisplayMedia });

    await expect(reasonOf(requestTabCapture())).resolves.toBe('retry');
    expect(getDisplayMedia).not.toHaveBeenCalled();
  });

  it('asks for a retry when the document is not focused', async () => {
    jest.spyOn(document, 'hasFocus').mockReturnValue(false);
    const getDisplayMedia = jest.fn();
    setMediaDevices({ getDisplayMedia });

    await expect(reasonOf(requestTabCapture())).resolves.toBe('retry');
    expect(getDisplayMedia).not.toHaveBeenCalled();
  });

  it('asks for a retry on InvalidStateError from the call itself', async () => {
    setMediaDevices({
      getDisplayMedia: jest.fn().mockRejectedValue(new DOMException('no activation', 'InvalidStateError')),
    });
    await expect(reasonOf(requestTabCapture())).resolves.toBe('retry');
  });

  /**
   * Chromium has no per-site screen-capture permission, so a NotAllowedError is
   * either a policy/OS refusal or the user dismissing the picker — separable
   * only by how long it took. Both used to read "permission is needed", which
   * is advice the blocked user cannot act on and the cancelling user does not
   * need.
   */
  it('treats an instant NotAllowedError as a block, not a cancel', async () => {
    setMediaDevices({
      getDisplayMedia: jest.fn().mockRejectedValue(new DOMException('blocked', 'NotAllowedError')),
    });
    await expect(reasonOf(requestTabCapture())).resolves.toBe('blocked');
  });

  it('treats a slow NotAllowedError as the user cancelling', async () => {
    setMediaDevices({
      getDisplayMedia: jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((_resolve, reject) =>
              setTimeout(() => reject(new DOMException('dismissed', 'NotAllowedError')), 400),
            ),
        ),
    });
    await expect(reasonOf(requestTabCapture())).resolves.toBe('cancelled');
  });

  it('carries no message on a cancel, so nothing is toasted', async () => {
    setMediaDevices({
      getDisplayMedia: jest.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')),
    });
    try {
      await requestTabCapture();
      throw new Error('expected a rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(CaptureError);
      expect((error as CaptureError).reason).toBe('cancelled');
      expect((error as CaptureError).message).toBe('');
    }
  });

  it('maps NotReadableError to the OS-grant hint', async () => {
    setMediaDevices({
      getDisplayMedia: jest.fn().mockRejectedValue(new DOMException('hardware', 'NotReadableError')),
    });
    try {
      await requestTabCapture();
      throw new Error('expected a rejection');
    } catch (error) {
      expect((error as CaptureError).reason).toBe('unreadable');
      expect((error as CaptureError).message).toMatch(/Screen & System Audio Recording/);
    }
  });

  it('records the underlying DOMException name for analytics', async () => {
    setMediaDevices({
      getDisplayMedia: jest.fn().mockRejectedValue(new DOMException('nope', 'NotReadableError')),
    });
    try {
      await requestTabCapture();
      throw new Error('expected a rejection');
    } catch (error) {
      expect((error as CaptureError).errorName).toBe('NotReadableError');
    }
  });

  /* Only the three that will still be true on the next press close the capture
     path; the transient two must leave the button alone. */
  it.each([
    ['unsupported', 'NotSupportedError', true],
    ['blocked', 'NotAllowedError', true],
    ['unreadable', 'NotReadableError', true],
    ['retry', 'InvalidStateError', false],
    ['cancelled', 'AbortError', false],
  ])('marks %s as persistent=%s', async (_reason, errorName, persistent) => {
    setMediaDevices({
      getDisplayMedia: jest.fn().mockRejectedValue(new DOMException('x', errorName)),
    });
    try {
      await requestTabCapture();
      throw new Error('expected a rejection');
    } catch (error) {
      expect((error as CaptureError).isPersistent).toBe(persistent);
    }
  });

  it('requests the current tab and returns the stream', async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const getDisplayMedia = jest.fn().mockResolvedValue(stream);
    setMediaDevices({ getDisplayMedia });

    await expect(requestTabCapture()).resolves.toBe(stream);
    expect(getDisplayMedia).toHaveBeenCalledWith(expect.objectContaining({ preferCurrentTab: true, audio: false }));
  });
});

describe('isCaptureSupported', () => {
  const originalMedia = navigator.mediaDevices;
  const originalSecure = window.isSecureContext;

  afterEach(() => {
    setMediaDevices(originalMedia);
    setSecureContext(originalSecure);
  });

  it('is false without getDisplayMedia', () => {
    setSecureContext(true);
    setMediaDevices({});
    expect(isCaptureSupported()).toBe(false);
  });

  it('is false in an insecure context', () => {
    setSecureContext(false);
    setMediaDevices({ getDisplayMedia: jest.fn() });
    expect(isCaptureSupported()).toBe(false);
  });

  it('is true when both hold', () => {
    setSecureContext(true);
    setMediaDevices({ getDisplayMedia: jest.fn() });
    expect(isCaptureSupported()).toBe(true);
  });
});

describe('stopCaptureStream', () => {
  it('stops every track', () => {
    const stop = jest.fn();
    stopCaptureStream({ getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream);
    expect(stop).toHaveBeenCalledTimes(2);
  });
});

/**
 * macOS without the Screen Recording grant hands back a stream that decodes to
 * flat black, and it used to be attached as the screenshot — the user found out
 * only when a reviewer opened a black image.
 *
 * The rule cannot be "is it dark": a dark-mode app is legitimately near-black,
 * so brightness alone would reject exactly the apps most likely to be dark.
 * What separates a dead capture from a dark screenshot is uniformity.
 */
describe('isBlankFrame', () => {
  /** A context whose every sampled pixel comes from `pixelAt(x, y)`. */
  const ctxOf = (pixelAt: (x: number, y: number) => [number, number, number]) =>
    ({
      getImageData: (x: number, y: number) => ({ data: Uint8ClampedArray.from([...pixelAt(x, y), 255]) }),
    }) as unknown as CanvasRenderingContext2D;

  it('rejects a frame that is uniformly black', () => {
    expect(
      isBlankFrame(
        ctxOf(() => [0, 0, 0]),
        800,
        600,
      ),
    ).toBe(true);
  });

  it('rejects a frame that is uniformly near-black', () => {
    expect(
      isBlankFrame(
        ctxOf(() => [3, 3, 4]),
        800,
        600,
      ),
    ).toBe(true);
  });

  /* The case the naive "mostly dark pixels" rule gets wrong. */
  it('accepts a dark-mode screenshot, which is dark but not uniform', () => {
    const darkUi = (x: number, y: number): [number, number, number] =>
      /* A band of text a fifth of the way down, on a #111 background. */
      y > 100 && y < 160 ? [220, 220, 220] : [17, 17, 17];
    expect(isBlankFrame(ctxOf(darkUi), 800, 600)).toBe(false);
  });

  it('accepts a very dark frame carrying one faint edge', () => {
    const faintEdge = (x: number): [number, number, number] => (x > 700 ? [40, 40, 40] : [2, 2, 2]);
    expect(isBlankFrame(ctxOf(faintEdge), 800, 600)).toBe(false);
  });

  /* Noise in a dead capture is still a dead capture: every sample is invisible,
     so variation among them is not evidence of content. */
  it('rejects a black frame that varies below the visible floor', () => {
    const noisy = (x: number, y: number): [number, number, number] => [(x + y) % 11, 0, 0];
    expect(isBlankFrame(ctxOf(noisy), 800, 600)).toBe(true);
  });

  it('accepts an ordinary bright screenshot', () => {
    expect(
      isBlankFrame(
        ctxOf(() => [255, 255, 255]),
        800,
        600,
      ),
    ).toBe(false);
  });

  /* A frame that is uniform but not dark is a solid-colour page, not a dead
     capture — the OS failure mode is specifically black. */
  it('accepts a uniformly white frame', () => {
    expect(
      isBlankFrame(
        ctxOf(() => [250, 250, 250]),
        800,
        600,
      ),
    ).toBe(false);
  });

  it('keeps the screenshot when the canvas cannot be sampled', () => {
    const throwing = {
      getImageData: () => {
        throw new DOMException('tainted', 'SecurityError');
      },
    } as unknown as CanvasRenderingContext2D;
    expect(isBlankFrame(throwing, 800, 600)).toBe(false);
  });
});
