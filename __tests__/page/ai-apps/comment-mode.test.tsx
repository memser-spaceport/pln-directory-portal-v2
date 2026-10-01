import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BRIDGE_NS, BRIDGE_VERSION } from '@/ai-apps-bridge/protocol';
import { CommentMode } from '@/components/page/ai-apps/components/element-pins';
import type { OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';

const mockUpdateStatus = jest.fn();
jest.mock('@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus', () => ({
  useUpdateAiAppFeedbackStatus: () => ({ mutate: mockUpdateStatus, isPending: false, variables: undefined }),
}));

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

const LOCATE_READY = { capabilities: ['pick', 'describe', 'crop', 'locate'], session: 's1' };

function setup(props: Partial<React.ComponentProps<typeof CommentMode>> = {}) {
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
  const handlers = {
    onOpenPinChange: jest.fn(),
    onGoToPage: jest.fn(),
    onExit: jest.fn(),
    onLeaveFeedback: jest.fn(),
  };
  const view = render(
    <CommentMode
      appUid="app-1"
      appName="Grant Tracker"
      iframeRef={{ current: iframe }}
      appOrigin={APP}
      frameKey="gen-1"
      pins={[
        stored('a'),
        stored('b', { pagePath: '/other' }),
        stored('c', { feedback: { ...stored('c').feedback, status: 'IMPLEMENTED' } }),
      ]}
      canManage
      currentPath="/pins"
      currentEnv="prod"
      active
      openPinUid={null}
      {...handlers}
      {...props}
    />,
  );
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
  return { ...view, ...handlers, fromApp, cleanup: () => iframe.remove() };
}

const placeAll = (t: ReturnType<typeof setup>) => {
  t.fromApp('ready', LOCATE_READY);
  t.fromApp('locate:result', {
    results: {
      a: { pinId: 'loc-1', rect: { x: 100, y: 200, w: 80, h: 40 } },
      c: { pinId: 'loc-2', rect: { x: 300, y: 200, w: 80, h: 40 } },
    },
  });
};

describe('CommentMode', () => {
  beforeEach(() => mockUpdateStatus.mockReset());

  it('draws each found comment as its author’s initials, at the spot that was clicked', () => {
    const t = setup();
    placeAll(t);
    const pin = screen.getAllByRole('button', { name: 'Comment by Ada Lovelace' })[0];
    expect(pin).toHaveTextContent('AL');
    /* x 100 + 80 × 0.5, y 200 + 40 × 0.25 */
    expect(pin).toHaveStyle({ left: '140px', top: '210px' });
    t.cleanup();
  });

  it('keeps Shipped comments on the page, faded', () => {
    const t = setup();
    placeAll(t);
    const [newPin, shippedPin] = screen.getAllByRole('button', { name: 'Comment by Ada Lovelace' });
    expect(newPin.className).not.toMatch(/pinShipped/);
    expect(shippedPin.className).toMatch(/pinShipped/);
    t.cleanup();
  });

  it('opens a comment’s thread, where the creator sets its status', () => {
    const t = setup({ openPinUid: 'a' });
    placeAll(t);
    const thread = screen.getByRole('dialog', { name: 'Comment by Ada Lovelace' });
    expect(thread).toHaveTextContent('Note a');
    expect(screen.getByAltText('The part of the app this comment points at')).toBeInTheDocument();
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
    /* The open thread is NEW: no badge. The unplaced one is Reviewed: a badge. */
    expect(screen.getByRole('dialog')).not.toHaveTextContent('New');
    fireEvent.click(screen.getByRole('button', { name: /Not on screen/ }));
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    t.cleanup();
  });

  it('lists comments it can’t draw: not found here, and other pages with Go to page', () => {
    const t = setup();
    t.fromApp('ready', LOCATE_READY);
    t.fromApp('locate:result', { results: { a: null, c: null } });
    const toggle = screen.getByRole('button', { name: 'Not on screen (3)' });
    fireEvent.click(toggle);
    expect(screen.getByText('Not found on this page')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go to page' }));
    expect(t.onGoToPage).toHaveBeenCalledWith('/other');
    t.cleanup();
  });

  it('Esc closes an open thread first, without leaving the mode', () => {
    const t = setup({ openPinUid: 'a' });
    placeAll(t);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(t.onOpenPinChange).toHaveBeenCalledWith(null);
    expect(t.onExit).not.toHaveBeenCalled();
    t.unmount();
    t.cleanup();
  });

  it('Esc with no thread open leaves the mode', () => {
    const t = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(t.onExit).toHaveBeenCalled();
    t.unmount();
    t.cleanup();
  });

  it('starts today’s flow from the dock', () => {
    const t = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Leave feedback' }));
    expect(t.onLeaveFeedback).toHaveBeenCalled();
    t.cleanup();
  });

  it('draws nothing while the mode is off', () => {
    const t = setup({ active: false });
    expect(screen.queryByTestId('comment-mode-layer')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Feedback on this app' })).not.toBeInTheDocument();
    t.cleanup();
  });
});
