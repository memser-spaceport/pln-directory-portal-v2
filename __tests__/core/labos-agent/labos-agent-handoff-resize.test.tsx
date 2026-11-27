import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentClient } from '@/types/labos-agent.types';

/*
 * LAB-3429 (design LAB-3389, prototype `prototypes/entries/agent`): "AI agent chat" in the agent header, the history
 * link, the resizable slot, the page chip wording and the picker heading.
 */

const chat = jest.fn();
const getAccess = jest.fn();
const searchMentions = jest.fn();
const client: LabosAgentClient = { chat, confirmAction: jest.fn(), getAccess, searchMentions };

jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

// LAB-3457: nothing is saved by the panel on open: `customFetch` (the signed-in fetch) stays unused.
const customFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: (...args: unknown[]) => customFetch(...args) }));

jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));
jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({ useCanRequestIntro: () => false }));
jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

let mockPathname = '/members/m-2';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

const mockCapture = jest.fn();
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: (...args: unknown[]) => mockCapture(...args) }),
}));

jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: () => ({ data: { memberPreferences: { showFeedbackButton: true } }, isLoading: false }),
}));
jest.mock('@/services/members/hooks/useSetShowFeedbackButton', () => ({ useSetShowFeedbackButton: () => jest.fn() }));
jest.mock('@/ai-apps-bridge/font-cache', () => ({ scheduleFontCache: () => () => {} }));

/* The drawer has its own suite. Here: open, and whether it is told to wear the agent width. */
const mockDialogProps = jest.fn();
jest.mock('@/components/page/ai-apps/components/GiveAiAppFeedbackDialog', () => ({
  GiveAiAppFeedbackDialog: (props: { isOpen: boolean; followAgentWidth?: boolean }) => {
    mockDialogProps(props);
    return props.isOpen ? <div data-testid="feedback-dialog" /> : null;
  },
}));

import { GlobalFeedback } from '@/components/core/GlobalFeedback';
import { LabosAgentRoot } from '@/components/core/labos-agent/LabosAgentRoot/LabosAgentRoot';
import { FeedbackDrawerFrame } from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/FeedbackDrawerFrame';
import { AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX } from '@/components/constants/aiSearchHandoff';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedbackDrawerStore } from '@/services/feedback/store';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';
import { isUnreadablePage } from '@/services/labos-agent/labos-agent.page-context';
import { clampWidth, maxWidthFor, useLabosAgentWidthStore } from '@/services/labos-agent/labos-agent.width';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { IUserInfo } from '@/types/shared.types';

const answer = {
  steps: ['Writing the answer'],
  content: 'Mock answer text',
  sources: [],
  sourceRefs: [],
  followUpQuestions: [],
  actions: [],
  proposals: [],
};

const PROMPT = 'What happened in the network this week?';

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <GlobalFeedback isLoggedIn />
      <LabosAgentRoot />
    </QueryClientProvider>,
  );
}

const signIn = (uid = 'me-1') => act(() => useCurrentUserStore.getState().actions.setCurrentUser({ uid } as IUserInfo));

const goTo = (url: string) => {
  window.history.pushState({}, '', url);
  mockPathname = new URL(url, 'http://localhost').pathname;
};

const setWindowWidth = (width: number) =>
  act(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
    window.dispatchEvent(new Event('resize'));
  });

async function openAgent() {
  fireEvent.click(await screen.findByRole('button', { name: 'Agent' }));
  return screen.getByRole('complementary', { name: 'Agent' });
}

async function askOnce() {
  fireEvent.click(screen.getByRole('button', { name: PROMPT }));
  await screen.findByText('Mock answer text');
}

const handoffButton = () => screen.getByRole('button', { name: 'Open in AI agent chat (new tab)' });

/** The tab `window.open('', '_blank')` gives back, as a browser does. */
function fakeTab() {
  return { opener: {} as unknown, closed: false, close: jest.fn(), location: { href: '' } };
}

const ok = (body: unknown = {}) => ({ ok: true, status: 200, json: async () => body });

const captured = (event: string) => mockCapture.mock.calls.filter(([name]) => name === event).map(([, props]) => props);

/* jsdom has no PointerEvent, so fireEvent.pointer* would carry no `button` or `clientX`. A MouseEvent with an id. */
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent = PointerEventPolyfill;
}

let openSpy: jest.SpyInstance;
const fetchSpy = jest.fn();
/* Spies on shared prototypes (Storage) are restored after each test, also when the test fails, so none leaks. */
const spies: jest.SpyInstance[] = [];
const restoreLater = <T extends jest.SpyInstance>(spy: T): T => {
  spies.push(spy);
  return spy;
};

beforeEach(() => {
  chat.mockReset().mockResolvedValue(answer);
  getAccess.mockReset().mockResolvedValue({ enabled: true });
  searchMentions.mockReset().mockResolvedValue({ members: [], teams: [], news: [] });
  customFetch.mockReset().mockResolvedValue(ok());
  fetchSpy.mockReset().mockResolvedValue(ok({ name: 'Maya Okonkwo' }));
  global.fetch = fetchSpy as unknown as typeof fetch;
  mockCapture.mockReset();
  mockDialogProps.mockReset();
  window.localStorage.clear();
  goTo('/members/m-2');
  setWindowWidth(1440);
  openSpy = jest.spyOn(window, 'open').mockImplementation(() => fakeTab() as unknown as Window);
  useLabosAgentStore.setState({ isOpen: false, context: null, readsPage: true, pageLocked: false, chats: {} });
  useLabosAgentWidthStore.setState({ preferred: null });
  useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
  act(() => useFeedbackDrawerStore.getState().actions.closeDrawer());
  window.localStorage.setItem('labos-agent', 'on');
  signIn();
});

afterEach(() => {
  openSpy.mockRestore();
  spies.splice(0).forEach((spy) => spy.mockRestore());
});

describe('LAB-3457: AI agent chat in the header opens the same chat on the full page', () => {
  it('is disabled with the "ask first" tooltip until the chat has one saved answer', async () => {
    renderApp();
    await openAgent();

    const button = handoffButton();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('title', 'Ask something first, then continue in AI agent chat');
    expect(button).toHaveTextContent('AI agent chat');

    fireEvent.click(button);
    expect(openSpy).not.toHaveBeenCalled();
    expect(captured('agent-open-ai-search-clicked')).toHaveLength(0);

    await askOnce();
    expect(handoffButton()).toHaveAttribute('aria-disabled', 'false');
    expect(handoffButton()).toHaveAttribute('title', 'Open this chat in AI agent chat (new tab)');
  });

  it("opens /ai-search/<the chat's own thread> in a new tab: nothing is copied, saved or asked again", async () => {
    goTo('/');
    const tab = fakeTab();
    openSpy.mockImplementation(() => tab as unknown as Window);
    renderApp();
    await openAgent();
    await askOnce();
    const composer = screen.getByRole('textbox', { name: 'Message the agent' });
    fireEvent.change(composer, { target: { value: 'And who funds it?' } });
    fireEvent.keyDown(composer, { key: 'Enter' });
    await waitFor(() => expect(screen.getAllByText('Mock answer text')).toHaveLength(2));

    fireEvent.click(handoffButton());

    // Both turns went to C1 with one thread, saved (`persist`); that thread opens.
    const [first, second] = chat.mock.calls.map(([request]) => request);
    // QA1: C1 knows the turns come from the panel (`surface: 'panel'`).
    expect(first).toMatchObject({ persist: true, surface: 'panel' });
    expect(second).toMatchObject({ surface: 'panel' });
    expect(second.threadId).toBe(first.threadId);
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(`/ai-search/${first.threadId}`, '_blank');
    expect(tab.opener).toBeNull();
    expect(customFetch).not.toHaveBeenCalled();
    expect(
      Object.keys(window.localStorage).filter((k) => k.startsWith(AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX)),
    ).toEqual([]);

    // The agent chat is unchanged.
    expect(screen.getAllByText('Mock answer text')).toHaveLength(2);
    expect(captured('agent-open-ai-search-clicked')).toEqual([
      expect.objectContaining({ questionCount: 2, pageType: 'other' }),
    ]);
    // No question text goes in the event.
    expect(JSON.stringify(captured('agent-open-ai-search-clicked'))).not.toContain('network');
  });

  it('a failed turn is not saved: it does not count, and a chat with no saved turn cannot open', async () => {
    goTo('/');
    chat.mockRejectedValueOnce(new LabosAgentError(500, 'UNKNOWN', 'Server error'));
    renderApp();
    await openAgent();
    fireEvent.click(screen.getByRole('button', { name: PROMPT }));
    await screen.findByText('The agent did not finish the answer.');
    expect(handoffButton()).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(handoffButton());
    expect(openSpy).not.toHaveBeenCalled();

    const composer = screen.getByRole('textbox', { name: 'Message the agent' });
    fireEvent.change(composer, { target: { value: 'And who funds it?' } });
    fireEvent.keyDown(composer, { key: 'Enter' });
    await screen.findByText('Mock answer text');
    fireEvent.click(handoffButton());
    expect(openSpy).toHaveBeenCalledWith(`/ai-search/${chat.mock.calls[1][0].threadId}`, '_blank');
    expect(captured('agent-open-ai-search-clicked')[0]).toMatchObject({ questionCount: 1 });
  });

  it('after a THREAD_NOT_FOUND restart, it opens the new thread', async () => {
    goTo('/');
    chat
      .mockResolvedValueOnce(answer)
      .mockRejectedValueOnce(new LabosAgentError(404, 'THREAD_NOT_FOUND', 'Gone'))
      .mockResolvedValueOnce({ ...answer, content: 'Second answer' });
    renderApp();
    await openAgent();
    await askOnce();
    const composer = screen.getByRole('textbox', { name: 'Message the agent' });
    fireEvent.change(composer, { target: { value: 'And who funds it?' } });
    fireEvent.keyDown(composer, { key: 'Enter' });
    await screen.findByText('Second answer');

    const renewed = chat.mock.calls[2][0].threadId;
    expect(renewed).not.toBe(chat.mock.calls[0][0].threadId);
    fireEvent.click(handoffButton());
    expect(openSpy).toHaveBeenCalledWith(`/ai-search/${renewed}`, '_blank');
  });
});

describe('LAB-3429 Decision 2: the history link', () => {
  it('the History menu holds only "All AI agent chats ↗", which opens /ai-search with History open in a new tab', async () => {
    renderApp();
    await openAgent();

    fireEvent.click(screen.getByRole('button', { name: 'Agent history' }));
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveAccessibleName('All AI agent chats (opens in a new tab)');
    expect(items[0]).toHaveTextContent('All AI agent chats');

    fireEvent.click(items[0]);
    expect(openSpy).toHaveBeenCalledWith('/ai-search?history=open', '_blank');
  });
});

describe('LAB-3429 Decision 4: the page chip', () => {
  it('attached reads "Context <page> ✕"; removed reads "Not in context <page> +" and one press adds it back', async () => {
    renderApp();
    await openAgent();

    const row = screen.getByRole('group', { name: 'What the agent reads' });
    expect(row).toHaveTextContent('ContextMember profile');
    // The prototype's title (agent/AgentChat.tsx).
    expect(within(row).getByTitle('The agent reads Member profile with every question')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Stop reading Member profile' }));

    const addBack = within(row).getByRole('button', { name: 'Let the agent read Member profile again' });
    expect(addBack).toHaveTextContent('Not in contextMember profile');
    expect(useLabosAgentStore.getState().readsPage).toBe(false);

    fireEvent.click(addBack);
    expect(useLabosAgentStore.getState().readsPage).toBe(true);
    expect(within(row).getByRole('button', { name: 'Stop reading Member profile' })).toBeInTheDocument();
  });

  it.each(['/settings/email', '/settings/privacy', '/notifications'])(
    '%s: "Can’t read this page", with nothing to press, and no page context',
    async (path) => {
      goTo(path);
      renderApp();
      await openAgent();

      const row = screen.getByRole('group', { name: 'What the agent reads' });
      expect(row).toHaveTextContent('Can’t read this page');
      expect(within(row).queryByRole('button', { name: /read/i })).not.toBeInTheDocument();

      await askOnce();
      expect(chat.mock.calls[0][0].context).toBeUndefined();
    },
  );

  it('a page the agent knows nothing about shows no chip, as before', async () => {
    goTo('/events');
    renderApp();
    await openAgent();
    expect(screen.getByRole('group', { name: 'What the agent reads' })).not.toHaveTextContent('Can’t read this page');
  });

  it('isUnreadablePage: settings and notifications, not the own-profile settings page', () => {
    expect(isUnreadablePage('/settings')).toBe(true);
    expect(isUnreadablePage('/settings/email/')).toBe(true);
    expect(isUnreadablePage('/notifications')).toBe(true);
    expect(isUnreadablePage('/settings/profile')).toBe(false);
    expect(isUnreadablePage('/settingsx')).toBe(false);
    expect(isUnreadablePage('/members/m-1')).toBe(false);
  });
});

describe('LAB-3429 Decision 5: the picker heading', () => {
  it('opens with "Add context" above the search field from + and from @', async () => {
    renderApp();
    await openAgent();

    fireEvent.click(screen.getByRole('button', { name: 'Add context' }));
    let picker = screen.getByRole('dialog', { name: 'Add context' });
    const heading = within(picker).getByText('Add context');
    const search = within(picker).getByRole('combobox', { name: 'Search what to add' });
    expect(heading.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add context' }));

    const composer = screen.getByRole('textbox', { name: 'Message the agent' }) as HTMLTextAreaElement;
    fireEvent.change(composer, { target: { value: '@', selectionStart: 1 } });
    picker = await screen.findByRole('dialog', { name: 'Add context' });
    expect(within(picker).getByText('Add context')).toBeInTheDocument();
  });
});

describe('LAB-3429 Decision 3: resize', () => {
  const handle = () => screen.queryByRole('separator', { name: 'Resize the agent panel' });
  const cssWidth = () => document.documentElement.style.getPropertyValue('--labos-agent-w');

  it('limits: 440 min, 720 max, and the page keeps 480 beside the panel', () => {
    expect(maxWidthFor(1440)).toBe(720);
    expect(maxWidthFor(1100)).toBe(620);
    expect(maxWidthFor(960)).toBe(480);
    expect(maxWidthFor(900)).toBe(440);
    expect(clampWidth(300, 1440)).toBe(440);
    expect(clampWidth(900, 1440)).toBe(720);
    expect(clampWidth(700, 1100)).toBe(620);
  });

  it('at 1440 opens at 600; arrow keys resize it, Home and End go to the limits, a double-click resets', async () => {
    renderApp();
    await openAgent();

    const edge = handle() as HTMLElement;
    expect(edge).toHaveAttribute('aria-valuenow', '600');
    expect(edge).toHaveAttribute('aria-valuemin', '440');
    expect(edge).toHaveAttribute('aria-valuemax', '720');
    expect(edge).toHaveAttribute('tabindex', '0');
    expect(cssWidth()).toBe('600px');

    fireEvent.keyDown(edge, { key: 'ArrowLeft' });
    expect(edge).toHaveAttribute('aria-valuenow', '624');
    fireEvent.keyDown(edge, { key: 'ArrowLeft', shiftKey: true });
    expect(edge).toHaveAttribute('aria-valuenow', '720');
    fireEvent.keyDown(edge, { key: 'ArrowRight' });
    expect(edge).toHaveAttribute('aria-valuenow', '696');
    fireEvent.keyDown(edge, { key: 'Home' });
    expect(edge).toHaveAttribute('aria-valuenow', '440');
    expect(cssWidth()).toBe('440px');
    expect(window.localStorage.getItem('labos-agent-width')).toBe('440');
    fireEvent.keyDown(edge, { key: 'End' });
    expect(edge).toHaveAttribute('aria-valuenow', '720');

    fireEvent.doubleClick(edge);
    expect(edge).toHaveAttribute('aria-valuenow', '600');
    // The default is not stored.
    expect(window.localStorage.getItem('labos-agent-width')).toBeNull();

    const events = captured('agent-panel-resized');
    expect(events.map((p) => p.method)).toEqual(['keyboard', 'keyboard', 'keyboard', 'keyboard', 'keyboard', 'reset']);
    expect(events[events.length - 1]).toMatchObject({ width: 600, tab: 'agent' });
  });

  it('a drag left stops at 720 and the page keeps at least 480; the drag commits once, at the end', async () => {
    renderApp();
    await openAgent();
    const edge = handle() as HTMLElement;

    fireEvent.pointerDown(edge, { button: 0, pointerId: 1, clientX: 840 });
    fireEvent.pointerMove(edge, { pointerId: 1, clientX: 100 });
    expect(edge).toHaveAttribute('aria-valuenow', '720');
    expect(edge).toHaveAttribute('data-dragging');
    expect(captured('agent-panel-resized')).toHaveLength(0);
    fireEvent.pointerMove(edge, { pointerId: 1, clientX: 1440 - 500 });
    fireEvent.pointerUp(edge, { pointerId: 1 });

    expect(edge).toHaveAttribute('aria-valuenow', '500');
    expect(edge).not.toHaveAttribute('data-dragging');
    expect(window.localStorage.getItem('labos-agent-width')).toBe('500');
    expect(captured('agent-panel-resized')).toEqual([expect.objectContaining({ width: 500, method: 'drag' })]);

    // A narrower window: the page keeps 480, so 1000 allows 520. The 500 choice still fits.
    setWindowWidth(1000);
    expect(edge).toHaveAttribute('aria-valuenow', '500');
    fireEvent.keyDown(edge, { key: 'End' });
    expect(edge).toHaveAttribute('aria-valuenow', '520');
  });

  it('a plain click on the edge is no resize: nothing is stored and no event is sent', async () => {
    renderApp();
    await openAgent();
    const edge = handle() as HTMLElement;

    fireEvent.pointerDown(edge, { button: 0, pointerId: 1, clientX: 840 });
    fireEvent.pointerUp(edge, { pointerId: 1, clientX: 840 });
    fireEvent.click(edge);

    expect(edge).toHaveAttribute('aria-valuenow', '600');
    expect(window.localStorage.getItem('labos-agent-width')).toBeNull();
    expect(captured('agent-panel-resized')).toHaveLength(0);
  });

  it('a real double-click (two presses, then dblclick) sends one reset and no drag', async () => {
    window.localStorage.setItem('labos-agent-width', '512');
    renderApp();
    await openAgent();
    const edge = handle() as HTMLElement;
    expect(edge).toHaveAttribute('aria-valuenow', '512');

    for (let i = 0; i < 2; i += 1) {
      fireEvent.pointerDown(edge, { button: 0, pointerId: 1, clientX: 928 });
      fireEvent.pointerUp(edge, { pointerId: 1, clientX: 928 });
      fireEvent.click(edge, { detail: i + 1 });
    }
    fireEvent.doubleClick(edge, { detail: 2 });

    expect(edge).toHaveAttribute('aria-valuenow', '600');
    expect(window.localStorage.getItem('labos-agent-width')).toBeNull();
    expect(captured('agent-panel-resized')).toEqual([expect.objectContaining({ width: 600, method: 'reset' })]);
  });

  it('keeps the width after a reload (localStorage) and survives blocked storage', async () => {
    window.localStorage.setItem('labos-agent-width', '512');
    const { unmount } = renderApp();
    await openAgent();
    expect(handle()).toHaveAttribute('aria-valuenow', '512');
    unmount();

    restoreLater(
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
        if (key === 'labos-agent-width') throw new Error('SecurityError');
        return key === 'labos-agent' ? 'on' : null;
      }),
    );
    useLabosAgentStore.setState({ isOpen: false });
    renderApp();
    await openAgent();
    expect(handle()).toHaveAttribute('aria-valuenow', '600');
  });

  it('below 960px the panel is a sheet with no edge', async () => {
    setWindowWidth(959);
    renderApp();
    await openAgent();
    expect(handle()).not.toBeInTheDocument();

    setWindowWidth(960);
    expect(handle()).toHaveAttribute('aria-valuenow', '480');

    setWindowWidth(390);
    expect(handle()).not.toBeInTheDocument();
  });

  it('the Feedback tab follows the same width: it is told to, and the edge resizes it too', async () => {
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Give feedback' }));
    expect(await screen.findByTestId('feedback-dialog')).toBeInTheDocument();
    expect(mockDialogProps).toHaveBeenLastCalledWith(expect.objectContaining({ followAgentWidth: true }));

    const edge = handle() as HTMLElement;
    fireEvent.keyDown(edge, { key: 'ArrowLeft' });
    expect(captured('agent-panel-resized')).toEqual([expect.objectContaining({ width: 624, tab: 'feedback' })]);
    expect(document.documentElement.style.getPropertyValue('--labos-agent-w')).toBe('624px');
  });

  it('the feedback drawer wears the agent width only when told to, and never in its Wider mode', () => {
    const { rerender } = render(
      <FeedbackDrawerFrame isOpen wide={false} hidden={false} reserveSpace={false} followAgentWidth label="Feedback">
        x
      </FeedbackDrawerFrame>,
    );
    expect(screen.getByRole('dialog', { name: 'Feedback' })).toHaveClass('panelNarrow', 'panelAgentWidth');

    rerender(
      <FeedbackDrawerFrame isOpen wide hidden={false} reserveSpace={false} followAgentWidth label="Feedback">
        x
      </FeedbackDrawerFrame>,
    );
    expect(screen.getByRole('dialog', { name: 'Feedback' })).not.toHaveClass('panelAgentWidth');

    rerender(
      <FeedbackDrawerFrame isOpen wide={false} hidden={false} reserveSpace={false} label="Feedback">
        x
      </FeedbackDrawerFrame>,
    );
    expect(screen.getByRole('dialog', { name: 'Feedback' })).not.toHaveClass('panelAgentWidth');
  });
});
