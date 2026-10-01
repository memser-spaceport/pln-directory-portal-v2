import { act, renderHook } from '@testing-library/react';
import { BRIDGE_NS, BRIDGE_VERSION } from '@/ai-apps-bridge/protocol';
import {
  normalizeAppPath,
  pinsHtml,
  toPinInputs,
  useFeedbackOverlay,
  type ElementPin,
} from '@/components/page/ai-apps/components/element-pins';
import { toPinId } from '@/components/page/ai-apps/components/element-pins/validate';
import type { OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';

const APP = 'https://demo.os.pl.xyz';

const stored = (uid: string, overrides: Partial<OverlayFeedbackPin> = {}): OverlayFeedbackPin => ({
  uid,
  feedbackUid: `fb-${uid}`,
  n: 1,
  env: 'prod',
  pagePath: '/pins',
  pageQuery: null,
  selector: `#${uid}`,
  tag: 'button',
  text: `Text ${uid}`,
  role: null,
  ariaLabel: null,
  component: null,
  source: null,
  rect: { x: 1, y: 2, w: 3, h: 4 },
  viewportW: 800,
  viewportH: 600,
  note: `Note ${uid}`,
  cropUrl: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  feedback: { uid: `fb-${uid}`, status: 'NEW', createdAt: '2026-10-01T00:00:00.000Z', member: null },
  ...overrides,
});

type Props = { active: boolean; pins: OverlayFeedbackPin[]; currentPath: string | null; frameKey?: string };

function setup(initial: Props) {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const appWindow = iframe.contentWindow as Window;
  const toApp: any[] = [];
  jest.spyOn(appWindow, 'postMessage').mockImplementation(((data: any, origin: string) => {
    expect(origin).toBe(APP);
    toApp.push(data);
  }) as any);
  const iframeRef = { current: iframe };
  const hook = renderHook(
    ({ active, pins, currentPath, frameKey = 'gen-1' }: Props) =>
      useFeedbackOverlay({ iframeRef, appOrigin: APP, frameKey, listening: true, active, pins, currentPath }),
    { initialProps: initial },
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
  const sent = (type: string) => toApp.filter((m) => m.type === type);
  return { hook, fromApp, toApp, sent, cleanup: () => iframe.remove() };
}

const READY = { capabilities: ['pick', 'describe', 'crop', 'locate'], session: 's1' };

describe('useFeedbackOverlay', () => {
  it('asks the bridge for this page’s pins only, and lists the rest under their pages', () => {
    const pins = [stored('a'), stored('b', { pagePath: '/other' }), stored('c', { pagePath: '/pins/' })];
    const t = setup({ active: true, pins, currentPath: '/pins?tab=1' });
    t.fromApp('ready', READY);

    const [locate] = t.sent('locate');
    expect(locate.payload.requests).toEqual([
      { key: 'a', selector: '#a', tag: 'button', text: 'Text a' },
      { key: 'c', selector: '#c', tag: 'button', text: 'Text c' },
    ]);
    expect([...t.hook.result.current.otherPages.keys()]).toEqual(['/other']);
    expect(t.hook.result.current.pending.map((p) => p.uid)).toEqual(['a', 'c']);
    t.cleanup();
  });

  it('places what the bridge found and lists what it could not find, with its crop kept', () => {
    const t = setup({ active: true, pins: [stored('a'), stored('b')], currentPath: '/pins' });
    t.fromApp('ready', READY);
    t.fromApp('locate:result', { results: { a: { pinId: 'loc-1', rect: { x: 10, y: 20, w: 30, h: 40 } }, b: null } });

    const { placed, notFound, pending } = t.hook.result.current;
    expect(placed).toEqual([
      { pin: expect.objectContaining({ uid: 'a' }), pinId: 'loc-1', rect: { x: 10, y: 20, w: 30, h: 40 } },
    ]);
    expect(notFound.map((p) => p.uid)).toEqual(['b']);
    expect(pending).toEqual([]);
    t.cleanup();
  });

  it('moves a placed pin with the page', () => {
    const t = setup({ active: true, pins: [stored('a')], currentPath: '/pins' });
    t.fromApp('ready', READY);
    t.fromApp('locate:result', { results: { a: { pinId: 'loc-1', rect: { x: 10, y: 20, w: 30, h: 40 } } } });
    t.fromApp('pins:rects', { rects: { 'loc-1': { x: 10, y: -80, w: 30, h: 40 } } });
    expect(t.hook.result.current.placed[0].rect).toEqual({ x: 10, y: -80, w: 30, h: 40 });
    t.cleanup();
  });

  it('ignores answers to an older request, and results from anywhere but the app', () => {
    const t = setup({ active: true, pins: [stored('a')], currentPath: '/pins' });
    t.fromApp('ready', READY);
    t.fromApp('locate:result', { results: { a: null } }, { origin: 'https://evil.example' });
    expect(t.hook.result.current.pending.map((p) => p.uid)).toEqual(['a']);

    /* The member navigated: the overlay now wants another page's pins. */
    t.hook.rerender({ active: true, pins: [stored('a'), stored('z', { pagePath: '/z' })], currentPath: '/z' });
    t.fromApp('locate:result', { results: { a: { pinId: 'loc-1', rect: { x: 1, y: 1, w: 1, h: 1 } } } });
    expect(t.hook.result.current.placed).toEqual([]);
    t.cleanup();
  });

  it('after being turned off and on, waits for fresh answers instead of reusing old placements', () => {
    const t = setup({ active: true, pins: [stored('a')], currentPath: '/pins' });
    t.fromApp('ready', READY);
    t.fromApp('locate:result', { results: { a: { pinId: 'loc-1', rect: { x: 1, y: 1, w: 1, h: 1 } } } });
    t.hook.rerender({ active: false, pins: [stored('a')], currentPath: '/pins' });
    t.hook.rerender({ active: true, pins: [stored('a')], currentPath: '/pins' });
    /* loc-1 was unwatched when the overlay went off; showing it would draw a frozen marker. */
    expect(t.hook.result.current.placed).toEqual([]);
    expect(t.hook.result.current.pending.map((p) => p.uid)).toEqual(['a']);
    t.cleanup();
  });

  it('stops tracking its pins when turned off, never the picker’s', () => {
    const t = setup({ active: true, pins: [stored('a')], currentPath: '/pins' });
    t.fromApp('ready', READY);
    t.fromApp('locate:result', { results: { a: { pinId: 'loc-7', rect: { x: 1, y: 1, w: 1, h: 1 } } } });
    t.hook.rerender({ active: false, pins: [stored('a')], currentPath: '/pins' });
    expect(t.sent('pins:unwatch').at(-1).payload.pinIds).toEqual(['loc-7']);
    expect(t.hook.result.current.placed).toEqual([]);
    t.cleanup();
  });

  it('looks for every pin when the app never said which page it is on', () => {
    const t = setup({ active: true, pins: [stored('a'), stored('b', { pagePath: '/other' })], currentPath: null });
    t.fromApp('ready', READY);
    expect(t.sent('locate')[0].payload.requests.map((r: { key: string }) => r.key)).toEqual(['a', 'b']);
    t.cleanup();
  });

  it('lists everything when the app’s bridge cannot locate (older bridge)', () => {
    const t = setup({ active: true, pins: [stored('a'), stored('b', { pagePath: '/other' })], currentPath: '/pins' });
    t.fromApp('ready', { capabilities: ['pick', 'describe', 'crop'], session: 's1' });
    expect(t.hook.result.current.status).toBe('unsupported');
    expect(t.sent('locate')).toEqual([]);
    expect(t.hook.result.current.notFound.map((p) => p.uid)).toEqual(['a']);
    expect([...t.hook.result.current.otherPages.keys()]).toEqual(['/other']);
    t.cleanup();
  });

  it('locates again when the app loads a new document', () => {
    const t = setup({ active: true, pins: [stored('a')], currentPath: '/pins' });
    t.fromApp('ready', READY);
    t.fromApp('ready', { ...READY, session: 's2' });
    expect(t.sent('locate')).toHaveLength(2);
    t.cleanup();
  });
});

describe('normalizeAppPath', () => {
  it.each([
    ['/pins', '/pins'],
    ['/pins/', '/pins'],
    ['/pins?tab=1', '/pins'],
    ['/pins#x', '/pins'],
    ['/', '/'],
    ['', '/'],
  ])('%s → %s', (input, expected) => expect(normalizeAppPath(input)).toBe(expected));
});

describe('toPinId', () => {
  it('accepts picked and located ids, nothing else', () => {
    expect(toPinId('pin-3')).toBe('pin-3');
    expect(toPinId('loc-12')).toBe('loc-12');
    expect(toPinId('loc-')).toBeNull();
    expect(toPinId('pin-1;alert(1)')).toBeNull();
  });
});

describe('toPinInputs', () => {
  const pin = (id: string, overrides: Partial<ElementPin> = {}): ElementPin => ({
    id,
    element: {
      selector: `#${id}`,
      tag: 'button',
      text: 'Save',
      html: '<button>Save</button>',
      role: null,
      ariaLabel: null,
      component: 'SaveButton',
      source: null,
      rect: { x: 1, y: 2, w: 3, h: 4 },
      page: { path: '/settings', title: 'Settings', viewportW: 800.4, viewportH: 600 },
    },
    rect: { x: 1, y: 2, w: 3, h: 4 },
    note: '  Too small  ',
    crop: { status: 'pending' },
    ...overrides,
  });

  it('sends the same pins as the readable block, numbered alike, sharing the hosted crops', () => {
    const pins = [pin('pin-1'), pin('pin-2', { note: '' })];
    const crops = ['https://cdn.example/1.webp', null];
    const inputs = toPinInputs(pins, crops, 'preview');

    expect(inputs.map((p) => [p.n, p.env, p.cropUrl, p.note])).toEqual([
      [1, 'preview', 'https://cdn.example/1.webp', 'Too small'],
      [2, 'preview', null, ''],
    ]);
    expect(inputs[0]).toMatchObject({
      pagePath: '/settings',
      pageQuery: null,
      viewportW: 800,
      component: 'SaveButton',
    });
    expect(inputs[0]).not.toHaveProperty('html');
    /* The readable block numbers the same pins the same way and shows the same crop. */
    const html = pinsHtml(pins, crops);
    expect(html).toContain('https://cdn.example/1.webp');
    expect(html.match(/<li>/g)).toHaveLength(2);
  });
});
