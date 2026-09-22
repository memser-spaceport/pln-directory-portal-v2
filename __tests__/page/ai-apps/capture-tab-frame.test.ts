import {
  CaptureDeniedError,
  CaptureUnavailableError,
  requestTabCapture,
  stopCaptureStream,
} from '@/components/page/ai-apps/components/screenshot-feedback/captureTabFrame';

describe('requestTabCapture', () => {
  const originalMedia = navigator.mediaDevices;

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMedia,
    });
    jest.restoreAllMocks();
  });

  it('throws CaptureUnavailableError when getDisplayMedia is missing', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {},
    });
    await expect(requestTabCapture()).rejects.toBeInstanceOf(CaptureUnavailableError);
  });

  it('maps NotAllowedError to CaptureDeniedError', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: jest.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
      },
    });
    await expect(requestTabCapture()).rejects.toBeInstanceOf(CaptureDeniedError);
  });

  it('requests the current tab and returns the stream', async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const getDisplayMedia = jest.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia },
    });

    await expect(requestTabCapture()).resolves.toBe(stream);
    expect(getDisplayMedia).toHaveBeenCalledWith(expect.objectContaining({ preferCurrentTab: true, audio: false }));
  });
});

describe('stopCaptureStream', () => {
  it('stops every track', () => {
    const stop = jest.fn();
    stopCaptureStream({ getTracks: () => [{ stop }, { stop }] } as unknown as MediaStream);
    expect(stop).toHaveBeenCalledTimes(2);
  });
});
