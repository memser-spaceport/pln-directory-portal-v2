import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BRIDGE_NS, BRIDGE_VERSION } from '@/ai-apps-bridge/protocol';
import {
  CommentMode,
  useCommentDrafts,
  type ElementPinsController,
  type ElementPin,
} from '@/components/page/ai-apps/components/element-pins';
import type { FeedbackContext, OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';

const mockUpdateStatus = jest.fn();
jest.mock('@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus', () => ({
  useUpdateAiAppFeedbackStatus: () => ({ mutate: mockUpdateStatus, isPending: false, variables: undefined }),
}));
const mockSubmit = jest.fn();
jest.mock('@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback', () => ({
  useSubmitAiAppFeedback: () => ({ mutateAsync: mockSubmit }),
}));
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({ onFeedbackSubmitted: jest.fn(), onFeedbackSubmitFailed: jest.fn() }),
}));
const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));
jest.mock('@/components/page/ai-apps/components/element-pins/pinsHtml', () => ({
  ...jest.requireActual('@/components/page/ai-apps/components/element-pins/pinsHtml'),
  hostPinCrops: () => Promise.resolve(['https://cdn.example/hosted-crop.png']),
}));
jest.mock('@/components/page/ai-apps/components/screenshot-feedback/AnnotatorModal', () => ({
  AnnotatorModal: () => <div>Annotator</div>,
}));

const APP = 'https://demo.os.pl.xyz';
const CONTEXT: FeedbackContext = {
  env: 'prod',
  appPath: '/pins',
  labosUrl: 'https://directory.example/pl-infra/ai-apps/app-1/pins',
  viewport: { w: 1000, h: 700 },
  pixelRatio: 2,
  touch: false,
  userAgent: 'jest',
  bridge: { version: 1, capabilities: ['pick', 'locate'] },
};

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
  cropUrl: 'https://cdn.example/crop.webp',
  ox: 0.5,
  oy: 0.25,
  createdAt: '2026-10-01T00:00:00.000Z',
  feedback: {
    uid: `fb-${uid}`,
    status: 'NEW',
    createdAt: '2026-10-01T00:00:00.000Z',
    member: { uid: 'm1', name: 'Ada Lovelace', image: null },
  },
  ...overrides,
});

const picked = (id: string, overrides: Partial<ElementPin> = {}): ElementPin => ({
  id,
  element: {
    selector: '#save',
    tag: 'button',
    text: 'Save',
    html: '<button id="save">Save</button>',
    role: null,
    ariaLabel: null,
    component: null,
    source: null,
    rect: { x: 10, y: 20, w: 100, h: 40 },
    page: { path: '/pins', title: 'Grant Tracker', viewportW: 1000, viewportH: 700 },
  },
  rect: { x: 10, y: 20, w: 100, h: 40 },
  note: '',
  crop: { status: 'done', dataUrl: 'data:image/png;base64,AAAA' },
  point: { ox: 0.2, oy: 0.5 },
  ...overrides,
});

type Bridge = { pins: ElementPin[]; isPicking: boolean };

function makeController(bridge: Bridge, spies: Record<string, jest.Mock>): ElementPinsController {
  return {
    status: 'ready',
    capabilities: ['pick', 'describe', 'crop', 'locate'],
    isPicking: bridge.isPicking,
    pins: bridge.pins,
    onFrameLoad: jest.fn(),
    startPicking: spies.startPicking,
    stopPicking: spies.stopPicking,
    setNote: jest.fn(),
    removePin: spies.removePin,
    clearPins: spies.clearPins,
  };
}

type HarnessProps = Partial<React.ComponentProps<typeof CommentMode>> & {
  bridge: Bridge;
  spies: Record<string, jest.Mock>;
};

function Harness({ bridge, spies, ...props }: HarnessProps) {
  const drafts = useCommentDrafts('app-1');
  return (
    <CommentMode
      appUid="app-1"
      appName="Grant Tracker"
      iframeRef={props.iframeRef!}
      appOrigin={APP}
      frameKey="gen-1"
      pins={[]}
      canManage
      currentPath="/pins"
      currentEnv="prod"
      active
      openPinUid={null}
      onOpenPinChange={jest.fn()}
      onGoToPage={jest.fn()}
      onExit={jest.fn()}
      elementPins={makeController(bridge, spies)}
      drafts={drafts}
      viewerName="Grace Hopper"
      getContext={() => CONTEXT}
      {...props}
    />
  );
}

function setup(
  props: Partial<React.ComponentProps<typeof CommentMode>> = {},
  bridge: Bridge = { pins: [], isPicking: true },
) {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  iframe.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: 1000,
      height: 700,
      x: 0,
      y: 0,
      right: 1000,
      bottom: 700,
      toJSON: () => ({}),
    }) as DOMRect;
  const appWindow = iframe.contentWindow as Window;
  jest.spyOn(appWindow, 'postMessage').mockImplementation(() => undefined);
  const spies = { startPicking: jest.fn(), stopPicking: jest.fn(), removePin: jest.fn(), clearPins: jest.fn() };
  const handlers = { onOpenPinChange: jest.fn(), onGoToPage: jest.fn(), onExit: jest.fn() };
  const base = { iframeRef: { current: iframe }, ...handlers, ...props };
  const view = render(<Harness bridge={bridge} spies={spies} {...base} />);
  const bridgeIs = (next: Bridge) => view.rerender(<Harness bridge={next} spies={spies} {...base} />);
  const fromApp = (type: string, payload: unknown) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { ns: BRIDGE_NS, v: BRIDGE_VERSION, id: 'm', type, payload },
          origin: APP,
          source: appWindow,
        }),
      );
    });
  return { ...view, ...handlers, spies, bridgeIs, fromApp, cleanup: () => iframe.remove() };
}

const LOCATE_READY = { capabilities: ['pick', 'describe', 'crop', 'locate'], session: 's1' };
const VIEW_PINS = [
  stored('a'),
  stored('b', { pagePath: '/other' }),
  stored('c', { feedback: { ...stored('c').feedback, status: 'IMPLEMENTED' } }),
];
const placeAll = (t: ReturnType<typeof setup>) => {
  t.fromApp('ready', LOCATE_READY);
  t.fromApp('locate:result', {
    results: {
      a: { pinId: 'loc-1', rect: { x: 100, y: 200, w: 80, h: 40 } },
      c: { pinId: 'loc-2', rect: { x: 300, y: 200, w: 80, h: 40 } },
    },
  });
};

/** A new pick, a note, Add comment: one draft in the dock. */
const addDraft = (t: ReturnType<typeof setup>, pin = picked('pin-1'), note = 'Label is unclear') => {
  t.bridgeIs({ pins: [pin], isPicking: false });
  fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), { target: { value: note } });
  fireEvent.click(screen.getByRole('button', { name: 'Add comment' }));
};

beforeEach(() => {
  mockUpdateStatus.mockReset();
  mockSubmit.mockReset().mockResolvedValue(true);
  mockToastError.mockReset();
  window.localStorage.clear();
});

describe('CommentMode — viewing', () => {
  it('draws each found comment as its author’s initials, at the spot that was clicked', () => {
    const t = setup({ pins: VIEW_PINS });
    placeAll(t);
    const pin = screen.getAllByRole('button', { name: 'Comment by Ada Lovelace' })[0];
    expect(pin).toHaveTextContent('AL');
    /* x 100 + 80 × 0.5, y 200 + 40 × 0.25 */
    expect(pin).toHaveStyle({ left: '140px', top: '210px' });
    t.cleanup();
  });

  it('keeps Shipped comments on the page, faded', () => {
    const t = setup({ pins: VIEW_PINS });
    placeAll(t);
    const [newPin, shippedPin] = screen.getAllByRole('button', { name: 'Comment by Ada Lovelace' });
    expect(newPin.className).not.toMatch(/pinShipped/);
    expect(shippedPin.className).toMatch(/pinShipped/);
    t.cleanup();
  });

  it('opens a comment’s thread, where the creator sets its status', () => {
    const t = setup({ pins: VIEW_PINS, openPinUid: 'a' });
    placeAll(t);
    expect(screen.getByRole('dialog', { name: 'Comment by Ada Lovelace' })).toHaveTextContent('Note a');
    expect(screen.getAllByRole('button', { name: /Change status/ }).length).toBeGreaterThan(0);
    t.cleanup();
  });

  it('shows a member a status only once it says something, read-only', () => {
    const t = setup({
      canManage: false,
      openPinUid: 'a',
      pins: [stored('a'), stored('v', { feedback: { ...stored('v').feedback, status: 'VIEWED' } })],
    });
    t.fromApp('ready', LOCATE_READY);
    t.fromApp('locate:result', { results: { a: { pinId: 'loc-1', rect: { x: 1, y: 1, w: 9, h: 9 } }, v: null } });
    expect(screen.queryByRole('button', { name: /Change status/ })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Comment by Ada Lovelace' })).not.toHaveTextContent('New');
    fireEvent.click(screen.getByRole('button', { name: /Not on screen/ }));
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    t.cleanup();
  });

  it('lists comments it can’t draw: not found here, and other pages with Go to page', () => {
    const t = setup({ pins: VIEW_PINS });
    t.fromApp('ready', LOCATE_READY);
    t.fromApp('locate:result', { results: { a: null, c: null } });
    fireEvent.click(screen.getByRole('button', { name: 'Not on screen (3)' }));
    expect(screen.getByText('Not found on this page')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go to page' }));
    expect(t.onGoToPage).toHaveBeenCalledWith('/other');
    t.cleanup();
  });

  it('Esc closes an open thread first, without leaving the mode', () => {
    const t = setup({ pins: VIEW_PINS, openPinUid: 'a' });
    placeAll(t);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(t.onOpenPinChange).toHaveBeenCalledWith(null);
    expect(t.onExit).not.toHaveBeenCalled();
    t.unmount();
    t.cleanup();
  });

  it('draws nothing while the mode is off, and stops picking', () => {
    const t = setup({ active: false });
    expect(screen.queryByTestId('comment-mode-layer')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Feedback on this app' })).not.toBeInTheDocument();
    expect(t.spies.stopPicking).toHaveBeenCalled();
    t.cleanup();
  });
});

describe('CommentMode — writing', () => {
  it('keeps picking on while nothing is open', () => {
    const t = setup({}, { pins: [], isPicking: false });
    expect(t.spies.startPicking).toHaveBeenCalled();
    t.cleanup();
  });

  it('a click in the app opens the composer beside the new pin; Add comment queues it in the dock', async () => {
    const t = setup();
    t.bridgeIs({ pins: [picked('pin-1')], isPicking: false });
    expect(screen.getByRole('dialog', { name: 'New comment' })).toBeInTheDocument();
    expect(t.spies.startPicking).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), { target: { value: 'Label is unclear' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add comment' }));

    expect(screen.getByText('1 comment')).toBeInTheDocument();
    expect(screen.getByText('Label is unclear')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'New comment' })).not.toBeInTheDocument();
    expect(t.spies.startPicking).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());
    t.cleanup();
  });

  it('removing the newest pin is not a click: an older pin left behind opens no composer', () => {
    const t = setup({}, { pins: [picked('pin-1')], isPicking: true });
    t.bridgeIs({ pins: [picked('pin-1'), picked('pin-2')], isPicking: true });
    expect(screen.getByRole('dialog', { name: 'New comment' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    t.bridgeIs({ pins: [picked('pin-1')], isPicking: true });
    expect(screen.queryByRole('dialog', { name: 'New comment' })).not.toBeInTheDocument();
    t.cleanup();
  });

  it('drops the marker of a comment sent or removed in another tab', async () => {
    const t = setup();
    addDraft(t);
    await waitFor(() => expect(window.localStorage.getItem('ai-app-comment-drafts:app-1')).toContain('hosted-crop'));
    t.spies.removePin.mockClear();

    act(() => {
      window.localStorage.removeItem('ai-app-comment-drafts:app-1');
      window.dispatchEvent(new StorageEvent('storage', { key: 'ai-app-comment-drafts:app-1' }));
    });

    expect(screen.queryByText('Label is unclear')).not.toBeInTheDocument();
    expect(t.spies.removePin).toHaveBeenCalledWith('pin-1');
    t.cleanup();
  });

  it('Cancel drops the new pin', () => {
    const t = setup();
    t.bridgeIs({ pins: [picked('pin-1')], isPicking: false });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(t.spies.removePin).toHaveBeenCalledWith('pin-1');
    expect(screen.queryByRole('dialog', { name: 'New comment' })).not.toBeInTheDocument();
    t.cleanup();
  });

  it('a click in the app while a thread is open only closes the thread', () => {
    const t = setup({ openPinUid: 'a', pins: VIEW_PINS });
    t.bridgeIs({ pins: [picked('pin-1')], isPicking: false });
    expect(t.spies.removePin).toHaveBeenCalledWith('pin-1');
    expect(t.onOpenPinChange).toHaveBeenCalledWith(null);
    expect(screen.queryByRole('dialog', { name: 'New comment' })).not.toBeInTheDocument();
    t.cleanup();
  });

  it('Esc inside the app (picking ends with no pick) leaves the mode', () => {
    const t = setup();
    t.bridgeIs({ pins: [], isPicking: false });
    expect(t.onExit).toHaveBeenCalled();
    t.cleanup();
  });

  it('sends one feedback item per comment, with its pin, crop and context, then the whole-app one', async () => {
    const t = setup();
    addDraft(t);
    fireEvent.change(screen.getByRole('textbox', { name: 'Comment about the whole app' }), {
      target: { value: 'Love it overall' },
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });

    expect(mockSubmit).toHaveBeenCalledTimes(2);
    const [first] = mockSubmit.mock.calls[0];
    expect(first.pins).toEqual([
      expect.objectContaining({
        n: 1,
        selector: '#save',
        note: 'Label is unclear',
        ox: 0.2,
        oy: 0.5,
        cropUrl: 'https://cdn.example/hosted-crop.png',
      }),
    ]);
    expect(first.context).toEqual(CONTEXT);
    expect(first.text).toContain('Label is unclear');
    expect(first.text).toContain('https://cdn.example/hosted-crop.png');
    const [second] = mockSubmit.mock.calls[1];
    expect(second).not.toHaveProperty('pins');
    expect(second.text).toContain('Love it overall');

    expect(screen.getByRole('status')).toHaveTextContent('Sent 2 comments.');
    expect(t.spies.removePin).toHaveBeenCalledWith('pin-1');
    t.cleanup();
  });

  it('keeps the Sent receipt until there is something new to send', async () => {
    jest.useFakeTimers();
    try {
      const t = setup();
      addDraft(t);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      });
      act(() => void jest.advanceTimersByTime(30_000));
      expect(screen.getByRole('status')).toHaveTextContent('Sent 1 comment.');

      fireEvent.change(screen.getByRole('textbox', { name: 'Comment about the whole app' }), {
        target: { value: 'One more thing' },
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      t.cleanup();
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps a comment that failed to send, and says so', async () => {
    mockSubmit.mockRejectedValueOnce(new Error('nope'));
    const t = setup();
    addDraft(t);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });
    expect(screen.getByText('Label is unclear')).toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalled();
    t.cleanup();
  });

  it('waits for a screenshot still being made before it can send', () => {
    const t = setup();
    addDraft(t, picked('pin-1', { crop: { status: 'pending' } }));
    expect(screen.getByRole('button', { name: 'Preparing…' })).toBeDisabled();
    t.cleanup();
  });

  it('keeps unsent comments in this browser, and brings them back', async () => {
    const t = setup();
    addDraft(t);
    await waitFor(() => expect(window.localStorage.getItem('ai-app-comment-drafts:app-1')).toContain('hosted-crop'));
    t.unmount();
    t.cleanup();

    const u = setup();
    expect(screen.getByText('Label is unclear')).toBeInTheDocument();
    u.cleanup();
  });
});
