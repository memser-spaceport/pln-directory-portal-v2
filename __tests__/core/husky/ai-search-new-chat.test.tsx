import '@testing-library/jest-dom';
import React, { createRef } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatHome, { SCOPE_LINE } from '@/components/page/husky/chat-home';
import ChatComposer from '@/components/page/husky/chat-composer';
import { getChatQuestions } from '@/services/discovery.service';

// LAB-2773: AI Search new-chat page shows suggestions under the field, and the field gets the new look.

jest.mock('@/services/discovery.service', () => ({
  getChatQuestions: jest.fn(),
}));

const mockTrackExplorationPromptSelection = jest.fn();
const mockTrackHuskyHomeSearch = jest.fn();
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({
    trackExplorationPromptSelection: mockTrackExplorationPromptSelection,
    trackHuskyHomeSearch: mockTrackHuskyHomeSearch,
    trackSignupFromHuskyChat: jest.fn(),
    trackLoginFromHuskyChat: jest.fn(),
  }),
}));

jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => jest.fn(),
}));

jest.mock('@/utils/husky.utlils', () => ({
  getChatCount: () => 0,
}));

const PROMPTS = [1, 2, 3, 4, 5].map((n) => ({
  uid: `q${n}`,
  question: `Question ${n}?`,
  answer: `Answer ${n}`,
  icon: `/icons/q${n}.svg`,
  answerSourceLinks: [{ link: `https://example.com/${n}` }],
  followupQuestions: [],
}));

const renderHome = () => {
  const onSubmit = jest.fn();
  const setMessages = jest.fn();
  const setType = jest.fn();
  render(<ChatHome onSubmit={onSubmit} setMessages={setMessages} setType={setType} />);
  return { onSubmit, setMessages, setType };
};

describe('AI Search new-chat page (ChatHome)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows four suggestions under the field before the field is focused', async () => {
    (getChatQuestions as jest.Mock).mockResolvedValue({ data: PROMPTS });
    renderHome();
    (document.activeElement as HTMLElement | null)?.blur();

    await waitFor(() => expect(screen.getByTestId('chat-home-prompts')).toBeInTheDocument());
    expect(screen.getByText('Try asking')).toBeInTheDocument();
    ['Question 1?', 'Question 2?', 'Question 3?', 'Question 4?'].forEach((q) =>
      expect(screen.getByText(q)).toBeInTheDocument(),
    );
    expect(screen.queryByText('Question 5?')).not.toBeInTheDocument();
  });

  it('starts a chat with the clicked suggestion', async () => {
    (getChatQuestions as jest.Mock).mockResolvedValue({ data: PROMPTS });
    const { setMessages, setType } = renderHome();

    fireEvent.click(await screen.findByTestId('prompt-1'));

    expect(mockTrackExplorationPromptSelection).toHaveBeenCalledWith('Question 2?', 'husky-page');
    expect(setMessages).toHaveBeenCalledWith([
      expect.objectContaining({ question: 'Question 2?', sources: ['https://example.com/2'] }),
    ]);
    expect(setType).toHaveBeenCalledWith('blog');
  });

  it('shows the one-line scope sentence under the headline', async () => {
    (getChatQuestions as jest.Mock).mockResolvedValue({ data: PROMPTS });
    renderHome();
    expect(screen.getByText('Explore Protocol Labs with AI')).toBeInTheDocument();
    expect(screen.getByTestId('chat-home-scope')).toHaveTextContent(SCOPE_LINE);
    await screen.findByTestId('chat-home-prompts');
  });

  it('has no "Shift + Enter" hint in the field', async () => {
    (getChatQuestions as jest.Mock).mockResolvedValue({ data: PROMPTS });
    renderHome();
    await screen.findByTestId('chat-home-prompts');
    expect(screen.queryByText(/to add new line/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
  });

  it('hides the suggestions area when the list is empty, and keeps headline, scope and field', async () => {
    (getChatQuestions as jest.Mock).mockResolvedValue({ data: [] });
    renderHome();
    await waitFor(() => expect(getChatQuestions).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.queryByTestId('chat-home-prompts')).not.toBeInTheDocument();
    expect(screen.getByText('Explore Protocol Labs with AI')).toBeInTheDocument();
    expect(screen.getByTestId('chat-home-scope')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Go ahead, ask anything!')).toBeInTheDocument();
  });

  it('hides the suggestions area when loading fails', async () => {
    (getChatQuestions as jest.Mock).mockRejectedValue(new Error('network'));
    renderHome();
    await waitFor(() => expect(getChatQuestions).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.queryByTestId('chat-home-prompts')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Go ahead, ask anything!')).toBeInTheDocument();
  });

  it('hides the suggestions area when the API returns an error object', async () => {
    (getChatQuestions as jest.Mock).mockResolvedValue({ error: { status: 500 } });
    renderHome();
    await waitFor(() => expect(getChatQuestions).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.queryByTestId('chat-home-prompts')).not.toBeInTheDocument();
  });

  it('asks the typed question with the send button', async () => {
    (getChatQuestions as jest.Mock).mockResolvedValue({ data: PROMPTS });
    const { onSubmit } = renderHome();
    await screen.findByTestId('chat-home-prompts');
    const field = screen.getByPlaceholderText('Go ahead, ask anything!') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: 'Who works on IPFS?' } });
    fireEvent.click(screen.getByTestId('chat-composer-send'));
    expect(onSubmit).toHaveBeenCalledWith('Who works on IPFS?');
    expect(mockTrackHuskyHomeSearch).toHaveBeenCalledWith('Who works on IPFS?', 'husky-page');
  });
});

describe('ChatComposer (field used on the new-chat page and under an open chat)', () => {
  it('dims and disables the send button while the field is empty, and enables it with text', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const onTextSubmit = jest.fn();
    render(<ChatComposer ref={ref} placeholder="Ask" onTextSubmit={onTextSubmit} />);

    const send = screen.getByTestId('chat-composer-send');
    expect(send).toBeDisabled();
    fireEvent.click(send);
    expect(onTextSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Ask'), { target: { value: 'hello' } });
    expect(send).toBeEnabled();
    fireEvent.click(send);
    expect(onTextSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows a stop button while an answer streams, and stop halts the answer', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const onStopStreaming = jest.fn();
    render(<ChatComposer ref={ref} placeholder="Ask" isLoadingObject onStopStreaming={onStopStreaming} />);

    expect(screen.queryByTestId('chat-composer-send')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('chat-composer-stop'));
    expect(onStopStreaming).toHaveBeenCalledTimes(1);
  });

  it('does not allow a send while the answer is loading', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<ChatComposer ref={ref} placeholder="Ask" defaultValue="hello" isAnswerLoading />);
    expect(screen.getByTestId('chat-composer-send')).toBeDisabled();
  });

  it('dims the send button again after the parent clears the field on Enter', async () => {
    const ref = createRef<HTMLTextAreaElement>();
    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') e.currentTarget.value = '';
    };
    render(<ChatComposer ref={ref} placeholder="Ask" onKeyDown={onKeyDown} />);
    const field = screen.getByPlaceholderText('Ask');
    fireEvent.change(field, { target: { value: 'hello' } });
    expect(screen.getByTestId('chat-composer-send')).toBeEnabled();
    fireEvent.keyDown(field, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('chat-composer-send')).toBeDisabled());
  });
});
