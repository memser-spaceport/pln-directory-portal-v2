import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const submitChat = jest.fn();
const onAiQuerySubmitted = jest.fn();
const useObjectOptions: { current: any } = { current: undefined };

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: (options: any) => {
    useObjectOptions.current = options;
    return { object: undefined, isLoading: false, submit: submitChat, error: undefined, stop: jest.fn() };
  },
}));
jest.mock('@/utils/auth.utils', () => ({ getUserCredentials: jest.fn() }));
jest.mock('@/utils/husky.utlils', () => ({
  getChatCount: jest.fn(() => 0),
  updateLimitType: jest.fn(),
  updateChatCount: jest.fn(),
  checkRefreshToken: jest.fn(() => true),
}));
jest.mock('@/services/husky.service', () => ({
  createHuskyThread: jest.fn(() => Promise.resolve(true)),
  createThreadTitle: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('@/analytics/husky.analytics', () => ({ useHuskyAnalytics: () => new Proxy({}, { get: () => jest.fn() }) }));
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onAiQuerySubmitted, onAiConversationHistoryOpenClick: jest.fn() }),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/components/core/application-search/components/AiChatPanel/components/ChatPanelHeader', () => ({
  ChatPanelHeader: () => null,
}));
jest.mock('@/components/core/application-search/components/AiChatPanel/components/EmptyChatView', () => ({
  EmptyChatView: () => null,
}));
jest.mock('@/components/core/application-search/components/AiChatPanel/components/ChatSubheader', () => ({
  ChatSubheader: () => null,
}));
jest.mock('@/components/core/application-search/components/AiChatPanel/components/ChatHistory', () => ({
  ChatHistory: () => null,
}));
jest.mock('@/components/core/husky/husky-limit-strip', () => () => null);
jest.mock('@/components/page/husky/chat-feedback', () => () => null);
jest.mock('@/components/core/register/register-form-loader', () => () => null);
jest.mock('@/components/page/husky/messages', () => ({
  __esModule: true,
  default: ({
    onFollowupClicked,
    onRegenerate,
  }: {
    onFollowupClicked: (q: string) => void;
    onRegenerate: (q: string) => void;
  }) => (
    <>
      <button onClick={() => onFollowupClicked('And in Lisbon?')}>follow up</button>
      <button onClick={() => onRegenerate('Who works on zk?')}>regenerate</button>
    </>
  ),
}));
jest.mock('@/components/page/husky/chat-input', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { forwardRef } = require('react');
  const ChatInput = forwardRef(function ChatInput(
    { onTextSubmit }: { onTextSubmit: () => void },
    ref: React.Ref<HTMLTextAreaElement>,
  ) {
    return (
      <>
        <textarea aria-label="question" ref={ref} />
        <button type="button" onClick={onTextSubmit}>
          send
        </button>
      </>
    );
  });
  return { __esModule: true, default: ChatInput };
});

import { AiChatPanel } from '@/components/core/application-search/components/AiChatPanel/AiChatPanel';
import { getUserCredentials } from '@/utils/auth.utils';
import { checkRefreshToken, updateLimitType } from '@/utils/husky.utlils';

function ask(text: string) {
  fireEvent.change(screen.getByLabelText('question'), { target: { value: text } });
  fireEvent.click(screen.getByText('send'));
}

describe('Legacy header dialog (AiChatPanel): member-side ask event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRefreshToken as jest.Mock).mockReturnValue(true);
    (getUserCredentials as jest.Mock).mockResolvedValue({
      authToken: 'member-jwt',
      userInfo: { uid: 'member-1', name: 'Member One', email: 'member@example.test' },
    });
  });

  it('sends one event per accepted submit with entryPoint header-dialog', async () => {
    render(<AiChatPanel isLoggedIn authToken="member-jwt" />);

    ask('Who works on zk?');
    await waitFor(() => expect(submitChat).toHaveBeenCalledTimes(1));
    expect(onAiQuerySubmitted).toHaveBeenCalledTimes(1);
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith('Who works on zk?', 'header-dialog', 'user-input');

    await act(async () => {
      await useObjectOptions.current.onFinish?.({});
    });

    fireEvent.click(screen.getByText('follow up'));
    await waitFor(() => expect(onAiQuerySubmitted).toHaveBeenCalledTimes(2));
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith('And in Lisbon?', 'header-dialog', 'followup');

    await act(async () => {
      await useObjectOptions.current.onFinish?.({});
    });

    fireEvent.click(screen.getByText('regenerate'));
    await waitFor(() => expect(onAiQuerySubmitted).toHaveBeenCalledTimes(3));
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith('Who works on zk?', 'header-dialog', 'regenerate');
  });

  it('sends no event for an empty query', async () => {
    render(<AiChatPanel isLoggedIn authToken="member-jwt" />);

    ask('   ');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getUserCredentials).not.toHaveBeenCalled();
    expect(onAiQuerySubmitted).not.toHaveBeenCalled();
  });

  it('sends no event when the signed-out daily limit refuses the question', async () => {
    (checkRefreshToken as jest.Mock).mockReturnValue(false);
    (updateLimitType as jest.Mock).mockReturnValue('warn');
    (getUserCredentials as jest.Mock).mockResolvedValue({ authToken: null, userInfo: null });

    render(<AiChatPanel authToken="" />);

    ask('One too many');
    await waitFor(() => expect(getUserCredentials).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(submitChat).not.toHaveBeenCalled();
    expect(onAiQuerySubmitted).not.toHaveBeenCalled();
  });
});
