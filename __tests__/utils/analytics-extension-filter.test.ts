import { isBrowserExtensionException } from '@/utils/analytics-extension-filter';

const makeException = (filenames: string[]) => ({
  $exception_list: [
    {
      type: 'TypeError',
      value: 'boom',
      stacktrace: {
        type: 'raw',
        frames: filenames.map((filename) => ({ filename, in_app: true })),
      },
    },
  ],
});

describe('isBrowserExtensionException', () => {
  it('drops an exception whose frames all come from a chrome extension', () => {
    const properties = makeException(['chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js']);
    expect(isBrowserExtensionException(properties)).toBe(true);
  });

  it('drops moz-extension and safari-web-extension frames', () => {
    expect(isBrowserExtensionException(makeException(['moz-extension://abc/content.js']))).toBe(true);
    expect(isBrowserExtensionException(makeException(['safari-web-extension://abc/content.js']))).toBe(true);
  });

  it('keeps an exception when any frame is application code', () => {
    const properties = makeException([
      'chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js',
      'https://directory.plnetwork.io/_next/static/chunk.js',
    ]);
    expect(isBrowserExtensionException(properties)).toBe(false);
  });

  it('reads the source field when filename is absent', () => {
    const properties = {
      $exception_list: [{ stacktrace: { frames: [{ source: 'moz-extension://abc/content.js' }] } }],
    };
    expect(isBrowserExtensionException(properties)).toBe(true);
  });

  it('keeps an exception that has no stack frames', () => {
    expect(isBrowserExtensionException(makeException([]))).toBe(false);
  });

  it('keeps events without an exception list', () => {
    expect(isBrowserExtensionException({})).toBe(false);
    expect(isBrowserExtensionException(undefined)).toBe(false);
  });
});
