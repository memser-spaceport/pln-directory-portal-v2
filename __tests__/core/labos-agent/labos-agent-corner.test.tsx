import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentClient } from '@/types/labos-agent.types';

const chat = jest.fn();
const getAccess = jest.fn();
const client: LabosAgentClient = { chat, confirmAction: jest.fn(), getAccess, searchMentions: jest.fn() };

jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

// jest.setup.js replaces useQuery with a stub; the access check needs the real one.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

// LAB-3318: the composer placeholder reads the intro role. Its real queries call the network and sign the test out.
jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({ useCanRequestIntro: () => false }));

// Markdown pulls in an ESM-only highlighter that Jest cannot parse.
jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

let mockPathname = '/members/m-2';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  // LAB-3298 D1: a LabOS source opens with router.push.
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
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
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';
import { toChatContext } from '@/services/labos-agent/labos-agent.service';
import { pageContextFromLocation } from '@/services/labos-agent/labos-agent.page-context';
import { chatKey, useLabosAgentStore } from '@/services/labos-agent/store';
import { isBlockingDialogOpen } from '@/services/labos-agent/labos-agent.dialogs';
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

const ctrlJ = (target: Window | Element = window) =>
  fireEvent.keyDown(target, { key: 'j', code: 'KeyJ', ctrlKey: true });
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
    it('LAB-3344: with no localStorage value, a member that GET /access allows sees the corner', async () => {
      signIn();
      renderApp();

      expect(await screen.findByRole('group', { name: 'Agent and feedback' })).toBeInTheDocument();
      expect(getAccess).toHaveBeenCalled();
      expect(agentTab()).toBeInTheDocument();
    });

    it('LAB-3344: with no localStorage value, a member that GET /access refuses sees no agent', async () => {
      getAccess.mockResolvedValue({ enabled: false });
      signIn();
      renderApp();

      expect(await screen.findByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
      expect(getAccess).toHaveBeenCalled();
      expect(agentTab()).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Agent and feedback' })).not.toBeInTheDocument();
    });

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

      // Feedback shows only after GET /access answers (no flash), so wait for it.
      expect(await screen.findByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
      expect(agentTab()).not.toBeInTheDocument();
    });

    it("with the feature gate off (localStorage['labos-agent'] = 'off'), the member keeps the feedback button only", async () => {
      window.localStorage.setItem('labos-agent', 'off');
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

  describe('S5-R5: key hint (AC4)', () => {
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
      // Wait for GET /access to answer no, so the check runs on the settled state.
      await screen.findByRole('button', { name: 'Give feedback' });
      expect(agentTab()).not.toBeInTheDocument();
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
    it('S5-C28: shows the current page; after ✕ the C1 body has no page context', async () => {
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
      // LAB-3429: the chip stays, dashed, as "Not in context News story +".
      expect(screen.queryByRole('button', { name: 'Stop reading News story' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Let the agent read News story again' })).toHaveTextContent(
        'Not in contextNews story',
      );
      expect(composer).toHaveFocus();
      fireEvent.change(composer, { target: { value: 'And now?' } });
      fireEvent.keyDown(composer, { key: 'Enter' });
      await screen.findAllByText('Mock answer text');
      expect(chat).toHaveBeenCalledTimes(2);
      // The client sends `JSON.stringify(request)`, so an undefined `context` is no field at all.
      expect(chat.mock.calls[1][0].context).toBeUndefined();
      expect(JSON.parse(JSON.stringify(chat.mock.calls[1][0]))).not.toHaveProperty('context');

      // The member can give the page back.
      fireEvent.click(screen.getByRole('button', { name: 'Let the agent read News story again' }));
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

  describe('S5-C29: the agent cannot read the page (C1 404)', () => {
    it.each([
      ['MEMBER_NOT_FOUND', '/members/missing-1', 'Member profile'],
      ['TEAM_NOT_FOUND', '/teams/missing-1', 'Team page'],
      ['JOB_NOT_FOUND', '/jobs/openings/missing-1', 'Job post'],
    ] as const)('%s: the panel tells the member to remove the chip and keeps the text', async (code, url, label) => {
      goTo(url);
      chat.mockRejectedValueOnce(new LabosAgentError(404, code, 'Not found.'));
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      fireEvent.click(await screen.findByRole('button', { name: 'Agent' }));

      const composer = screen.getByRole('textbox', { name: 'Message the agent' }) as HTMLTextAreaElement;
      fireEvent.change(composer, { target: { value: 'What does this page say?' } });
      fireEvent.keyDown(composer, { key: 'Enter' });

      expect(
        await screen.findByText('The agent cannot read this page. Remove the page chip and ask again.'),
      ).toBeInTheDocument();
      // The turn keeps the text, and the text comes back in the composer.
      expect(screen.getByText('What does this page say?', { selector: ':not(textarea)' })).toBeInTheDocument();
      expect(composer.value).toBe('What does this page say?');

      // The member removes the chip and sends again: C1 gets no context.
      fireEvent.click(screen.getByRole('button', { name: `Stop reading ${label}` }));
      fireEvent.keyDown(composer, { key: 'Enter' });
      expect(await screen.findByText('Mock answer text')).toBeInTheDocument();
      expect(chat).toHaveBeenCalledTimes(2);
      expect(chat.mock.calls[1][0].context).toBeUndefined();
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

  describe('S5-R6: each page type maps to its context (contract change 3)', () => {
    it.each([
      ['/', '', { page: 'home', label: 'Home' }, { page: 'home' }],
      [
        '/',
        '?news=n-1',
        { page: 'news-story', newsUid: 'n-1', label: 'News story' },
        { page: 'news-story', newsUid: 'n-1' },
      ],
      [
        '/members/m-2',
        '',
        { page: 'member', memberUid: 'm-2', label: 'Member profile' },
        { page: 'member', memberUid: 'm-2' },
      ],
      ['/teams/t-1', '', { page: 'team', teamUid: 't-1', label: 'Team page' }, { page: 'team', teamUid: 't-1' }],
      [
        '/teams/t-1/applicants',
        '',
        { page: 'team', teamUid: 't-1', label: 'Team page' },
        { page: 'team', teamUid: 't-1' },
      ],
      ['/jobs/openings/j-1', '', { page: 'job', jobUid: 'j-1', label: 'Job post' }, { page: 'job', jobUid: 'j-1' }],
    ])('S5-C25: %s%s sends its page and id, not home', (pathname, search, open, wire) => {
      const context = pageContextFromLocation(pathname, search, 'me-1');
      expect(context).toEqual(open);
      expect(toChatContext(context)).toEqual(wire);
    });

    it('S5-C26: /jobs sends { page: "job" } with no jobUid', () => {
      const wire = toChatContext(pageContextFromLocation('/jobs', '?q=rust', 'me-1'));
      expect(wire).toEqual({ page: 'job' });
      expect(wire).not.toHaveProperty('jobUid');
    });

    it.each(['/settings/profile', '/members/me-1'])('S5-C27: %s sends { page: "profile" } with no id', (pathname) => {
      const context = pageContextFromLocation(pathname, '', 'me-1');
      expect(context).toEqual({ page: 'profile', label: 'Your profile' });
      expect(JSON.parse(JSON.stringify(toChatContext(context)))).toStrictEqual({ page: 'profile' });
    });

    it.each(['/members', '/members/browse', '/teams', '/teams/add', '/events', '/forum'])(
      '%s has no page context (no chip)',
      (pathname) => {
        expect(pageContextFromLocation(pathname, '', 'me-1')).toBeNull();
        expect(toChatContext(null)).toBeUndefined();
      },
    );
  });

  describe('Oleg review: job drawer, story modal, access flash, guards, page 404 reopen', () => {
    /** A mock of the story `Modal`: overlay with `data-modal`, a dialog container, the passthrough marker. */
    const openStoryModal = () => {
      const overlay = document.createElement('div');
      overlay.setAttribute('data-modal', '');
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      const marker = document.createElement('span');
      marker.hidden = true;
      marker.setAttribute('data-labos-agent-passthrough', '');
      dialog.appendChild(marker);
      overlay.appendChild(dialog);
      act(() => {
        document.body.appendChild(overlay);
      });
      return overlay;
    };
    const realMatchMedia = window.matchMedia;
    const setWide = (wide: boolean) => {
      window.matchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: query === '(min-width: 960px)' ? wide : false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })) as unknown as typeof window.matchMedia;
    };
    afterEach(() => {
      window.matchMedia = realMatchMedia;
      document.querySelectorAll('[data-modal], [role="dialog"]').forEach((el) => el.remove());
    });

    it('S5-R6: the job drawer /jobs?job=<uid> sends that job, not the board', () => {
      const context = pageContextFromLocation('/jobs', '?job=j-9&q=rust', 'me-1');
      expect(context).toEqual({ page: 'job', jobUid: 'j-9', label: 'Job post' });
      expect(toChatContext(context)).toEqual({ page: 'job', jobUid: 'j-9' });
    });

    it('S5-R6: a broken escape in the path gives no context and does not throw', () => {
      expect(() => pageContextFromLocation('/members/%E0%A4%A', '', 'me-1')).not.toThrow();
      expect(pageContextFromLocation('/members/%E0%A4%A', '', 'me-1')).toBeNull();
      expect(pageContextFromLocation('/teams/t%2F1', '', 'me-1')).toEqual({
        page: 'team',
        teamUid: 't/1',
        label: 'Team page',
      });
    });

    it('S5-R3: Ctrl/⌘ J opens the agent over the news story modal, and the panel goes above it', async () => {
      goTo('/?news=n-1');
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await screen.findByRole('button', { name: 'Agent' });
      openStoryModal();
      expect(isBlockingDialogOpen()).toBe(false);

      expect(ctrlJ()).toBe(false); // preventDefault ran
      const aside = panel();
      expect(aside).toBeInTheDocument();
      expect(aside?.parentElement).toBe(document.body);
      expect(aside?.className).toMatch(/overModal/);
      expect(screen.getByText('News story')).toBeInTheDocument();
    });

    it('S5-R3: a share sheet or any other dialog over the story still stops Ctrl/⌘ J', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await screen.findByRole('button', { name: 'Agent' });
      const story = openStoryModal();
      const share = document.createElement('div');
      share.setAttribute('role', 'dialog');
      story.querySelector('[role="dialog"]')?.appendChild(share);

      expect(isBlockingDialogOpen()).toBe(true);
      expect(ctrlJ()).toBe(true);
      expect(panel()).not.toBeInTheDocument();
    });

    it('S5-R1: from 960px, the Agent tab portals above the story with no Feedback tab, and opens the agent', async () => {
      setWide(true);
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await screen.findByRole('button', { name: 'Agent' });
      openStoryModal();

      await waitFor(() => expect(document.querySelector('body > [data-feedback-fab]')).not.toBeNull());
      expect(
        screen.getByRole('group', { name: 'Agent and feedback' }).closest('[data-feedback-fab]')?.parentElement,
      ).toBe(document.body);
      expect(screen.queryByRole('button', { name: 'Give feedback' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Agent' }));
      expect(panel()).toBeInTheDocument();
    });

    it('S5-R5: Escape in the panel over the story closes the panel only, not the story', async () => {
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await screen.findByRole('button', { name: 'Agent' });
      openStoryModal();
      // The story `Modal` listens for Escape in the document capture phase.
      const closeStory = jest.fn();
      const onStoryKey = (e: KeyboardEvent) => e.key === 'Escape' && closeStory();
      document.addEventListener('keydown', onStoryKey, true);

      ctrlJ();
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Message the agent' }), { key: 'Escape' });
      expect(panel()).not.toBeInTheDocument();
      expect(closeStory).not.toHaveBeenCalled();
      document.removeEventListener('keydown', onStoryKey, true);
    });

    it('S5-R1: no feedback button flash: neither shows until GET /access answers, then the corner only', async () => {
      let answer: (v: { enabled: boolean }) => void = () => {};
      getAccess.mockReturnValue(new Promise((resolve) => (answer = resolve)));
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await act(async () => {});

      expect(screen.queryByRole('button', { name: 'Give feedback' })).not.toBeInTheDocument();
      expect(agentTab()).not.toBeInTheDocument();

      await act(async () => answer({ enabled: true }));
      expect(await screen.findByRole('group', { name: 'Agent and feedback' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Give feedback' })).toHaveLength(1);
    });

    it('S5-R2: a member outside the pilot gets the feedback button when GET /access answers no', async () => {
      let answer: (v: { enabled: boolean }) => void = () => {};
      getAccess.mockReturnValue(new Promise((resolve) => (answer = resolve)));
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      await act(async () => {});
      expect(screen.queryByRole('button', { name: 'Give feedback' })).not.toBeInTheDocument();

      await act(async () => answer({ enabled: false }));
      expect(await screen.findByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
      expect(agentTab()).not.toBeInTheDocument();
    });

    it('S5-R3: a contenteditable field on the page keeps Ctrl/⌘ J', () => {
      const editor = document.createElement('div');
      editor.setAttribute('contenteditable', 'true');
      const inner = document.createElement('p');
      editor.appendChild(inner);
      document.body.appendChild(editor);
      const key = new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', ctrlKey: true, bubbles: true });
      Object.defineProperty(key, 'target', { value: inner });

      expect(isAgentShortcut(key, { feedbackOpen: false })).toBe(false);
      editor.remove();
    });

    it('S5-R3: with the feedback drawer open (a dialog), Ctrl/⌘ J still opens the agent', () => {
      const drawer = document.createElement('div');
      drawer.setAttribute('role', 'dialog');
      document.body.appendChild(drawer);
      const key = new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', ctrlKey: true });

      expect(isAgentShortcut(key, { feedbackOpen: true })).toBe(true);
      expect(isAgentShortcut(key, { feedbackOpen: false })).toBe(false);
      drawer.remove();
    });

    it('S5-C29: after a page 404, a reopen has no old text and no chip, so the next send has no context', async () => {
      goTo('/teams/missing-1');
      chat.mockRejectedValueOnce(new LabosAgentError(404, 'TEAM_NOT_FOUND', 'Not found.'));
      window.localStorage.setItem('labos-agent', 'on');
      signIn();
      renderApp();
      fireEvent.click(await screen.findByRole('button', { name: 'Agent' }));
      let composer = screen.getByRole('textbox', { name: 'Message the agent' }) as HTMLTextAreaElement;
      fireEvent.change(composer, { target: { value: 'What does this team do?' } });
      fireEvent.keyDown(composer, { key: 'Enter' });
      await screen.findByText('The agent cannot read this page. Remove the page chip and ask again.');
      expect(composer.value).toBe('What does this team do?');

      fireEvent.click(screen.getByRole('button', { name: 'Close agent' }));
      fireEvent.click(screen.getByRole('button', { name: 'Agent' }));
      composer = screen.getByRole('textbox', { name: 'Message the agent' }) as HTMLTextAreaElement;
      expect(composer.value).toBe('');
      expect(screen.queryByRole('button', { name: 'Stop reading Team page' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Let the agent read Team page again' })).toBeInTheDocument();

      fireEvent.change(composer, { target: { value: 'Try again' } });
      fireEvent.keyDown(composer, { key: 'Enter' });
      await screen.findByText('Mock answer text');
      expect(chat).toHaveBeenCalledTimes(2);
      expect(chat.mock.calls[1][0].context).toBeUndefined();
    });

    it('S5-R6: chatKey differs for each member, team and job uid', () => {
      expect(chatKey({ page: 'member', memberUid: 'm-1' })).not.toBe(chatKey({ page: 'member', memberUid: 'm-2' }));
      expect(chatKey({ page: 'team', teamUid: 't-1' })).not.toBe(chatKey({ page: 'team', teamUid: 't-2' }));
      expect(chatKey({ page: 'job', jobUid: 'j-1' })).not.toBe(chatKey({ page: 'job', jobUid: 'j-2' }));
      expect(chatKey({ page: 'job', jobUid: 'j-1' })).not.toBe(chatKey({ page: 'job' }));
    });
  });
});

describe('LAB-3457: the corner on AI agent chat (the page agent)', () => {
  const pageFocus = jest.fn();
  beforeEach(() => {
    chat.mockReset().mockResolvedValue(answer);
    getAccess.mockReset().mockResolvedValue({ enabled: true });
    mockPreferences = { memberPreferences: { showFeedbackButton: true } };
    window.localStorage.clear();
    useLabosAgentStore.setState({ isOpen: false, context: null, readsPage: true, chats: {} });
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    act(() => useFeedbackDrawerStore.getState().actions.closeDrawer());
    pageFocus.mockReset();
    document.addEventListener('labos-agent-page-focus', pageFocus);
  });
  afterEach(() => document.removeEventListener('labos-agent-page-focus', pageFocus));

  it.each(['/ai-search', '/ai-search/t-1'])(
    'on %s keeps Feedback, has no Agent tab, and Ctrl/⌘ J goes to the page composer, not the panel',
    async (url) => {
      goTo(url);
      signIn();
      renderApp();

      expect(await screen.findByRole('group', { name: 'Agent and feedback' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
      expect(agentTab()).not.toBeInTheDocument();

      ctrlJ();
      expect(pageFocus).toHaveBeenCalledTimes(1);
      expect(panel()).not.toBeInTheDocument();
      expect(useLabosAgentStore.getState().isOpen).toBe(false);
    },
  );

  it('a panel open from another page closes on AI agent chat; elsewhere the corner is as before', async () => {
    goTo('/members/m-2');
    signIn();
    const { rerender } = renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Agent' }));
    expect(panel()).toBeInTheDocument();

    goTo('/ai-search');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      <QueryClientProvider client={qc}>
        <GlobalFeedback isLoggedIn />
        <LabosAgentRoot />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(useLabosAgentStore.getState().isOpen).toBe(false));
    expect(agentTab()).not.toBeInTheDocument();
  });

  it('with the feedback button hidden, AI agent chat shows no corner, and Ctrl/⌘ J still goes to the composer', async () => {
    mockPreferences = { memberPreferences: { showFeedbackButton: false } };
    goTo('/ai-search');
    signIn();
    renderApp();
    await waitFor(() => expect(getAccess).toHaveBeenCalled());
    await act(async () => {});

    expect(screen.queryByRole('group', { name: 'Agent and feedback' })).not.toBeInTheDocument();
    expect(agentTab()).not.toBeInTheDocument();
    ctrlJ();
    expect(pageFocus).toHaveBeenCalledTimes(1);
  });

  it('outside the gate, AI search keeps the feedback button and Ctrl/⌘ J does nothing', async () => {
    getAccess.mockResolvedValue({ enabled: false });
    goTo('/ai-search');
    signIn();
    renderApp();

    expect(await screen.findByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
    ctrlJ();
    expect(pageFocus).not.toHaveBeenCalled();
    expect(panel()).not.toBeInTheDocument();
  });
});
