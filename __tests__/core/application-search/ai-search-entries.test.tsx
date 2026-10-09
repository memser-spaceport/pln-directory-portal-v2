import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const push = jest.fn();
const replace = jest.fn();
let mockSearchParams = new URLSearchParams();
let mockChats: { threadId: string; title: string; createdAt: string; updatedAt: string }[] = [];
let mockResults: any;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => mockSearchParams,
  useParams: () => ({}),
  usePathname: () => '/home',
}));

jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

jest.mock('@/services/search/hooks/useFullApplicationSearch', () => ({
  useFullApplicationSearch: (term: string) => ({ data: term ? mockResults : undefined, isLoading: false }),
}));
jest.mock('@/services/search/hooks/useRecordRecentSearch', () => ({ useRecordRecentSearch: jest.fn() }));
jest.mock('@/services/search/hooks/useRecentSearch', () => ({ useRecentSearch: () => ({ data: ['libp2p'] }) }));
jest.mock('@/services/search/hooks/useRemoveRecentSearch', () => ({
  useRemoveRecentSearch: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/services/search/hooks/useChatHistory', () => ({ useChatHistory: () => ({ data: mockChats }) }));

// The full-search modal is left as it is; these stand in for its heavy panels.
jest.mock('@/components/core/application-search/components/AiChatPanel', () => ({ AiChatPanel: () => null }));
jest.mock('@/components/core/application-search/components/FullSearchPanel', () => ({ FullSearchPanel: () => null }));
jest.mock('@/components/core/application-search/components/SearchResultsSection', () => ({
  SearchResultsSection: () => null,
}));
jest.mock('@/components/core/application-search/components/ContentLoader', () => ({ ContentLoader: () => null }));
jest.mock('@/components/core/application-search/components/SearchCategories', () => ({
  SearchCategories: () => null,
}));

import { AppSearchDesktop } from '@/components/core/application-search/components/AppSearchDesktop';
import { AppSearchMobile } from '@/components/core/application-search/components/AppSearchMobile';
import { suggestAiQuestions } from '@/components/core/application-search/components/AiSearchEntries/utils/suggestAiQuestions';
import { openAiSearch } from '@/components/utils/openAiSearch';
import { AI_SEARCH_RETURN_KEY, REOPEN_HEADER_SEARCH_EVENT } from '@/components/constants/aiSearchHandoff';

const chat = (threadId: string, title: string, daysAgo: number) => {
  const createdAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  return { threadId, title, createdAt, updatedAt: createdAt };
};

const team = (name: string) => ({ uid: name, name, index: 'teams', image: undefined, matches: [] });

const userInfo = {} as any;

const renderDesktop = (isLoggedIn = true) =>
  render(<AppSearchDesktop isLoggedIn={isLoggedIn} userInfo={userInfo} authToken="token" />);

const typeTerm = (text: string) => {
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: text } });
  act(() => {
    jest.advanceTimersByTime(800);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
  mockSearchParams = new URLSearchParams();
  mockChats = [
    chat('c-1', 'Lumen Storage vs Saturn Grid', 0),
    chat('c-2', 'Office hours at Lumen Storage', 1),
    chat('c-3', 'PL members at Lisbon events', 3),
    chat('c-4', 'IPFS for scientific data', 20),
  ];
  mockResults = { top: [], teams: [team('Lumen Storage')], members: [], projects: [], events: [], forumThreads: [] };
  window.history.replaceState(null, '', '/home?tab=news');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('suggested AI questions', () => {
  it('offers questions whose words start with what was typed, at most two', () => {
    const results = { teams: [team('Lumen Storage')] } as any;

    expect(suggestAiQuestions({ term: 'fil ber', results }).map((q) => q.text)).toEqual([
      'Find teams building on Filecoin in Berlin',
    ]);
    expect(suggestAiQuestions({ term: 'lumen', results }).map((q) => q.text)).toEqual([
      'What does Lumen Storage work on?',
    ]);
    expect(suggestAiQuestions({ term: 'f', results })).toEqual([]);
    expect(suggestAiQuestions({ term: 'in', results }).length).toBeLessThanOrEqual(2);
  });
});

describe('opening the AI Search page from the header search', () => {
  const router = { push } as any;

  it('asks the question on /ai-search and remembers where to come back to', () => {
    openAiSearch({ router, term: 'filecoin', question: 'filecoin' });

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(localStorage.getItem('input')).toBe('filecoin');
    expect(JSON.parse(sessionStorage.getItem(AI_SEARCH_RETURN_KEY)!)).toEqual({
      path: '/home?tab=news',
      term: 'filecoin',
    });
  });

  it('opens a past chat at its own URL, or the page with History open', () => {
    openAiSearch({ router, term: '', threadId: 'c-2' });
    expect(push).toHaveBeenLastCalledWith('/ai-search/c-2');

    openAiSearch({ router, term: '', showHistory: true });
    expect(push).toHaveBeenLastCalledWith('/ai-search?history=open');
    expect(localStorage.getItem('input')).toBeNull();
  });

  it('keeps the page the member came from when they search again on /ai-search', () => {
    openAiSearch({ router, term: 'filecoin', question: 'filecoin' });
    window.history.replaceState(null, '', '/ai-search?searchState=open');

    openAiSearch({ router, term: 'ipfs', question: 'ipfs' });

    expect(JSON.parse(sessionStorage.getItem(AI_SEARCH_RETURN_KEY)!)).toEqual({ path: '/home?tab=news', term: 'ipfs' });
  });
});

describe('header search popover (desktop)', () => {
  it('lists the three latest chats and All chats with the full count at rest', () => {
    renderDesktop();
    fireEvent.click(screen.getAllByRole('textbox')[0]);

    expect(screen.getByText('Recent AI Search chats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All chats (4)' })).toBeInTheDocument();
    expect(screen.getByText('Lumen Storage vs Saturn Grid')).toBeInTheDocument();
    expect(screen.getByText('PL members at Lisbon events')).toBeInTheDocument();
    expect(screen.queryByText('IPFS for scientific data')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Office hours at Lumen Storage'));
    expect(push).toHaveBeenCalledWith('/ai-search/c-2');
  });

  it('opens the page with History open from All chats', () => {
    renderDesktop();
    fireEvent.click(screen.getAllByRole('textbox')[0]);

    fireEvent.click(screen.getByRole('button', { name: 'All chats (4)' }));

    expect(push).toHaveBeenCalledWith('/ai-search?history=open');
  });

  it('shows no chats section to a member without chats', () => {
    mockChats = [];
    renderDesktop();
    fireEvent.click(screen.getAllByRole('textbox')[0]);

    expect(screen.queryByText('Recent AI Search chats')).not.toBeInTheDocument();
    expect(screen.getByText('Ask AI Search a question')).toBeInTheDocument();
  });

  it('asks the typed term on the AI Search page', () => {
    renderDesktop();
    typeTerm('filecoin');

    fireEvent.click(screen.getByText(/Chat with AI Search about/));

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(localStorage.getItem('input')).toBe('filecoin');
  });

  it('asks a suggested question on the AI Search page', () => {
    renderDesktop();
    typeTerm('lumen');

    fireEvent.click(screen.getByRole('button', { name: /What does Lumen Storage work on\?/ }));

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(localStorage.getItem('input')).toBe('What does Lumen Storage work on?');
  });

  it('sends a search with no results to the AI Search page, not the modal', () => {
    mockResults = { top: [], teams: [], members: [], projects: [], events: [], forumThreads: [] };
    renderDesktop();
    typeTerm('zzzz');

    fireEvent.click(screen.getByText(/No results found/));

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(localStorage.getItem('input')).toBe('zzzz');
  });

  it('opens the AI Search page on a new chat from the AI badge', () => {
    renderDesktop();

    fireEvent.click(screen.getByRole('button', { name: 'Open AI Search' }));

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(localStorage.getItem('input')).toBeNull();
  });

  it('opens again with the term when the member comes back from AI Search', () => {
    renderDesktop();

    act(() => {
      document.dispatchEvent(new CustomEvent(REOPEN_HEADER_SEARCH_EVENT, { detail: { term: 'filecoin' } }));
    });

    expect(screen.getAllByRole('textbox')[0]).toHaveValue('filecoin');
    expect(screen.getByText(/Chat with AI Search about/)).toHaveTextContent('Chat with AI Search about “filecoin”');
  });
});

describe('header search sheet (phone)', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('searchState=open');
  });

  it('offers AI Search and the latest chats at rest, with no chat inside the sheet', () => {
    render(<AppSearchMobile isLoggedIn />);

    expect(screen.getByText('Ask AI Search a question')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All chats (4)' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ask AI Search a question'));
    expect(push).toHaveBeenCalledWith('/ai-search');
  });

  it('asks the typed term on the AI Search page', () => {
    render(<AppSearchMobile isLoggedIn />);
    typeTerm('filecoin');

    fireEvent.click(screen.getByText(/Chat with AI Search about/));

    expect(push).toHaveBeenCalledWith('/ai-search');
    expect(localStorage.getItem('input')).toBe('filecoin');
  });
});
