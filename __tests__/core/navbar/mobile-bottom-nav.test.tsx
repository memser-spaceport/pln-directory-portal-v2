import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { MobileBottomNav } from '@/components/core/MobileBottomNav';
import { EVENT_LINKS } from '@/components/core/navbar/constants/navLinks';
import type { ISubItem } from '@/components/core/navbar/type';

jest.mock('next/navigation', () => ({ usePathname: () => '/members' }));

const mockPlInfraItems = jest.fn<ISubItem[], []>();
const mockMoreItems = jest.fn<ISubItem[], []>();
const mockHasNewNews = jest.fn<boolean, []>();

jest.mock('@/components/core/navbar/components/navItems/PLInfraNavItems/hook/useGetPlInfraNavItems', () => ({
  useGetPlInfraNavItems: () => mockPlInfraItems(),
}));
jest.mock('@/components/core/navbar/components/navItems/MoreNavItems/hooks/useMoreNavItems', () => ({
  useMoreNavItems: () => mockMoreItems(),
}));
jest.mock('@/services/team-news/hooks/useHasNewNews', () => ({ useHasNewNews: () => mockHasNewNews() }));
jest.mock('@/services/rbac/hooks/useDemoDayAnalyticsAccess', () => ({
  useDemoDayAnalyticsAccess: () => ({ hasAccess: false }),
}));
jest.mock('@/components/core/MobileBottomNav/useScrollDirection', () => ({ useScrollDirection: () => 'up' }));

// A menu's contents only exist in the DOM once it's opened, so the real
// component can't answer "what went into More?". Standing in for it exposes the
// `items` it was handed, which is the actual wiring under test.
jest.mock('@/components/core/MobileBottomNav/components/MobileMenuItem', () => ({
  MobileNavItemWithMenu: ({ label, items }: { label: string; items: ISubItem[] }) => (
    <li data-testid={`menu-${label}`} data-items={items.map((item) => item.title).join('|')}>
      {label}
    </li>
  ),
}));

/** Entry labels in DOM order — this is what pins the slot ORDER. */
function labels() {
  return Array.from(document.querySelectorAll('#mobile-bottom-nav li')).map((li) =>
    (li.textContent ?? '').replace('New news', '').trim(),
  );
}

function moreItems() {
  return (screen.getByTestId('menu-More').getAttribute('data-items') ?? '').split('|');
}

const gantry: ISubItem = { icon: null, href: '/gantry', title: 'Gantry', description: '' };
const jobs: ISubItem = { icon: null, href: '/jobs', title: 'Job Board', description: '' };

describe('MobileBottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMoreItems.mockReturnValue([jobs]);
    mockHasNewNews.mockReturnValue(false);
  });

  it('gives slot 2 to Events for a member without PL Infra', () => {
    mockPlInfraItems.mockReturnValue([]);

    render(<MobileBottomNav />);

    expect(labels()).toEqual(['Directory', 'Events', 'Home', 'Demo Day', 'More']);
  });

  it('gives slot 2 to PL Infra for a member who has it', () => {
    mockPlInfraItems.mockReturnValue([gantry]);

    render(<MobileBottomNav />);

    expect(labels()).toEqual(['Directory', 'PL Infra', 'Home', 'Demo Day', 'More']);
  });

  it('moves Events into More rather than dropping it, when PL Infra takes the slot', () => {
    mockPlInfraItems.mockReturnValue([gantry]);

    render(<MobileBottomNav />);

    // Losing the bar slot must not lose the destination.
    EVENT_LINKS.forEach((link) => expect(moreItems()).toContain(link.title));
  });

  it('does not also put Events in More when it already has the slot', () => {
    mockPlInfraItems.mockReturnValue([]);

    render(<MobileBottomNav />);

    EVENT_LINKS.forEach((link) => expect(moreItems()).not.toContain(link.title));
  });

  it('keeps Home in the bar for everyone, dot or no dot', () => {
    mockPlInfraItems.mockReturnValue([]);

    render(<MobileBottomNav />);

    expect(screen.getByRole('link', { name: /Home/ })).toHaveAttribute('href', '/home');
  });

  it('marks Home with the new-news dot only when there is new news', () => {
    mockPlInfraItems.mockReturnValue([]);

    const { rerender } = render(<MobileBottomNav />);
    expect(screen.queryByText('New news')).not.toBeInTheDocument();

    mockHasNewNews.mockReturnValue(true);
    rerender(<MobileBottomNav />);

    expect(screen.getByText('New news')).toBeInTheDocument();
  });
});
