/**
 * The capture renderer (`v1-crop.js`). The pixels are modern-screenshot's; what
 * is ours — and what is tested here — is what it is told to do: render the
 * viewport, mask what the member typed or chose and what the app opted out,
 * leave the bridge's own UI out, and put sticky/fixed elements back where they
 * are on screen.
 */

const mockDomToJpeg = jest.fn();
const mockDomToPng = jest.fn();
jest.mock('modern-screenshot', () => ({
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
  mockDomToJpeg.mockReset().mockResolvedValue('data:image/jpeg;base64,AAAA');
  mockDomToPng.mockReset().mockResolvedValue('data:image/png;base64,AAAA');
  document.body.innerHTML = '';
});

const capture = () => (window as RenderWindow).__plnBridgeCapture!();
const optionsOf = (mock: jest.Mock) => mock.mock.calls[0][1];

const box = (el: Element, rect: { top: number; left: number; width: number; height: number }) => {
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      x: rect.left,
      y: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      toJSON: () => ({}),
    }) as DOMRect;
};

describe('capture renderer', () => {
  it('renders the page at the viewport size with the page scroll applied, and reports that size', async () => {
    const result = await capture();
    const [root, options] = mockDomToJpeg.mock.calls[0];
    expect(root).toBe(document.documentElement);
    expect(options).toMatchObject({
      width: window.innerWidth,
      height: window.innerHeight,
      features: { restoreScrollPosition: true },
    });
    expect(options.style).toBeUndefined();
    expect(result).toEqual({
      dataUrl: 'data:image/jpeg;base64,AAAA',
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });

  it('leaves the bridge’s own nodes out', async () => {
    await capture();
    const { filter } = optionsOf(mockDomToJpeg);
    const outline = document.createElement('div');
    outline.setAttribute('data-pln-bridge', 'outline');
    expect(filter(outline)).toBe(false);
    expect(filter(document.createElement('div'))).toBe(true);
  });

  it('masks typed values, chosen options, editable text, and anything the app opted out', async () => {
    await capture();
    const { onCloneEachNode, onCloneNode } = optionsOf(mockDomToJpeg);

    const input = document.createElement('input');
    input.setAttribute('value', 'secret-token');
    onCloneEachNode(input);
    expect(input.getAttribute('value')).toBe('••••••••••••');

    const option = document.createElement('option');
    option.textContent = 'Salary: 120k';
    onCloneEachNode(option);
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
    const header = document.getElementById('h')!;
    const bar = document.getElementById('f')!;
    /* On screen the header is stuck at the top; in the flow it would be 107px up. */
    header.getBoundingClientRect = () => {
      const stuck = { top: 0, left: 0, width: 1000, height: 60 };
      const flow = { top: -107, left: 0, width: 1000, height: 60 };
      const r = header.style.getPropertyValue('position') === 'static' ? flow : stuck;
      return {
        ...r,
        x: r.left,
        y: r.top,
        right: r.left + r.width,
        bottom: r.top + r.height,
        toJSON: () => ({}),
      } as DOMRect;
    };
    box(bar, { top: 600, left: 0, width: 1000, height: 40 });

    let tagsDuringRender: Array<string | null> = [];
    mockDomToJpeg.mockImplementation(async (_root: Element, options: { onCloneNode: (n: Node) => void }) => {
      tagsDuringRender = [header.getAttribute('data-pln-bridge-place'), bar.getAttribute('data-pln-bridge-place')];
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      options.onCloneNode(clone);
      const h = clone.querySelector('#h') as HTMLElement;
      const f = clone.querySelector('#f') as HTMLElement;
      expect([h.style.getPropertyValue('position'), h.style.getPropertyValue('top')]).toEqual(['relative', '107px']);
      expect([f.style.getPropertyValue('position'), f.style.getPropertyValue('top')]).toEqual(['absolute', '600px']);
      return 'data:image/jpeg;base64,AAAA';
    });

    await capture();
    expect(tagsDuringRender).toEqual(['sticky:107:0', 'fixed:600:0']);
    expect(header.hasAttribute('data-pln-bridge-place')).toBe(false);
    expect(bar.hasAttribute('data-pln-bridge-place')).toBe(false);
    /* The measurement left the page's own inline style as it was. */
    expect(header.style.getPropertyValue('position')).toBe('sticky');
  });

  it('untags the page even when the render fails', async () => {
    document.body.innerHTML = '<div id="f" style="position: fixed">Bar</div>';
    const bar = document.getElementById('f')!;
    box(bar, { top: 10, left: 0, width: 100, height: 20 });
    mockDomToJpeg.mockRejectedValue(new Error('render-failed'));
    await expect(capture()).rejects.toThrow('render-failed');
    expect(bar.hasAttribute('data-pln-bridge-place')).toBe(false);
  });

  it('element crops get the wider masking too', async () => {
    const el = document.createElement('div');
    box(el, { top: 0, left: 0, width: 100, height: 40 });
    await (window as RenderWindow).__plnBridgeCrop!(el);
    expect(optionsOf(mockDomToPng)).toMatchObject({
      onCloneEachNode: expect.any(Function),
      onCloneNode: expect.any(Function),
    });
  });
});
