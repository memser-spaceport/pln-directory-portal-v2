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
    expect(ctx.posted[0].payload.capabilities).toEqual(['pick', 'describe', 'crop', 'locate', 'capture']);
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

  describe('capture (a picture of the app as it is on screen)', () => {
    /* The renderer chunk is already loaded: the bridge skips the <script> and calls it. */
    const withRenderer = (capture?: () => Promise<unknown>) => {
      (ctx.win as any).__plnBridgeCrop = jest.fn();
      if (capture) (ctx.win as any).__plnBridgeCapture = capture;
    };
    const lastResult = async () => {
      await new Promise((r) => setTimeout(r, 0));
      return ctx.posted.filter((m) => m.type === 'capture:result').at(-1);
    };

    it('answers with the picture and the viewport size, under LabOS’s key', async () => {
      ctx = setup();
      withRenderer(() => Promise.resolve({ dataUrl: 'data:image/jpeg;base64,AAAA', width: 1280, height: 720 }));
      ctx.command('capture', { key: 'cap-1' });
      expect(await lastResult()).toMatchObject({
        payload: { key: 'cap-1', dataUrl: 'data:image/jpeg;base64,AAAA', width: 1280, height: 720 },
      });
    });

    it('says why when it can’t: a renderer from before capture, a picture too large, a render error', async () => {
      ctx = setup();
      withRenderer();
      ctx.command('capture', { key: 'cap-1' });
      expect(await lastResult()).toMatchObject({ payload: { key: 'cap-1', error: 'capture-missing' } });

      withRenderer(() =>
        Promise.resolve({ dataUrl: `data:image/jpeg;base64,${'A'.repeat(4_000_001)}`, width: 1, height: 1 }),
      );
      ctx.command('capture', { key: 'cap-2' });
      expect(await lastResult()).toMatchObject({ payload: { key: 'cap-2', error: 'too-large' } });

      withRenderer(() => Promise.reject(new Error('timeout')));
      ctx.command('capture', { key: 'cap-3' });
      expect(await lastResult()).toMatchObject({ payload: { key: 'cap-3', error: 'timeout' } });
    });

    it('ignores a capture without a usable key, and from anyone but LabOS', async () => {
      ctx = setup();
      const render = jest.fn(() => Promise.resolve({ dataUrl: 'data:image/jpeg;base64,AA', width: 1, height: 1 }));
      withRenderer(render);
      ctx.command('capture', { key: 'x'.repeat(41) });
      ctx.command('capture', {});
      ctx.command('capture', { key: 'cap-1' }, { origin: 'https://evil.example' });
      await new Promise((r) => setTimeout(r, 0));
      expect(render).not.toHaveBeenCalled();
    });
  });
});

describe('AI Apps bridge: what a pick means', () => {
  let ctx: ReturnType<typeof setup>;
  afterEach(() => ctx?.cleanup());

  const box = (el: Element, rect = { x: 100, y: 100, width: 200, height: 40 }) => {
    el.getBoundingClientRect = () => ({ ...rect, top: rect.y, left: rect.x, right: 0, bottom: 0, toJSON: () => ({}) });
    return el;
  };
  const move = (el: Element, x = 150, y = 110) =>
    el.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y }));
  const clickAt = (el: Element, x = 150, y = 110) =>
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  const selected = () => ctx.posted.filter((m) => m.type === 'pick:selected').at(-1)?.payload;

  /** elementFromPoint always answers with the leaf; the rule decides from there. */
  const under = (el: Element) => {
    (ctx.doc as any).elementFromPoint = () => el;
  };

  it('climbs from a word to the button it sits in', () => {
    ctx = setup();
    ctx.doc.body.innerHTML = '<button id="go"><span>Review</span> now</button>';
    const span = ctx.doc.querySelector('span')!;
    box(ctx.doc.getElementById('go')!);
    under(span);
    ctx.command('pick:start');
    move(span);
    clickAt(span);
    expect(selected().element).toMatchObject({ selector: '#go', tag: 'button' });
  });

  it('climbs from a number to the card with an edge around it', () => {
    ctx = setup();
    ctx.doc.body.innerHTML =
      '<div class="card" style="border: 1px solid #ccc"><div><strong>24</strong></div><small>teams</small></div>';
    const strong = ctx.doc.querySelector('strong')!;
    box(ctx.doc.querySelector('.card')!);
    under(strong);
    ctx.command('pick:start');
    move(strong);
    clickAt(strong);
    expect(selected().element.tag).toBe('div');
    expect(selected().element.html).toContain('class="card"');
  });

  it('keeps the leaf when the nearest edged ancestor fills most of the window', () => {
    ctx = setup();
    ctx.doc.body.innerHTML = '<main style="background: #fff"><p id="para">Some text</p></main>';
    const p = ctx.doc.getElementById('para')!;
    box(ctx.doc.querySelector('main')!, { x: 0, y: 0, width: 5000, height: 5000 });
    box(p);
    under(p);
    ctx.command('pick:start');
    move(p);
    clickAt(p);
    expect(selected().element.tag).toBe('p');
  });

  it('reports where in the element the click landed', () => {
    ctx = setup();
    ctx.doc.body.innerHTML = '<button id="go">Go</button>';
    const button = box(ctx.doc.getElementById('go')!);
    under(button);
    ctx.command('pick:start');
    move(button);
    /* Box is x 100–300, y 100–140: (150, 130) is a quarter across, three quarters down. */
    clickAt(button, 150, 130);
    expect(selected().point).toEqual({ ox: 0.25, oy: 0.75 });
  });

  it('a tap with no hover before it picks by the same rule', () => {
    ctx = setup();
    ctx.doc.body.innerHTML = '<button id="go"><span>Go</span></button>';
    const span = ctx.doc.querySelector('span')!;
    box(ctx.doc.getElementById('go')!);
    under(span);
    ctx.command('pick:start');
    clickAt(span);
    expect(selected().element.tag).toBe('button');
  });

  it('⌥ walks up from the chosen target, and a small move over the same word keeps the walk', () => {
    ctx = setup();
    ctx.doc.body.innerHTML = '<section id="panel"><button id="go"><span>Go</span></button></section>';
    const span = ctx.doc.querySelector('span')!;
    box(ctx.doc.getElementById('go')!);
    box(ctx.doc.getElementById('panel')!);
    under(span);
    ctx.command('pick:start');
    move(span);
    ctx.win.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', bubbles: true }));
    move(span, 151, 111);
    clickAt(span);
    expect(selected().element.selector).toBe('#panel');
  });
});

describe('AI Apps bridge: locate (the feedback overlay)', () => {
  let ctx: ReturnType<typeof setup>;
  afterEach(() => ctx?.cleanup());

  /** Gives every element a visible box; jsdom lays nothing out. */
  const sized = (el: Element, rect = { x: 10, y: 20, width: 100, height: 30 }) => {
    el.getBoundingClientRect = () => ({ ...rect, top: rect.y, left: rect.x, right: 0, bottom: 0, toJSON: () => ({}) });
    return el;
  };

  const add = (html: string) => {
    ctx.doc.body.insertAdjacentHTML('beforeend', html);
    ctx.doc.body.querySelectorAll('*').forEach((el) => sized(el));
  };

  const locate = (requests: unknown[]) => {
    ctx.command('locate', { requests });
    const result = ctx.posted.filter((m) => m.type === 'locate:result').at(-1);
    return result?.payload.results as Record<string, { pinId: string; rect: unknown } | null>;
  };

  const req = (key: string, selector: string, tag: string, text = '') => ({ key, selector, tag, text });

  it('finds a pin by its selector and answers with a tracked id and a position, nothing else', () => {
    ctx = setup();
    add('<button id="review">Review now</button>');
    const results = locate([req('p1', '#review', 'button', 'Review now')]);
    expect(results).toEqual({ p1: { pinId: 'loc-1', rect: { x: 10, y: 20, w: 100, h: 30 } } });
  });

  it('falls back to the same tag with the same visible text when the selector no longer matches', () => {
    ctx = setup();
    /* After a redeploy: the id is gone, the button is the same. */
    add('<div><span>Grants</span><button>Review now</button><button>Export</button></div>');
    const results = locate([req('p1', '#review', 'button', 'Review now')]);
    expect(results.p1).toMatchObject({ pinId: 'loc-1' });
  });

  it('does not trust a selector that now matches an element of another kind', () => {
    ctx = setup();
    add('<div id="review">Review now</div>');
    expect(locate([req('p1', '#review', 'button', 'Review now')]).p1).toBeNull();
  });

  it('gives up rather than guess when the text matches more than one element', () => {
    ctx = setup();
    add('<button>Delete</button><button>Delete</button>');
    expect(locate([req('p1', '#gone', 'button', 'Delete')]).p1).toBeNull();
  });

  it('does not fall back on empty text (an input matches every input)', () => {
    ctx = setup();
    add('<input type="text">');
    expect(locate([req('p1', '#q', 'input', '')]).p1).toBeNull();
  });

  it('survives a selector the browser cannot parse', () => {
    ctx = setup();
    add('<button>Save</button>');
    expect(locate([req('p1', 'button:has(((', 'button', 'Save')]).p1).toMatchObject({ pinId: 'loc-1' });
  });

  it('drops malformed requests and answers the rest', () => {
    ctx = setup();
    add('<button id="ok">OK</button>');
    const results = locate([
      req('bad-tag', '#ok', 'button onclick=x', 'OK'),
      { key: 'no-selector', tag: 'button', text: 'OK' },
      req('long', 'x'.repeat(1001), 'button', 'OK'),
      req('good', '#ok', 'button', 'OK'),
    ]);
    expect(Object.keys(results)).toEqual(['good']);
  });

  it('tracks a located element like a picked one, and reports it gone when it leaves', async () => {
    ctx = setup();
    add('<button id="review">Review now</button>');
    locate([req('p1', '#review', 'button', 'Review now')]);
    ctx.doc.getElementById('review')!.remove();
    ctx.win.dispatchEvent(new Event('resize'));
    await new Promise((r) => setTimeout(r, 5));
    const rects = ctx.posted.filter((m) => m.type === 'pins:rects').map((m) => m.payload.rects['loc-1']);
    expect(rects.at(-1)).toBeNull();
  });

  it('never lets located pins use up the member’s picks', () => {
    ctx = setup();
    add(Array.from({ length: 25 }, (_, i) => `<button id="b${i}">B${i}</button>`).join(''));
    locate(Array.from({ length: 25 }, (_, i) => req(`k${i}`, `#b${i}`, 'button', `B${i}`)));
    const target = ctx.doc.getElementById('b0')!;
    ctx.place(target);
    ctx.command('pick:start');
    click(target);
    expect(ctx.posted.find((m) => m.type === 'pick:selected')?.payload.pinId).toBe('pin-1');
  });

  it('ignores locate from any other origin', () => {
    ctx = setup();
    add('<button id="review">Review now</button>');
    ctx.command('locate', { requests: [req('p1', '#review', 'button')] }, { origin: 'https://evil.example' });
    expect(ctx.posted.some((m) => m.type === 'locate:result')).toBe(false);
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
