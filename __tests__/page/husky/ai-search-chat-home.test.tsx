import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cookies from 'js-cookie';

const goToLogin = jest.fn();
const refresh = jest.fn();
const toastInfo = jest.fn();
const trackLoginFromHuskyChat = jest.fn();
const trackSignupFromHuskyChat = jest.fn();
const trackHuskyHomeSearch = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh }) }));
jest.mock('@/services/team-news/hooks/useTeamNewsPrompts', () => ({ useTeamNewsPrompts: jest.fn() }));
jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => goToLogin }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { info: (...args: any[]) => toastInfo(...args) } }));
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () =>
    new Proxy(
      { trackLoginFromHuskyChat, trackSignupFromHuskyChat, trackHuskyHomeSearch },
      { get: (target: any, key) => target[key] ?? jest.fn() },
    ),
}));

import { ChatHome } from '@/components/page/husky/Chat/components/ChatHome';
import { useTeamNewsPrompts } from '@/services/team-news/hooks/useTeamNewsPrompts';
import { useCurrentUserStore } from '@/services/auth/store';

const PROMPT = { uid: 'news-1', question: 'What is the news from Saturn Grid: "Saturn Grid ships v2"?' };

const mockPrompts = (data: unknown) => (useTeamNewsPrompts as jest.Mock).mockReturnValue({ data });

const renderHome = () => {
  const onSubmit = jest.fn();
  const setMessages = jest.fn();
  const setType = jest.fn();
  render(<ChatHome onSubmit={onSubmit} setMessages={setMessages} setType={setType} />);
  return { onSubmit, setMessages, setType };
};

const field = () => screen.getByPlaceholderText('Go ahead, ask anything!') as HTMLTextAreaElement;

const flushFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));

const setWidth = (width: number) => Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });

beforeEach(() => {
  jest.clearAllMocks();
  Cookies.remove('sessionExpiresAt');
  Cookies.remove('dailyChats');
  useCurrentUserStore.setState({ currentUser: null } as any);
  mockPrompts([]);
  setWidth(1440);
});

describe('AI Search new-chat page: asking', () => {
  it('asks the trimmed question and clears the field', async () => {
    const { onSubmit } = renderHome();

    fireEvent.change(field(), { target: { value: '  Who works on IPFS?  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSubmit).toHaveBeenCalledWith('Who works on IPFS?');
    expect(field().value).toBe('');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await act(async () => {});
  });

  it('asks on Enter on a desktop, but not on Shift+Enter', async () => {
    const { onSubmit } = renderHome();
    fireEvent.change(field(), { target: { value: 'Who works on IPFS?' } });

    fireEvent.keyDown(field(), { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('Who works on IPFS?');
    await act(async () => {});
  });

  it('does not ask on Enter in a narrow window, where Enter adds a line', async () => {
    setWidth(800);
    const { onSubmit } = renderHome();
    fireEvent.change(field(), { target: { value: 'Who works on IPFS?' } });

    fireEvent.keyDown(field(), { key: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
    await act(async () => {});
  });
});

describe('AI Search new-chat page: signed-out daily limit', () => {
  it('shows the limit notice without focus and refuses the question at the limit', async () => {
    Cookies.set('dailyChats', '10');
    const { onSubmit } = renderHome();
    await flushFrame();

    expect(screen.getByTestId('chat-home-limit')).toHaveTextContent('Limit reached');
    expect(screen.getByTestId('chat-home-limit')).toHaveTextContent('to get unlimited responses');

    fireEvent.change(field(), { target: { value: 'One more?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(trackHuskyHomeSearch).not.toHaveBeenCalled();
    expect(field().value).toBe('One more?');
  });

  it('shows no notice below the limit', async () => {
    Cookies.set('dailyChats', '9');
    const { onSubmit } = renderHome();
    await flushFrame();

    expect(screen.queryByTestId('chat-home-limit')).not.toBeInTheDocument();
    fireEvent.change(field(), { target: { value: 'One more?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith('One more?');
  });

  it('shows no notice to a signed-in member, whatever the count', async () => {
    Cookies.set('sessionExpiresAt', '2000000000');
    Cookies.set('dailyChats', '50');
    const { onSubmit } = renderHome();
    await flushFrame();

    expect(screen.queryByTestId('chat-home-limit')).not.toBeInTheDocument();
    fireEvent.change(field(), { target: { value: 'One more?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith('One more?');
  });

  it('shows the notice when the field is focused after the limit is reached', async () => {
    renderHome();
    await flushFrame();
    expect(screen.queryByTestId('chat-home-limit')).not.toBeInTheDocument();

    Cookies.set('dailyChats', '10');
    fireEvent.focus(field());

    expect(screen.getByTestId('chat-home-limit')).toBeInTheDocument();
  });

  it('opens sign-in from the notice', async () => {
    Cookies.set('dailyChats', '10');
    renderHome();
    await flushFrame();

    fireEvent.click(screen.getByText('Sign in'));

    expect(trackLoginFromHuskyChat).toHaveBeenCalledWith('husky-home-search');
    expect(goToLogin).toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes instead of opening sign-in when the member is already signed in', async () => {
    Cookies.set('dailyChats', '10');
    useCurrentUserStore.setState({ currentUser: { uid: 'member-1' } } as any);
    renderHome();
    await flushFrame();

    fireEvent.click(screen.getByText('Sign in'));

    expect(toastInfo).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
    expect(goToLogin).not.toHaveBeenCalled();
  });

  it('tracks the sign-up link before leaving for the sign-up page', async () => {
    Cookies.set('dailyChats', '10');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    renderHome();
    await flushFrame();

    fireEvent.click(screen.getByRole('link', { name: /Sign up/ }));

    expect(trackSignupFromHuskyChat).toHaveBeenCalledWith('husky-home-search');
  });
});

describe('AI Search new-chat page: prompt suggestions', () => {
  it('asks AI Search about the picked news story', async () => {
    mockPrompts([PROMPT]);
    const { onSubmit, setMessages, setType } = renderHome();

    fireEvent.click(await screen.findByRole('button', { name: PROMPT.question }));

    expect(onSubmit).toHaveBeenCalledWith(PROMPT.question);
    expect(setMessages).not.toHaveBeenCalled();
    expect(setType).not.toHaveBeenCalled();
  });

  it('refuses the picked prompt at the signed-out daily limit and shows the notice', async () => {
    Cookies.set('dailyChats', '10');
    mockPrompts([PROMPT]);
    const { onSubmit } = renderHome();

    fireEvent.click(await screen.findByRole('button', { name: PROMPT.question }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('chat-home-limit')).toBeInTheDocument();
  });

  it('hides the suggestions when the prompt data is not a list', async () => {
    mockPrompts({ items: [PROMPT] });
    renderHome();
    await act(async () => {});

    expect(screen.queryByText('Try asking')).not.toBeInTheDocument();
  });
});
