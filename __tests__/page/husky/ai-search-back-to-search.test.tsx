import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const push = jest.fn();
const replace = jest.fn();
const setOpen = jest.fn();
const setOpenMobile = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useParams: () => ({}),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/ai-search',
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

jest.mock('@/components/page/husky/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ toggleSidebar: jest.fn(), setOpen, setOpenMobile, state: 'expanded', isMobile: false }),
}));

jest.mock('@/components/core/login/utils', () => ({ useLoginRedirect: () => jest.fn() }));

jest.mock('@/services/husky.service', () => ({
  getHuskyHistory: async () => [],
  deleteThread: jest.fn(),
}));

jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: async () => ({ authToken: 'token' }),
}));

import { ChatTitleBar } from '@/components/page/husky/ChatTitleBar';
import AppSidebar from '@/components/page/husky/app-sidebar';
import { AI_SEARCH_RETURN_KEY, REOPEN_HEADER_SEARCH_EVENT } from '@/components/constants/aiSearchHandoff';

const setWidth = (width: number) => Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  mockSearchParams = new URLSearchParams();
  setWidth(1440);
});

describe('Back to search on the AI Search page', () => {
  it('leads the bar on the new-chat page and beside an open chat', () => {
    const { unmount } = render(<ChatTitleBar />);
    expect(screen.getByRole('button', { name: 'Back to search' })).toBeInTheDocument();
    unmount();

    render(<ChatTitleBar chat={{ threadId: 't-1', title: 'Storage teams' }} />);
    expect(screen.getByRole('button', { name: 'Back to search' })).toBeInTheDocument();
  });

  it('returns to the page the member came from and reopens the popover with their term', () => {
    sessionStorage.setItem(AI_SEARCH_RETURN_KEY, JSON.stringify({ path: '/teams?focus=storage', term: 'filecoin' }));
    const reopened = jest.fn();
    document.addEventListener(REOPEN_HEADER_SEARCH_EVENT, reopened);
    render(<ChatTitleBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));

    expect(push).toHaveBeenCalledWith('/teams?focus=storage');
    expect((reopened.mock.calls[0][0] as CustomEvent).detail).toEqual({ term: 'filecoin' });
    document.removeEventListener(REOPEN_HEADER_SEARCH_EVENT, reopened);
  });

  it('opens the phone search sheet on the way back', () => {
    setWidth(390);
    sessionStorage.setItem(AI_SEARCH_RETURN_KEY, JSON.stringify({ path: '/teams?focus=storage', term: 'filecoin' }));
    render(<ChatTitleBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));

    expect(push).toHaveBeenCalledWith('/teams?focus=storage&searchState=open');
  });

  it('goes home with an empty search when the member opened AI Search directly', () => {
    render(<ChatTitleBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));

    expect(push).toHaveBeenCalledWith('/home');
  });
});

describe('All chats opens the AI Search page with History showing', () => {
  it('expands the rail on desktop and drops the parameter', () => {
    mockSearchParams = new URLSearchParams('history=open');
    render(<AppSidebar isLoggedIn />);

    expect(setOpen).toHaveBeenCalledWith(true);
    expect(setOpenMobile).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith(window.location.pathname, { scroll: false });
  });

  it('opens the drawer on a phone', () => {
    setWidth(390);
    mockSearchParams = new URLSearchParams('history=open');
    render(<AppSidebar isLoggedIn />);

    expect(setOpenMobile).toHaveBeenCalledWith(true);
    expect(setOpen).not.toHaveBeenCalled();
  });
});
