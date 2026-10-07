import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

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
jest.mock('@/services/husky.service', () => ({
  saveFeedback: (...args: unknown[]) => saveFeedback(...args),
}));

const getMemberInfo = jest.fn();
jest.mock('@/services/members.service', () => ({
  getMemberInfo: (...args: unknown[]) => getMemberInfo(...args),
}));

const getUserCredentialsInfo = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  getUserCredentialsInfo: () => getUserCredentialsInfo(),
}));

import PreviewMessage from '@/components/page/husky/preview-message';

const baseMessage = {
  question: 'Which teams work on storage?',
  answer: 'Saturn Grid works on storage.',
  relatedResults: [],
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

function renderMessage(overrides: Record<string, unknown> = {}, message = baseMessage) {
  return render(
    <PreviewMessage
      message={message}
      isLastIndex
      onFollowupClicked={noop}
      onFeedback={asyncNoop}
      onRegenerate={noop}
      onQuestionEdit={noop}
      onCopyAnswer={asyncNoop}
      isLoadingObject={false}
      isAnswerLoading={false}
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

  it('lists the sources after the answer text and drops the "N source(s)" pill', () => {
    renderMessage({ layout: 'page' });

    expect(screen.queryByText('1 source(s)')).not.toBeInTheDocument();
    const answer = screen.getByText('Saturn Grid works on storage.');
    const source = screen.getByRole('link', { name: 'Acme raises Series A' });
    expect(followsInDom(answer, source)).toBe(true);
    expect(followsInDom(source, screen.getByRole('button', { name: 'Good answer' }))).toBe(true);
  });

  it('keeps the search dialog answer as it was (pill above, 1-5 feedback)', () => {
    renderMessage();

    expect(screen.getByText('1 source(s)')).toBeInTheDocument();
    expect(screen.getByTitle('Submit feedback')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Good answer' })).not.toBeInTheDocument();
  });

  it('shows inline thumbs instead of the 1-5 feedback dialog button', () => {
    renderMessage({ layout: 'page' });

    expect(screen.getByRole('button', { name: 'Good answer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not helpful' })).toBeInTheDocument();
    expect(screen.queryByTitle('Submit feedback')).not.toBeInTheDocument();
  });

  it('hides the thumbs and the sources while the answer streams', () => {
    renderMessage({ layout: 'page', isStreaming: true });

    expect(screen.getByText('Saturn Grid works on storage.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Acme raises Series A' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Good answer' })).not.toBeInTheDocument();
  });

  it('shows no sources block for an answer without sources, but shows the thumbs', () => {
    renderMessage({ layout: 'page' }, { ...baseMessage, sources: [], sourceRefs: [] });

    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good answer' })).toBeInTheDocument();
  });

  it('records a thumbs up once, shows the chosen state and blocks a second send', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    renderMessage({ layout: 'page' });

    const up = screen.getByRole('button', { name: 'Good answer' });
    fireEvent.click(up);

    await waitFor(() => expect(up).toHaveAttribute('aria-pressed', 'true'));
    expect(saveFeedback).toHaveBeenCalledTimes(1);
    expect(saveFeedback).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({
        rating: 5,
        comment: '',
        prompt: 'Which teams work on storage?',
        response: 'Saturn Grid works on storage.',
      }),
    );
    expect(trackFeedbackStatus).toHaveBeenCalledWith('success', 'up', 'Which teams work on storage?');
    expect(trackFeedbackClick).toHaveBeenCalledWith('Which teams work on storage?', 'Saturn Grid works on storage.');

    const down = screen.getByRole('button', { name: 'Not helpful' });
    expect(up).toBeDisabled();
    expect(down).toBeDisabled();
    fireEvent.click(down);
    fireEvent.click(up);
    expect(saveFeedback).toHaveBeenCalledTimes(1);
  });

  it('sends a thumbs down as rating 1', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    renderMessage({ layout: 'page' });

    const down = screen.getByRole('button', { name: 'Not helpful' });
    fireEvent.click(down);

    await waitFor(() => expect(down).toHaveAttribute('aria-pressed', 'true'));
    expect(saveFeedback).toHaveBeenCalledWith('token', expect.objectContaining({ rating: 1, comment: '' }));
    expect(trackFeedbackStatus).toHaveBeenCalledWith('success', 'down', 'Which teams work on storage?');
  });

  it('shows an inline error when the save fails and lets the member tap again', async () => {
    saveFeedback.mockResolvedValueOnce({ isError: true, status: 500 }).mockResolvedValueOnce({ isSaved: true });
    renderMessage({ layout: 'page' });

    const up = screen.getByRole('button', { name: 'Good answer' });
    fireEvent.click(up);

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save your rating/i);
    expect(trackFeedbackStatus).toHaveBeenCalledWith('error', 'up', 'Which teams work on storage?');
    expect(up).not.toBeDisabled();
    expect(up).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(up);
    await waitFor(() => expect(up).toHaveAttribute('aria-pressed', 'true'));
    expect(saveFeedback).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides the thumbs for a signed-out viewer (the feedback call needs a token)', () => {
    renderMessage({ layout: 'page', showRating: false });

    expect(screen.queryByRole('button', { name: 'Good answer' })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Submit feedback')).not.toBeInTheDocument();
  });

  it('still saves the vote when the member lookup fails', async () => {
    getUserCredentialsInfo.mockResolvedValue({ newAuthToken: 'token', newUserInfo: { uid: 'm-1' } });
    getMemberInfo.mockRejectedValue(new Error('member api down'));
    saveFeedback.mockResolvedValue({ isSaved: true });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    renderMessage({ layout: 'page' });

    const up = screen.getByRole('button', { name: 'Good answer' });
    fireEvent.click(up);

    await waitFor(() => expect(up).toHaveAttribute('aria-pressed', 'true'));
    expect(saveFeedback).toHaveBeenCalledWith('token', expect.objectContaining({ rating: 5 }));
  });

  it('starts a different answer in the same list position with fresh thumbs', async () => {
    saveFeedback.mockResolvedValue({ isSaved: true });
    const { rerender } = renderMessage({ layout: 'page' });

    fireEvent.click(screen.getByRole('button', { name: 'Good answer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Good answer' })).toBeDisabled());

    rerender(
      <PreviewMessage
        message={{ ...baseMessage, question: 'Who funds storage?', answer: 'Acme funds storage.' }}
        isLastIndex
        onFollowupClicked={noop}
        onFeedback={asyncNoop}
        onRegenerate={noop}
        onQuestionEdit={noop}
        onCopyAnswer={asyncNoop}
        isLoadingObject={false}
        isAnswerLoading={false}
        layout="page"
      />,
    );

    expect(screen.getByRole('button', { name: 'Good answer' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Good answer' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not let a viewer rate an answer in a shared thread they do not own', () => {
    renderMessage({ layout: 'page', canRate: false });

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

jest.mock('@/components/page/husky/sidebar', () => ({
  useSidebar: () => ({ state: 'expanded', isMobile: false, toggleSidebar: jest.fn() }),
}));

import Chat from '@/components/page/husky/chat';

describe('AI Search page: reading column and pinned input', () => {
  const renderChat = () =>
    render(
      <Chat
        isLoggedIn
        userInfo={{ name: 'Ada', email: 'ada@example.com', uid: 'm-1' } as any}
        initialMessages={[baseMessage]}
        isOwnThread
      />,
    );

  // styled-jsx injects minified rules into document.head; compare without whitespace
  const squash = (text: string) => text.replace(/\s+/g, '');
  const pageStyles = () =>
    squash(
      Array.from(document.querySelectorAll('style'))
        .map((style) => style.textContent)
        .join('\n'),
    );

  it('renders the thread in a 768px reading column with the input pinned at the same width', () => {
    renderChat();
    const css = pageStyles();

    expect(css).toContain(squash('max-width: calc(768px + 32px)'));
    expect(css).toMatch(/\.chat__form-wrapper[^{]*\{[^}]*position:fixed;[^}]*width:min\(768px,calc\(100%-32px\)\)/);
    expect(css).toContain(squash('width: min(768px, calc(100% - 300px - 32px))'));
    expect(css).toContain(squash('width: min(768px, calc(100% - 64px - 32px))'));
    expect(css).not.toContain('989px');
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
