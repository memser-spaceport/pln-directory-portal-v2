import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { QuickActions } from '@/components/page/home/QuickActions/QuickActions';
import type { QuickActionsState } from '@/components/page/home/QuickActions/utils/resolveQuickActionsState';

const mockUseOfficeHoursAccess = jest.fn();
const mockUseCurrentUserStore = jest.fn();

jest.mock('@/services/access-control/hooks/useOfficeHoursAccess', () => ({
  useOfficeHoursAccess: () => mockUseOfficeHoursAccess(),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

const NO_OH = {
  canViewSupply: false,
  canSupply: false,
  canViewDemand: false,
  canRequestDemand: false,
  isLoading: false,
  isError: false,
};

const state = (overrides: Partial<QuickActionsState> = {}): QuickActionsState => ({
  group: 'others',
  hasDealsAccess: false,
  hasOhAccess: false,
  ...overrides,
});

describe('QuickActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOfficeHoursAccess.mockReturnValue(NO_OH);
    mockUseCurrentUserStore.mockReturnValue({ isHydrated: true });
  });

  describe('server-resolved (ohResolved)', () => {
    it('renders the full pl-infra row on the very first render', () => {
      render(<QuickActions initial={state({ group: 'pl-infra', hasDealsAccess: true })} ohResolved />);

      // No waitFor: the point of the fix is that nothing arrives late.
      expect(screen.getAllByRole('link')).toHaveLength(4);
      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Book Office Hours')).toBeInTheDocument();
      expect(screen.getByText('Network Deals')).toBeInTheDocument();
      expect(screen.getByText('Job Board')).toBeInTheDocument();
    });

    // The regression this whole change exists to prevent: before, the client
    // query decided the card set and the band rendered 2 cards -> nothing -> 4.
    it('ignores the client query entirely, even while it is still loading', () => {
      mockUseCurrentUserStore.mockReturnValue({ isHydrated: false });
      mockUseOfficeHoursAccess.mockReturnValue({ ...NO_OH, isLoading: true });

      render(<QuickActions initial={state({ hasOhAccess: true })} ohResolved />);

      expect(screen.getByText('Book Office Hours')).toBeInTheDocument();
      expect(screen.queryByText('Network Directory')).not.toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    it('shows Network Directory instead of Office Hours when access is absent', () => {
      render(<QuickActions initial={state({ hasOhAccess: false })} ohResolved />);

      expect(screen.getByText('Network Directory')).toBeInTheDocument();
      expect(screen.queryByText('Book Office Hours')).not.toBeInTheDocument();
    });

    it('drops the Deals card for a founder without deals access', () => {
      render(<QuickActions initial={state({ group: 'founder', hasDealsAccess: false })} ohResolved />);

      expect(screen.queryByText('Network Deals')).not.toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    it('keeps the Deals card for a founder with deals access', () => {
      render(<QuickActions initial={state({ group: 'founder', hasDealsAccess: true })} ohResolved />);

      expect(screen.getByText('Network Deals')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(3);
    });
  });

  describe('degraded path (server /me/access failed)', () => {
    it('holds the row with skeletons instead of collapsing while access resolves', () => {
      mockUseOfficeHoursAccess.mockReturnValue({ ...NO_OH, isLoading: true });

      const { container } = render(<QuickActions initial={state()} ohResolved={false} />);

      // The band must still be on the page — returning null here was the
      // 0px-collapse beat of the original layout shift.
      expect(screen.getByRole('region', { name: 'Quick actions' })).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    });

    it('holds the row before the user store hydrates, when the query has not run yet', () => {
      // Query is disabled until the store fills, so it reports isLoading: false
      // without having fetched — isHydrated is what makes this window visible.
      mockUseCurrentUserStore.mockReturnValue({ isHydrated: false });

      render(<QuickActions initial={state()} ohResolved={false} />);

      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(screen.getByRole('region', { name: 'Quick actions' })).toBeInTheDocument();
    });

    it('falls back to the client query once it resolves', () => {
      mockUseOfficeHoursAccess.mockReturnValue({ ...NO_OH, canViewSupply: true });

      render(<QuickActions initial={state()} ohResolved={false} />);

      expect(screen.getByText('Book Office Hours')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    it('never shows skeletons for groups whose row does not depend on office hours', () => {
      mockUseOfficeHoursAccess.mockReturnValue({ ...NO_OH, isLoading: true });

      render(<QuickActions initial={state({ group: 'pl-infra' })} ohResolved={false} />);

      expect(screen.getAllByRole('link')).toHaveLength(4);
    });
  });

  it('renders nothing without a resolved state (logged-out only)', () => {
    const { container } = render(<QuickActions initial={null} ohResolved={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});
