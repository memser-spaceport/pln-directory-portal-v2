import { act, renderHook } from '@testing-library/react';
import { BRIDGE_NS, BRIDGE_VERSION, LIMITS } from '@/ai-apps-bridge/protocol';
import {
  BRIDGE_READY_TIMEOUT_MS,
  CAPTURE_TIMEOUT_MS,
  ELEMENT_PINS_ATTR,
  pinsHtml,
  serializePins,
  useElementPins,
  type ElementPin,
} from '@/components/page/ai-apps/components/element-pins';
import { sanitizeAiAppFeedbackHtml } from '@/utils/html/sanitizeAiAppFeedbackHtml';

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onFeedbackPinAdded: jest.fn(),
    onFeedbackPinRemoved: jest.fn(),
    onFeedbackPinDetached: jest.fn(),
    onFeedbackPinCropFailed: jest.fn(),
    onFeedbackBridgeUnavailable: jest.fn(),
  }),
}));

const APP = 'https://demo.os.pl.xyz';

function setup() {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const appWindow = iframe.contentWindow as Window;
  const toApp: any[] = [];
  jest.spyOn(appWindow, 'postMessage').mockImplementation(((data: any, origin: string) => {
    expect(origin).toBe(APP);
    toApp.push(data);
  }) as any);
  const iframeRef = { current: iframe };
  const hook = renderHook(() =>
    useElementPins({ iframeRef, appOrigin: APP, frameKey: 'gen-1', enabled: true, appUid: 'app-1' }),
  );
  const fromApp = (type: string, payload?: unknown, { origin = APP, source = appWindow } = {}) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { ns: BRIDGE_NS, v: BRIDGE_VERSION, id: 'm', type, payload },
          origin,
          source,
        }),
      );
    });
  return { hook, fromApp, toApp, appWindow, cleanup: () => iframe.remove() };
}

const descriptor = (overrides: Record<string, unknown> = {}) => ({
  selector: '#save',
  tag: 'button',
  text: 'Save',
  html: '<button id="save">Save</button>',
  role: null,
  ariaLabel: null,
  component: 'SaveButton',
  source: null,
  rect: { x: 1, y: 2, w: 3, h: 4 },
  page: { path: '/settings', title: 'Settings', viewportW: 800, viewportH: 600 },
  ...overrides,
});

describe('useElementPins', () => {
  afterEach(() => jest.useRealTimers());

  it('turns on only after the app says ready — from the app origin and the app window', () => {
    const t = setup();
    expect(t.hook.result.current.status).toBe('waiting');
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' }, { origin: 'https://evil.example' });
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' }, { source: window });
    expect(t.hook.result.current.status).toBe('waiting');
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' });
    expect(t.hook.result.current.status).toBe('ready');
    t.cleanup();
  });

  it('replays Alt+F pressed inside the app as the same key on this window', () => {
    const t = setup();
    const onKey = jest.fn();
    window.addEventListener('keydown', onKey);

    t.fromApp('shortcut:feedback');
    t.fromApp('shortcut:feedback', undefined, { origin: 'https://evil.example' });

    expect(onKey).toHaveBeenCalledTimes(1);
    expect(onKey.mock.calls[0][0]).toMatchObject({ code: 'KeyF', altKey: true });
    window.removeEventListener('keydown', onKey);
    t.cleanup();
  });

  it('falls back to screenshots when a loaded frame never answers', () => {
    jest.useFakeTimers();
    const t = setup();
    act(() => t.hook.result.current.onFrameLoad());
    /* One on subscribe (the frame may have announced itself already), one on load. */
    expect(t.toApp.map((m) => m.type)).toEqual(['hello', 'hello']);
    act(() => jest.advanceTimersByTime(BRIDGE_READY_TIMEOUT_MS));
    expect(t.hook.result.current.status).toBe('unavailable');
    t.cleanup();
  });

  it('adds a pin from a pick, asks for its crop, and caps what the app sent', () => {
    const t = setup();
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' });
    act(() => t.hook.result.current.startPicking());
    expect(t.toApp.at(-1)).toMatchObject({ type: 'pick:start', ns: BRIDGE_NS });

    t.fromApp('pick:selected', { pinId: 'pin-1', element: descriptor({ text: 'x'.repeat(10_000) }) });
    const [pin] = t.hook.result.current.pins;
    expect(pin.element.text).toHaveLength(LIMITS.text);
    expect(pin.crop.status).toBe('pending');
    expect(t.hook.result.current.isPicking).toBe(false);
    expect(t.toApp.at(-1)).toMatchObject({ type: 'crop', payload: { pinId: 'pin-1' } });
    t.cleanup();
  });

  it('keeps where in the element the member clicked, and drops a point that is not inside it', () => {
    const t = setup();
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' });
    t.fromApp('pick:selected', { pinId: 'pin-1', element: descriptor(), point: { ox: 0.25, oy: 0.75 } });
    t.fromApp('pick:selected', { pinId: 'pin-2', element: descriptor(), point: { ox: 1.5, oy: 0.5 } });
    t.fromApp('pick:selected', { pinId: 'pin-3', element: descriptor() });
    expect(t.hook.result.current.pins.map((p) => p.point)).toEqual([{ ox: 0.25, oy: 0.75 }, null, null]);
    t.cleanup();
  });

  it('drops malformed picks and crops that are not raster images', () => {
    const t = setup();
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' });
    t.fromApp('pick:selected', { pinId: 'pin-1', element: descriptor({ selector: 42 }) });
    t.fromApp('pick:selected', { pinId: '../../x', element: descriptor() });
    expect(t.hook.result.current.pins).toHaveLength(0);

    t.fromApp('pick:selected', { pinId: 'pin-2', element: descriptor() });
    t.fromApp('crop:result', { pinId: 'pin-2', dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' });
    expect(t.hook.result.current.pins[0].crop).toEqual({ status: 'failed', error: 'invalid' });
    t.cleanup();
  });

  it('marks a pin detached when the app reports its element gone, keeping the note', () => {
    const t = setup();
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' });
    t.fromApp('pick:selected', { pinId: 'pin-1', element: descriptor() });
    act(() => t.hook.result.current.setNote('pin-1', 'Too small'));
    t.fromApp('pins:rects', { rects: { 'pin-1': null } });
    expect(t.hook.result.current.pins[0]).toMatchObject({ rect: null, note: 'Too small' });
    t.cleanup();
  });

  it('a ready from a NEW page load detaches every pin; an echo of hello changes nothing', () => {
    const t = setup();
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' });
    t.fromApp('pick:selected', { pinId: 'pin-1', element: descriptor() });
    act(() => t.hook.result.current.startPicking());
    t.fromApp('ready', { capabilities: ['pick'], session: 's1' });
    expect(t.hook.result.current.isPicking).toBe(true);
    expect(t.hook.result.current.pins[0].rect).not.toBeNull();

    t.fromApp('ready', { capabilities: ['pick'], session: 's2' });
    expect(t.hook.result.current.isPicking).toBe(false);
    expect(t.hook.result.current.pins[0].rect).toBeNull();
    t.cleanup();
  });

  describe('capture()', () => {
    const CAPABLE = { capabilities: ['pick', 'crop', 'capture'], session: 's1' };
    const JPEG = 'data:image/jpeg;base64,AAAA';
    const sentKey = (t: ReturnType<typeof setup>) => t.toApp.filter((m) => m.type === 'capture').at(-1)?.payload.key;

    it('asks the bridge and resolves with the picture its answer carries', async () => {
      const t = setup();
      t.fromApp('ready', CAPABLE);
      expect(t.hook.result.current.canCapture).toBe(true);
      let shot: Promise<unknown> = Promise.resolve();
      act(() => {
        shot = t.hook.result.current.capture();
      });
      const key = sentKey(t);
      expect(key).toMatch(/^cap-\d+$/);
      t.fromApp('capture:result', { key, dataUrl: JPEG, width: 1280, height: 720 });
      await expect(shot).resolves.toEqual({ dataUrl: JPEG, width: 1280, height: 720 });
      t.cleanup();
    });

    it('rejects at once as unsupported when the bridge is older than capture, or not ready', async () => {
      const t = setup();
      await expect(t.hook.result.current.capture()).rejects.toMatchObject({ reason: 'unsupported' });
      t.fromApp('ready', { capabilities: ['pick', 'crop'], session: 's1' });
      expect(t.hook.result.current.canCapture).toBe(false);
      await expect(t.hook.result.current.capture()).rejects.toMatchObject({ reason: 'unsupported' });
      expect(t.toApp.some((m) => m.type === 'capture')).toBe(false);
      t.cleanup();
    });

    it('passes the bridge’s error on, and refuses a picture that isn’t a raster or has no size', async () => {
      const t = setup();
      t.fromApp('ready', CAPABLE);
      let first: Promise<unknown> = Promise.resolve();
      act(() => {
        first = t.hook.result.current.capture();
      });
      t.fromApp('capture:result', { key: sentKey(t), error: 'too-large' });
      await expect(first).rejects.toMatchObject({ reason: 'too-large' });

      let second: Promise<unknown> = Promise.resolve();
      act(() => {
        second = t.hook.result.current.capture();
      });
      t.fromApp('capture:result', {
        key: sentKey(t),
        dataUrl: 'data:image/svg+xml;base64,AAAA',
        width: 10,
        height: 10,
      });
      await expect(second).rejects.toMatchObject({ reason: 'invalid' });
      t.cleanup();
    });

    it('ignores answers it never asked for, and fails a pending capture when the app reloads', async () => {
      const t = setup();
      t.fromApp('ready', CAPABLE);
      let shot: Promise<unknown> = Promise.resolve();
      act(() => {
        shot = t.hook.result.current.capture();
      });
      t.fromApp('capture:result', { key: 'cap-999', dataUrl: JPEG, width: 1, height: 1 });
      t.fromApp(
        'capture:result',
        { key: sentKey(t), dataUrl: JPEG, width: 1, height: 1 },
        { origin: 'https://evil.example' },
      );
      t.fromApp('ready', { ...CAPABLE, session: 's2' });
      await expect(shot).rejects.toMatchObject({ reason: 'reloaded' });
      t.cleanup();
    });

    it('times out when the bridge never answers', async () => {
      jest.useFakeTimers();
      try {
        const t = setup();
        t.fromApp('ready', CAPABLE);
        let shot: Promise<unknown> = Promise.resolve();
        act(() => {
          shot = t.hook.result.current.capture();
        });
        const settled = expect(shot).rejects.toMatchObject({ reason: 'timeout' });
        act(() => void jest.advanceTimersByTime(CAPTURE_TIMEOUT_MS));
        await settled;
        t.cleanup();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('scrollApp() (a wheel over Pick a part’s layer)', () => {
    it('sends the wheel to the app only once its bridge says it can scroll', () => {
      const t = setup();
      act(() => t.hook.result.current.scrollApp(10, 20, 0, 120));
      t.fromApp('ready', { capabilities: ['pick', 'capture'], session: 's1' });
      expect(t.hook.result.current.canScroll).toBe(false);
      act(() => t.hook.result.current.scrollApp(10, 20, 0, 120));
      expect(t.toApp.some((m) => m.type === 'scroll')).toBe(false);

      t.fromApp('ready', { capabilities: ['pick', 'capture', 'scroll'], session: 's1' });
      expect(t.hook.result.current.canScroll).toBe(true);
      act(() => t.hook.result.current.scrollApp(10, 20, 0, 120));
      expect(t.toApp.filter((m) => m.type === 'scroll')).toEqual([
        expect.objectContaining({ ns: BRIDGE_NS, payload: { x: 10, y: 20, dx: 0, dy: 120 } }),
      ]);
      t.cleanup();
    });
  });
});

describe('pinsHtml', () => {
  const pin = (note: string, overrides: Partial<ElementPin> = {}): ElementPin => ({
    id: 'pin-1',
    element: descriptor() as ElementPin['element'],
    rect: { x: 1, y: 2, w: 3, h: 4 },
    note,
    crop: { status: 'pending' },
    point: null,
    ...overrides,
  });

  it('survives the feedback sanitizer with its data, and never lets a note become markup', () => {
    const html = sanitizeAiAppFeedbackHtml(
      pinsHtml([pin('<img src=x onerror=alert(1)> too small')], ['https://img/1.png']),
    );
    /* The note may appear as inert text or attribute value; what must not
       exist is an element or a handler built from it. */
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    expect(tpl.content.querySelectorAll('img')).toHaveLength(1);
    expect(tpl.content.querySelector('[onerror]')).toBeNull();
    expect(tpl.content.querySelector('li strong')!.textContent).toBe('<img src=x onerror=alert(1)> too small');
    const encoded = html.match(new RegExp(`${ELEMENT_PINS_ATTR}="([^"]+)"`))![1];
    const data = JSON.parse(decodeURIComponent(encoded.replace(/&amp;/g, '&')));
    expect(data.pins[0]).toMatchObject({ n: 1, selector: '#save', component: 'SaveButton', crop: 'https://img/1.png' });
    expect(tpl.content.querySelector('img')!.getAttribute('alt')).toBe('Pin 1: <img src=x onerror=alert(1)> too small');
  });

  it('drops the html excerpts first when the payload would crowd out the rest of the feedback', () => {
    const big = Array.from({ length: LIMITS.pins }, (_, i) =>
      pin('n', {
        id: `pin-${i}`,
        element: descriptor({ html: '<div class="a">'.repeat(125) }) as ElementPin['element'],
      }),
    );
    const data = JSON.parse(decodeURIComponent(serializePins(big, [])));
    expect(data.pins).toHaveLength(LIMITS.pins);
    expect(data.pins[0].html).toBeUndefined();
    expect(data.pins[0].selector).toBe('#save');
  });
});
