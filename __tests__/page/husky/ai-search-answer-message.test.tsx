import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/core/husky/husky-code-block', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <code>{children}</code>,
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

jest.mock('@/services/husky.service', () => ({ saveFeedback: jest.fn(), removeFeedback: jest.fn() }));
jest.mock('@/services/members.service', () => ({ getMemberInfo: jest.fn() }));
jest.mock('@/utils/fetch-wrapper', () => ({ getUserCredentialsInfo: jest.fn() }));

import { Messages } from '@/components/page/husky/Chat/components/Messages';
import { PreviewMessage } from '@/components/page/husky/Chat/components/Messages/components/PreviewMessage';
import { ChatMessageActions } from '@/components/page/husky/Chat/components/Messages/components/PreviewMessage/components/ChatMessageActions';

const baseMessage = {
  id: 'answer-1',
  question: 'Which teams work on storage?',
  answer: 'Saturn Grid works on **storage**.',
  followUpQuestions: [] as string[],
  sources: ['https://news.example/acme'],
  actions: [] as Array<{ name: string; type: string; directoryLink: string }>,
  sql: [] as Array<{ name: string; type: string; source: string }>,
  isError: false,
};

type Message = typeof baseMessage;

const handlers = () => ({
  onFollowupClicked: jest.fn(),
  onRegenerate: jest.fn(),
  onQuestionEdit: jest.fn(),
  onCopyAnswer: jest.fn().mockResolvedValue(undefined),
});

function renderPreview(message: Partial<Message> = {}, props: Record<string, unknown> = {}) {
  const callbacks = handlers();
  render(
    <PreviewMessage
      message={{ ...baseMessage, ...message }}
      isLastIndex
      threadId="thread-1"
      isLoadingObject={false}
      isStreaming={false}
      showRating
      canRate
      {...callbacks}
      {...props}
    />,
  );
  return callbacks;
}

describe('AI Search answer: one question and its answer', () => {
  it('shows the question as a heading and the answer as markdown', () => {
    renderPreview();

    expect(screen.getByRole('heading', { level: 2, name: 'Which teams work on storage?' })).toBeInTheDocument();
    expect(screen.getByText('storage', { selector: 'strong' })).toBeInTheDocument();
  });

  it('shows no heading when the message has no question', () => {
    renderPreview({ question: '' });

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByText(/Saturn Grid works on/)).toBeInTheDocument();
  });

  it('shows the error copy without copy action or thumbs for a failed answer', () => {
    renderPreview({ answer: '', isError: true });

    expect(
      screen.getByText('Something went wrong, we are unable to provide a response. Please try again later'),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Error')).toBeInTheDocument();
    expect(screen.queryByTitle('Copy response')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Good answer' })).not.toBeInTheDocument();
    expect(screen.getByTitle('Edit question')).toBeInTheDocument();
  });

  it('renders no answer block while there is neither an answer nor an error', () => {
    renderPreview({ answer: '' });

    expect(screen.getByRole('heading', { name: 'Which teams work on storage?' })).toBeInTheDocument();
    expect(screen.queryByTitle('Edit question')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Copy response')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /source/ })).not.toBeInTheDocument();
  });

  it('shows directory results from the sql rows', () => {
    renderPreview({ sql: [{ name: 'Saturn Grid', type: 'team', source: '/teams/saturn' }] });

    expect(screen.getAllByText('Results from the directory').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Saturn Grid - team' })[0]).toHaveAttribute('href', '/teams/saturn');
  });

  it('shows follow-ups and asks the clicked one', () => {
    const { onFollowupClicked } = renderPreview({ followUpQuestions: ['Who leads Saturn Grid?'] });

    fireEvent.click(screen.getByText('Who leads Saturn Grid?'));

    expect(onFollowupClicked).toHaveBeenCalledWith('Who leads Saturn Grid?');
  });

  it('marks the follow-ups as loading while the next answer streams in', () => {
    renderPreview({ followUpQuestions: ['Who leads Saturn Grid?'] }, { isLoadingObject: true });

    expect(screen.getByTestId('followup-questions-list')).toHaveAttribute('data-state', 'loading');
  });

  it('shows related results from the actions', () => {
    renderPreview({ actions: [{ name: 'Saturn Grid', type: 'team', directoryLink: '/teams/saturn' }] });

    expect(screen.getByRole('heading', { name: 'Related results' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Saturn Grid/ })).toHaveAttribute('href', '/teams/saturn');
  });

  it('shows no directory, follow-up or related blocks when they are empty', () => {
    renderPreview();

    expect(screen.queryByText('Results from the directory')).not.toBeInTheDocument();
    expect(screen.queryByText('Follow up questions')).not.toBeInTheDocument();
    expect(screen.queryByText('Related results')).not.toBeInTheDocument();
  });

  it('regenerates and edits the question of the last answer', () => {
    const { onRegenerate, onQuestionEdit } = renderPreview();

    fireEvent.click(screen.getByTitle('Regenerate response'));
    fireEvent.click(screen.getByTitle('Edit question'));

    expect(onRegenerate).toHaveBeenCalledWith('Which teams work on storage?');
    expect(onQuestionEdit).toHaveBeenCalledWith('Which teams work on storage?');
  });

  it('offers only copy on an earlier answer', () => {
    renderPreview({}, { isLastIndex: false });

    expect(screen.queryByTitle('Regenerate response')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Edit question')).not.toBeInTheDocument();
    expect(screen.getByTitle('Copy response')).toBeInTheDocument();
  });

  it('shows the sources pill next to the actions once the answer is complete', () => {
    renderPreview({ sources: ['https://a.example/1', 'https://b.example/2'] });

    expect(screen.getByRole('button', { name: '2 sources' })).toBeInTheDocument();
  });
});

describe('AI Search answer: the thread of messages', () => {
  const messages = [
    { ...baseMessage, id: 'm-1', question: 'First question?', answer: 'First answer.' },
    { ...baseMessage, id: 'm-2', question: 'Second question?', answer: 'Second answer.' },
  ];

  function renderMessages(props: Record<string, unknown> = {}) {
    const callbacks = handlers();
    render(
      <Messages
        messages={messages}
        threadId="thread-1"
        isAnswerLoading={false}
        isLoadingObject={false}
        isStreaming={false}
        showRating
        canRate
        {...callbacks}
        {...props}
      />,
    );
    return callbacks;
  }

  it('renders every question and answer in order', () => {
    renderMessages();

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual(['First question?', 'Second question?']);
    expect(screen.getByText('First answer.')).toBeInTheDocument();
    expect(screen.getByText('Second answer.')).toBeInTheDocument();
  });

  it('offers regenerate and edit only on the last message', () => {
    const { onRegenerate } = renderMessages();

    expect(screen.getAllByTitle('Regenerate response')).toHaveLength(1);
    expect(screen.getAllByTitle('Edit question')).toHaveLength(1);
    expect(screen.getAllByTitle('Copy response')).toHaveLength(2);

    fireEvent.click(screen.getByTitle('Regenerate response'));

    expect(onRegenerate).toHaveBeenCalledWith('Second question?');
  });

  it('hides regenerate when no handler is given', () => {
    renderMessages({ onRegenerate: undefined });

    expect(screen.queryByTitle('Regenerate response')).not.toBeInTheDocument();
    expect(screen.getByTitle('Edit question')).toBeInTheDocument();
  });

  it('treats only the last message as streaming', () => {
    renderMessages({ isStreaming: true });

    expect(screen.getAllByRole('button', { name: 'Good answer' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '1 source' })).toHaveLength(1);
  });

  it('shows the answer loader with the status line while an answer is loading', () => {
    renderMessages({ isAnswerLoading: true, statusLine: 'Searching teams' });

    expect(screen.getByTestId('chat-answer-loader')).toHaveTextContent('Searching teams');
    expect(screen.getByRole('status')).toBe(screen.getByTestId('chat-answer-loader'));
  });

  it('falls back to the default loader label without a status line', () => {
    renderMessages({ isAnswerLoading: true });

    expect(screen.getByTestId('chat-answer-loader')).toHaveTextContent('Understanding your question');
  });

  it('shows no loader when no answer is loading', () => {
    renderMessages();

    expect(screen.queryByTestId('chat-answer-loader')).not.toBeInTheDocument();
  });
});

describe('AI Search answer: message actions', () => {
  const writeText = jest.fn().mockResolvedValue(undefined);

  beforeAll(() => {
    Object.assign(navigator, { clipboard: { writeText } });
  });

  function renderActions(props: Record<string, unknown> = {}) {
    const callbacks = handlers();
    render(
      <ChatMessageActions
        onQuestionEdit={callbacks.onQuestionEdit}
        onRegenerate={callbacks.onRegenerate}
        onCopyAnswer={callbacks.onCopyAnswer}
        answer="The answer"
        question="The question"
        isLastIndex
        hideActions={false}
        isLoadingObject={false}
        {...props}
      />,
    );
    return callbacks;
  }

  it('copies the answer, reports it and shows "Copied!"', async () => {
    const { onCopyAnswer } = renderActions();

    fireEvent.click(screen.getByTitle('Copy response'));

    expect(await screen.findByText('Copied!')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('The answer');
    await waitFor(() => expect(onCopyAnswer).toHaveBeenCalledWith('The answer'));
  });

  it('hides copy when actions are hidden but keeps regenerate and edit on the last message', () => {
    renderActions({ hideActions: true });

    expect(screen.queryByTitle('Copy response')).not.toBeInTheDocument();
    expect(screen.getByTitle('Regenerate response')).toBeInTheDocument();
    expect(screen.getByTitle('Edit question')).toBeInTheDocument();
  });

  it('marks the actions as loading while an answer streams in', () => {
    renderActions({ isLoadingObject: true });

    expect(screen.getByTitle('Edit question').parentElement).toHaveAttribute('data-state', 'loading');
  });

  it('renders the feedback slot beside the actions and the sources slot after them', () => {
    renderActions({
      feedbackSlot: <span>feedback slot</span>,
      sourcesSlot: <span>sources slot</span>,
    });

    const row = screen.getByTitle('Edit question').parentElement as HTMLElement;
    expect(within(row).getByText('feedback slot')).toBeInTheDocument();
    expect(within(row).queryByText('sources slot')).not.toBeInTheDocument();
    expect(row.nextElementSibling).toHaveTextContent('sources slot');
  });
});
