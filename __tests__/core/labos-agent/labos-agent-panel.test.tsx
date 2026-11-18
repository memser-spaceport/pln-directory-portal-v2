import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentClient } from '@/types/labos-agent.types';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

const chat = jest.fn();
const client: LabosAgentClient = { chat, getAccess: async () => ({ enabled: true }) };

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

import { AskAgentButton } from '@/components/core/labos-agent/AskAgentButton/AskAgentButton';
import { LabosAgentRoot } from '@/components/core/labos-agent/LabosAgentRoot/LabosAgentRoot';
import { useCurrentUserStore } from '@/services/auth/store';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { IUserInfo } from '@/types/shared.types';

const context = { page: 'news-story' as const, newsUid: 'n-1', label: 'Mock story title' };

const answer = {
  steps: ['Understanding the question', 'Reading the news story'],
  content: 'Mock answer text',
  sources: ['https://example.com/page'],
  sourceRefs: [{ type: 'news', uid: 'n-1', title: 'This news story (mock)' }],
  followUpQuestions: ['What happened before this?'],
  actions: [],
  proposals: [],
};

function renderApp(onOpened = jest.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AskAgentButton context={context} onOpened={onOpened} />
      <LabosAgentRoot />
    </QueryClientProvider>,
  );
}

const signIn = () =>
  act(() => useCurrentUserStore.getState().actions.setCurrentUser({ uid: 'mock-member' } as IUserInfo));

describe('LAB-3298: agent panel and Ask a follow-up', () => {
  beforeEach(() => {
    chat.mockReset();
    window.localStorage.clear();
    useLabosAgentStore.setState({ isOpen: false, context: null, chats: {} });
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
  });

  it('shows no button while the feature gate is off', async () => {
    signIn();
    renderApp();
    await act(async () => {});
    expect(screen.queryByText('Ask a follow-up')).not.toBeInTheDocument();
  });

  it('shows no button to a signed-out visitor', async () => {
    window.localStorage.setItem('labos-agent', 'on');
    renderApp();
    await act(async () => {});
    expect(screen.queryByText('Ask a follow-up')).not.toBeInTheDocument();
  });

  it('opens the panel with the story as context and answers about it', async () => {
    window.localStorage.setItem('labos-agent', 'on');
    signIn();
    chat.mockImplementation(async (_req, { onUpdate }) => {
      onUpdate?.({ steps: answer.steps });
      return answer;
    });
    const onOpened = jest.fn();
    renderApp(onOpened);

    fireEvent.click(await screen.findByText('Ask a follow-up'));
    expect(onOpened).toHaveBeenCalled();
    expect(await screen.findByRole('complementary', { name: 'Agent' })).toBeInTheDocument();
    expect(screen.getByText('Mock story title').closest('a')).toHaveAttribute('href', '/?news=n-1');
    expect(screen.queryByText('Mock answers')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Summarize this story'));

    expect(await screen.findByText('Mock answer text')).toBeInTheDocument();
    expect(chat.mock.calls[0][0]).toMatchObject({
      message: 'Summarize this story',
      context: { page: 'news-story', newsUid: 'n-1' },
    });
    expect(chat.mock.calls[0][0].context).not.toHaveProperty('label');
    expect(screen.getByText('example.com').closest('a')).toHaveAttribute('href', 'https://example.com/page');
    expect(screen.getByText('This news story (mock)').closest('a')).toHaveAttribute('href', '/?news=n-1');
    expect(screen.getByText('What happened before this?')).toBeInTheDocument();
  });

  it('shows a message and Retry after a hard error, and Retry sends the same message again', async () => {
    window.localStorage.setItem('labos-agent', 'on');
    signIn();
    chat.mockRejectedValueOnce(new LabosAgentError(0, 'STREAM_FAILED', 'broken')).mockResolvedValueOnce(answer);
    renderApp();

    fireEvent.click(await screen.findByText('Ask a follow-up'));
    fireEvent.click(await screen.findByText('Why does this matter?'));

    expect(await screen.findByRole('alert')).toHaveTextContent('The agent did not finish the answer.');
    fireEvent.click(screen.getByText('Retry'));

    expect(await screen.findByText('Mock answer text')).toBeInTheDocument();
    expect(chat).toHaveBeenCalledTimes(2);
    expect(chat.mock.calls[1][0].message).toBe('Why does this matter?');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows Retry when the answer stalls', async () => {
    window.localStorage.setItem('labos-agent', 'on');
    signIn();
    chat.mockResolvedValue({
      ...answer,
      content: 'Part\n\n_The answer was cut short because the AI provider stopped responding. Please try again._',
    });
    renderApp();

    fireEvent.click(await screen.findByText('Ask a follow-up'));
    fireEvent.click(await screen.findByText('Summarize this story'));

    await waitFor(() => expect(screen.getByText('Retry')).toBeInTheDocument());
    expect(screen.queryByText('What happened before this?')).not.toBeInTheDocument();
  });

  it('closes on the close button', async () => {
    window.localStorage.setItem('labos-agent', 'on');
    signIn();
    renderApp();

    fireEvent.click(await screen.findByText('Ask a follow-up'));
    fireEvent.click(await screen.findByLabelText('Close agent'));
    expect(screen.queryByRole('complementary', { name: 'Agent' })).not.toBeInTheDocument();
  });

  it('shows the Mock answers label only while the mock is on', async () => {
    window.localStorage.setItem('labos-agent', 'on');
    window.localStorage.setItem('labos-agent-api', 'mock');
    signIn();
    renderApp();

    fireEvent.click(await screen.findByText('Ask a follow-up'));
    expect(await screen.findByText('Mock answers')).toBeInTheDocument();
  });

  it('keeps the chat after close and reopen from the same story, and a new story starts a new chat', async () => {
    window.localStorage.setItem('labos-agent', 'on');
    signIn();
    chat.mockResolvedValue(answer);
    renderApp();

    fireEvent.click(await screen.findByText('Ask a follow-up'));
    fireEvent.click(await screen.findByText('Summarize this story'));
    expect(await screen.findByText('Mock answer text')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close agent'));
    expect(screen.queryByRole('complementary', { name: 'Agent' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Ask a follow-up'));
    expect(await screen.findByText('Mock answer text')).toBeInTheDocument();
    expect(screen.getAllByText('Summarize this story')).toHaveLength(1);

    act(() =>
      useLabosAgentStore
        .getState()
        .actions.openAgent({ context: { page: 'news-story', newsUid: 'n-2', label: 'Other story' } }),
    );
    expect(await screen.findByText('Other story')).toBeInTheDocument();
    expect(screen.queryByText('Mock answer text')).not.toBeInTheDocument();
    expect(screen.getByText('What do you want to know?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Summarize this story'));
    expect(await screen.findByText('Mock answer text')).toBeInTheDocument();
    expect(chat.mock.calls[1][0].threadId).not.toBe(chat.mock.calls[0][0].threadId);
  });
});
