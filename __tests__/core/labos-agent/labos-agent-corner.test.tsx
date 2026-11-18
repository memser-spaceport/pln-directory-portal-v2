import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentClient } from '@/types/labos-agent.types';

const chat = jest.fn();
const getAccess = jest.fn();
const client: LabosAgentClient = { chat, confirmAction: jest.fn(), getAccess };

jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

// jest.setup.js replaces useQuery with a stub; the access check needs the real one.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

// Markdown pulls in an ESM-only highlighter that Jest cannot parse.
jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

let mockPathname = '/members/m-2';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

const mockCapture = jest.fn();
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: (...args: unknown[]) => mockCapture(...args) }),
}));

let mockPreferences: { memberPreferences: { showFeedbackButton?: boolean } } | undefined;
jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: () => ({ data: mockPreferences, isLoading: false }),
}));

jest.mock('@/services/members/hooks/useSetShowFeedbackButton', () => ({
  useSetShowFeedbackButton: () => jest.fn(),
}));

jest.mock('@/ai-apps-bridge/font-cache', () => ({
  scheduleFontCache: () => () => {},
}));

/* The drawer has its own suite. Here only open and close count. */
jest.mock('@/components/page/ai-apps/components/GiveAiAppFeedbackDialog', () => ({
  GiveAiAppFeedbackDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="feedback-dialog">
        <button type="button" onClick={onClose}>
          Close feedback
        </button>
      </div>
    ) : null,
}));

import { GlobalFeedback } from '@/components/core/GlobalFeedback';
import { LabosAgentRoot } from '@/components/core/labos-agent/LabosAgentRoot/LabosAgentRoot';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedbackDrawerStore } from '@/services/feedback/store';
import { agentShortcutHint, isAgentShortcut, KEY_HINT_QUERY } from '@/services/labos-agent/hooks/useLabosAgentShortcut';
import { toChatContext } from '@/services/labos-agent/labos-agent.service';
import { pageContextFromLocation } from '@/services/labos-agent/labos-agent.page-context';
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

function renderApp(isLoggedIn = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <GlobalFeedback isLoggedIn={isLoggedIn} />
      <LabosAgentRoot />
    </QueryClientProvider>,
  );
}

const signIn = (uid = 'me-1') => act(() => useCurrentUserStore.getState().actions.setCurrentUser({ uid } as IUserInfo));

/** Moves the test page. `usePathname` and `window.location` agree, as in the app. */
const goTo = (url: string) => {
  window.history.pushState({}, '', url);
  mockPathname = new URL(url, 'http://localhost').pathname;
};

const ctrlJ = (target: Window | Element = window) => fireEvent.keyDown(target, { key: 'j', code: 'KeyJ', ctrlKey: true });
const agentTab = () => screen.queryByRole('button', { name: 'Agent' });
const panel = () => screen.queryByRole('complementary', { name: 'Agent' });

describe('LAB-3302: agent corner, Ctrl/⌘ J and context chips', () => {
  beforeEach(() => {
    chat.mockReset().mockResolvedValue(answer);
    getAccess.mockReset().mockResolvedValue({ enabled: true });
    mockCapture.mockReset();
    mockPreferences = { memberPreferences: { showFeedbackButton: true } };
    window.localStorage.clear();
    goTo('/members/m-2');
    useLabosAgentStore.setState({ isOpen: false, context: null, readsPage: true, chats: {} });
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    act(() => useFeedbackDrawerStore.getState().actions.closeDrawer());
  });

  describe('S5-R1: who sees the corner (AC1, AC3)', () => {
    it('a pilot member sees one corner with the Agent and Feedback tabs, and no second feedback button', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();

      expect(await screen.findByRole('group', { name: 'Agent and feedback' })).toBeInTheDocument();
      expect(agentTab()).toHaveAttribute('aria-keyshortcuts', 'Control+J Meta+J');
      expect(screen.getAllByRole('button', { name: 'Give feedback' })).toHaveLength(1);
    });

    it('a member outside the pilot (access enabled: false) keeps the feedback button only', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      getAccess.mockResolvedValue({ enabled: false });
      signIn();
      renderApp();
      await act(async () => {});

      expect(agentTab()).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
    });

    it('with the feature gate off, the member keeps the feedback button only', async () => {
      signIn();
      renderApp();
      await act(async () => {});

      expect(agentTab()).not.toBeInTheDocument();
      expect(getAccess).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
    });

    it('a signed-out visitor sees no corner and no button', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      const { container } = renderApp(false);
      await act(async () => {});

      expect(container).toBeEmptyDOMElement();
      expect(getAccess).not.toHaveBeenCalled();
    });

    it('a member who hid the feedback button keeps the Agent tab only', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      mockPreferences = { memberPreferences: { showFeedbackButton: false } };
      signIn();
      renderApp();

      expect(await screen.findByRole('button', { name: 'Agent' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Give feedback' })).not.toBeInTheDocument();
    });
  });

  describe('S5-R2: the Feedback tab works as before (AC3)', () => {
    it('opens the same drawer with the same feedback-button-click event, and closes the agent', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      fireEvent.click(await screen.findByRole('button', { name: 'Agent' }));
      expect(panel()).toBeInTheDocument();

      act(() => useFeedbackDrawerStore.getState().actions.openDrawer());
      expect(panel()).not.toBeInTheDocument();
      act(() => useFeedbackDrawerStore.getState().actions.closeDrawer());

      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
      expect(screen.getByTestId('feedback-dialog')).toBeInTheDocument();
      expect(mockCapture).toHaveBeenCalledWith(
        'feedback-button-click',
        expect.objectContaining({ source: 'floating-button', page: '/members/m-2' }),
      );
    });

    it('keeps Alt+F, and an agent open closes the drawer', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await screen.findByRole('button', { name: 'Agent' });

      fireEvent.keyDown(window, { key: 'ƒ', code: 'KeyF', altKey: true });
      expect(useFeedbackDrawerStore.getState().open).toBe(true);

      ctrlJ();
      expect(useFeedbackDrawerStore.getState().open).toBe(false);
      expect(panel()).toBeInTheDocument();
    });
  });

  describe('S5-R6: key hint (AC4)', () => {
    const realMatchMedia = window.matchMedia;
    const realUserAgent = navigator.userAgent;
    const setUserAgent = (ua: string) =>
      Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
    /** `fine`: the device has a mouse or trackpad and a screen at least 640 wide. */
    const setDevice = (fine: boolean) => {
      window.matchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: query === KEY_HINT_QUERY ? fine : false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })) as unknown as typeof window.matchMedia;
    };
    const hint = () => agentTab()?.querySelector('kbd') ?? null;

    afterEach(() => {
      window.matchMedia = realMatchMedia;
      setUserAgent(realUserAgent);
    });

    it('a phone or touch device below the tablet breakpoint shows no key hint', async () => {
      setDevice(false);
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();

      expect(await screen.findByRole('group', { name: 'Agent and feedback' })).toBeInTheDocument();
      expect(hint()).toBeNull();
      expect(agentTab()).toHaveAttribute('aria-keyshortcuts', 'Control+J Meta+J');
    });

    it('a desktop on Windows shows "Ctrl J"', async () => {
      setDevice(true);
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();

      await screen.findByRole('group', { name: 'Agent and feedback' });
      expect(hint()).toHaveTextContent(/^Ctrl J$/);
    });

    it('a desktop on a Mac shows "⌘J"', async () => {
      setDevice(true);
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();

      await screen.findByRole('group', { name: 'Agent and feedback' });
      expect(hint()).toHaveTextContent(/^⌘J$/);
    });

    it('maps the modifier label to the hint text', () => {
      expect(agentShortcutHint('⌘')).toBe('⌘J');
      expect(agentShortcutHint('Ctrl')).toBe('Ctrl J');
    });
  });

  describe('S5-R3: Ctrl/⌘ J (AC1)', () => {
    it('opens the agent with the page context, and closes it again', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await screen.findByRole('button', { name: 'Agent' });

      expect(ctrlJ()).toBe(false); // preventDefault ran
      expect(panel()).toBeInTheDocument();
      expect(useLabosAgentStore.getState().context).toEqual({
        page: 'member',
        memberUid: 'm-2',
        label: 'Member profile',
      });
      expect(screen.getByText('Member profile')).toBeInTheDocument();

      // From the agent's own composer, the key closes the panel.
      ctrlJ(screen.getByRole('textbox', { name: 'Message the agent' }));
      expect(panel()).not.toBeInTheDocument();
    });

    it('⌘ J works too', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await screen.findByRole('button', { name: 'Agent' });

      fireEvent.keyDown(window, { key: 'j', code: 'KeyJ', metaKey: true });
      expect(panel()).toBeInTheDocument();
    });

    it('leaves the key to a text field on the page, and to the browser for members without the agent', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      const { unmount } = renderApp();
      await screen.findByRole('button', { name: 'Agent' });
      const field = document.createElement('input');
      document.body.appendChild(field);

      expect(ctrlJ(field)).toBe(true); // not prevented
      expect(panel()).not.toBeInTheDocument();
      field.remove();
      unmount();

      getAccess.mockResolvedValue({ enabled: false });
      renderApp();
      await act(async () => {});
      expect(ctrlJ()).toBe(true);
      expect(panel()).not.toBeInTheDocument();
    });

    it('matches only Ctrl/⌘ J with no Shift, Alt, repeat or IME', () => {
      const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', ...init });
      const opts = { feedbackOpen: false };
      expect(isAgentShortcut(key({ ctrlKey: true }), opts)).toBe(true);
      expect(isAgentShortcut(key({ metaKey: true }), opts)).toBe(true);
      expect(isAgentShortcut(key({}), opts)).toBe(false);
      expect(isAgentShortcut(key({ ctrlKey: true, shiftKey: true }), opts)).toBe(false);
      expect(isAgentShortcut(key({ ctrlKey: true, altKey: true }), opts)).toBe(false);
      expect(isAgentShortcut(key({ ctrlKey: true, repeat: true }), opts)).toBe(false);
      expect(isAgentShortcut(key({ ctrlKey: true, isComposing: true }), opts)).toBe(false);
    });

    it('does not open over another dialog', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await screen.findByRole('button', { name: 'Agent' });
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      document.body.appendChild(dialog);

      expect(ctrlJ()).toBe(true);
      expect(panel()).not.toBeInTheDocument();
      dialog.remove();
    });
  });

  describe('S5-R4: the context chip (AC2)', () => {
    it('shows the current page; after ✕ the C1 body has no page context', async () => {
      goTo('/?news=n-1');
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      fireEvent.click(await screen.findByRole('button', { name: 'Agent' }));

      const composer = screen.getByRole('textbox', { name: 'Message the agent' }) as HTMLTextAreaElement;
      expect(screen.getByText('News story')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Summarize this story'));
      expect(await screen.findByText('Mock answer text')).toBeInTheDocument();
      expect(chat.mock.calls[0][0].context).toEqual({ page: 'news-story', newsUid: 'n-1' });

      fireEvent.click(screen.getByRole('button', { name: 'Stop reading News story' }));
      expect(screen.queryByText('News story', { selector: 'span' })).not.toBeInTheDocument();
      expect(composer).toHaveFocus();
      fireEvent.change(composer, { target: { value: 'And now?' } });
      fireEvent.keyDown(composer, { key: 'Enter' });
      await screen.findAllByText('Mock answer text');
      expect(chat).toHaveBeenCalledTimes(2);
      // The client sends `JSON.stringify(request)`, so an undefined `context` is no field at all.
      expect(chat.mock.calls[1][0].context).toBeUndefined();
      expect(JSON.parse(JSON.stringify(chat.mock.calls[1][0]))).not.toHaveProperty('context');

      // The member can give the page back.
      fireEvent.click(screen.getByRole('button', { name: '+ Read News story' }));
      expect(screen.getByRole('button', { name: 'Stop reading News story' })).toBeInTheDocument();
    });

    it('a new open reads the page again', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      fireEvent.click(await screen.findByRole('button', { name: 'Agent' }));
      fireEvent.click(screen.getByRole('button', { name: 'Stop reading Member profile' }));
      expect(useLabosAgentStore.getState().readsPage).toBe(false);

      fireEvent.click(screen.getByRole('button', { name: 'Close agent' }));
      fireEvent.click(screen.getByRole('button', { name: 'Agent' }));
      expect(useLabosAgentStore.getState().readsPage).toBe(true);
      expect(screen.getByRole('button', { name: 'Stop reading Member profile' })).toBeInTheDocument();
    });
  });

  describe('S5-R5: a11y', () => {
    it('Escape closes the panel and focus goes back to the Agent tab', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      fireEvent.click(await screen.findByRole('button', { name: 'Agent' }));
      const composer = screen.getByRole('textbox', { name: 'Message the agent' });
      expect(composer).toHaveFocus();

      fireEvent.keyDown(composer, { key: 'Escape' });
      expect(panel()).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Agent' })).toHaveFocus();
    });
  });

  describe('S5-R6: each page type maps to its context', () => {
    it.each([
      ['/', '', { page: 'home', label: 'Home' }, { page: 'home' }],
      [
        '/',
        '?news=n-1',
        { page: 'news-story', newsUid: 'n-1', label: 'News story' },
        { page: 'news-story', newsUid: 'n-1' },
      ],
      ['/members/m-2', '', { page: 'member', memberUid: 'm-2', label: 'Member profile' }, { page: 'home' }],
      ['/members/me-1', '', { page: 'profile', label: 'Your profile' }, { page: 'home' }],
      ['/settings/profile', '', { page: 'profile', label: 'Your profile' }, { page: 'home' }],
      ['/teams/t-1', '', { page: 'team', teamUid: 't-1', label: 'Team page' }, { page: 'home' }],
      ['/teams/t-1/applicants', '', { page: 'team', teamUid: 't-1', label: 'Team page' }, { page: 'home' }],
      ['/jobs/openings/j-1', '', { page: 'job', jobUid: 'j-1', label: 'Job post' }, { page: 'home' }],
      ['/jobs', '?q=rust', { page: 'job', label: 'Jobs' }, { page: 'home' }],
    ])('%s%s', (pathname, search, open, wire) => {
      const context = pageContextFromLocation(pathname, search, 'me-1');
      expect(context).toEqual(open);
      expect(toChatContext(context)).toEqual(wire);
    });

    it.each(['/members', '/members/browse', '/teams', '/teams/add', '/events', '/forum'])(
      '%s has no page context (no chip)',
      (pathname) => {
        expect(pageContextFromLocation(pathname, '', 'me-1')).toBeNull();
        expect(toChatContext(null)).toBeUndefined();
      },
    );
  });
});
