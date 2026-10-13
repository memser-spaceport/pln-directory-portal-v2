/**
 * The capture renderer (`v1-crop.js`). The pixels are modern-screenshot's; what
 * is ours — and what is tested here — is what it is told to do: render the
 * viewport, mask what the member typed or chose and what the app opted out,
 * leave the bridge's own UI out, put sticky/fixed elements back where they are
 * on screen, skip what is off screen, and never hold the page's thread for long.
 */

type FakeContext = Record<string, any> & { node: Node; drawImageCount: number };

const mockCreateContext = jest.fn();
const mockDestroyContext = jest.fn();
const mockDomToJpeg = jest.fn();
const mockDomToPng = jest.fn();
jest.mock('modern-screenshot', () => ({
  createContext: (...args: unknown[]) => mockCreateContext(...args),
  destroyContext: (...args: unknown[]) => mockDestroyContext(...args),
  domToJpeg: (...args: unknown[]) => mockDomToJpeg(...args),
  domToPng: (...args: unknown[]) => mockDomToPng(...args),
}));

type RenderWindow = Window & {
  __plnBridgeCapture?: () => Promise<{ dataUrl: string; width: number; height: number }>;
  __plnBridgeCrop?: (el: Element) => Promise<string>;
};

beforeAll(async () => {
  await import('@/ai-apps-bridge/crop-entry');
});

beforeEach(() => {
  mockCreateContext
    .mockReset()
    .mockImplementation(async (node: Node, options: object) => ({ node, ...options, drawImageCount: 0 }));
  mockDestroyContext.mockReset();
  mockDomToJpeg.mockReset().mockResolvedValue('data:image/jpeg;base64,AAAA');
  mockDomToPng.mockReset().mockResolvedValue('data:image/png;base64,AAAA');
  document.body.innerHTML = '';
});

afterEach(() => {
  jest.restoreAllMocks();
});

const capture = () => (window as RenderWindow).__plnBridgeCapture!();
/** What the capture asked the renderer for: the options it built its context from. */
const captureOptions = () => mockCreateContext.mock.calls[0][1];
/** Runs the render with the context the capture created. */
const renderWith = (fn: (context: FakeContext) => unknown) =>
  mockDomToJpeg.mockImplementation(async (context: FakeContext) => {
    await fn(context);
    return 'data:image/jpeg;base64,AAAA';
  });

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

describe('capture renderer', () => {
  it('renders the page at the viewport size with the page scroll applied, and reports that size', async () => {
    const result = await capture();
    const [root, options] = mockCreateContext.mock.calls[0];
    expect(root).toBe(document.documentElement);
    expect(options).toMatchObject({
      type: 'image/jpeg',
      width: window.innerWidth,
      height: window.innerHeight,
      features: { restoreScrollPosition: true },
    });
    expect(options.style).toBeUndefined();
    expect(mockDomToJpeg).toHaveBeenCalledWith(await mockCreateContext.mock.results[0].value);
    expect(mockDestroyContext).toHaveBeenCalledWith(await mockCreateContext.mock.results[0].value);
    expect(result).toEqual({
      dataUrl: 'data:image/jpeg;base64,AAAA',
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });

  it('leaves the bridge’s own nodes out', async () => {
    await capture();
    const { filter } = captureOptions();
    const outline = document.createElement('div');
    outline.setAttribute('data-pln-bridge', 'outline');
    expect(filter(outline)).toBe(false);
    expect(filter(document.createElement('div'))).toBe(true);
  });

  it('masks typed values, chosen options, editable text, and anything the app opted out', async () => {
    await capture();
    const { onCloneEachNode, onCloneNode } = captureOptions();

    const input = document.createElement('input');
    input.setAttribute('value', 'secret-token');
    void onCloneEachNode(input);
    expect(input.getAttribute('value')).toBe('••••••••••••');

    const option = document.createElement('option');
    option.textContent = 'Salary: 120k';
    void onCloneEachNode(option);
    expect(option.textContent).toBe('••••••••••••');

    const clone = document.createElement('div');
    clone.innerHTML =
      '<div contenteditable="true">Draft reply</div><div contenteditable="false">Label</div><section data-labos-mask><p>Private</p></section>';
    onCloneNode(clone);
    expect(clone.querySelector('[contenteditable="true"]')!.textContent).toBe('•••••••••••');
    expect(clone.querySelector('[contenteditable="false"]')!.textContent).toBe('Label');
    const optedOut = clone.querySelector('section') as HTMLElement;
    expect(optedOut.style.getPropertyValue('color')).toBe('transparent');
    expect((optedOut.querySelector('p') as HTMLElement).style.getPropertyValue('visibility')).toBe('hidden');
  });

  it('puts a stuck sticky header and a fixed bar back where they are on screen, then untags the page', async () => {
    document.body.innerHTML =
      '<header id="h" style="position: sticky; top: 0">Nav</header><div id="f" style="position: fixed; bottom: 0">Bar</div>';
    const header = byId('h');
    const bar = byId('f');
    /* On screen the header is stuck at the top; in the flow it would be 107px up. */
    header.getBoundingClientRect = () =>
      rectOf(
        header.style.getPropertyValue('position') === 'static'
          ? { top: -107, left: 0, width: 1000, height: 60 }
          : { top: 0, left: 0, width: 1000, height: 60 },
      );
    box(bar, { top: 600, left: 0, width: 1000, height: 40 });

    let tagsDuringRender: Array<string | null> = [];
    renderWith((context) => {
      tagsDuringRender = [header.getAttribute('data-pln-bridge-place'), bar.getAttribute('data-pln-bridge-place')];
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      context.onCloneNode(clone);
      const h = clone.querySelector('#h') as HTMLElement;
      const f = clone.querySelector('#f') as HTMLElement;
      expect([h.style.getPropertyValue('position'), h.style.getPropertyValue('top')]).toEqual(['relative', '107px']);
      expect([f.style.getPropertyValue('position'), f.style.getPropertyValue('top')]).toEqual(['absolute', '600px']);
    });

    await capture();
    expect(tagsDuringRender).toEqual(['sticky:107:0', 'fixed:600:0']);
    expect(header.hasAttribute('data-pln-bridge-place')).toBe(false);
    expect(bar.hasAttribute('data-pln-bridge-place')).toBe(false);
    /* The measurement left the page's own inline style as it was. */
    expect(header.style.getPropertyValue('position')).toBe('sticky');
  });

  it('measures a sticky inside a sticky with its ancestor stuck, so the offsets don’t add up twice', async () => {
    document.body.innerHTML =
      '<section id="outer" style="position: sticky; top: 0"><div id="inner" style="position: sticky; top: 0">Sub</div></section>';
    const outer = byId('outer');
    const inner = byId('inner');
    const isStatic = (el: HTMLElement) => el.style.getPropertyValue('position') === 'static';
    /* Each is stuck 50px below its place in the flow; the inner's box carries the outer's offset. */
    outer.getBoundingClientRect = () => rectOf({ top: isStatic(outer) ? -50 : 0, left: 0, width: 1000, height: 80 });
    let outerStaticWhileInnerMeasured = false;
    inner.getBoundingClientRect = () => {
      if (isStatic(inner) && isStatic(outer)) outerStaticWhileInnerMeasured = true;
      return rectOf({
        top: (isStatic(outer) ? -50 : 0) + (isStatic(inner) ? -50 : 0),
        left: 0,
        width: 1000,
        height: 30,
      });
    };

    let tags: Array<string | null> = [];
    renderWith(() => {
      tags = [outer.getAttribute('data-pln-bridge-place'), inner.getAttribute('data-pln-bridge-place')];
    });
    await capture();

    expect(outerStaticWhileInnerMeasured).toBe(false);
    expect(tags).toEqual(['sticky:50:0', 'sticky:50:0']);
  });

  it('untags the page and releases the renderer even when the render fails', async () => {
    document.body.innerHTML = '<div id="f" style="position: fixed">Bar</div><div id="off">Below</div>';
    box(byId('f'), { top: 10, left: 0, width: 100, height: 20 });
    box(byId('off'), BELOW);
    mockDomToJpeg.mockRejectedValue(new Error('render-failed'));
    await expect(capture()).rejects.toThrow('render-failed');
    expect(document.querySelector('[data-pln-bridge-place], [data-pln-bridge-shell]')).toBeNull();
    expect(mockDestroyContext).toHaveBeenCalledTimes(1);
  });

  describe('drawing only what is on screen', () => {
    it('draws an off-screen block as an empty box: kept itself, its contents skipped', async () => {
      document.body.innerHTML =
        '<main id="main"><p id="on">Seen</p><section id="off"><p id="deep">Unseen</p></section></main>';
      box(byId('on'), ON_SCREEN);
      box(byId('off'), BELOW);
      box(byId('deep'), BELOW);
      await capture();
      const { filter } = captureOptions();

      expect(filter(byId('main'))).toBe(true);
      expect(filter(byId('on'))).toBe(true);
      expect(filter(byId('on').firstChild)).toBe(true);
      expect(filter(byId('off'))).toBe(true);
      expect(filter(byId('deep'))).toBe(false);
    });

    it('keeps the way to anything on screen, like a fixed modal declared inside an off-screen container', async () => {
      document.body.innerHTML = '<div id="wrap"><div id="modal" style="position: fixed">Dialog</div></div>';
      box(byId('wrap'), BELOW);
      box(byId('modal'), { top: 200, left: 200, width: 300, height: 100 });
      let tag: string | null = null;
      renderWith(() => {
        tag = byId('modal').getAttribute('data-pln-bridge-place');
      });
      await capture();
      const { filter } = captureOptions();

      expect(filter(byId('wrap'))).toBe(true);
      expect(filter(byId('modal'))).toBe(true);
      expect(filter(byId('modal').firstChild)).toBe(true);
      expect(tag).toBe(`fixed:${200 + window.scrollY}:${200 + window.scrollX}`);
    });

    it('never empties inline content or a `display: contents` wrapper — their children still lay out the line', async () => {
      /* Inline display spelled out: jsdom has no browser default style sheet. */
      document.body.innerHTML =
        '<p id="on">Start <span id="inline" style="display: inline">off <b id="bold">screen</b></span><span id="contents" style="display: contents"><i id="italic">x</i></span></p>';
      box(byId('on'), ON_SCREEN);
      await capture();
      const { filter } = captureOptions();

      expect(filter(byId('bold'))).toBe(true);
      expect(filter(byId('italic'))).toBe(true);
    });

    it('keeps the inside of a drawing whole when it holds ids another drawing may point at', async () => {
      document.body.innerHTML =
        '<svg id="defs"><defs><linearGradient id="g"></linearGradient></defs></svg><svg id="plain"><rect class="bar"></rect></svg>';
      box(byId('defs'), BELOW);
      box(byId('plain'), BELOW);
      await capture();
      const { filter } = captureOptions();

      expect(filter(byId('defs').firstElementChild!)).toBe(true);
      expect(filter(byId('plain').querySelector('rect')!)).toBe(false);
    });

    it('skips the shadow tree of an off-screen host, and keeps the one of a host on screen', async () => {
      document.body.innerHTML = '<div id="offHost"></div><div id="onHost"></div>';
      box(byId('offHost'), BELOW);
      box(byId('onHost'), ON_SCREEN);
      const offRoot = byId('offHost').attachShadow({ mode: 'open' });
      offRoot.innerHTML = '<p>Unseen</p>';
      const onRoot = byId('onHost').attachShadow({ mode: 'open' });
      onRoot.innerHTML = '<p>Seen</p>';
      await capture();
      const { filter } = captureOptions();

      expect(filter(offRoot.firstChild)).toBe(false);
      expect(filter(onRoot.firstChild)).toBe(true);
    });

    it('holds each empty box at the size it had, then untags the page', async () => {
      document.body.innerHTML = '<p id="on">Seen</p><section id="off"><p>Unseen</p></section>';
      box(byId('on'), ON_SCREEN);
      box(byId('off'), BELOW);
      let taggedDuringRender = false;
      renderWith((context) => {
        taggedDuringRender = byId('off').hasAttribute('data-pln-bridge-shell');
        const clone = document.documentElement.cloneNode(true) as HTMLElement;
        const offClone = clone.querySelector('#off') as HTMLElement;
        /* What the renderer copies onto every element: its used size. */
        offClone.style.width = '300px';
        offClone.style.height = '120px';
        context.onCloneNode(clone);
        expect(offClone.style.getPropertyValue('flex')).toBe('0 0 auto');
        expect(offClone.style.getPropertyValue('min-width')).toBe('300px');
        expect(offClone.style.getPropertyValue('min-height')).toBe('120px');
        expect(offClone.hasAttribute('data-pln-bridge-shell')).toBe(false);
        expect((clone.querySelector('#on') as HTMLElement).style.getPropertyValue('flex')).toBe('');
      });

      await capture();
      expect(taggedDuringRender).toBe(true);
      expect(byId('off').hasAttribute('data-pln-bridge-shell')).toBe(false);
    });
  });

  describe('keeping the page responsive', () => {
    it('gives up with too-slow past its budget, and leaves the page as it was', async () => {
      document.body.innerHTML = '<section id="off">Below</section>';
      box(byId('off'), BELOW);
      let now = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => now);
      renderWith(async (context) => {
        now = 60_000;
        await context.onCloneEachNode(document.createElement('div'));
      });

      await expect(capture()).rejects.toThrow('too-slow');
      expect(mockDestroyContext).toHaveBeenCalledTimes(1);
      expect(document.querySelector('[data-pln-bridge-shell]')).toBeNull();
    });

    it('lets the page paint between slices of a render that is still within budget', async () => {
      let now = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => now);
      let yielded: unknown;
      renderWith(async (context) => {
        now = 20;
        yielded = context.onCloneEachNode(document.createElement('div'));
        await yielded;
      });

      await capture();
      expect(yielded).toBeInstanceOf(Promise);
    });

    it('caps the Safari/Firefox redraws of the finished picture', async () => {
      renderWith((context) => {
        context.drawImageCount = 40;
        context.onEmbedNode(document.documentElement);
        expect(context.drawImageCount).toBe(3);
        context.drawImageCount = 2;
        context.onEmbedNode(document.documentElement);
        expect(context.drawImageCount).toBe(2);
      });
      await capture();
      expect.assertions(2);
    });

    it('answers a capture asked for while one is under way with the same render', async () => {
      let finish: (value: string) => void = () => {};
      mockDomToJpeg.mockImplementation(() => new Promise<string>((resolve) => (finish = resolve)));
      const first = capture();
      const second = capture();
      await Promise.resolve();
      await Promise.resolve();
      finish('data:image/jpeg;base64,AAAA');
      expect(await second).toEqual(await first);
      expect(mockCreateContext).toHaveBeenCalledTimes(1);

      mockDomToJpeg.mockResolvedValue('data:image/jpeg;base64,BBBB');
      expect((await capture()).dataUrl).toBe('data:image/jpeg;base64,BBBB');
      expect(mockCreateContext).toHaveBeenCalledTimes(2);
    });
  });

  it('element crops get the wider masking too', async () => {
    const el = document.createElement('div');
    box(el, { top: 0, left: 0, width: 100, height: 40 });
    await (window as RenderWindow).__plnBridgeCrop!(el);
    expect(mockDomToPng.mock.calls[0][1]).toMatchObject({
      onCloneEachNode: expect.any(Function),
      onCloneNode: expect.any(Function),
    });
  });
});
