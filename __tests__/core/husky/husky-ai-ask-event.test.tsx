import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const submit = jest.fn();
const onAiQuerySubmitted = jest.fn();
const cookies: Record<string, string | undefined> = {};

jest.mock('ai/react', () => ({
  experimental_useObject: () => ({ object: undefined, isLoading: false, submit, error: undefined, stop: jest.fn() }),
}));
jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { get: (name: string) => cookies[name], set: jest.fn() },
}));
jest.mock('@/utils/fetch-wrapper', () => ({
  getUserCredentialsInfo: jest.fn(() =>
    Promise.resolve({ isLoginRequired: false, newAuthToken: 'member-jwt', newUserInfo: { uid: 'member-1' } }),
  ),
}));
jest.mock('@/services/discovery.service', () => ({ incrementHuskyShareCount: jest.fn() }));
jest.mock('@/analytics/husky.analytics', () => ({ useHuskyAnalytics: () => new Proxy({}, { get: () => jest.fn() }) }));
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onAiQuerySubmitted }),
}));
jest.mock('@/components/core/husky/husky-ask', () => ({
  __esModule: true,
  default: ({ onPromptClicked }: { onPromptClicked: (q: string) => void }) => (
    <button onClick={() => onPromptClicked('Which teams work on storage?')}>prompt</button>
  ),
}));
jest.mock('@/components/core/husky/husky-chat', () => ({
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
      <button onClick={() => onRegenerate('Which teams work on storage?')}>regenerate</button>
    </>
  ),
}));
jest.mock('@/components/core/husky/husky-input-box', () => ({
  __esModule: true,
  default: ({ onHuskyInput }: { onHuskyInput: (q: string) => void }) => (
    <>
      <button onClick={() => onHuskyInput('Who works on zk?')}>type</button>
      <button onClick={() => onHuskyInput('   ')}>type empty</button>
    </>
  ),
}));
jest.mock('@/components/core/husky/husky-limit-strip', () => () => null);
jest.mock('@/components/core/husky/husky-answer-loader', () => () => null);
jest.mock('@/components/core/husky/husky-feedback', () => () => null);
jest.mock('@/components/core/page-loader', () => () => null);

import HuskyAi from '@/components/core/husky/husky-ai';

const initialChats = [{ question: 'Which teams work on storage?', answer: 'Team A.', isError: false }];

describe('Home page AI chat (HuskyAi): member-side ask event', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cookies.sessionExpiresAt = '2000000000';
    cookies.dailyChats = undefined;
  });

  it('sends one event per accepted submit with entryPoint home', async () => {
    render(<HuskyAi isLoggedIn initialChats={initialChats} />);

    fireEvent.click(screen.getByText('prompt'));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith('Which teams work on storage?', 'home', 'prompt');

    fireEvent.click(screen.getByText('type'));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith('Who works on zk?', 'home', 'user-input');

    fireEvent.click(screen.getByText('follow up'));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(3));
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith('And in Lisbon?', 'home', 'followup');

    fireEvent.click(screen.getByText('regenerate'));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(4));
    expect(onAiQuerySubmitted).toHaveBeenLastCalledWith('Which teams work on storage?', 'home', 'regenerate');

    expect(onAiQuerySubmitted).toHaveBeenCalledTimes(4);
  });

  it('records a blog-mode regenerate as submitType regenerate', async () => {
    render(<HuskyAi isLoggedIn mode="blog" blogId="blog-1" initialChats={initialChats} />);

    fireEvent.click(screen.getByText('regenerate'));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(onAiQuerySubmitted).toHaveBeenCalledWith('Which teams work on storage?', 'home', 'regenerate');
  });

  it('hands an empty query to the handler, which sends nothing for it', async () => {
    render(<HuskyAi isLoggedIn initialChats={initialChats} />);

    fireEvent.click(screen.getByText('type empty'));
    await waitFor(() => expect(onAiQuerySubmitted).toHaveBeenCalledWith('   ', 'home', 'user-input'));
  });

  it('sends no event when the signed-out daily limit refuses the question', async () => {
    cookies.sessionExpiresAt = undefined;
    cookies.dailyChats = '99';

    render(<HuskyAi isLoggedIn={false} initialChats={initialChats} />);

    fireEvent.click(screen.getByText('type'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(submit).not.toHaveBeenCalled();
    expect(onAiQuerySubmitted).not.toHaveBeenCalled();
  });
});
