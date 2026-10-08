/**
 * The list-page capture. The pixels are modern-screenshot's; what is tested
 * here is what it is told to do: the viewport, the feedback chrome left out,
 * and sticky/fixed bars put back where they sit on screen.
 */

import {
  capturePageViewport,
  FEEDBACK_CAPTURE_IGNORE_ATTR,
} from '@/components/page/ai-apps/components/screenshot-feedback/capturePage';

type FakeContext = Record<string, any> & { node: Node; drawImageCount: number };

const mockCreateContext = jest.fn();
const mockDestroyContext = jest.fn();
const mockDomToJpeg = jest.fn();
jest.mock('modern-screenshot', () => ({
  createContext: (...args: unknown[]) => mockCreateContext(...args),
  destroyContext: (...args: unknown[]) => mockDestroyContext(...args),
  domToJpeg: (...args: unknown[]) => mockDomToJpeg(...args),
}));

beforeEach(() => {
  window.dispatchEvent(new Event('resize'));
  const host = window as Window & {
    __plnBridgeFontCss?: unknown;
    __plnBridgeFontCssTask?: unknown;
    __plnBridgeFontCssSig?: unknown;
  };
  delete host.__plnBridgeFontCss;
  delete host.__plnBridgeFontCssTask;
  delete host.__plnBridgeFontCssSig;
  mockCreateContext
    .mockReset()
    .mockImplementation(async (node: Node, options: object) => ({ node, ...options, drawImageCount: 0 }));
  mockDestroyContext.mockReset();
  mockDomToJpeg.mockReset().mockResolvedValue('data:image/jpeg;base64,AAAA');
  document.body.innerHTML = '';
});

afterEach(() => {
  jest.restoreAllMocks();
});

const captureOptions = () => mockCreateContext.mock.calls[0][1];

const rectOf = (r: { top: number; left: number; width: number; height: number }) =>
  ({
    ...r,
    x: r.left,
    y: r.top,
    right: r.left + r.width,
    bottom: r.top + r.height,
    toJSON: () => ({}),
  }) as DOMRect;

const box = (el: Element, rect: { top: number; left: number; width: number; height: number }) => {
  el.getBoundingClientRect = () => rectOf(rect);
};
const ON_SCREEN = { top: 10, left: 10, width: 100, height: 20 };
const BELOW = { top: 5000, left: 10, width: 100, height: 20 };
const byId = (id: string) => document.getElementById(id)!;

describe('capturePageViewport', () => {
  it('renders the window at its size, with the page scroll restored', async () => {
    const result = await capturePageViewport();
    const [root, options] = mockCreateContext.mock.calls[0];
    expect(root).toBe(document.documentElement);
    expect(options).toMatchObject({
      type: 'image/jpeg',
      width: window.innerWidth,
      height: window.innerHeight,
      features: { restoreScrollPosition: true, copyScrollbar: false },
    });
    expect(result).toEqual({
      dataUrl: 'data:image/jpeg;base64,AAAA',
      width: window.innerWidth,
      height: window.innerHeight,
    });
    expect(mockDestroyContext).toHaveBeenCalled();
  });

  it('reuses the picture while the viewport is unchanged, and draws again when the page changes', async () => {
    await capturePageViewport();
    expect(mockCreateContext).toHaveBeenCalledTimes(1);
    mockDomToJpeg.mockResolvedValue('data:image/jpeg;base64,BBBB');

    const ui = document.createElement('div');
    ui.setAttribute('data-feedback-capture-ignore', '');
    ui.textContent = 'drawer';
    document.body.appendChild(ui);
    await Promise.resolve();
    expect((await capturePageViewport()).dataUrl).toBe('data:image/jpeg;base64,AAAA');
    expect(mockCreateContext).toHaveBeenCalledTimes(1);

    document.body.appendChild(document.createElement('p'));
    await Promise.resolve();
    expect((await capturePageViewport()).dataUrl).toBe('data:image/jpeg;base64,BBBB');
    expect(mockCreateContext).toHaveBeenCalledTimes(2);
  });

  it('leaves out a node marked to ignore, and anything inside it', async () => {
    await capturePageViewport();
    const { filter } = captureOptions();

    const drawer = document.createElement('div');
    drawer.setAttribute(FEEDBACK_CAPTURE_IGNORE_ATTR, '');
    const button = document.createElement('button');
    drawer.appendChild(button);
    document.body.appendChild(drawer);

    expect(filter(drawer)).toBe(false);
    expect(filter(button)).toBe(false);
    expect(filter(document.createElement('p'))).toBe(true);
  });

  it('puts a sticky header back where it sits on screen', async () => {
    document.body.innerHTML = '<header id="h" style="position: sticky; top: 0">Nav</header>';
    const header = document.getElementById('h') as HTMLElement;
    header.getBoundingClientRect = () =>
      rectOf(
        header.style.getPropertyValue('position') === 'static'
          ? { top: -40, left: 0, width: 200, height: 40 }
          : { top: 0, left: 0, width: 200, height: 40 },
      );

    mockDomToJpeg.mockImplementation(async (context: FakeContext) => {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      context.onCloneNode(clone);
      const h = clone.querySelector('#h') as HTMLElement;
      expect(h.style.getPropertyValue('position')).toBe('relative');
      expect(h.style.getPropertyValue('top')).toBe('40px');
      return 'data:image/jpeg;base64,AAAA';
    });

    await capturePageViewport();
    expect(header.hasAttribute('data-feedback-capture-place')).toBe(false);
    expect(header.style.getPropertyValue('position')).toBe('sticky');
  });

  it('keeps a block above the viewport as an empty box and skips what is inside it', async () => {
    document.body.innerHTML = '<section id="above"><p id="old">Earlier</p></section><p id="on">Seen</p>';
    box(byId('above'), { top: -400, left: 0, width: 800, height: 200 });
    box(byId('old'), { top: -300, left: 0, width: 100, height: 20 });
    box(byId('on'), ON_SCREEN);
    mockDomToJpeg.mockImplementation(async (context: FakeContext) => {
      expect(context.filter(byId('above'))).toBe(true);
      expect(context.filter(byId('old'))).toBe(false);
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      const above = clone.querySelector('#above') as HTMLElement;
      above.style.width = '800px';
      above.style.height = '200px';
      context.onCloneNode(clone);
      expect(above.style.getPropertyValue('flex')).toBe('0 0 auto');
      expect(above.style.getPropertyValue('min-height')).toBe('200px');
      expect(above.hasAttribute('data-feedback-capture-shell')).toBe(false);
      return 'data:image/jpeg;base64,AAAA';
    });
    await capturePageViewport();
    expect(byId('above').hasAttribute('data-feedback-capture-shell')).toBe(false);
  });

  it('still finds a fixed element nested two wrappers below the viewport', async () => {
    document.body.innerHTML =
      '<div id="wrap"><div id="inner"><div id="modal" style="position: fixed">Dialog</div></div></div>';
    box(byId('wrap'), BELOW);
    box(byId('inner'), BELOW);
    box(byId('modal'), { top: 200, left: 200, width: 300, height: 100 });
    let tag: string | null = null;
    mockDomToJpeg.mockImplementation(async () => {
      tag = byId('modal').getAttribute('data-feedback-capture-place');
      return 'data:image/jpeg;base64,AAAA';
    });
    await capturePageViewport();
    expect(tag).toBe(`fixed:${200 + window.scrollY}:${200 + window.scrollX}`);
  });

  it('does not measure inside a long block that sits fully below', async () => {
    const items = Array.from({ length: 40 }, (_, i) => `<li><span id="s${i}">x</span></li>`).join('');
    document.body.innerHTML = `<ul id="list">${items}</ul>`;
    box(byId('list'), BELOW);
    let measured = false;
    byId('s0').getBoundingClientRect = () => {
      measured = true;
      return rectOf(BELOW);
    };
    await capturePageViewport();
    expect(measured).toBe(false);
  });

  it('detaches an unloaded image that sits fully off screen, then puts it back', async () => {
    document.body.innerHTML = '<img id="off" alt=""><img id="on" alt="">';
    const off = byId('off') as HTMLImageElement;
    const on = byId('on') as HTMLImageElement;
    box(off, BELOW);
    box(on, ON_SCREEN);
    Object.defineProperty(off, 'complete', { configurable: true, get: () => false });
    Object.defineProperty(on, 'complete', { configurable: true, get: () => false });
    let offConnected: boolean | null = null;
    let onConnected: boolean | null = null;
    mockCreateContext.mockImplementation(async (node: Node, options: object) => {
      offConnected = off.isConnected;
      onConnected = on.isConnected;
      return { node, ...options, drawImageCount: 0 };
    });
    await capturePageViewport();
    expect(offConnected).toBe(false);
    expect(onConnected).toBe(true);
    expect(off.isConnected).toBe(true);
    expect(on.isConnected).toBe(true);
  });

  it('gives the renderer font files that were already prepared', async () => {
    const style = document.createElement('style');
    style.textContent = "@font-face { font-family: 'Test'; src: url('/fonts/page.woff2') format('woff2'); }";
    document.head.appendChild(style);
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['font'], { type: 'font/woff2' }),
      } as Response),
    });
    try {
      await capturePageViewport();
      expect(captureOptions().font.cssText).toContain('data:');
    } finally {
      style.remove();
    }
  });
});
