import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { useCurrentUserStore } from '@/services/auth/store';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: (...a: unknown[]) => mockRouterPush(...a), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/home',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton', () => ({
  StartConversationButton: () => <button type="button">Discuss</button>,
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '2d ago',
}));

const makeItem = (overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid: 'story-1',
  teamUid: 'team-1',
  teamName: 'Lattice Compute',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT' as TeamNewsEventType,
  eventDate: '2026-07-01T00:00:00.000Z',
  title: 'Lattice Compute doubles headcount',
  summary: 'Six new roles opened across protocol engineering.',
  sourceUrl: 'https://example.com/story',
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  upvoteCount: 4,
  viewerHasUpvoted: false,
  ...overrides,
});

describe('NewsDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCurrentUserStore.setState({ currentUser: { uid: 'user-1' }, isHydrated: true });
  });
  afterEach(() => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
  });

  it('renders dialog semantics labelled by the story title', () => {
    render(<NewsDetailModal item={makeItem()} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Lattice Compute doubles headcount' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('renders team header, meta, content, disclaimer, source link, and footer actions', () => {
    render(<NewsDetailModal item={makeItem()} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);

    expect(screen.getByRole('link', { name: 'Lattice Compute' })).toHaveAttribute('href', '/teams/team-1');
    expect(screen.getByText('2d ago')).toBeInTheDocument();
    expect(screen.getByText(/Six new roles opened/)).toBeInTheDocument();
    expect(screen.getByText(/written by AI from the linked sources/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'example.com' })).toHaveAttribute('href', 'https://example.com/story');
    expect(screen.getByRole('button', { name: 'Like (4)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discuss' })).toBeInTheDocument();
  });

  it('renders sanitized contentHtml paragraphs instead of the summary when present', () => {
    const item = makeItem({
      contentHtml: '<p>First paragraph with <strong>bold</strong>.</p><p>Second paragraph.</p>',
    });
    render(<NewsDetailModal item={item} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);

    expect(screen.getByText(/First paragraph with/)).toBeInTheDocument();
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    // The plain summary is superseded by the rich body.
    expect(screen.queryByText(/Six new roles opened/)).not.toBeInTheDocument();
  });

  it('strips scripts, event handlers, and unsafe hrefs from contentHtml', () => {
    const item = makeItem({
      contentHtml:
        '<p>Safe text<script>window.pwned = true;</script></p>' +
        '<p><img src="x" onerror="window.pwned = true" />after img</p>' +
        '<p><a href="javascript:alert(1)">bad link</a> <a href="https://example.com/ok">good link</a></p>',
    });
    render(<NewsDetailModal item={item} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);

    expect(screen.getByText(/Safe text/)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img[onerror]')).toBeNull();
    expect(screen.getByText('bad link')).not.toHaveAttribute('href');
    const goodLink = screen.getByRole('link', { name: 'good link' });
    expect(goodLink).toHaveAttribute('href', 'https://example.com/ok');
    expect(goodLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect((window as unknown as { pwned?: boolean }).pwned).toBeUndefined();
  });

  it('falls back to the plain summary when contentHtml is absent (not-yet-re-enriched item)', () => {
    render(<NewsDetailModal item={makeItem()} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);
    expect(screen.getByText(/Six new roles opened/)).toBeInTheDocument();
  });

  it('hides the SOURCE section and the AI disclaimer together when no valid source exists', () => {
    const item = makeItem({ sourceUrl: 'not a url', sourceDomain: '', sourceUrls: undefined });
    render(<NewsDetailModal item={item} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);

    expect(screen.queryByText(/written by AI/)).not.toBeInTheDocument();
    expect(screen.queryByText('Source')).not.toBeInTheDocument();
  });

  it('locks body scroll while open and restores the previous value on unmount', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<NewsDetailModal item={makeItem()} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });

  it('moves focus to the close button on open', () => {
    render(<NewsDetailModal item={makeItem()} onClose={jest.fn()} onUpvoteToggle={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('restores focus to the feed root fallback when the originating row is gone', () => {
    const feedRoot = document.createElement('div');
    feedRoot.setAttribute('data-news-feed-root', '');
    feedRoot.tabIndex = -1;
    document.body.appendChild(feedRoot);

    const onClose = jest.fn();
    render(<NewsDetailModal item={makeItem()} onClose={onClose} onUpvoteToggle={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(feedRoot).toHaveFocus();
    feedRoot.remove();
  });

  it('routes anonymous Likes to #login with the news deep link, without toggling', () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    const onUpvoteToggle = jest.fn();
    render(<NewsDetailModal item={makeItem()} onClose={jest.fn()} onUpvoteToggle={onUpvoteToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Like (4)' }));

    expect(mockRouterPush).toHaveBeenCalledWith('/home?news=story-1#login');
    expect(onUpvoteToggle).not.toHaveBeenCalled();
  });

  it('forwards signed-in Likes to onUpvoteToggle with the item', () => {
    const item = makeItem();
    const onUpvoteToggle = jest.fn();
    render(<NewsDetailModal item={item} onClose={jest.fn()} onUpvoteToggle={onUpvoteToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Like (4)' }));

    expect(onUpvoteToggle).toHaveBeenCalledWith(item);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
