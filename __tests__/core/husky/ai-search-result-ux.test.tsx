import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/core/husky/husky-code-block', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <code>{children}</code>,
}));

const trackHuskyCitationClicked = jest.fn();
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({
    trackHuskyCitationClicked,
    trackHuskySourceLinkClicked: jest.fn(),
    trackDirectoryResultsCardClicked: jest.fn(),
    trackMobileHeaderToggleClicked: jest.fn(),
    trackMobileDeleteThread: jest.fn(),
    trackHistoryListItemClicked: jest.fn(),
    trackDeleteThread: jest.fn(),
    trackSidebarToggleClicked: jest.fn(),
    trackSidebarNewConversationClicked: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'thread-1' }),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/ai-search/thread-1',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/page/husky/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({
    toggleSidebar: jest.fn(),
    state: 'expanded',
    isMobile: false,
  }),
}));

jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: async () => ({ authToken: 'token' }),
}));

jest.mock('@/services/husky.service', () => ({
  getHuskyHistory: async () => [
    {
      title: 'Storage teams',
      threadId: 'thread-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  deleteThread: jest.fn(),
}));

import { Markdown } from '@/components/common/Markdown';
import HuskySourceCard from '@/components/core/husky/husky-source-card';
import { DirectoryResultCards } from '@/components/core/application-search/components/DirectoryResultCards';
import cards from '@/components/core/application-search/components/DirectoryResultCards/DirectoryResultCards.module.scss';
import ChatMessageActions from '@/components/page/husky/chat-actions';
import { ChatTitleBar } from '@/components/page/husky/ChatTitleBar';
import AppSidebar from '@/components/page/husky/app-sidebar';

const newsRef = {
  index: 1,
  title: 'Acme raises Series A',
  type: 'news',
  directoryLink: '/home?news=news-1',
  externalUrl: 'https://news.example/acme',
};

describe('AI search citations and sources', () => {
  it('points a numbered citation at the in-product page and keeps the news title', () => {
    render(<Markdown sourceRefs={[newsRef]}>{'Funding news [1](https://news.example/acme)'}</Markdown>);

    const link = screen.getByRole('link', { name: '[1]' });
    expect(link).toHaveAttribute('href', '/home?news=news-1');
    expect(link).toHaveAttribute('title', 'Acme raises Series A');
    expect(link).toHaveAttribute('target', '_blank');

    fireEvent.click(link);
    expect(trackHuskyCitationClicked).toHaveBeenCalledWith('/home?news=news-1');
  });

  it('does not record an ordinary link as a citation', () => {
    trackHuskyCitationClicked.mockClear();
    render(<Markdown>{'[docs](https://example.com/docs)'}</Markdown>);

    fireEvent.click(screen.getByRole('link', { name: 'docs' }));

    expect(trackHuskyCitationClicked).not.toHaveBeenCalled();
  });

  it('indents a nested list under its parent point', () => {
    const { container } = render(<Markdown>{'- Storage\n  - Filecoin'}</Markdown>);

    expect(container.querySelectorAll('ul').length).toBeGreaterThan(1);
    expect(container.querySelector('style')?.textContent).toContain('list-style-type: circle');
    expect(container.querySelector('style')?.textContent).toContain('padding-inline-start');
  });

  it('shows the source title instead of the raw URL', () => {
    render(<HuskySourceCard sources={['https://news.example/acme']} sourceRefs={[newsRef]} />);

    const link = screen.getByRole('link', { name: 'Acme raises Series A' });
    expect(link).toHaveAttribute('href', '/home?news=news-1');
    expect(screen.queryByText('https://news.example/acme')).not.toBeInTheDocument();
  });

  it('shows only the cited team when a source title still contains the whole team line', () => {
    const title = 'Teams: Speculative Technologies (Ancestor) [TeamLink](/teams/spec), Synchron (Ancestor)';
    render(<HuskySourceCard sourceRefs={[{ index: 1, title, type: 'team', directoryLink: '/teams/synchron' }]} />);

    const link = screen.getByRole('link', { name: 'Synchron (Ancestor)' });
    expect(link).toHaveAttribute('href', '/teams/synchron');
    expect(screen.queryByText(/TeamLink/)).not.toBeInTheDocument();
  });

  it('splits a source that is a raw team line into one link per team', () => {
    const line =
      'Teams: Speculative Technologies (Ancestor) [TeamLink](/teams/spec), Science (Ancestor) [TeamLink](/teams/science)';
    render(<HuskySourceCard sources={[line]} />);

    expect(screen.getByRole('link', { name: 'Speculative Technologies (Ancestor)' })).toHaveAttribute(
      'href',
      '/teams/spec',
    );
    expect(screen.getByRole('link', { name: 'Science (Ancestor)' })).toHaveAttribute('href', '/teams/science');
    expect(screen.queryByText(/TeamLink/)).not.toBeInTheDocument();
  });
});

describe('AI search result cards', () => {
  it('lets a news title wrap and keeps a team name on one line', () => {
    render(
      <DirectoryResultCards
        actions={[
          { name: 'Acme raises Series A and expands the network', directoryLink: '/home?news=news-1', type: 'News' },
          { name: 'Saturn Grid', directoryLink: '/teams/saturn', type: 'Team' },
          { name: 'Backend engineer', directoryLink: '/jobs/openings/role-1', type: 'Job' },
        ]}
      />,
    );

    expect(screen.getByText('Acme raises Series A and expands the network')).toHaveClass(cards.nameFull);
    expect(screen.getByText('Saturn Grid')).not.toHaveClass(cards.nameFull);
    expect(screen.getByText('News')).toBeInTheDocument();
    expect(screen.getByText('Job')).toBeInTheDocument();
  });
});

describe('AI search share controls', () => {
  it('does not offer share on a chat answer', () => {
    render(
      <ChatMessageActions
        onQuestionEdit={jest.fn()}
        onFeedback={jest.fn()}
        onRegenerate={jest.fn()}
        onCopyAnswer={jest.fn()}
        answer="answer"
        isLastIndex
        question="question"
        hideActions={false}
        isLoadingObject={false}
      />,
    );

    expect(screen.queryByTitle('Share entire thread')).not.toBeInTheDocument();
    expect(screen.queryByText('Share entire thread')).not.toBeInTheDocument();
  });

  it('keeps Share out of the chat title bar menu, which only deletes', async () => {
    render(<ChatTitleBar chat={{ threadId: 'thread-1', title: 'Storage teams' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'More actions for this chat' }));

    expect(await screen.findByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Share/ })).not.toBeInTheDocument();
  });

  it('does not offer share on a sidebar thread', async () => {
    render(<AppSidebar isLoggedIn />);

    expect(await screen.findByText('Storage teams')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'share', hidden: true })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'delete', hidden: true })).toBeInTheDocument();
  });
});
