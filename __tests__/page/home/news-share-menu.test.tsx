import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { NewsShareMenu } from '@/components/page/home/TeamNews/components/NewsShareMenu';
import { buildShareIntentUrl } from '@/components/page/home/TeamNews/utils/buildShareIntentUrl';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

const mockOnShared = jest.fn();
jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsShared: (...a: unknown[]) => mockOnShared(...a),
  }),
}));

const item: ITeamNewsItem = {
  uid: 'story-1',
  teamUid: 'team-1',
  teamName: 'Lattice Compute',
  teamLogoUrl: null,
  eventType: 'ANNOUNCEMENT' as TeamNewsEventType,
  eventDate: '2026-07-01T00:00:00.000Z',
  title: 'Lattice doubles headcount',
  summary: null,
  sourceUrl: 'https://example.com/story',
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
};

// jsdom test origin — the canonical deep link the menu must always share.
const CANONICAL = 'http://localhost/home?news=story-1';

const writeText = jest.fn().mockResolvedValue(undefined);
beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

let windowOpenSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
});
afterEach(() => {
  windowOpenSpy.mockRestore();
});

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: /Share/ }));

describe('buildShareIntentUrl', () => {
  it('percent-encodes a poisoned title so it cannot smuggle its own url param', () => {
    const url = buildShareIntentUrl('x', CANONICAL, 'Evil &url=https://attacker.example');
    expect(url).not.toContain('&url=https://attacker.example');
    expect(url).toContain(`text=${encodeURIComponent('Evil &url=https://attacker.example')}`);
    expect(url).toContain(`url=${encodeURIComponent(CANONICAL)}`);
  });

  it('builds the LinkedIn share-offsite URL with only the encoded url', () => {
    expect(buildShareIntentUrl('linkedin', CANONICAL, 'ignored')).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(CANONICAL)}`,
    );
  });

  it('uses the x.com/intent/post canonical for X', () => {
    expect(buildShareIntentUrl('x', CANONICAL, 'hello')).toMatch(/^https:\/\/x\.com\/intent\/post\?/);
  });
});

describe('NewsShareMenu', () => {
  it('copies the canonical deep link (never location.href) and shows the copied state', async () => {
    window.history.replaceState(null, '', '/home?utm_source=li&news=other-story');
    render(<NewsShareMenu item={item} source="home" />);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));
    await act(async () => {});

    expect(writeText).toHaveBeenCalledWith(CANONICAL);
    expect(screen.getByRole('menuitem', { name: /Link copied!/ })).toBeInTheDocument();
    expect(mockOnShared).toHaveBeenCalledWith(item, 'copy', 'home');
    window.history.replaceState(null, '', '/');
  });

  it('opens the X intent in a popup that keeps noopener in the features string', () => {
    render(<NewsShareMenu item={item} source="home" />);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Share on X' }));

    const [url, target, features] = windowOpenSpy.mock.calls[0];
    expect(url).toBe(buildShareIntentUrl('x', CANONICAL, 'Lattice doubles headcount — Lattice Compute'));
    expect(target).toBe('_blank');
    expect(features).toContain('noopener');
    expect(mockOnShared).toHaveBeenCalledWith(item, 'x', 'home');
  });

  it('opens the LinkedIn intent with the canonical link', () => {
    render(<NewsShareMenu item={item} source="home" />);
    openMenu();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Share on LinkedIn' }));

    expect(windowOpenSpy.mock.calls[0][0]).toContain('linkedin.com/sharing/share-offsite');
    expect(mockOnShared).toHaveBeenCalledWith(item, 'linkedin', 'home');
  });

  it('never lets trigger or menu clicks reach a clickable ancestor (rows open a modal)', () => {
    const onAncestorClick = jest.fn();
    render(
      <div onClick={onAncestorClick}>
        <NewsShareMenu item={item} source="home" />
      </div>,
    );

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share on X' }));

    expect(onAncestorClick).not.toHaveBeenCalled();
  });

  it('reports popup transitions through onOpenChange (the modal gates Escape on it)', () => {
    const onOpenChange = jest.fn();
    render(<NewsShareMenu item={item} source="news-modal" variant="button" onOpenChange={onOpenChange} />);

    openMenu();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('a fresh copy restarts the feedback window instead of being snuffed by the old timer', async () => {
    jest.useFakeTimers();
    render(<NewsShareMenu item={item} source="home" />);
    openMenu();

    const copyItem = () => screen.getByRole('menuitem', { name: /Copy link|Link copied!/ });
    fireEvent.click(copyItem());
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    fireEvent.click(copyItem());
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(1000); // old timer would have expired at 1500ms total
    });

    expect(screen.getByRole('menuitem', { name: /Link copied!/ })).toBeInTheDocument();
    jest.useRealTimers();
  });
});
