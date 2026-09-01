import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { PastTeamCard } from '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/components/PastTeamCard';
import type { DemoDayTeam } from '@/app/actions/demo-day.actions';

const mockCardClicked = jest.fn();
const mockToggleFollow = jest.fn();
const mockUseFollow = jest.fn(() => ({ isPending: false, isFollowing: false, toggleFollow: mockToggleFollow }));

jest.mock('@/analytics/demoday.analytics', () => ({
  useDemoDayAnalytics: () => ({ onCompletedViewTeamCardClicked: (...a: unknown[]) => mockCardClicked(...a) }),
}));

jest.mock(
  '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/components/hooks/useFollowDemoDayTeam',
  () => ({ useFollowDemoDayTeam: (...a: unknown[]) => mockUseFollow(...(a as [])) }),
);

jest.mock('@/hooks/useDefaultAvatar', () => ({
  useDefaultAvatar: () => '/icons/default-avatar.svg',
}));

const team = (overrides: Partial<DemoDayTeam> = {}): DemoDayTeam => ({
  uid: 'team-1',
  name: 'Protocol Labs',
  logoUrl: 'https://cdn.example.com/logo.png',
  newsCount: 0,
  shortDescription: 'Building the next generation of the web',
  isFollowing: false,
  ...overrides,
});

/** The badge nests an <a> inside the card's <a>, so both links match "updates" by
 *  accessible name — address the badge by the href only it carries. */
const badge = (container: HTMLElement) => container.querySelector('a[href*="highlight=news"]');

beforeEach(() => {
  jest.clearAllMocks();
  mockUseFollow.mockReturnValue({ isPending: false, isFollowing: false, toggleFollow: mockToggleFollow });
});

describe('PastTeamCard — the card link', () => {
  it('opens the team profile in a new tab, opener-safe', () => {
    render(<PastTeamCard team={team()} />);

    const card = screen.getByRole('link', { name: /Building the next generation/i });
    expect(card).toHaveAttribute('href', '/teams/team-1');
    expect(card).toHaveAttribute('target', '_blank');
    expect(card).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('reports the card click with the team it points at', () => {
    render(<PastTeamCard team={team()} />);

    fireEvent.click(screen.getByRole('link', { name: /Building the next generation/i }));

    expect(mockCardClicked).toHaveBeenCalledWith({ teamUid: 'team-1', teamName: 'Protocol Labs' });
  });

  it('shows the name and blurb', () => {
    render(<PastTeamCard team={team()} />);

    expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
    expect(screen.getByText('Building the next generation of the web')).toBeInTheDocument();
  });
});

describe('PastTeamCard — the updates badge', () => {
  it('is hidden when the team has no news', () => {
    const { container } = render(<PastTeamCard team={team({ newsCount: 0 })} />);

    expect(badge(container)).toBeNull();
  });

  it('states the count once there is news', () => {
    const { container } = render(<PastTeamCard team={team({ newsCount: 3 })} />);

    expect(badge(container)).toHaveTextContent('3 updates');
  });

  it('deep-links to the profile with the news rail asked to highlight itself', () => {
    const { container } = render(<PastTeamCard team={team({ newsCount: 3 })} />);

    expect(badge(container)).toHaveAttribute('href', '/teams/team-1?highlight=news');
    expect(badge(container)).toHaveAttribute('target', '_blank');
    expect(badge(container)).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('is a link of its own, not the card link — the two go to different places', () => {
    render(<PastTeamCard team={team({ newsCount: 3 })} />);

    const hrefs = screen.getAllByRole('link').map((el) => el.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/teams/team-1', '/teams/team-1?highlight=news']));
  });
});

describe('PastTeamCard — following', () => {
  it('follows without navigating away to the profile', () => {
    render(<PastTeamCard team={team()} />);

    const followClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(screen.getByRole('button', { name: /follow/i }), followClick);

    expect(mockToggleFollow).toHaveBeenCalledTimes(1);
    expect(followClick.defaultPrevented).toBe(true);
  });

  it('reflects the follow state the hook reports', () => {
    mockUseFollow.mockReturnValue({ isPending: false, isFollowing: true, toggleFollow: mockToggleFollow });
    render(<PastTeamCard team={team()} />);

    expect(screen.getByRole('button', { name: /following|unfollow/i })).toBeInTheDocument();
  });

  it('disables the button while the request is in flight', () => {
    mockUseFollow.mockReturnValue({ isPending: true, isFollowing: false, toggleFollow: mockToggleFollow });
    render(<PastTeamCard team={team()} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('hands the whole team to the follow hook', () => {
    const t = team();
    render(<PastTeamCard team={t} />);

    expect(mockUseFollow).toHaveBeenCalledWith(t);
  });
});

describe('PastTeamCard — logo', () => {
  it('uses the team logo when there is one', () => {
    render(<PastTeamCard team={team()} />);

    expect(screen.getByAltText('Protocol Labs logo')).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
  });

  it('falls back to the generated avatar when there is none', () => {
    render(<PastTeamCard team={team({ logoUrl: null })} />);

    expect(screen.getByAltText('Protocol Labs logo')).toHaveAttribute('src', '/icons/default-avatar.svg');
  });
});
