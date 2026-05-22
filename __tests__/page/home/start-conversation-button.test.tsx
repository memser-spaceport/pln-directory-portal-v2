import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import {
  NEWS_JOIN_DISCUSSION_PENDING_KEY,
  StartConversationButton,
} from '@/components/page/home/TeamNews/components/NewsCard/StartConversationButton';
import type { ITeamNewsItem } from '@/types/team-news.types';

const mockPush = jest.fn();
const mockUseCurrentUserStore = jest.fn();
const mockUseForumAccess = jest.fn();
const mockOnStartConversationClicked = jest.fn();
const mockOnJoinDiscussionClicked = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

jest.mock('@/services/access-control/hooks/useForumAccess', () => ({
  useForumAccess: () => mockUseForumAccess(),
}));

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsStartConversationClicked: (...a: unknown[]) => mockOnStartConversationClicked(...a),
    onTeamNewsJoinDiscussionClicked: (...a: unknown[]) => mockOnJoinDiscussionClicked(...a),
  }),
}));

const baseItem: ITeamNewsItem = {
  uid: 'item-1',
  teamUid: 'team-1',
  teamName: 'Bagel',
  teamLogoUrl: null,
  eventType: 'FUNDING',
  eventDate: '2026-05-19T12:00:00.000Z',
  title: 'Bagel raises $9M to build verifiable inference',
  summary: null,
  sourceUrl: 'https://www.theblock.co/post/bagel-series-a-2026',
  sourceDomain: 'theblock.co',
  tags: ['raise'],
  focusAreas: ['AI & Robotics'],
  subFocusAreas: [],
  createdAt: '2026-05-19T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
};

const itemWithThread: ITeamNewsItem = {
  ...baseItem,
  discussion: { count: 1, latestTopicUrl: '/forum/topics/1/42' },
};

describe('StartConversationButton', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
    mockUseForumAccess.mockReturnValue({ hasAccess: true, canWrite: true, isLoading: false, isError: false });
  });

  afterEach(() => {
    // Several tests override window.location to control the post-login redirect
    // target. Restore so we don't leak that state to other suites.
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  describe('no existing discussion (count === 0)', () => {
    it('renders the Discuss link when user has forum.write', () => {
      render(<StartConversationButton item={baseItem} position={2} />);
      expect(screen.getByRole('button', { name: /Start a conversation/i })).toBeInTheDocument();
    });

    it('renders nothing when user has forum.read but not forum.write', () => {
      mockUseForumAccess.mockReturnValue({ hasAccess: true, canWrite: false, isLoading: false, isError: false });
      const { container } = render(<StartConversationButton item={baseItem} position={0} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('navigates to /forum/posts/new with title + url + topic + newsItemUid on click', () => {
      render(<StartConversationButton item={baseItem} position={3} />);
      fireEvent.click(screen.getByRole('button', { name: /Start a conversation/i }));
      expect(mockPush).toHaveBeenCalledTimes(1);
      const url = mockPush.mock.calls[0][0] as string;
      expect(url).toMatch(/^\/forum\/posts\/new\?/);
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('title')).toBe(baseItem.title);
      expect(params.get('url')).toBe(baseItem.sourceUrl);
      expect(params.get('topic')).toBe('General');
      expect(params.get('newsItemUid')).toBe(baseItem.uid);
    });

    it('fires the start-conversation analytics event with the item and position', () => {
      render(<StartConversationButton item={baseItem} position={4} />);
      fireEvent.click(screen.getByRole('button', { name: /Start a conversation/i }));
      expect(mockOnStartConversationClicked).toHaveBeenCalledTimes(1);
      expect(mockOnStartConversationClicked).toHaveBeenCalledWith(baseItem, 4, false);
      expect(mockOnJoinDiscussionClicked).not.toHaveBeenCalled();
    });

    describe('unauth visitor', () => {
      beforeEach(() => {
        mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
        mockUseForumAccess.mockReturnValue({ hasAccess: false, canWrite: false, isLoading: false, isError: false });
        try {
          window.sessionStorage.clear();
        } catch {
          /* noop */
        }
        Object.defineProperty(window, 'location', {
          configurable: true,
          value: { pathname: '/home', search: '' },
        });
      });

      it('renders the Discuss link (parity with auth + write users)', () => {
        render(<StartConversationButton item={baseItem} position={0} />);
        expect(screen.getByRole('button', { name: /Start a conversation/i })).toBeInTheDocument();
      });

      it('stashes the prefill URL and triggers the login modal on click', () => {
        render(<StartConversationButton item={baseItem} position={0} />);
        fireEvent.click(screen.getByRole('button', { name: /Start a conversation/i }));
        const stashed = window.sessionStorage.getItem(NEWS_JOIN_DISCUSSION_PENDING_KEY);
        expect(stashed).toMatch(/^\/forum\/posts\/new\?/);
        expect(stashed).toContain(`newsItemUid=${baseItem.uid}`);
        expect(mockPush).toHaveBeenCalledWith('/home#login');
      });

      it('reports wasAnonymous=true on the analytics event', () => {
        render(<StartConversationButton item={baseItem} position={6} />);
        fireEvent.click(screen.getByRole('button', { name: /Start a conversation/i }));
        expect(mockOnStartConversationClicked).toHaveBeenCalledWith(baseItem, 6, true);
      });
    });
  });

  describe('existing discussion (count > 0)', () => {
    it('renders the Join discussion link when user has forum.read (even without write)', () => {
      mockUseForumAccess.mockReturnValue({ hasAccess: true, canWrite: false, isLoading: false, isError: false });
      render(<StartConversationButton item={itemWithThread} position={1} />);
      expect(screen.getByRole('button', { name: /Join the existing forum discussion/i })).toBeInTheDocument();
    });

    it('navigates directly to the latest topic URL on click', () => {
      render(<StartConversationButton item={itemWithThread} position={2} />);
      fireEvent.click(screen.getByRole('button', { name: /Join the existing forum discussion/i }));
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/forum/topics/1/42');
    });

    it('fires the join-discussion analytics event', () => {
      render(<StartConversationButton item={itemWithThread} position={5} />);
      fireEvent.click(screen.getByRole('button', { name: /Join the existing forum discussion/i }));
      expect(mockOnJoinDiscussionClicked).toHaveBeenCalledTimes(1);
      expect(mockOnJoinDiscussionClicked).toHaveBeenCalledWith(itemWithThread, 5, false);
      expect(mockOnStartConversationClicked).not.toHaveBeenCalled();
    });

    it('falls through to Discuss when count > 0 but latestTopicUrl is missing', () => {
      const item: ITeamNewsItem = { ...baseItem, discussion: { count: 1, latestTopicUrl: null } };
      render(<StartConversationButton item={item} position={0} />);
      expect(screen.getByRole('button', { name: /Start a conversation/i })).toBeInTheDocument();
    });

    it('renders nothing when signed-in user lacks forum.read', () => {
      mockUseForumAccess.mockReturnValue({ hasAccess: false, canWrite: false, isLoading: false, isError: false });
      const { container } = render(<StartConversationButton item={itemWithThread} position={0} />);
      expect(container).toBeEmptyDOMElement();
    });

    describe('unauth visitor', () => {
      beforeEach(() => {
        mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
        mockUseForumAccess.mockReturnValue({ hasAccess: false, canWrite: false, isLoading: false, isError: false });
        try {
          window.sessionStorage.clear();
        } catch {
          /* jsdom may not implement sessionStorage in all setups */
        }
      });

      it('renders the Join discussion link', () => {
        render(<StartConversationButton item={itemWithThread} position={0} />);
        expect(screen.getByRole('button', { name: /Join the existing forum discussion/i })).toBeInTheDocument();
      });

      it('stashes the target URL in sessionStorage and triggers the login modal on click', () => {
        // jsdom doesn't expose window.location.pathname mutation, so just assert
        // the push call ends with `#login` and target is stashed.
        Object.defineProperty(window, 'location', {
          configurable: true,
          value: { pathname: '/home', search: '' },
        });
        render(<StartConversationButton item={itemWithThread} position={0} />);
        fireEvent.click(screen.getByRole('button', { name: /Join the existing forum discussion/i }));
        expect(window.sessionStorage.getItem(NEWS_JOIN_DISCUSSION_PENDING_KEY)).toBe('/forum/topics/1/42');
        expect(mockPush).toHaveBeenCalledWith('/home#login');
      });

      it('reports wasAnonymous=true on the analytics event', () => {
        render(<StartConversationButton item={itemWithThread} position={7} />);
        fireEvent.click(screen.getByRole('button', { name: /Join the existing forum discussion/i }));
        expect(mockOnJoinDiscussionClicked).toHaveBeenCalledWith(itemWithThread, 7, true);
      });
    });
  });

  describe('gate states (apply to both rendering modes)', () => {
    it('renders nothing while currentUser is not yet hydrated', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: false });
      const { container } = render(<StartConversationButton item={baseItem} position={0} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing for signed-in users while forum access is loading', () => {
      mockUseForumAccess.mockReturnValue({ hasAccess: false, canWrite: false, isLoading: true, isError: false });
      const { container } = render(<StartConversationButton item={baseItem} position={0} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('stops the click from propagating so the parent card link does not also fire', () => {
    const parentClick = jest.fn();
    render(
      <a href="https://example.com/parent" onClick={parentClick}>
        <StartConversationButton item={baseItem} position={0} />
      </a>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start a conversation/i }));
    expect(parentClick).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
