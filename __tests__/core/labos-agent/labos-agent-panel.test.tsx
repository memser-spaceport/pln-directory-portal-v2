import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LabosAgentClient } from '@/types/labos-agent.types';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

const chat = jest.fn();
const confirmAction = jest.fn();
const client: LabosAgentClient = { chat, confirmAction, getAccess: async () => ({ enabled: true }) };

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
    confirmAction.mockReset();
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

describe('LAB-3299: action cards', () => {
  const bio = {
    proposalId: 'ap_bio',
    tool: 'update_my_profile' as const,
    title: 'Update your bio',
    targetType: 'member' as const,
    changes: [{ field: 'bio', label: 'Bio', oldValue: 'Old bio', newValue: 'New bio' }],
  };
  const team = {
    proposalId: 'ap_team',
    tool: 'update_team' as const,
    title: 'Update the team',
    targetType: 'team' as const,
    changes: [{ field: 'tags', label: 'Tags', oldValue: [], newValue: ['AI', 'Data'] }],
  };

  beforeEach(() => {
    chat.mockReset();
    confirmAction.mockReset();
    window.localStorage.clear();
    window.localStorage.setItem('labos-agent', 'on');
    useLabosAgentStore.setState({ isOpen: false, context: null, chats: {} });
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    signIn();
    chat.mockResolvedValue({ ...answer, followUpQuestions: [], proposals: [bio, team] });
  });

  async function askForEdits() {
    renderApp();
    fireEvent.click(await screen.findByText('Ask a follow-up'));
    fireEvent.click(await screen.findByText('Summarize this story'));
    await screen.findByText('Update your bio');
  }

  const card = (title: string) => screen.getByRole('article', { name: title });

  it('shows one card per edit with old and new values, and saves nothing before Confirm', async () => {
    await askForEdits();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(card('Update your bio')).toHaveTextContent('Old bio');
    expect(card('Update your bio')).toHaveTextContent('New bio');
    expect(card('Update the team')).toHaveTextContent('Empty');
    expect(card('Update the team')).toHaveTextContent('AI, Data');
    expect(confirmAction).not.toHaveBeenCalled();
  });

  it('confirms through C2 once, shows the result and removes the buttons', async () => {
    let resolve: (v: unknown) => void = () => {};
    confirmAction.mockReturnValue(new Promise((r) => (resolve = r)));
    await askForEdits();

    const bioCard = within(card('Update your bio'));
    fireEvent.click(bioCard.getByText('Confirm'));
    expect(bioCard.getByText('Saving').closest('button')).toBeDisabled();
    fireEvent.click(bioCard.getByText('Saving'));
    expect(confirmAction).toHaveBeenCalledTimes(1);
    expect(confirmAction).toHaveBeenCalledWith({ proposalId: 'ap_bio', decision: 'confirm' });

    await act(async () => resolve({ proposalId: 'ap_bio', status: 'done', summary: 'Your bio is updated.' }));
    expect(bioCard.getByRole('status')).toHaveTextContent('Your bio is updated.');
    expect(bioCard.queryByRole('button')).not.toBeInTheDocument();
    expect(within(card('Update the team')).getByText('Confirm')).toBeInTheDocument();
  });

  it('cancels through C2 and removes the buttons', async () => {
    confirmAction.mockResolvedValue({ proposalId: 'ap_team', status: 'cancelled', summary: '' });
    await askForEdits();

    const teamCard = within(card('Update the team'));
    fireEvent.click(teamCard.getByText('Cancel'));
    expect(await teamCard.findByText('Cancelled. Nothing was saved.')).toBeInTheDocument();
    expect(confirmAction).toHaveBeenCalledWith({ proposalId: 'ap_team', decision: 'cancel' });
    expect(teamCard.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a short message on a 403 and offers no retry', async () => {
    confirmAction.mockRejectedValue(new LabosAgentError(403, 'ACTION_NOT_ALLOWED', 'Not a lead'));
    await askForEdits();

    const teamCard = within(card('Update the team'));
    fireEvent.click(teamCard.getByText('Confirm'));
    expect(await teamCard.findByText('You cannot make this change. Nothing was saved.')).toBeInTheDocument();
    expect(teamCard.getByRole('status')).toHaveTextContent('You cannot make this change. Nothing was saved.');
    expect(teamCard.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows Retry after an error, and Retry confirms again', async () => {
    confirmAction
      .mockRejectedValueOnce(new LabosAgentError(0, 'STREAM_FAILED', 'broken'))
      .mockResolvedValueOnce({ proposalId: 'ap_bio', status: 'done', summary: 'Your bio is updated.' });
    await askForEdits();

    const bioCard = within(card('Update your bio'));
    fireEvent.click(bioCard.getByText('Confirm'));
    fireEvent.click(await bioCard.findByText('Retry'));
    expect(await bioCard.findByText('Your bio is updated.')).toBeInTheDocument();
    expect(confirmAction).toHaveBeenCalledTimes(2);
    expect(confirmAction.mock.calls[1][0]).toEqual({ proposalId: 'ap_bio', decision: 'confirm' });
  });

  it('keeps the cards and their state after close and reopen', async () => {
    confirmAction.mockResolvedValue({ proposalId: 'ap_bio', status: 'done', summary: 'Your bio is updated.' });
    await askForEdits();
    fireEvent.click(within(card('Update your bio')).getByText('Confirm'));
    await screen.findByText('Your bio is updated.');

    fireEvent.click(screen.getByLabelText('Close agent'));
    fireEvent.click(screen.getByText('Ask a follow-up'));

    expect(await screen.findByText('Your bio is updated.')).toBeInTheDocument();
    expect(within(card('Update your bio')).queryByRole('button')).not.toBeInTheDocument();
    expect(within(card('Update the team')).getByText('Confirm')).toBeInTheDocument();
    expect(confirmAction).toHaveBeenCalledTimes(1);
  });

  it('keeps one status region mounted, changes its text and moves focus to it after Confirm', async () => {
    let resolve: (v: unknown) => void = () => {};
    confirmAction.mockReturnValue(new Promise((r) => (resolve = r)));
    await askForEdits();

    const bioCard = within(card('Update your bio'));
    const region = bioCard.getByRole('status');
    expect(region).toHaveTextContent('');
    expect(bioCard.getAllByRole('status')).toHaveLength(1);

    fireEvent.click(bioCard.getByText('Confirm'));
    expect(bioCard.getByRole('status')).toBe(region);
    await act(async () => resolve({ proposalId: 'ap_bio', status: 'done', summary: 'Your bio is updated.' }));

    expect(bioCard.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Your bio is updated.');
    expect(region).toHaveFocus();
  });

  it('moves focus to the result after Cancel too', async () => {
    confirmAction.mockResolvedValue({ proposalId: 'ap_team', status: 'cancelled', summary: '' });
    await askForEdits();
    const teamCard = within(card('Update the team'));
    fireEvent.click(teamCard.getByText('Cancel'));
    await teamCard.findByText('Cancelled. Nothing was saved.');
    expect(teamCard.getByRole('status')).toHaveFocus();
  });

  it('shows HTML fields as plain text, capped at about 300 characters', async () => {
    const long = 'word '.repeat(100).trim();
    chat.mockResolvedValue({
      ...answer,
      followUpQuestions: [],
      proposals: [
        {
          ...bio,
          changes: [
            {
              field: 'bio',
              label: 'Bio',
              oldValue: '<p>Old <strong>bio</strong> &amp; more</p>',
              newValue: `<p>${long}</p>`,
            },
          ],
        },
        {
          ...team,
          changes: [{ field: 'shortDescription', label: 'Short', oldValue: '<b>raw</b>', newValue: 'x' }],
        },
      ],
    });
    await askForEdits();

    const bioCard = card('Update your bio');
    expect(bioCard).toHaveTextContent('Old bio & more');
    expect(bioCard.innerHTML).not.toContain('&lt;p&gt;');
    expect(bioCard.querySelector('strong')).toBeNull();
    const newValue = (bioCard.textContent ?? '').match(/New value: (word[^→]*…)/)?.[1] ?? '';
    expect(newValue.endsWith('…')).toBe(true);
    expect(newValue.length).toBeLessThanOrEqual(301);
    expect(newValue.length).toBeGreaterThan(280);
    // A field that is not HTML in the contract shows as it is.
    expect(card('Update the team')).toHaveTextContent('<b>raw</b>');
  });

  it('hides Confirm after expiresAt', async () => {
    chat.mockResolvedValue({
      ...answer,
      followUpQuestions: [],
      proposals: [{ ...bio, expiresAt: new Date(Date.now() - 1000).toISOString() }, team],
    });
    await askForEdits();

    const bioCard = within(card('Update your bio'));
    expect(bioCard.queryByText('Confirm')).not.toBeInTheDocument();
    expect(bioCard.getByRole('status')).toHaveTextContent(
      'This change expired. Nothing was saved. Ask the agent again.',
    );
    expect(within(card('Update the team')).getByText('Confirm')).toBeInTheDocument();
  });

  it('hides Confirm when expiresAt passes while the card is open', async () => {
    chat.mockResolvedValue({
      ...answer,
      followUpQuestions: [],
      proposals: [{ ...bio, expiresAt: new Date(Date.now() + 300).toISOString() }],
    });
    await askForEdits();
    const bioCard = within(card('Update your bio'));
    expect(bioCard.getByText('Confirm')).toBeInTheDocument();
    await waitFor(() => expect(bioCard.queryByText('Confirm')).not.toBeInTheDocument(), { timeout: 2000 });
  });
});
