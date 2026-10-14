import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';

jest.mock('@/components/core/husky/husky-code-block', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <code>{children}</code>,
}));

const trackFeedbackStatus = jest.fn();
const trackFeedbackClick = jest.fn();
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({
    trackFeedbackStatus,
    trackFeedbackClick,
    trackHuskyCitationClicked: jest.fn(),
    trackHuskySourceLinkClicked: jest.fn(),
    trackDirectoryResultsCardClicked: jest.fn(),
    trackFollowupClicked: jest.fn(),
  }),
}));

const saveFeedback = jest.fn();
const removeFeedback = jest.fn();
jest.mock('@/services/husky.service', () => ({
  saveFeedback: (...args: unknown[]) => saveFeedback(...args),
  removeFeedback: (...args: unknown[]) => removeFeedback(...args),
}));

const getMemberInfo = jest.fn();
jest.mock('@/services/members.service', () => ({
  getMemberInfo: (...args: unknown[]) => getMemberInfo(...args),
}));

const getUserCredentialsInfo = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  getUserCredentialsInfo: () => getUserCredentialsInfo(),
}));

import { PreviewMessage } from '@/components/page/husky/Chat/components/Messages/components/PreviewMessage';

const baseMessage = {
  id: 'answer-1',
  question: 'Which teams work on storage?',
  answer: 'Saturn Grid works on storage.',
  followUpQuestions: ['Who leads Saturn Grid?'],
  sources: ['https://news.example/acme'],
  sourceRefs: [
    {
      index: 1,
      title: 'Acme raises Series A',
      type: 'news',
      directoryLink: '/home?news=news-1',
      externalUrl: 'https://news.example/acme',
    },
  ],
  actions: [],
  sql: [],
};

const noop = () => {};
const asyncNoop = async () => {};

function renderMessage(
  overrides: Record<string, unknown> = {},
  message: typeof baseMessage & { feedback?: { rating: number } } = baseMessage,
) {
  return render(
    <PreviewMessage
      message={message}
      isLastIndex
      threadId="thread-1"
      onFollowupClicked={noop}
      onRegenerate={noop}
      onQuestionEdit={noop}
      onCopyAnswer={asyncNoop}
      isLoadingObject={false}
      isStreaming={false}
      showRating
      canRate
      {...overrides}
    />,
  );
}

const followsInDom = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('AI Search page answer: reading column layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserCredentialsInfo.mockResolvedValue({ newAuthToken: 'token', newUserInfo: null });
  });

  it('ends the actions row with an "N sources" pill that lists what the answer was read from', async () => {
    renderMessage();

    expect(screen.queryByText('1 source(s)')).not.toBeInTheDocument();
    const pill = screen.getByRole('button', { name: /1 source$/ });
    expect(followsInDom(screen.getByText('Saturn Grid works on storage.'), pill)).toBe(true);
    expect(followsInDom(screen.getByRole('button', { name: 'Good answer' }), pill)).toBe(true);

    fireEvent.click(pill);

    const source = await screen.findByRole('link', { name: /Acme raises Series A/ });
    expect(source).toHaveAttribute('href', '/home?news=news-1');
    expect(source).toHaveTextContent('News');
  });

  it('shows inline thumbs instead of the 1-5 feedback dialog button', () => {
    renderMessage();

    expect(screen.getByRole('button', { name: 'Good answer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not helpful' })).toBeInTheDocument();
    expect(screen.queryByTitle('Submit feedback')).not.toBeInTheDocument();
  });

  it('hides the thumbs and the sources while the answer streams', () => {
    renderMessage({ isStreaming: true });

    expect(screen.getByText('Saturn Grid works on storage.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /source/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Good answer' })).not.toBeInTheDocument();
  });

  it('shows no sources pill for an answer without sources, but shows the thumbs', () => {
    renderMessage({}, { ...baseMessage, sources: [], sourceRefs: [] });

    expect(screen.queryByRole('button', { name: /source/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good answer' })).toBeInTheDocument();
  });

  it('saves a thumbs up for this answer and shows the receipt', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    renderMessage();

    const up = screen.getByRole('button', { name: 'Good answer' });
    fireEvent.click(up);

    expect(up).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for your response');
    await waitFor(() =>
      expect(trackFeedbackStatus).toHaveBeenCalledWith('success', 'up', 'Which teams work on storage?'),
    );
    expect(saveFeedback).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({
        rating: 5,
        comment: '',
        prompt: 'Which teams work on storage?',
        response: 'Saturn Grid works on storage.',
        threadId: 'thread-1',
        questionId: 'answer-1',
      }),
    );
    expect(trackFeedbackClick).toHaveBeenCalledWith('Which teams work on storage?', 'Saturn Grid works on storage.');
  });

  it('takes the vote back when the chosen thumb is pressed again', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    removeFeedback.mockResolvedValue({ isSaved: true });
    renderMessage();

    const up = screen.getByRole('button', { name: 'Good answer' });
    fireEvent.click(up);
    fireEvent.click(up);

    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await waitFor(() => expect(removeFeedback).toHaveBeenCalledWith('token', 'answer-1'));
    // The removal waits for the save, so the server ends on the last press.
    expect(saveFeedback.mock.invocationCallOrder[0]).toBeLessThan(removeFeedback.mock.invocationCallOrder[0]);
  });

  it('switches the vote from up to down', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    renderMessage();

    fireEvent.click(screen.getByRole('button', { name: 'Good answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));

    expect(screen.getByRole('button', { name: 'Good answer' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Not helpful' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(saveFeedback).toHaveBeenCalledTimes(2));
    expect(saveFeedback).toHaveBeenLastCalledWith('token', expect.objectContaining({ rating: 1 }));
    expect(removeFeedback).not.toHaveBeenCalled();
  });

  it('asks what was wrong after a thumbs down and sends the picked reasons', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    renderMessage();

    fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));
    await waitFor(() => expect(saveFeedback).toHaveBeenCalledWith('token', expect.objectContaining({ rating: 1 })));
    expect(screen.getByText('What was wrong?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Out of date' }));
    fireEvent.change(screen.getByPlaceholderText('Anything else? (optional)'), { target: { value: ' Old team ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.queryByText('What was wrong?')).not.toBeInTheDocument());
    expect(saveFeedback).toHaveBeenLastCalledWith(
      'token',
      expect.objectContaining({ rating: 1, reasons: ['Out of date'], comment: 'Old team', questionId: 'answer-1' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for your response');
    expect(screen.getByRole('button', { name: 'Not helpful' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('closes the reasons on Skip without another request, keeping the thumbs down', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    renderMessage();

    fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(screen.queryByText('What was wrong?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not helpful' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(trackFeedbackStatus).toHaveBeenCalledWith('success', 'down', 'Which teams work on storage?'),
    );
    expect(saveFeedback).toHaveBeenCalledTimes(1);
  });

  it('keeps the picked reasons when sending them fails', async () => {
    saveFeedback.mockResolvedValueOnce({ isSaved: true }).mockResolvedValueOnce({ isError: true, status: 500 });
    renderMessage();

    fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wrong matches' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save your rating/i);
    expect(screen.getByText('What was wrong?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
  });

  it('puts the thumbs back and shows an error when the save fails', async () => {
    saveFeedback.mockResolvedValueOnce({ isError: true, status: 500 }).mockResolvedValueOnce({ isSaved: true });
    renderMessage();

    const up = screen.getByRole('button', { name: 'Good answer' });
    fireEvent.click(up);

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save your rating/i);
    expect(trackFeedbackStatus).toHaveBeenCalledWith('error', 'up', 'Which teams work on storage?');
    expect(up).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(up);
    expect(up).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(saveFeedback).toHaveBeenCalledTimes(2));
  });

  it('shows the vote saved before the chat was reopened', () => {
    renderMessage({}, { ...baseMessage, feedback: { rating: 1 } });

    expect(screen.getByRole('button', { name: 'Not helpful' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for your response');
    expect(screen.queryByText('What was wrong?')).not.toBeInTheDocument();
  });

  it('hides the thumbs for a signed-out viewer (the feedback call needs a token)', () => {
    renderMessage({ showRating: false });

    expect(screen.queryByRole('button', { name: 'Good answer' })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Submit feedback')).not.toBeInTheDocument();
  });

  it('still saves the vote when the member lookup fails', async () => {
    getUserCredentialsInfo.mockResolvedValue({ newAuthToken: 'token', newUserInfo: { uid: 'm-1' } });
    getMemberInfo.mockRejectedValue(new Error('member api down'));
    saveFeedback.mockResolvedValue({ isSaved: true });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    renderMessage();

    fireEvent.click(screen.getByRole('button', { name: 'Good answer' }));

    await waitFor(() => expect(saveFeedback).toHaveBeenCalledWith('token', expect.objectContaining({ rating: 5 })));
    expect(screen.getByRole('button', { name: 'Good answer' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not let a viewer rate an answer in a shared thread they do not own', () => {
    renderMessage({ canRate: false });

    const up = screen.getByRole('button', { name: 'Good answer' });
    expect(up).toBeDisabled();
    fireEvent.click(up);
    expect(saveFeedback).not.toHaveBeenCalled();
  });
});

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: () => ({
    object: undefined,
    isLoading: false,
    submit: jest.fn(),
    error: undefined,
    stop: jest.fn(),
  }),
}));

jest.mock('@/components/page/husky/hooks/useSidebar', () => ({
  useSidebar: () => ({ state: 'expanded', isMobile: false, toggleSidebar: jest.fn() }),
}));

import { Chat } from '@/components/page/husky/Chat';

describe('AI Search page: reading column and pinned input', () => {
  const renderChat = () => render(<Chat isLoggedIn initialMessages={[baseMessage]} isOwnThread />);

  // Jest applies no CSS, so the layout rules are read from the module; compare without whitespace
  const squash = (text: string) => text.replace(/\s+/g, '');
  const chatStyles = squash(
    fs.readFileSync(path.join(process.cwd(), 'components/page/husky/Chat/Chat.module.scss'), 'utf8'),
  );

  it('renders the thread in a 768px reading column with the input pinned at the same width', () => {
    renderChat();

    expect(chatStyles).toContain(squash('max-width: calc(768px + 32px)'));
    expect(chatStyles).toMatch(/\.formWrapper\{[^}]*position:fixed;[^}]*width:min\(768px,calc\(100%-32px\)\)/);
    expect(chatStyles).toMatch(/&\[data-state='expanded'\]\{[^}]*width:min\(768px,calc\(100%-300px-32px\)\)/);
    expect(chatStyles).toMatch(/&\[data-state='collapsed'\]\{[^}]*width:min\(768px,calc\(100%-64px-32px\)\)/);
    expect(chatStyles).not.toContain('989px');
    expect(screen.getByPlaceholderText('Go ahead, ask anything!')).toBeInTheDocument();
  });

  it('shows thumbs on the page answer and has no 1-5 rating dialog', () => {
    const { container } = renderChat();

    expect(screen.getByRole('button', { name: 'Good answer' })).toBeInTheDocument();
    expect(screen.queryByTitle('Submit feedback')).not.toBeInTheDocument();
    expect(container.querySelector('dialog')).toBeNull();
    expect(screen.queryByText('1 source(s)')).not.toBeInTheDocument();
  });
});
