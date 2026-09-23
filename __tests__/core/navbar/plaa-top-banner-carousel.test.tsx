import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUsePlaaAccess = jest.fn();
jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => mockUsePlaaAccess(),
}));

const mockUseCurrentSnapshotStatus = jest.fn();
jest.mock('@/services/plaa/hooks/useCurrentSnapshotStatus', () => ({
  useCurrentSnapshotStatus: () => mockUseCurrentSnapshotStatus(),
}));

const mockUseBuybackBannerSlide = jest.fn();
jest.mock('@/components/core/navbar/components/PlaaBuybackBanner/PlaaBuybackBanner', () => ({
  useBuybackBannerSlide: () => mockUseBuybackBannerSlide(),
  PlaaBuybackBannerBar: () => <div data-testid="buyback-slide" />,
}));

jest.mock('@/components/core/navbar/components/PlaaSnapshotBar/PlaaSnapshotBar', () => ({
  PlaaSnapshotBarBar: () => <div data-testid="snapshot-slide" />,
}));

import { PlaaTopBannerCarousel } from '@/components/core/navbar/components/PlaaTopBannerCarousel';

const STATUS = {
  periodLabel: 'August 2026',
  daysLeft: 16,
  progressPct: 52,
  pointsCollected: 420,
  activitiesCount: 7,
  categoriesCount: 4,
  activities: [],
};

const BUYBACK_SLIDE = {
  debugNow: null,
  progressPct: 40,
  countdownLabel: '3 days left to bid',
  auctionEndLabel: 'Sep 29, 12:00 PM EDT',
  onCtaClick: jest.fn(),
};

describe('PlaaTopBannerCarousel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/alignment-asset/activities');
    mockUsePlaaAccess.mockReturnValue({ canView: true, isLoading: false, isError: false });
    mockUseCurrentSnapshotStatus.mockReturnValue(STATUS);
    mockUseBuybackBannerSlide.mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing off alignment-asset routes', () => {
    mockUsePathname.mockReturnValue('/members');
    const { container } = render(<PlaaTopBannerCarousel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a member without PLAA access', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });
    const { container } = render(<PlaaTopBannerCarousel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows only the snapshot slide, with no dots, when the buyback banner has nothing to show', () => {
    render(<PlaaTopBannerCarousel />);
    expect(screen.getByTestId('snapshot-slide')).toBeInTheDocument();
    expect(screen.queryByTestId('buyback-slide')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('rotates between both slides with dot navigation when the buyback banner is live', () => {
    mockUseBuybackBannerSlide.mockReturnValue(BUYBACK_SLIDE);
    render(<PlaaTopBannerCarousel />);

    expect(screen.getByTestId('buyback-slide')).toBeInTheDocument();
    expect(screen.queryByTestId('snapshot-slide')).not.toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);

    act(() => {
      jest.advanceTimersByTime(8000);
    });
    expect(screen.getByTestId('snapshot-slide')).toBeInTheDocument();
    expect(screen.queryByTestId('buyback-slide')).not.toBeInTheDocument();
  });

  it('lets a dot jump straight to a slide', () => {
    mockUseBuybackBannerSlide.mockReturnValue(BUYBACK_SLIDE);
    render(<PlaaTopBannerCarousel />);

    fireEvent.click(screen.getByRole('tab', { name: /snapshot banner/i }));
    expect(screen.getByTestId('snapshot-slide')).toBeInTheDocument();
  });
});
