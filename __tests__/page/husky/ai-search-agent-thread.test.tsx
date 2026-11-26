import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type {
  LabosAgentChatResponse,
  LabosAgentClient,
  LabosAgentHistoryClient,
  LabosAgentThread,
} from '@/types/labos-agent.types';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

/**
 * LAB-3457: `/ai-search/<threadId>` for a member inside the agent gate opens the saved thread (T2) in AI agent chat.
 * The real page, store, turn and cards run; C1, T2, PostHog and the page's neighbours are mocked.
 */
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ capture: jest.fn() }) }));

const notFound = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/ai-search/t-1',
  useSearchParams: () => new URLSearchParams(),
  notFound: () => notFound(),
}));

const chat = jest.fn();
const getAccess = jest.fn(async () => ({ enabled: true }));
const client: LabosAgentClient = { chat, confirmAction: jest.fn(), getAccess, searchMentions: jest.fn() };
jest.mock('@/services/labos-agent/labos-agent.service', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.service'),
  getLabosAgentClient: () => client,
}));
const history: jest.Mocked<LabosAgentHistoryClient> = {
  listThreads: jest.fn(),
  getThread: jest.fn(),
  deleteThread: jest.fn(),
  confirmDraft: jest.fn(),
};
jest.mock('@/services/labos-agent/labos-agent.history', () => ({
  ...jest.requireActual('@/services/labos-agent/labos-agent.history'),
  getLabosAgentHistoryClient: () => history,
}));

jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));
jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({ useCanRequestIntro: () => true }));
jest.mock('@/services/team-news/hooks/useTeamNewsPrompts', () => ({ useTeamNewsPrompts: () => ({ data: [] }) }));
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

import { AgentChat } from '@/components/page/husky/AgentChat/AgentChat';
import { AiSearchThreadBody } from '@/components/page/husky/AiSearchThreadBody/AiSearchThreadBody';
import { useCurrentUserStore } from '@/services/auth/store';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { IUserInfo } from '@/types/shared.types';

const proposal = {
  tool: 'update_my_profile' as const,
  targetType: 'member' as const,
  changes: [{ field: 'bio', label: 'Bio', oldValue: 'Old bio', newValue: 'New bio' }],
  expiresAt: '2099-01-01T00:00:00.000Z',
};
const draft = {
  kind: 'intro' as const,
  minLength: 20,
  maxLength: 3500,
  source: 'agent' as const,
};

const thread: LabosAgentThread = {
  threadId: 't-1',
  title: 'Storage and intros',
  source: 'ai-search',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-26T10:00:00.000Z',
  turns: [
    {
      kind: 'ai-search',
      chatId: 'c-old',
      question: 'Which teams work on storage?',
      content: 'A saved AI search answer.',
      sources: [],
      sourceRefs: [],
      followUpQuestions: ['Who leads them?'],
      actions: [{ name: 'Ada Lovelace', type: 'member', directoryLink: 'https://example.com/members/m-2' }],
      sql: [{ name: 'Acme Storage', type: 'team', source: 'directory' }],
      createdAt: null,
    },
    {
      kind: 'agent',
      chatId: 'c-agent',
      question: 'Update my bio and intro me',
      content: 'Here you go.',
      sources: [],
      sourceRefs: [],
      followUpQuestions: [],
      actions: [],
      createdAt: '2026-11-26T10:00:00.000Z',
      steps: ['Reading the profile', 'Drafting'],
      proposals: [
        {
          ...proposal,
          proposalId: 'p-done',
          title: 'Bio change done',
          status: 'done',
          summary: 'Your bio is updated.',
        },
        { ...proposal, proposalId: 'p-open', title: 'Bio change open', status: 'open' },
      ],
      drafts: [
        {
          ...draft,
          draftId: 'd-sent',
          target: { type: 'member', uid: 'm-2', name: 'Ada Lovelace' },
          text: 'Hi Ada, the text that went out.',
          status: 'sent',
        },
        {
          ...draft,
          draftId: 'd-open',
          target: { type: 'team', uid: 't-9', name: 'Acme' },
          text: 'Hi Acme, an intro about storage please.',
          status: 'open',
        },
      ],
    },
  ],
};

const answer: LabosAgentChatResponse = {
  steps: ['Searching the directory'],
  content: 'Three people lead them.',
  sources: [],
  sourceRefs: [],
  followUpQuestions: [],
  actions: [],
  proposals: [],
  drafts: [],
};

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

beforeEach(() => {
  jest.clearAllMocks();
  chat.mockResolvedValue(answer);
  getAccess.mockResolvedValue({ enabled: true });
  history.getThread.mockResolvedValue(JSON.parse(JSON.stringify(thread)));
  window.localStorage.clear();
  useLabosAgentStore.setState({ chats: {}, session: null, pageSession: null, sentIntroTargets: {} });
  useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1' } as IUserInfo, isHydrated: true });
});

describe('LAB-3457: a saved chat on AI agent chat', () => {
  it('loads T2 and shows the old answer and the agent turn, finished', async () => {
    wrap(<AgentChat threadId="t-1" />);
    expect(await screen.findByText('A saved AI search answer.')).toBeInTheDocument();
    expect(history.getThread).toHaveBeenCalledWith('t-1');
    expect(screen.getByTestId('title-bar')).toHaveTextContent('Storage and intros');
    expect(screen.getByRole('heading', { name: 'Which teams work on storage?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Who leads them?' })).toBeInTheDocument();
    // A saved turn has no duration.
    expect(screen.getByRole('button', { name: /^Worked · 2 steps/ })).toBeInTheDocument();
  });

  it('an old AI search turn keeps today’s result blocks; an agent turn has none', async () => {
    wrap(<AgentChat threadId="t-1" />);
    await screen.findByText('A saved AI search answer.');
    // One message block per turn: the question block's parent.
    const turnOf = (question: string) => screen.getByRole('heading', { name: question }).parentElement!.parentElement!;
    const old = turnOf('Which teams work on storage?');
    // DirectoryResults draws a desktop and a phone copy; CSS shows one.
    expect(within(old).getAllByText('Results from the directory').length).toBeGreaterThan(0);
    expect(within(old).getAllByText('Acme Storage').length).toBeGreaterThan(0);
    expect(within(old).getByText('Related results')).toBeInTheDocument();
    expect(within(old).getByRole('link', { name: /Ada Lovelace/ })).toHaveAttribute(
      'href',
      'https://example.com/members/m-2',
    );
    const agent = turnOf('Update my bio and intro me');
    expect(within(agent).queryByText('Results from the directory')).not.toBeInTheDocument();
    expect(within(agent).queryByText('Related results')).not.toBeInTheDocument();
  });

  it('finished cards show their result and no buttons; open cards keep theirs', async () => {
    wrap(<AgentChat threadId="t-1" />);
    const done = await screen.findByRole('article', { name: 'Bio change done' });
    expect(within(done).getByText('Your bio is updated.')).toBeInTheDocument();
    expect(within(done).queryByRole('button')).not.toBeInTheDocument();
    const open = screen.getByRole('article', { name: 'Bio change open' });
    expect(within(open).getByRole('button', { name: 'Confirm' })).toBeInTheDocument();

    const sent = screen.getByRole('article', { name: 'Intro request to Ada Lovelace' });
    expect(
      within(sent).getByText('Your request is received. Someone from the team will reach out.'),
    ).toBeInTheDocument();
    expect(within(sent).queryByRole('button', { name: /Send/ })).not.toBeInTheDocument();
    const waiting = screen.getByRole('article', { name: 'Intro request to Acme' });
    expect(within(waiting).getByRole('button', { name: /Send/ })).toBeInTheDocument();
  });

  it('an open saved draft sends with C5 in its thread', async () => {
    history.confirmDraft.mockResolvedValue({ draftId: 'd-open', status: 'sent', introRequestUid: 'ir-2' });
    wrap(<AgentChat threadId="t-1" />);
    const waiting = await screen.findByRole('article', { name: 'Intro request to Acme' });
    fireEvent.click(within(waiting).getByRole('button', { name: /Send/ }));
    await waitFor(() =>
      expect(history.confirmDraft).toHaveBeenCalledWith({
        threadId: 't-1',
        draftId: 'd-open',
        decision: 'send',
        text: 'Hi Acme, an intro about storage please.',
      }),
    );
  });

  it('a follow-up continues the same thread', async () => {
    wrap(<AgentChat threadId="t-1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Who leads them?' }));
    expect(await screen.findByText('Three people lead them.')).toBeInTheDocument();
    expect(chat).toHaveBeenCalledTimes(1);
    expect(chat.mock.calls[0][0]).toMatchObject({ threadId: 't-1', message: 'Who leads them?', persist: true });
    // The open intro card goes with the message (LAB-3362), as in a live chat.
    expect(chat.mock.calls[0][0].introDraft).toEqual({
      target: { type: 'team', uid: 't-9' },
      text: 'Hi Acme, an intro about storage please.',
    });
  });

  it('a thread that is not the member’s is the 404 page', async () => {
    history.getThread.mockRejectedValue(new LabosAgentError(404, 'THREAD_NOT_FOUND', 'No'));
    wrap(<AgentChat threadId="gone" />);
    await waitFor(() => expect(notFound).toHaveBeenCalled());
  });

  it('another failure says so and loads again on Try again', async () => {
    // T2 tries 3 times (2 retries) before it shows the failure.
    [1, 2, 3].forEach(() => history.getThread.mockRejectedValueOnce(new LabosAgentError(0, 'STREAM_FAILED', 'No')));
    wrap(<AgentChat threadId="t-1" />);
    expect(await screen.findByRole('alert', {}, { timeout: 6000 })).toHaveTextContent('This chat could not be loaded.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('A saved AI search answer.')).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
    expect(history.getThread).toHaveBeenCalledTimes(4);
  }, 10000);

  it('a handed-over question does not go into a saved chat', async () => {
    window.localStorage.setItem('input', 'Handed over');
    wrap(<AgentChat threadId="t-1" />);
    await screen.findByText('A saved AI search answer.');
    expect(chat).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('input')).toBe('Handed over');
  });
});

describe('LAB-3457: the thread route switch', () => {
  it('inside the gate the thread opens on the agent, not today’s page', async () => {
    wrap(<AiSearchThreadBody threadId="t-1" fallback={<div data-testid="husky-thread" />} />);
    expect(await screen.findByText('A saved AI search answer.')).toBeInTheDocument();
    expect(screen.queryByTestId('husky-thread')).not.toBeInTheDocument();
  });

  it('outside the gate today’s thread page shows', async () => {
    getAccess.mockResolvedValue({ enabled: false });
    wrap(<AiSearchThreadBody threadId="t-1" fallback={<div data-testid="husky-thread" />} />);
    expect(await screen.findByTestId('husky-thread')).toBeInTheDocument();
    expect(history.getThread).not.toHaveBeenCalled();
  });

  it('outside the gate with no AI search thread: the 404 page', async () => {
    getAccess.mockResolvedValue({ enabled: false });
    wrap(<AiSearchThreadBody threadId="t-1" fallback={null} />);
    await waitFor(() => expect(notFound).toHaveBeenCalled());
  });
});
