import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentChatResponse, LabosAgentClient } from '@/types/labos-agent.types';
import { mockMentions } from '@/services/labos-agent/labos-agent.mock';

/**
 * LAB-3457: AI agent chat runs on the agent for members inside the gate. The real page, store, composer hook, turn
 * and analytics run; C1, C4, PostHog and the page's own neighbours (title bar, MCP hint, today's page) are mocked.
 */
const capture = jest.fn();
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: (...args: unknown[]) => capture(...args) }),
}));

const chat = jest.fn();
const searchMentions = jest.fn();
const getAccess = jest.fn(async () => ({ enabled: true }));
const client: LabosAgentClient = { chat, confirmAction: jest.fn(), getAccess, searchMentions };
jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));

jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));
const canRequestIntro = jest.fn(() => false);
jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({
  useCanRequestIntro: () => canRequestIntro(),
}));
jest.mock('@/services/team-news/hooks/useTeamNewsPrompts', () => ({
  useTeamNewsPrompts: () => ({
    data: [
      { uid: 'p1', question: 'Question one?' },
      { uid: 'p2', question: 'Question two?' },
      { uid: 'p3', question: 'Question three?' },
      { uid: 'p4', question: 'Question four?' },
    ],
  }),
}));
jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/core/mcp-hints/McpHint', () => ({ McpHint: () => null }));
jest.mock('@/components/page/husky/hooks/useSidebar', () => ({
  useSidebar: () => ({ toggleSidebar: jest.fn(), state: 'expanded', isMobile: false }),
}));
jest.mock('@/components/page/husky/Chat/components/ChatTitleBar', () => ({
  ChatTitleBar: ({ chat: shown }: { chat?: { title: string } }) => (
    <div data-testid="title-bar">{shown?.title ?? ''}</div>
  ),
}));
jest.mock('@/components/page/husky/ChatContainer', () => ({
  ChatContainer: ({ isLoggedIn }: { isLoggedIn: boolean }) => (
    <div data-testid="husky-page" data-logged-in={String(isLoggedIn)} />
  ),
}));

import { AiSearchPageBody } from '@/components/page/husky/AiSearchPageBody/AiSearchPageBody';
import { AgentChat } from '@/components/page/husky/AgentChat/AgentChat';
import { useCurrentUserStore } from '@/services/auth/store';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { IUserInfo } from '@/types/shared.types';

const answer: LabosAgentChatResponse = {
  steps: ['Searching the directory'],
  content: 'Three teams work on storage.',
  sources: [],
  sourceRefs: [],
  followUpQuestions: ['Which one is hiring?'],
  actions: [],
  proposals: [],
  drafts: [],
};

const signIn = (user: Partial<IUserInfo> = {}) =>
  act(() => useCurrentUserStore.getState().actions.setCurrentUser({ uid: 'viewer-1', ...user } as IUserInfo));

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const field = () => screen.getByLabelText('Message the agent') as HTMLTextAreaElement;
const type = (input: HTMLTextAreaElement, value: string) =>
  fireEvent.change(input, { target: { value, selectionStart: value.length, selectionEnd: value.length } });

describe('LAB-3457: AI agent chat on the agent', () => {
  beforeEach(() => {
    chat.mockReset();
    chat.mockResolvedValue(answer);
    searchMentions.mockReset();
    searchMentions.mockImplementation(async (query) => mockMentions(query));
    getAccess.mockReset();
    getAccess.mockResolvedValue({ enabled: true });
    capture.mockReset();
    canRequestIntro.mockReturnValue(false);
    window.localStorage.clear();
    useLabosAgentStore.setState({ chats: {}, session: null, pageSession: null, sentIntroTargets: {} });
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
  });

  describe('the gate switch', () => {
    it('signed out keeps today’s page and never asks the gate', async () => {
      wrap(<AiSearchPageBody isLoggedIn={false} />);
      expect(screen.getByTestId('husky-page')).toHaveAttribute('data-logged-in', 'false');
      expect(getAccess).not.toHaveBeenCalled();
    });

    it('a member inside the gate gets the agent page, not today’s page', async () => {
      signIn();
      wrap(<AiSearchPageBody isLoggedIn />);
      expect(await screen.findByLabelText('Message the agent')).toBeInTheDocument();
      expect(screen.queryByTestId('husky-page')).not.toBeInTheDocument();
    });

    it('a member outside the gate keeps today’s page', async () => {
      getAccess.mockResolvedValue({ enabled: false });
      signIn();
      wrap(<AiSearchPageBody isLoggedIn />);
      expect(await screen.findByTestId('husky-page')).toHaveAttribute('data-logged-in', 'true');
      expect(screen.queryByLabelText('Message the agent')).not.toBeInTheDocument();
    });

    it('shows neither page while the gate has not answered, so today’s page reads no handed-over question', async () => {
      getAccess.mockImplementation(() => new Promise(() => {}));
      signIn();
      wrap(<AiSearchPageBody isLoggedIn />);
      await waitFor(() => expect(getAccess).toHaveBeenCalled());
      expect(screen.queryByTestId('husky-page')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Message the agent')).not.toBeInTheDocument();
    });

    it('localStorage labos-agent=off keeps today’s page for a member', async () => {
      window.localStorage.setItem('labos-agent', 'off');
      signIn();
      wrap(<AiSearchPageBody isLoggedIn />);
      expect(await screen.findByTestId('husky-page')).toBeInTheDocument();
    });
  });

  describe('the new chat', () => {
    it('has the agent placeholder, the new line and two prompt columns of three', () => {
      signIn();
      wrap(<AgentChat />);
      expect(field()).toHaveAttribute('placeholder', 'Ask, request an intro, or type @');
      expect(screen.getByTestId('chat-home-scope')).toHaveTextContent('Ask about the network, or make a request.');
      const prompts = screen.getByTestId('agent-chat-prompts');
      expect(within(prompts).getByText('Try asking')).toBeInTheDocument();
      expect(within(prompts).getByText('Make a request')).toBeInTheDocument();
      expect(within(prompts).getByRole('button', { name: 'Question three?' })).toBeInTheDocument();
      expect(within(prompts).queryByRole('button', { name: 'Question four?' })).not.toBeInTheDocument();
    });

    it('a member who can request intros, and leads a team, gets intro, team and profile requests', () => {
      canRequestIntro.mockReturnValue(true);
      signIn({ leadingTeams: ['team-1'], mainTeamName: 'Lattice Compute' });
      wrap(<AgentChat />);
      const prompts = screen.getByTestId('agent-chat-prompts');
      expect(
        within(prompts).getByRole('button', {
          name: "I need intros to founders who raised a Series A this year, I'm planning a fundraise",
        }),
      ).toBeInTheDocument();
      expect(
        within(prompts).getByRole('button', { name: 'Update Lattice Compute’s profile from its website' }),
      ).toBeInTheDocument();
      expect(
        within(prompts).getByRole('button', { name: "Update my profile: I'm now CEO and based in Lisbon" }),
      ).toBeInTheDocument();
    });

    it('a member who can’t request intros gets no intro request', () => {
      signIn();
      wrap(<AgentChat />);
      const prompts = screen.getByTestId('agent-chat-prompts');
      expect(within(prompts).queryByRole('button', { name: /intros/ })).not.toBeInTheDocument();
      expect(within(prompts).getByRole('button', { name: 'Update my profile: I moved to Lisbon' })).toBeInTheDocument();
    });
  });

  describe('a message', () => {
    it('goes to the agent (C1) with the page’s thread id, and the answer shows steps, sources and follow-ups', async () => {
      signIn();
      wrap(<AgentChat />);
      type(field(), 'Which teams work on decentralized storage?');
      fireEvent.keyDown(field(), { key: 'Enter' });

      expect(await screen.findByText('Three teams work on storage.')).toBeInTheDocument();
      expect(chat).toHaveBeenCalledTimes(1);
      const [request] = chat.mock.calls[0];
      expect(request.message).toBe('Which teams work on decentralized storage?');
      const key = Object.keys(useLabosAgentStore.getState().chats)[0];
      expect(key).toBe(`ai-search:${request.threadId}`);
      expect(request.context).toBeUndefined();
      expect(screen.getByRole('button', { name: /Worked for \d+s · 1 step/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Which one is hiring?' })).toBeInTheDocument();
      expect(screen.getByTestId('title-bar')).toHaveTextContent('Which teams work on decentralized storage?');
    });

    it('sends agent-message-sent with surface page, in the page’s own session', async () => {
      signIn();
      wrap(<AgentChat />);
      type(field(), 'Hello');
      fireEvent.keyDown(field(), { key: 'Enter' });
      await screen.findByText('Three teams work on storage.');

      const sent = capture.mock.calls.find(([event]) => event === 'agent-message-sent');
      expect(sent?.[1]).toMatchObject({ surface: 'page', entryPoint: 'ai-search-page', turnIndex: 1 });
      expect(sent?.[1].conversationId).toBe(useLabosAgentStore.getState().pageSession?.conversationId);
      expect(useLabosAgentStore.getState().session).toBeNull();
      expect(useLabosAgentStore.getState().pageSession?.turnCount).toBe(1);
    });

    it('a picked prompt sends at once', async () => {
      signIn();
      wrap(<AgentChat />);
      fireEvent.click(screen.getByRole('button', { name: 'Update my profile: I moved to Lisbon' }));
      await waitFor(() => expect(chat).toHaveBeenCalledTimes(1));
      expect(chat.mock.calls[0][0].message).toBe('Update my profile: I moved to Lisbon');
    });

    it('the field becomes Stop while the answer streams, and Stop ends the turn', async () => {
      chat.mockImplementation(() => new Promise(() => {}));
      signIn();
      wrap(<AgentChat />);
      type(field(), 'Long question');
      fireEvent.keyDown(field(), { key: 'Enter' });
      const stopButton = await screen.findByRole('button', { name: 'Stop answering' });
      fireEvent.click(stopButton);
      expect(await screen.findByText('Stopped')).toBeInTheDocument();
    });

    it('caps the field at 2000 characters', () => {
      signIn();
      wrap(<AgentChat />);
      expect(field()).toHaveAttribute('maxLength', '2000');
    });

    it('a question handed over in localStorage.input goes to the agent once', async () => {
      window.localStorage.setItem('input', 'Who works on IPFS?');
      signIn();
      wrap(<AgentChat />);
      await waitFor(() => expect(chat).toHaveBeenCalledTimes(1));
      expect(chat.mock.calls[0][0].message).toBe('Who works on IPFS?');
      expect(window.localStorage.getItem('input')).toBeNull();
    });
  });

  describe('@mentions', () => {
    it('@ opens the agent’s picker; a pick writes @name and puts a chip inside the field; the send carries it', async () => {
      signIn();
      wrap(<AgentChat />);
      type(field(), 'Tell me about @ad');
      const option = await screen.findByRole('option', { name: /Ada Mock/ });
      fireEvent.click(option);

      expect(field().value).toBe('Tell me about @Ada Mock ');
      const chips = screen.getByRole('group', { name: 'What the agent reads' });
      expect(within(chips).getByText('Ada Mock')).toBeInTheDocument();
      // Inside the field: the chip row sits in the composer box, with the textarea.
      expect(screen.getByTestId('chat-composer')).toContainElement(chips);

      fireEvent.keyDown(field(), { key: 'Enter' });
      await waitFor(() => expect(chat).toHaveBeenCalledTimes(1));
      expect(chat.mock.calls[0][0].mentions).toEqual([expect.objectContaining({ type: 'member' })]);
      expect(screen.queryByRole('group', { name: 'What the agent reads' })).not.toBeInTheDocument();
    });

    it('Esc closes the picker and keeps the text', async () => {
      signIn();
      wrap(<AgentChat />);
      type(field(), '@ad');
      expect(await screen.findByRole('dialog', { name: 'Add context' })).toBeInTheDocument();
      fireEvent.keyDown(field(), { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Add context' })).not.toBeInTheDocument();
      expect(field().value).toBe('@ad');
    });
  });
});
