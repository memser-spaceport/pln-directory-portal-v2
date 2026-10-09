import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const push = jest.fn();

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
  useParams: () => ({ id: 'thread-1' }),
  useRouter: () => ({ push }),
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

jest.mock('@/utils/common.utils', () => ({
  ...jest.requireActual('@/utils/common.utils'),
  triggerLoader: jest.fn(),
}));

jest.mock('@/services/husky.service', () => ({
  getHuskyHistory: async () => [
    {
      title: 'Storage teams',
      threadId: 'thread-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  deleteThread: jest.fn(),
}));

jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ isLoggedIn: false }),
}));

import { PAGE_ROUTES } from '@/utils/constants';
import { ChatTitleBar } from '@/components/page/husky/ChatTitleBar';
import AppSidebar from '@/components/page/husky/app-sidebar';
import { metadata } from '@/app/ai-search/layout';

const OLD_TEXT = /Husky|AI Chat|New Conversation|Threads/;

describe('LAB-2772: the AI chat page is AI Search at /ai-search', () => {
  beforeEach(() => push.mockClear());

  it('points the in-app route at /ai-search', () => {
    expect(PAGE_ROUTES.HUSKY).toBe('/ai-search');
  });

  it('titles the browser tab "AI Search"', () => {
    expect(metadata.title).toBe('AI Search | Protocol Labs Directory');
    expect(String(metadata.description)).not.toMatch(OLD_TEXT);
  });

  it('labels the sidebar "New chat" and "History", with no old names', async () => {
    const { container } = render(<AppSidebar isLoggedIn />);

    expect(await screen.findByText('Storage teams')).toBeInTheDocument();
    expect(screen.getByText('New chat')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(OLD_TEXT);
  });

  it('labels the chat title bar "New chat" and "History", with no old names', () => {
    const { container } = render(<ChatTitleBar chat={{ threadId: 'thread-1', title: 'Storage teams' }} />);

    expect(screen.getByRole('button', { name: 'New chat' })).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(OLD_TEXT);
  });

  it('opens a past chat from the sidebar at /ai-search/<id>', async () => {
    render(<AppSidebar isLoggedIn />);

    fireEvent.click(await screen.findByText('Storage teams'));

    expect(push).toHaveBeenCalledWith('/ai-search/thread-2');
  });

  it('starts a new chat at /ai-search from the sidebar and the header', async () => {
    render(<AppSidebar isLoggedIn />);
    await screen.findByText('Storage teams');
    fireEvent.click(screen.getByText('New chat'));
    expect(push).toHaveBeenLastCalledWith('/ai-search');

    push.mockClear();
    render(<ChatTitleBar chat={{ threadId: 'thread-1', title: 'Storage teams' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
    expect(push).toHaveBeenLastCalledWith('/ai-search');
  });
});
