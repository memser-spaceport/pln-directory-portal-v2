import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({
    trackMobileHeaderToggleClicked: jest.fn(),
    trackMobileDeleteThread: jest.fn(),
    trackHistoryListItemClicked: jest.fn(),
    trackDeleteThread: jest.fn(),
    trackSidebarToggleClicked: jest.fn(),
    trackSidebarNewConversationClicked: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/ai-search',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/page/husky/Sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/page/husky/hooks/useSidebar', () => ({
  useSidebar: () => ({ toggleSidebar: jest.fn(), state: 'expanded', isMobile: false }),
}));

jest.mock('@/services/husky.service', () => ({
  getHuskyHistory: async () => [],
  deleteThread: jest.fn(),
}));

jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ isLoggedIn: false }),
}));

jest.mock('@/services/search/hooks/useChatHistory', () => ({
  useChatHistory: () => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() }),
}));

import { metadata } from '@/app/ai-search/layout';
import { AppSidebar } from '@/components/page/husky/AppSidebar';
import { AiSearchHistorySection } from '@/components/core/application-search/components/AiSearchHistorySection/AiSearchHistorySection';
import { ChatSubheader } from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader';
import { NothingFound } from '@/components/core/application-search/components/NothingFound/NothingFound';

const OLD_NAME = /AI Search/i;
const noop = jest.fn();

describe('LAB-3430: members read "AI agent chat", not "AI Search"', () => {
  it('titles and describes the /ai-search page as AI agent chat', () => {
    expect(metadata.title).toBe('AI agent chat | Protocol Labs Directory');
    expect(metadata.description).toBe('AI agent chat for Protocol Labs Directory');
  });

  it('names the page sidebar "AI agent chat"', () => {
    const { container } = render(<AppSidebar isLoggedIn={false} />);

    expect(screen.getByText('AI agent chat')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(OLD_NAME);
  });

  it('labels the header search history "Your AI agent chat history"', () => {
    const { container } = render(
      <AiSearchHistorySection
        mode="full"
        isLoggedIn
        onOpenThread={async () => true}
        onShowAll={noop}
        onCloseFull={noop}
      />,
    );

    expect(screen.getAllByText('Your AI agent chat history').length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(OLD_NAME);
  });

  it('tells a signed-out member to sign in to keep their AI agent chat history', () => {
    const { container } = render(
      <AiSearchHistorySection
        mode="compact"
        isLoggedIn={false}
        onOpenThread={async () => true}
        onShowAll={noop}
        onCloseFull={noop}
      />,
    );

    expect(screen.getByText('Your AI agent chat history')).toBeInTheDocument();
    expect(screen.getByText('Sign in to keep your AI agent chat history.')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(OLD_NAME);
  });

  it('offers "Your AI agent chat history" from an empty chat', () => {
    render(<ChatSubheader isEmpty isLoggedIn isShowHistory={false} lastQuery="" onToggleHistory={noop} />);

    expect(screen.getByRole('button', { name: 'Your AI agent chat history' })).toBeInTheDocument();
  });

  it('points a search with no results at AI agent chat', () => {
    const { container } = render(<NothingFound onClick={noop} searchTerm="zzz" />);

    expect(screen.getByText('Try using different keywords or use AI agent chat.')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(OLD_NAME);
  });
});
