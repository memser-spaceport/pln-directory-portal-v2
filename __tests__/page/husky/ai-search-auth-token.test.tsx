import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const useObjectOptions: { current: any } = { current: undefined };
const submitChat = jest.fn();

jest.mock('@ai-sdk/react', () => ({
  experimental_useObject: (options: any) => {
    useObjectOptions.current = options;
    return { object: undefined, isLoading: false, submit: submitChat, error: undefined, stop: jest.fn() };
  },
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
jest.mock('@/analytics/husky.analytics', () => ({ useHuskyAnalytics: () => new Proxy({}, { get: () => jest.fn() }) }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/components/page/husky/sidebar', () => ({ useSidebar: () => ({}) }));
jest.mock('@/components/page/husky/messages', () => () => null);
jest.mock('@/components/page/husky/chat-composer', () => () => null);
jest.mock('@/components/core/husky/husky-limit-strip', () => () => null);
jest.mock('@/components/page/husky/ChatHome', () => ({
  ChatHome: ({ onSubmit }: { onSubmit: (q: string) => void }) => (
    <button onClick={() => onSubmit('Who can give us a warm intro to a fund?')}>ask</button>
  ),
}));

import Chat from '@/components/page/husky/chat';
import { getUserCredentials } from '@/utils/auth.utils';
import { checkRefreshToken } from '@/utils/husky.utlils';

/** Runs the `fetch` handed to useObject and returns the headers it sent. */
async function headersOfNextChatRequest(): Promise<Record<string, string>> {
  const realFetch = jest.fn(() => Promise.resolve({ ok: true }));
  const originalFetch = global.fetch;
  global.fetch = realFetch as any;
  try {
    await useObjectOptions.current.fetch('http://api/v1/husky/chat/contextual-tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  } finally {
    global.fetch = originalFetch;
  }
  return (realFetch.mock.calls[0] as any[])[1].headers;
}

describe('AI Search page chat request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRefreshToken as jest.Mock).mockReturnValue(true);
    useObjectOptions.current = undefined;
  });

  it('sends the signed-in token, so member-gated tools see the member', async () => {
    (getUserCredentials as jest.Mock).mockResolvedValue({
      authToken: 'member-jwt',
      userInfo: { uid: 'member-1', name: 'Member One', email: 'member@example.test' },
    });
    render(
      <Chat isLoggedIn userInfo={{ uid: 'member-1' } as any} initialMessages={[]} setInitialMessages={jest.fn()} />,
    );

    fireEvent.click(screen.getByText('ask'));
    await waitFor(() => expect(submitChat).toHaveBeenCalled());

    const headers = await headersOfNextChatRequest();
    expect(headers.Authorization).toBe('Bearer member-jwt');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends no Authorization header for a signed-out visitor', async () => {
    (getUserCredentials as jest.Mock).mockResolvedValue({ authToken: null, userInfo: null });
    (checkRefreshToken as jest.Mock).mockReturnValue(false);
    render(<Chat isLoggedIn={false} userInfo={null as any} initialMessages={[]} setInitialMessages={jest.fn()} />);

    fireEvent.click(screen.getByText('ask'));
    await waitFor(() => expect(submitChat).toHaveBeenCalled());

    const headers = await headersOfNextChatRequest();
    expect(headers.Authorization).toBeUndefined();
  });
});
