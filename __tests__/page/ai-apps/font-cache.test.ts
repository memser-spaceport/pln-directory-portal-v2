/**
 * Font files are fetched once while the page is idle and reused by a later capture.
 */

import { ensureFontCache, scheduleFontCache } from '@/ai-apps-bridge/font-cache';

type FontWindow = Window & {
  __plnBridgeFontCss?: { sig: string; css: string };
  __plnBridgeFontCssTask?: Promise<string | null>;
  __plnBridgeFontCssSig?: string;
};

const clearFontCache = () => {
  const host = window as FontWindow;
  delete host.__plnBridgeFontCss;
  delete host.__plnBridgeFontCssTask;
  delete host.__plnBridgeFontCssSig;
};

const fontResponse = () =>
  ({
    ok: true,
    blob: async () => new Blob(['font'], { type: 'font/woff2' }),
    text: async () => '',
  }) as Response;

const installFetch = () => {
  const fetchMock = jest.fn().mockResolvedValue(fontResponse());
  Object.defineProperty(window, 'fetch', { configurable: true, writable: true, value: fetchMock });
  return fetchMock;
};

describe('font cache', () => {
  let style: HTMLStyleElement;

  beforeEach(() => {
    clearFontCache();
    style = document.createElement('style');
    document.head.appendChild(style);
  });

  afterEach(() => {
    style.remove();
    clearFontCache();
    jest.restoreAllMocks();
  });

  it('inlines a woff2 and does not fetch the other formats of the same face', async () => {
    style.textContent =
      "@font-face { font-family: 'Test'; src: url('/fonts/a.woff') format('woff'), url('/fonts/a.woff2') format('woff2'); }";
    const fetchMock = installFetch();

    const css = await ensureFontCache();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/fonts/a.woff2');
    expect(css).toContain('data:');
    expect(css).not.toContain('/fonts/a.woff');
  });

  it('fetches each face once and reuses it while the stylesheets are unchanged', async () => {
    style.textContent = "@font-face { font-family: 'Test'; src: url('/fonts/b.woff2') format('woff2'); }";
    const fetchMock = installFetch();

    expect(await ensureFontCache()).toContain('data:');
    expect(await ensureFontCache()).toContain('data:');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not start the fetch when idle work is cancelled first', () => {
    const host = window as Window & { requestIdleCallback?: unknown };
    const idle = host.requestIdleCallback;
    delete host.requestIdleCallback;
    const fetchMock = installFetch();
    jest.useFakeTimers();
    try {
      const cancel = scheduleFontCache();
      cancel();
      jest.advanceTimersByTime(1000);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
      if (idle) host.requestIdleCallback = idle;
    }
  });
});
