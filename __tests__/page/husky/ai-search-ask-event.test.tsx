import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const submitChat = jest.fn();
const onAiQuerySubmitted = jest.fn();
const trackAiResponse = jest.fn();

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: () => ({
    object: undefined,
    isLoading: false,
    submit: submitChat,
    error: undefined,
    stop: jest.fn(),
  }),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
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
  duplicateThread: jest.fn(),
}));
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => new Proxy({ trackAiResponse }, { get: (t: any, k) => t[k] ?? jest.fn() }),
}));
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onAiQuerySubmitted }),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/components/page/husky/hooks/useSidebar', () => ({ useSidebar: () => ({}) }));
jest.mock('@/components/page/husky/Chat/components/Messages', () => ({
  Messages: ({
    onFollowupClicked,
    onRegenerate,
  }: {
    onFollowupClicked: (q: string) => void;
    onRegenerate: (q: string) => void;
  }) => (
    <>
      <button onClick={() => onFollowupClicked('And in Lisbon?')}>follow up</button>
      <button onClick={() => onRegenerate('Who can give us a warm intro to a fund?')}>regenerate</button>
    </>
  ),
}));
jest.mock('@/components/page/husky/Chat/components/ChatComposer', () => ({ ChatComposer: () => null }));
jest.mock('@/components/core/husky/husky-limit-strip', () => () => null);
jest.mock('@/components/page/husky/Chat/components/ChatHome', () => ({
  ChatHome: ({ onSubmit }: { onSubmit: (q: string) => void }) => (
    <button onClick={() => onSubmit('Who can give us a warm intro to a fund?')}>ask</button>
  ),
}));

import { Chat } from '@/components/page/husky/Chat';
import { getUserCredentials } from '@/utils/auth.utils';
import { checkRefreshToken, updateLimitType } from '@/utils/husky.utlils';

const existingMessages = [
  { question: 'Who can give us a warm intro to a fund?', answer: 'Ask Ada.', followupQuestions: [], sources: [] },
];

describe('AI Search page: member-side ask event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    (checkRefreshToken as jest.Mock).mockReturnValue(true);
    (getUserCredentials as jest.Mock).mockResolvedValue({
      authToken: 'member-jwt',
      userInfo: { uid: 'member-1', name: 'Member One', email: 'member@example.test' },
    });
  });

  it('sends one event for a new question, with entryPoint ai-search-page', async () => {
    render(<Chat isLoggedIn initialMessages={[]} setInitialMessages={jest.fn()} />);

    fireEvent.click(screen.getByText('ask'));
    await waitFor(() => expect(submitChat).toHaveBeenCalled());

    expect(onAiQuerySubmitted).toHaveBeenCalledTimes(1);
    expect(onAiQuerySubmitted).toHaveBeenCalledWith(
      'Who can give us a warm intro to a fund?',
      'ai-search-page',
      'user-input',
    );
    expect(trackAiResponse).toHaveBeenCalledWith('initiated', 'user-input', false, expect.any(String));
  });

  it('sends one event for a follow-up and for a regenerate', async () => {
    render(<Chat isLoggedIn id="thread-1" initialMessages={existingMessages} setInitialMessages={jest.fn()} />);

    fireEvent.click(screen.getByText('follow up'));
    await waitFor(() => expect(onAiQuerySubmitted).toHaveBeenCalledTimes(1));
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith('And in Lisbon?', 'ai-search-page', 'followup');

    fireEvent.click(screen.getByText('regenerate'));
    await waitFor(() => expect(onAiQuerySubmitted).toHaveBeenCalledTimes(2));
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith(
      'Who can give us a warm intro to a fund?',
      'ai-search-page',
      'regenerate',
    );
  });

  it('sends one event for a question handed over by another page', async () => {
    localStorage.setItem('input', 'Who builds on IPFS?');

    render(<Chat isLoggedIn initialMessages={[]} setInitialMessages={jest.fn()} />);

    await waitFor(() => expect(submitChat).toHaveBeenCalled());
    expect(onAiQuerySubmitted).toHaveBeenCalledTimes(1);
    expect(onAiQuerySubmitted).toHaveBeenCalledWith('Who builds on IPFS?', 'ai-search-page', 'user-input');
  });

  it('sends no event when the signed-out daily limit refuses the question', async () => {
    (checkRefreshToken as jest.Mock).mockReturnValue(false);
    (updateLimitType as jest.Mock).mockReturnValue('warn');
    (getUserCredentials as jest.Mock).mockResolvedValue({ authToken: null, userInfo: null });

    render(<Chat isLoggedIn={false} initialMessages={[]} setInitialMessages={jest.fn()} />);

    fireEvent.click(screen.getByText('ask'));
    await waitFor(() => expect(getUserCredentials).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(submitChat).not.toHaveBeenCalled();
    expect(onAiQuerySubmitted).not.toHaveBeenCalled();
  });
});
