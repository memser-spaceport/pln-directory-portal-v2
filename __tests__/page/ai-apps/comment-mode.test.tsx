import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BRIDGE_NS, BRIDGE_VERSION } from '@/ai-apps-bridge/protocol';
import { describeTarget, shortAgo } from '@/components/page/ai-apps/components/element-pins/CommentsDrawer';
import { keepClear } from '@/components/page/ai-apps/components/element-pins/CommentMode';
import {
  CommentMode,
  type ElementPinsController,
  type ElementPin,
} from '@/components/page/ai-apps/components/element-pins';
import type {
  AiAppFeedbackComment,
  FeedbackContext,
  OverlayFeedbackPin,
} from '@/services/ai-app-feedback/ai-app-feedback.service';

const mockUpdateStatus = jest.fn();
jest.mock('@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus', () => ({
  useUpdateAiAppFeedbackStatus: () => ({ mutate: mockUpdateStatus, isPending: false, variables: undefined }),
}));
const mockSubmit = jest.fn();
const mockFeedbackTab = jest.fn();
jest.mock('@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback', () => ({
  useSubmitAiAppFeedback: () => ({ mutateAsync: mockSubmit }),
}));
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({
    onFeedbackSubmitted: jest.fn(),
    onFeedbackSubmitFailed: jest.fn(),
    onFeedbackReplySent: jest.fn(),
    onFeedbackReplyDeleted: jest.fn(),
    onFeedbackReplyEdited: jest.fn(),
    onFeedbackCommentEdited: jest.fn(),
    onFeedbackCommentDeleted: jest.fn(),
  }),
}));
/* The conversation's data layer is tested on its own (feedback-comments-hooks); here it is a stub. */
let mockComments: AiAppFeedbackComment[] = [];
const mockCommentsFetched = jest.fn();
const mockAddReply = jest.fn();
const mockDeleteReply = jest.fn();
const mockEditReply = jest.fn();
jest.mock('@/services/ai-app-feedback/hooks/useFeedbackComments', () => ({
  useFeedbackComments: (_appUid: string, feedbackUid: string, enabled: boolean) => {
    if (enabled) mockCommentsFetched(feedbackUid);
    return { comments: enabled ? mockComments : [], isLoading: false, isError: false, refetch: jest.fn() };
  },
  useAddFeedbackComment: () => ({ mutateAsync: (text: string) => mockAddReply(text) }),
  useDeleteFeedbackComment: () => ({ mutate: (uid: string) => mockDeleteReply(uid) }),
  useEditFeedbackComment: () => ({ mutate: (vars: unknown) => mockEditReply(vars) }),
}));
const mockEditNote = jest.fn();
const mockDeleteItem = jest.fn();
jest.mock('@/services/ai-app-feedback/hooks/useFeedbackItemActions', () => ({
  useEditFeedbackNote: () => ({ mutate: (vars: unknown) => mockEditNote(vars) }),
  useDeleteFeedbackItem: () => ({ mutate: (uid: string) => mockDeleteItem(uid) }),
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
    canCapture: false,
    capture: jest.fn(),
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
      viewerName="Grace Hopper"
      commentCount={2}
      onFeedbackTab={mockFeedbackTab}
      viewer={{ uid: 'me', name: 'Grace Hopper', image: null }}
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
  let base = { iframeRef: { current: iframe }, ...handlers, ...props };
  let bridgeNow = bridge;
  const view = render(<Harness bridge={bridge} spies={spies} {...base} />);
  const bridgeIs = (next: Bridge) => {
    bridgeNow = next;
    view.rerender(<Harness bridge={next} spies={spies} {...base} />);
  };
  /* New props from the page (say, the pins query came back), the bridge as it is. */
  const propsAre = (next: Partial<React.ComponentProps<typeof CommentMode>>) => {
    base = { ...base, ...next };
    view.rerender(<Harness bridge={bridgeNow} spies={spies} {...base} />);
  };
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
  return { ...view, ...handlers, spies, bridgeIs, propsAre, fromApp, cleanup: () => iframe.remove() };
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

/** A new pick and a note in its composer. */
const compose = (t: ReturnType<typeof setup>, pin = picked('pin-1'), note = 'Label is unclear') => {
  t.bridgeIs({ pins: [pin], isPicking: false });
  fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), { target: { value: note } });
};
const post = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));
  });
};

beforeEach(() => {
  mockComments = [];
  mockCommentsFetched.mockReset();
  mockAddReply.mockReset().mockResolvedValue(undefined);
  mockDeleteReply.mockReset();
  mockEditReply.mockReset();
  mockEditNote.mockReset();
  mockDeleteItem.mockReset();
  mockUpdateStatus.mockReset();
  mockSubmit.mockReset().mockResolvedValue({ uid: 'fb-new' });
  mockFeedbackTab.mockReset();
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
    const row = within(screen.getByRole('complementary', { name: 'Comments' }))
      .getAllByRole('listitem')
      .find((r) => r.textContent?.includes('Note v'));
    expect(row).toHaveTextContent('Reviewed');
    t.cleanup();
  });

  it('lists every comment newest first, saying where each one points', () => {
    const t = setup({
      pins: [
        stored('old', {
          createdAt: '2026-09-01T00:00:00.000Z',
          feedback: { ...stored('old').feedback, createdAt: '2026-09-01T00:00:00.000Z' },
        }),
        stored('a', { tag: 'a', text: 'Draft intro' }),
        stored('b', { pagePath: '/other' }),
      ],
    });
    t.fromApp('ready', LOCATE_READY);
    t.fromApp('locate:result', {
      results: { a: { pinId: 'loc-1', rect: { x: 100, y: 200, w: 80, h: 40 } }, old: null },
    });

    const panel = screen.getByRole('complementary', { name: 'Comments' });
    expect(panel).toHaveTextContent('Comments 3');
    const rows = within(panel).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Note a'),
      expect.stringContaining('Note b'),
      expect.stringContaining('Note old'),
    ]);
    expect(rows[0]).toHaveTextContent('Link “Draft intro”');
    expect(rows[1]).toHaveTextContent('/other');
    expect(rows[2]).toHaveTextContent('Not on the current version');
    t.cleanup();
  });

  it('a row opens its thread: at the pin here, after going to the page for another one', () => {
    const t = setup({ pins: VIEW_PINS });
    placeAll(t);
    const panel = screen.getByRole('complementary', { name: 'Comments' });

    fireEvent.click(within(panel).getByText('Note a'));
    expect(t.onOpenPinChange).toHaveBeenLastCalledWith('a');

    fireEvent.click(within(panel).getByText('Note b'));
    expect(t.onGoToPage).toHaveBeenCalledWith('/other');
    expect(t.onOpenPinChange).toHaveBeenLastCalledWith('b');
    t.cleanup();
  });

  it('a comment whose element is gone opens beside the panel, with its replies', () => {
    mockComments = [];
    const t = setup({
      pins: [stored('gone', { feedback: { ...stored('gone').feedback, commentCount: 0 } })],
      openPinUid: 'gone',
    });
    t.fromApp('ready', LOCATE_READY);
    t.fromApp('locate:result', { results: { gone: null } });
    const thread = screen.getByRole('dialog', { name: 'Comment by Ada Lovelace' });
    expect(thread).toHaveTextContent('Note gone');
    expect(within(thread).getByRole('textbox', { name: 'Reply' })).toBeInTheDocument();
    t.cleanup();
  });

  it('filters the list by status', () => {
    const t = setup({ pins: VIEW_PINS });
    placeAll(t);
    const panel = screen.getByRole('complementary', { name: 'Comments' });
    fireEvent.change(within(panel).getByRole('combobox', { name: 'Show comments' }), {
      target: { value: 'IMPLEMENTED' },
    });
    expect(within(panel).getAllByRole('listitem')).toHaveLength(1);
    expect(panel).toHaveTextContent('Note c');
    fireEvent.change(within(panel).getByRole('combobox', { name: 'Show comments' }), { target: { value: 'VIEWED' } });
    expect(panel).toHaveTextContent('No Reviewed comments.');
    t.cleanup();
  });

  it('makes room for the panel while the mode is on', () => {
    const t = setup();
    expect(document.documentElement.style.getPropertyValue('--ai-app-comments-inset')).toBe('380px');
    t.unmount();
    expect(document.documentElement.style.getPropertyValue('--ai-app-comments-inset')).toBe('');
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
    expect(screen.queryByRole('region', { name: 'Comments on this app' })).not.toBeInTheDocument();
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

  it('a click in the app opens the composer beside the new pin; Post sends it at once', async () => {
    const t = setup();
    compose(t);
    expect(screen.getByRole('dialog', { name: 'New comment' })).toBeInTheDocument();
    expect(t.spies.startPicking).not.toHaveBeenCalled();

    await post();

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const [sent] = mockSubmit.mock.calls[0];
    expect(sent.pins).toEqual([
      expect.objectContaining({ n: 1, selector: '#save', note: 'Label is unclear', ox: 0.2, oy: 0.5, cropUrl: null }),
    ]);
    expect(sent.context).toEqual(CONTEXT);
    expect(sent.kind).toBe('COMMENT');
    expect(sent.text).toContain('Label is unclear');
    /* Comments are public: where it points travels as pin data, never as text. */
    expect(sent.text).not.toContain('#save');
    expect(sent.text).not.toContain('<code>');
    expect(t.spies.removePin).toHaveBeenCalledWith('pin-1');
    expect(screen.queryByRole('dialog', { name: 'New comment' })).not.toBeInTheDocument();
    t.cleanup();
  });

  it('opens the posted comment’s thread once its pin comes back', async () => {
    const t = setup();
    compose(t);
    await post();
    expect(t.onOpenPinChange).not.toHaveBeenCalled();

    t.propsAre({ pins: [stored('new', { feedbackUid: 'fb-new' })] });
    expect(t.onOpenPinChange).toHaveBeenCalledWith('new');
    t.cleanup();
  });

  it('attaches the element’s screenshot only when asked', async () => {
    const t = setup();
    compose(t);
    fireEvent.click(screen.getByRole('button', { name: 'Screenshot' }));
    expect(screen.getByRole('img', { name: 'Screenshot of the element' })).toBeInTheDocument();

    await post();

    const [sent] = mockSubmit.mock.calls[0];
    expect(sent.pins[0].cropUrl).toBe('https://cdn.example/hosted-crop.png');
    expect(sent.text).toContain('https://cdn.example/hosted-crop.png');
    t.cleanup();
  });

  it('a removed screenshot is not sent', async () => {
    const t = setup();
    compose(t);
    fireEvent.click(screen.getByRole('button', { name: 'Screenshot' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot' }));
    await post();
    expect(mockSubmit.mock.calls[0][0].pins[0].cropUrl).toBeNull();
    t.cleanup();
  });

  it('waits for a screenshot still being made, but only if it was attached', () => {
    const t = setup();
    compose(t, picked('pin-1', { crop: { status: 'pending' } }));
    expect(screen.getByRole('button', { name: 'Post' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Screenshot' }));
    expect(screen.getByText('Preparing screenshot…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled();
    t.cleanup();
  });

  it('keeps a comment that did not post, with its text, and says so', async () => {
    mockSubmit.mockRejectedValueOnce(new Error('nope'));
    const t = setup();
    compose(t);
    await post();
    expect(screen.getByRole('textbox', { name: 'Comment' })).toHaveValue('Label is unclear');
    expect(t.spies.removePin).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalled();
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

  it('the card says how to comment, and its Feedback tab hands over to the written form', () => {
    const t = setup();
    const card = screen.getByRole('region', { name: 'Comments on this app' });
    expect(card).toHaveTextContent('Click anywhere on the app to leave a comment.');
    expect(within(card).getByRole('tab', { name: /Comment/ })).toHaveAttribute('aria-selected', 'true');
    expect(within(card).getByRole('tab', { name: /Comment/ })).toHaveTextContent('2');

    fireEvent.click(within(card).getByRole('tab', { name: 'Feedback' }));
    expect(mockFeedbackTab).toHaveBeenCalled();
    fireEvent.click(within(card).getByRole('button', { name: 'Close comments' }));
    expect(t.onExit).toHaveBeenCalled();
    t.cleanup();
  });
});

describe('CommentMode — replies', () => {
  const withReplies = (uid: string, commentCount: number, overrides: Partial<OverlayFeedbackPin> = {}) =>
    stored(uid, { ...overrides, feedback: { ...stored(uid).feedback, commentCount } });
  const reply = (
    uid: string,
    memberUid: string,
    name: string,
    text: string,
    extra: Partial<AiAppFeedbackComment> = {},
  ) =>
    ({
      uid,
      text,
      kind: 'REPLY',
      createdAt: '2026-10-01T01:00:00.000Z',
      member: { uid: memberUid, name, image: null },
      ...extra,
    }) as AiAppFeedbackComment;
  const openThread = (pin: OverlayFeedbackPin) => {
    const t = setup({ pins: [pin], openPinUid: pin.uid });
    t.fromApp('ready', LOCATE_READY);
    t.fromApp('locate:result', { results: { [pin.uid]: { pinId: 'loc-1', rect: { x: 100, y: 200, w: 80, h: 40 } } } });
    return t;
  };
  const thread = () => screen.getByRole('dialog', { name: 'Comment by Ada Lovelace' });

  it('shows the conversation under the comment, the agent’s note marked, and a reply field', () => {
    mockComments = [
      reply('c-1', 'creator', 'Cleo Creator', 'Which chart?'),
      reply('c-2', 'creator', 'Cleo Creator', 'Axis labels added', { kind: 'CLOSING_NOTE' }),
    ];
    const t = openThread(withReplies('a', 2));

    expect(within(thread()).getByText('Which chart?')).toBeInTheDocument();
    expect(within(thread()).getByText('Shipped note')).toBeInTheDocument();
    expect(within(thread()).getByRole('textbox', { name: 'Reply' })).toBeInTheDocument();
    t.cleanup();
  });

  it('offers no replies while the API has no conversations (no commentCount on the pin)', () => {
    const t = openThread(stored('a'));
    expect(within(thread()).queryByRole('textbox', { name: 'Reply' })).not.toBeInTheDocument();
    expect(mockCommentsFetched).not.toHaveBeenCalled();
    t.cleanup();
  });

  it('does not fetch a thread that has no replies yet, but still lets you write the first', () => {
    const t = openThread(withReplies('a', 0));
    expect(mockCommentsFetched).not.toHaveBeenCalled();
    expect(within(thread()).getByRole('textbox', { name: 'Reply' })).toBeInTheDocument();
    t.cleanup();
  });

  it('Enter sends the trimmed reply and clears the field; Shift+Enter does not send', async () => {
    const t = openThread(withReplies('a', 0));
    const field = within(thread()).getByRole('textbox', { name: 'Reply' });
    fireEvent.change(field, { target: { value: '  On it \n' } });
    fireEvent.keyDown(field, { key: 'Enter', shiftKey: true });
    expect(mockAddReply).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.keyDown(field, { key: 'Enter' });
    });
    expect(mockAddReply).toHaveBeenCalledWith('On it');
    expect(field).toHaveValue('');
    t.cleanup();
  });

  it('puts the text back when the reply does not go', async () => {
    mockAddReply.mockRejectedValue(new Error('offline'));
    const t = openThread(withReplies('a', 0));
    const field = within(thread()).getByRole('textbox', { name: 'Reply' });
    fireEvent.change(field, { target: { value: 'Still broken' } });
    await act(async () => {
      fireEvent.click(within(thread()).getByRole('button', { name: 'Reply' }));
    });
    await waitFor(() => expect(field).toHaveValue('Still broken'));
    t.cleanup();
  });

  it('Esc in a field with text leaves the field, and keeps the thread open', () => {
    const t = openThread(withReplies('a', 0));
    const field = within(thread()).getByRole('textbox', { name: 'Reply' });
    fireEvent.change(field, { target: { value: 'half a thought' } });
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(t.onOpenPinChange).not.toHaveBeenCalledWith(null);
    expect(field).toHaveValue('half a thought');
    t.cleanup();
  });

  it('lets you delete your own reply from its ⋮ after confirming, and offers nothing on anyone else’s', () => {
    mockComments = [
      reply('c-1', 'creator', 'Cleo Creator', 'Which chart?'),
      reply('c-2', 'me', 'Grace Hopper', 'Mine'),
    ];
    const t = openThread(withReplies('a', 2));

    expect(within(thread()).queryByRole('button', { name: 'Actions for this reply' })).not.toBeInTheDocument();
    fireEvent.click(within(thread()).getByRole('button', { name: 'Actions for your reply' }));
    fireEvent.click(within(thread()).getByRole('menuitem', { name: 'Delete' }));
    expect(mockDeleteReply).not.toHaveBeenCalled();
    fireEvent.click(
      within(within(thread()).getByRole('group', { name: 'Delete this reply?' })).getByRole('button', {
        name: 'Delete',
      }),
    );
    expect(mockDeleteReply).toHaveBeenCalledWith('c-2');
    t.cleanup();
  });

  it('edits your own reply inline: Save sends the new text, Cancel puts the reply back', () => {
    mockComments = [reply('c-2', 'me', 'Grace Hopper', 'Mine')];
    const t = openThread(withReplies('a', 1));

    fireEvent.click(within(thread()).getByRole('button', { name: 'Actions for your reply' }));
    fireEvent.click(within(thread()).getByRole('menuitem', { name: 'Edit' }));
    const field = within(thread()).getByRole('textbox', { name: 'Edit your reply' });
    expect(field).toHaveValue('Mine');
    expect(within(thread()).getByRole('button', { name: 'Save' })).toBeDisabled();

    fireEvent.click(within(thread()).getByRole('button', { name: 'Cancel' }));
    expect(within(thread()).queryByRole('textbox', { name: 'Edit your reply' })).not.toBeInTheDocument();
    expect(within(thread()).getByText('Mine')).toBeInTheDocument();

    fireEvent.click(within(thread()).getByRole('button', { name: 'Actions for your reply' }));
    fireEvent.click(within(thread()).getByRole('menuitem', { name: 'Edit' }));
    fireEvent.change(within(thread()).getByRole('textbox', { name: 'Edit your reply' }), {
      target: { value: '  Mine, fixed  ' },
    });
    fireEvent.click(within(thread()).getByRole('button', { name: 'Save' }));
    expect(mockEditReply).toHaveBeenCalledWith({ commentUid: 'c-2', text: 'Mine, fixed' });
    expect(within(thread()).queryByRole('textbox', { name: 'Edit your reply' })).not.toBeInTheDocument();
    t.cleanup();
  });

  it('marks an edited reply', () => {
    mockComments = [
      reply('c-1', 'creator', 'Cleo Creator', 'Which chart?', { editedAt: '2026-10-02T10:00:00.000Z' }),
      reply('c-2', 'creator', 'Cleo Creator', 'As posted'),
    ];
    const t = openThread(withReplies('a', 2));
    expect(within(thread()).getAllByText(/· edited/)).toHaveLength(1);
    t.cleanup();
  });

  it('a directory admin may delete anyone’s reply, never edit it', () => {
    mockComments = [reply('c-1', 'creator', 'Cleo Creator', 'Which chart?')];
    const t = openThread(withReplies('a', 1));
    t.propsAre({ isAdmin: true });

    fireEvent.click(within(thread()).getByRole('button', { name: 'Actions for this reply' }));
    expect(within(thread()).queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    fireEvent.click(within(thread()).getByRole('menuitem', { name: 'Delete' }));
    fireEvent.click(
      within(within(thread()).getByRole('group', { name: 'Delete this reply?' })).getByRole('button', {
        name: 'Delete',
      }),
    );
    expect(mockDeleteReply).toHaveBeenCalledWith('c-1');
    t.cleanup();
  });

  it('badges a pin with the messages in its conversation, the comment included', () => {
    const t = setup({ pins: [withReplies('a', 2), withReplies('b', 0)] });
    t.fromApp('ready', LOCATE_READY);
    t.fromApp('locate:result', {
      results: {
        a: { pinId: 'loc-1', rect: { x: 100, y: 200, w: 80, h: 40 } },
        b: { pinId: 'loc-2', rect: { x: 300, y: 200, w: 80, h: 40 } },
      },
    });
    expect(screen.getByLabelText('3 messages')).toHaveTextContent('3');
    expect(screen.getAllByLabelText(/messages$/)).toHaveLength(1);
    t.cleanup();
  });
});

describe('comments panel helpers', () => {
  it('names a target the way a person would', () => {
    const base = { role: null, ariaLabel: null, selector: '#x' };
    expect(describeTarget({ ...base, tag: 'a', text: 'Draft intro via Roneil Rumburg →' })).toBe(
      'Link “Draft intro via Roneil Rumburg →”',
    );
    expect(describeTarget({ ...base, tag: 'div', text: '92% match score' })).toBe('Card “92% match score”');
    expect(describeTarget({ ...base, tag: 'div', role: 'button', text: 'Go' })).toBe('Button “Go”');
    expect(describeTarget({ ...base, tag: 'canvas', text: '' })).toBe('Chart');
    expect(describeTarget({ ...base, tag: 'p', text: 'x'.repeat(60) })).toMatch(/^Text “x{47}…”$/);
  });

  it('says how long ago in the list’s short form', () => {
    const now = Date.parse('2026-10-02T12:00:00.000Z');
    expect(shortAgo('2026-10-02T11:59:40.000Z', now)).toBe('just now');
    expect(shortAgo('2026-10-02T11:55:00.000Z', now)).toBe('5m ago');
    expect(shortAgo('2026-10-02T07:00:00.000Z', now)).toBe('5h ago');
    expect(shortAgo('2026-09-26T12:00:00.000Z', now)).toBe('6d ago');
  });
});

describe('CommentMode — editing and deleting a comment', () => {
  const ME = { uid: 'me', name: 'Grace Hopper', image: null };
  const mine = (overrides: Partial<OverlayFeedbackPin['feedback']> = {}) =>
    stored('a', { feedback: { ...stored('a').feedback, member: ME, kind: 'COMMENT', ...overrides } });
  const open = (pin: OverlayFeedbackPin, props: Partial<React.ComponentProps<typeof CommentMode>> = {}) => {
    const t = setup({ pins: [pin], openPinUid: pin.uid, ...props });
    t.fromApp('ready', LOCATE_READY);
    t.fromApp('locate:result', { results: { [pin.uid]: { pinId: 'loc-1', rect: { x: 100, y: 200, w: 80, h: 40 } } } });
    return t;
  };
  const card = (name = 'Grace Hopper') => screen.getByRole('dialog', { name: `Comment by ${name}` });

  it('edits your own comment inline and sends the new note', () => {
    const t = open(mine());

    fireEvent.click(within(card()).getByRole('button', { name: 'Actions for your comment' }));
    fireEvent.click(within(card()).getByRole('menuitem', { name: 'Edit' }));
    const field = within(card()).getByRole('textbox', { name: 'Edit your comment' });
    expect(field).toHaveValue('Note a');
    fireEvent.change(field, { target: { value: 'Note a, clearer' } });
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }));

    expect(mockEditNote).toHaveBeenCalledWith({ feedbackUid: 'fb-a', note: 'Note a, clearer' });
    expect(within(card()).queryByRole('textbox', { name: 'Edit your comment' })).not.toBeInTheDocument();
    t.cleanup();
  });

  it('shows "edited" on an edited comment', () => {
    const t = open(mine({ editedAt: '2026-10-02T10:00:00.000Z' }));
    expect(within(card()).getByText(/· edited/)).toBeInTheDocument();
    t.cleanup();
  });

  it('deleting your comment says how many replies go with it, then closes the thread', () => {
    const t = open(mine({ commentCount: 3 }));

    fireEvent.click(within(card()).getByRole('button', { name: 'Actions for your comment' }));
    fireEvent.click(within(card()).getByRole('menuitem', { name: 'Delete' }));
    const confirm = within(card()).getByRole('group', { name: 'Delete comment?' });
    expect(confirm).toHaveTextContent('Also deletes 3 replies.');
    expect(mockDeleteItem).not.toHaveBeenCalled();
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));

    expect(mockDeleteItem).toHaveBeenCalledWith('fb-a');
    expect(t.onOpenPinChange).toHaveBeenCalledWith(null);
    t.cleanup();
  });

  it('a comment without replies asks plainly', () => {
    const t = open(mine({ commentCount: 0 }));
    fireEvent.click(within(card()).getByRole('button', { name: 'Actions for your comment' }));
    fireEvent.click(within(card()).getByRole('menuitem', { name: 'Delete' }));
    expect(within(card()).getByRole('group', { name: 'Delete comment?' })).not.toHaveTextContent('Also deletes');
    t.cleanup();
  });

  it('the app’s creator gets no actions on someone else’s comment (moderation is for admins)', () => {
    const t = open(stored('a', { feedback: { ...stored('a').feedback, kind: 'COMMENT' } }), { canManage: true });
    expect(within(card('Ada Lovelace')).queryByRole('button', { name: /^Actions for/ })).not.toBeInTheDocument();
    t.cleanup();
  });

  it('a directory admin may delete someone else’s comment, never edit it', () => {
    const t = open(stored('a', { feedback: { ...stored('a').feedback, kind: 'COMMENT' } }), { isAdmin: true });
    fireEvent.click(within(card('Ada Lovelace')).getByRole('button', { name: 'Actions for this comment' }));
    expect(within(card('Ada Lovelace')).queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(card('Ada Lovelace')).getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    t.cleanup();
  });

  it('your own private feedback can be deleted but not edited (the API edits comments only)', () => {
    const t = open(mine({ kind: 'FEEDBACK' }));
    fireEvent.click(within(card()).getByRole('button', { name: 'Actions for your comment' }));
    expect(within(card()).queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(card()).getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    t.cleanup();
  });

  it('Esc closes the ⋮ menu and leaves the thread open', () => {
    const t = open(mine());
    fireEvent.click(within(card()).getByRole('button', { name: 'Actions for your comment' }));
    fireEvent.keyDown(within(card()).getByRole('menuitem', { name: 'Edit' }), { key: 'Escape' });

    expect(within(card()).queryByRole('menu')).not.toBeInTheDocument();
    expect(t.onOpenPinChange).not.toHaveBeenCalledWith(null);
    t.cleanup();
  });

  it('tells the reader everyone who can open the app sees comments', () => {
    const t = setup();
    expect(screen.getByRole('region', { name: 'Comments on this app' })).toHaveTextContent(
      'Everyone who can open this app can see it.',
    );
    compose(t);
    expect(screen.getByRole('dialog', { name: 'New comment' })).toHaveTextContent(
      'Everyone who can open this app can see it',
    );
    t.cleanup();
  });
});

describe('thread cards keep clear of the Comment card', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
  });
  const card = { top: 700, left: 700 };

  it('a thread in the card’s column is raised to have 400px above it', () => {
    expect(keepClear(500, 600, 400, card)).toEqual({ left: 500, top: 288, maxHeight: 400 });
  });

  it('a thread beside the card, not above it, may run to the window’s bottom', () => {
    expect(keepClear(100, 300, 400, card)).toEqual({ left: 100, top: 300, maxHeight: 520 });
  });

  it('never grows past the card’s own 520px limit', () => {
    expect(keepClear(100, 8, 400, null).maxHeight).toBe(520);
  });

  it('with no card measured yet it keeps to the window', () => {
    expect(keepClear(500, 700, 400, null)).toEqual({ left: 500, top: 492, maxHeight: 400 });
  });
});
