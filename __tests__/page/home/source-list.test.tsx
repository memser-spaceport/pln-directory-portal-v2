import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { SourceList } from '@/components/page/home/TeamNews/components/SourceList/SourceList';
import { getNewsSources, hasNewsSource } from '@/components/page/home/TeamNews/utils/getNewsSources';
import { NewsCard } from '@/components/page/home/TeamNews/components/NewsCard/NewsCard';
import { NewsGroupCard } from '@/components/page/home/TeamNews/components/NewsGroupCard/NewsGroupCard';
import type { ITeamNewsItem, TeamCluster, TeamNewsEventType } from '@/types/team-news.types';

const mockOnSourcesExpanded = jest.fn();
const mockOnSourceLinkClicked = jest.fn();
const mockOnCardClicked = jest.fn();

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsSourcesExpanded: (...a: unknown[]) => mockOnSourcesExpanded(...a),
    onTeamNewsSourceLinkClicked: (...a: unknown[]) => mockOnSourceLinkClicked(...a),
    onTeamNewsCardClicked: (...a: unknown[]) => mockOnCardClicked(...a),
  }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'm-1' }, isHydrated: true }),
}));

jest.mock('@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton', () => ({
  StartConversationButton: () => <button type="button">Discuss</button>,
}));

jest.mock('@/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => '2d ago',
}));

const PRIMARY_URL = 'https://protocol.ai/blog/story';
const SECOND_URL = 'https://techcrunch.com/story';
const TWO_SOURCE_URLS = [PRIMARY_URL, SECOND_URL];

const makeItem = (uid: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid,
  teamUid: 'team-1',
  teamName: 'Protocol Labs',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT' as TeamNewsEventType,
  eventDate: '2026-06-01T00:00:00.000Z',
  title: `Headline ${uid}`,
  summary: null,
  sourceUrl: PRIMARY_URL,
  sourceDomain: 'protocol.ai',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-06-02T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

let windowOpenSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  windowOpenSpy.mockRestore();
});

describe('getNewsSources', () => {
  it('derives display domains from URLs, stripping a leading www.', () => {
    const item = makeItem('a', { sourceUrls: [PRIMARY_URL, 'https://www.coindesk.com/tech/story'] });
    expect(getNewsSources(item)).toEqual([
      { domain: 'protocol.ai', url: PRIMARY_URL },
      { domain: 'coindesk.com', url: 'https://www.coindesk.com/tech/story' },
    ]);
  });

  it('keeps the backend-computed sourceDomain for the primary entry', () => {
    const item = makeItem('a', { sourceDomain: 'blog.protocol.ai', sourceUrls: TWO_SOURCE_URLS });
    expect(getNewsSources(item)[0]).toEqual({ domain: 'blog.protocol.ai', url: PRIMARY_URL });
  });

  it('drops malformed URLs instead of rendering broken rows', () => {
    const item = makeItem('a', { sourceUrls: ['not a url', SECOND_URL] });
    expect(getNewsSources(item)).toEqual([{ domain: 'techcrunch.com', url: SECOND_URL }]);
  });

  it('returns empty when sourceUrls is absent', () => {
    expect(getNewsSources(makeItem('a'))).toEqual([]);
  });
});

describe('hasNewsSource', () => {
  it('is true for a plain sourceDomain, a single-entry sourceUrls, and multi-source items', () => {
    expect(hasNewsSource(makeItem('a'))).toBe(true);
    expect(hasNewsSource(makeItem('b', { sourceDomain: null, sourceUrls: [SECOND_URL] }))).toBe(true);
    expect(hasNewsSource(makeItem('c', { sourceUrls: TWO_SOURCE_URLS }))).toBe(true);
  });

  it('is false when there is neither a sourceDomain nor sourceUrls', () => {
    expect(hasNewsSource(makeItem('a', { sourceDomain: null }))).toBe(false);
    expect(hasNewsSource(makeItem('b', { sourceDomain: null, sourceUrls: [] }))).toBe(false);
  });
});

describe('SourceList', () => {
  it('renders the plain domain with no pill when sourceUrls is absent', () => {
    render(<SourceList item={makeItem('a')} />);
    expect(screen.getByText('protocol.ai')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a single sourceUrls entry as a plain derived domain (no pill)', () => {
    render(<SourceList item={makeItem('a', { sourceDomain: null, sourceUrls: ['https://www.fil.org/x'] })} />);
    expect(screen.getByText('fil.org')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no domain at all', () => {
    const { container } = render(<SourceList item={makeItem('a', { sourceDomain: null })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a collapsed "N sources" pill for a multi-source item', () => {
    render(<SourceList item={makeItem('a', { sourceUrls: TWO_SOURCE_URLS })} />);
    const pill = screen.getByRole('button', { name: /2 sources/i });
    expect(pill).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles the popover on pill clicks and reports the expand only on open', () => {
    render(
      <SourceList
        item={makeItem('a', { sourceUrls: TWO_SOURCE_URLS })}
        position={2}
        analyticsSource="team-profile-modal"
      />,
    );
    const pill = screen.getByRole('button', { name: /2 sources/i });

    fireEvent.click(pill);
    expect(pill).toHaveAttribute('aria-expanded', 'true');
    expect(mockOnSourcesExpanded).toHaveBeenCalledTimes(1);
    expect(mockOnSourcesExpanded).toHaveBeenCalledWith(expect.objectContaining({ uid: 'a' }), 2, 'team-profile-modal');

    fireEvent.click(pill);
    expect(pill).toHaveAttribute('aria-expanded', 'false');
    expect(mockOnSourcesExpanded).toHaveBeenCalledTimes(1);
  });

  it('lists every outlet as a new-tab anchor and reports + closes on source click', () => {
    render(<SourceList item={makeItem('a', { sourceUrls: TWO_SOURCE_URLS })} />);
    fireEvent.click(screen.getByRole('button', { name: /2 sources/i }));

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', PRIMARY_URL);
    expect(links[0]).toHaveTextContent('protocol.ai');
    expect(links[1]).toHaveAttribute('href', SECOND_URL);
    expect(links[1]).toHaveTextContent('techcrunch.com');
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    fireEvent.click(links[1]);
    expect(mockOnSourceLinkClicked).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'a' }),
      0,
      { domain: 'techcrunch.com', url: SECOND_URL },
      'home',
    );
    expect(screen.getByRole('button', { name: /2 sources/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape and returns focus to the pill', () => {
    render(<SourceList item={makeItem('a', { sourceUrls: TWO_SOURCE_URLS })} />);
    const pill = screen.getByRole('button', { name: /2 sources/i });
    fireEvent.click(pill);
    fireEvent.keyDown(screen.getAllByRole('link')[0], { key: 'Escape' });
    expect(pill).toHaveAttribute('aria-expanded', 'false');
    expect(pill).toHaveFocus();
  });

  it('closes when a press lands outside the segment', () => {
    render(<SourceList item={makeItem('a', { sourceUrls: TWO_SOURCE_URLS })} />);
    const pill = screen.getByRole('button', { name: /2 sources/i });
    fireEvent.click(pill);
    fireEvent.pointerDown(document.body);
    expect(pill).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('NewsCard with a multi-source item', () => {
  const item = makeItem('a', { sourceUrls: TWO_SOURCE_URLS });

  it('shows the pill in the meta line and keeps the card click on the primary source', () => {
    const onClick = jest.fn();
    render(<NewsCard item={item} onClick={onClick} />);

    expect(screen.getByRole('button', { name: /2 sources/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText('Headline a'));
    expect(onClick).toHaveBeenCalledWith(item);
    expect(windowOpenSpy).toHaveBeenCalledWith(PRIMARY_URL, '_blank', 'noopener,noreferrer');
  });

  it('never opens the article from pill interactions (click, Enter, Space)', () => {
    const onClick = jest.fn();
    render(<NewsCard item={item} onClick={onClick} />);
    const pill = screen.getByRole('button', { name: /2 sources/i });

    fireEvent.click(pill);
    fireEvent.keyDown(pill, { key: 'Enter' });
    fireEvent.keyDown(pill, { key: ' ' });

    expect(onClick).not.toHaveBeenCalled();
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('keeps the single-source meta line as plain text', () => {
    render(<NewsCard item={makeItem('b')} />);
    expect(screen.getByText('protocol.ai')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sources/i })).not.toBeInTheDocument();
  });
});

describe('NewsGroupCard with a multi-source story', () => {
  const story = makeItem('a', { sourceUrls: TWO_SOURCE_URLS, upvoteCount: 3 });
  const cluster: TeamCluster = {
    teamUid: 'team-1',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    items: [story],
  };

  it('shows the pill in the story row', () => {
    render(<NewsGroupCard cluster={cluster} />);
    expect(screen.getByRole('button', { name: /2 sources/i })).toBeInTheDocument();
  });

  it('does not open the story when the pill is activated by keyboard or click', () => {
    render(<NewsGroupCard cluster={cluster} />);
    const pill = screen.getByRole('button', { name: /2 sources/i });

    fireEvent.keyDown(pill, { key: 'Enter' });
    fireEvent.keyDown(pill, { key: ' ' });
    fireEvent.click(pill);

    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('still opens the story on Enter pressed on the row itself', () => {
    render(<NewsGroupCard cluster={cluster} />);
    const row = document.querySelector('[data-story-uid="a"]') as HTMLElement;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(windowOpenSpy).toHaveBeenCalledWith(PRIMARY_URL, '_blank', 'noopener,noreferrer');
  });
});
