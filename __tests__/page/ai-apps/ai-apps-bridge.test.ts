import { createBridge } from '@/ai-apps-bridge/bridge';
import { redactedHtml, selectorFor } from '@/ai-apps-bridge/describe';
import { BRIDGE_NS, BRIDGE_VERSION } from '@/ai-apps-bridge/protocol';

/**
 * The bridge runs inside member-written apps, so the tests that matter are the
 * ones about what it REFUSES: the wrong parent, a click leaking to the app in
 * pick mode, a typed value or a token leaving the frame.
 */

const PARENT = 'https://os.pl.xyz';

type Posted = { type: string; payload?: any };

function setup() {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const win = iframe.contentWindow as Window;
  const posted: Posted[] = [];
  const spy = jest.spyOn(window, 'postMessage').mockImplementation(((data: any, origin: string) => {
    expect(origin).toBe(PARENT);
    posted.push(data);
  }) as any);
  (win as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0);
  (win as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
  const destroy = createBridge(win, { parentOrigin: PARENT, cropScriptUrl: `${PARENT}/ai-apps/bridge/v1-crop.js` });

  const command = (type: string, payload?: unknown, { origin = PARENT, source = window as Window } = {}) =>
    win.dispatchEvent(
      new MessageEvent('message', {
        data: { ns: BRIDGE_NS, v: BRIDGE_VERSION, id: 'x', type, payload },
        origin,
        source,
      }),
    );

  const place = (el: Element, rect = { x: 10, y: 20, width: 100, height: 30 }) => {
    el.getBoundingClientRect = () => ({ ...rect, top: rect.y, left: rect.x, right: 0, bottom: 0, toJSON: () => ({}) });
    (win.document as any).elementFromPoint = () => el;
  };

  const cleanup = () => {
    destroy();
    spy.mockRestore();
    iframe.remove();
  };
  return { win, doc: win.document, posted, command, place, cleanup };
}

const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

describe('AI Apps bridge', () => {
  let ctx: ReturnType<typeof setup>;
  afterEach(() => ctx?.cleanup());

  it('does nothing when the app is not inside a frame', () => {
    const spy = jest.spyOn(window, 'postMessage');
    const destroy = createBridge(window, { parentOrigin: PARENT, cropScriptUrl: 'x' });
    expect(spy).not.toHaveBeenCalled();
    destroy();
    spy.mockRestore();
  });

  it('announces itself to the exact LabOS origin, and again on hello', () => {
    ctx = setup();
    expect(ctx.posted).toEqual([expect.objectContaining({ type: 'ready', ns: BRIDGE_NS, v: BRIDGE_VERSION })]);
    expect(ctx.posted[0].payload.capabilities).toEqual(['pick', 'describe', 'crop']);
    ctx.command('hello');
    expect(ctx.posted.map((m) => m.type)).toEqual(['ready', 'ready']);
    /* Same page load, same session — LabOS tells an echo from a new document by it. */
    expect(ctx.posted[1].payload.session).toBe(ctx.posted[0].payload.session);
  });

  it('ignores commands from any other origin or any other window', () => {
    ctx = setup();
    const button = ctx.doc.createElement('button');
    ctx.doc.body.appendChild(button);
    const appHandler = jest.fn();
    button.addEventListener('click', appHandler);
    ctx.place(button);

    ctx.command('pick:start', undefined, { origin: 'https://evil.example' });
    ctx.command('pick:start', undefined, { source: ctx.win });
    click(button);

    expect(appHandler).toHaveBeenCalledTimes(1);
    expect(ctx.posted.map((m) => m.type)).toEqual(['ready']);
  });

  it('in pick mode, the click becomes the pick and never reaches the app', () => {
    ctx = setup();
    const button = ctx.doc.createElement('button');
    button.textContent = 'Save changes';
    button.id = 'save';
    ctx.doc.body.appendChild(button);
    const appHandler = jest.fn();
    button.addEventListener('click', appHandler);
    ctx.place(button);

    ctx.command('pick:start');
    button.dispatchEvent(
      /* jsdom has no PointerEvent; the bridge only reads clientX/Y. */
      new MouseEvent('pointermove', { bubbles: true, clientX: 15, clientY: 25 }),
    );
    click(button);

    expect(appHandler).not.toHaveBeenCalled();
    const selected = ctx.posted.find((m) => m.type === 'pick:selected')!;
    expect(selected.payload.pinId).toBe('pin-1');
    expect(selected.payload.element).toMatchObject({
      selector: '#save',
      tag: 'button',
      rect: { x: 10, y: 20, w: 100, h: 30 },
    });

    /* One pick, then the app is usable again. */
    click(button);
    expect(appHandler).toHaveBeenCalledTimes(1);
  });

  it('Esc leaves pick mode and tells LabOS', () => {
    ctx = setup();
    ctx.command('pick:start');
    ctx.win.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(ctx.posted.map((m) => m.type)).toContain('pick:cancelled');
    expect(ctx.doc.querySelector('[data-pln-bridge]')).toBeNull();
  });

  it('reports a pinned element as detached once it leaves the page', async () => {
    ctx = setup();
    const card = ctx.doc.createElement('div');
    ctx.doc.body.appendChild(card);
    ctx.place(card);
    ctx.command('pick:start');
    click(card);
    await new Promise((r) => setTimeout(r, 5));
    card.remove();
    ctx.win.dispatchEvent(new Event('resize'));
    await new Promise((r) => setTimeout(r, 5));
    const rects = ctx.posted.filter((m) => m.type === 'pins:rects').map((m) => m.payload.rects['pin-1']);
    expect(rects.at(-1)).toBeNull();
  });

  it('answers a crop for an unknown pin with an error rather than guessing', () => {
    ctx = setup();
    ctx.command('crop', { pinId: 'pin-9' });
    expect(ctx.posted.at(-1)).toMatchObject({ type: 'crop:result', payload: { pinId: 'pin-9', error: 'detached' } });
  });
});

describe('describe: what leaves the frame', () => {
  it('strips typed values, secrets, handlers, scripts, and URL queries', () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <input name="email" value="me@example.com">
      <input type="password" value="hunter2">
      <textarea>private draft</textarea>
      <div data-api-key="abc" data-testid="card" onclick="steal()">ok</div>
      <a href="/reset?token=SECRET#frag">Reset</a>
      <span data-x="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0">jwt</span>
      <img src="data:image/png;base64,AAAA">
      <script>window.secret = 1</script>`;
    const html = redactedHtml(form);
    for (const leak of [
      'me@example.com',
      'hunter2',
      'private draft',
      'abc',
      'steal',
      'SECRET',
      'frag',
      'eyJhbGci',
      'secret = 1',
      'base64',
    ]) {
      expect(html).not.toContain(leak);
    }
    expect(html).toContain('href="/reset"');
    expect(html).toContain('data-testid="card"');
    expect(html).toContain('name="email"');
  });

  it('prefers a stable id, then a test id, then a structural path', () => {
    document.body.innerHTML = `
      <main><section><button id="go">Go</button><button id=":r3:">A</button><button>B</button></section>
      <div data-testid="price">1</div></main>`;
    const [go, generated, plain] = Array.from(document.querySelectorAll('button'));
    expect(selectorFor(go)).toBe('#go');
    expect(selectorFor(document.querySelector('[data-testid]')!)).toBe('[data-testid="price"]');
    expect(selectorFor(generated)).toBe('body > main > section > button:nth-of-type(2)');
    expect(document.querySelector(selectorFor(plain))).toBe(plain);
  });
});
