import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import OverviewPage from '@/components/page/aligement-assets/overview/overview-page';

const mockUsePlaaAccess = jest.fn();
jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => mockUsePlaaAccess(),
}));

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

jest.mock('@/components/page/aligement-assets/overview/active-member-overview', () => ({
  __esModule: true,
  default: () => <div>Active member overview</div>,
}));

jest.mock('@/components/page/aligement-assets/overview/prospective-visitor-overview', () => ({
  __esModule: true,
  default: () => <div>Prospective visitor overview</div>,
}));

const MEMBER = { uid: 'member-1' };
const PROPS = { roundHistory: [] };

describe('OverviewPage persona', () => {
  beforeEach(() => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: MEMBER, isHydrated: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the active member view to a plaa.access holder', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: true, isLoading: false, isError: false });

    render(<OverviewPage {...PROPS} />);

    expect(screen.getByText('Active member overview')).toBeInTheDocument();
    expect(screen.queryByText('Prospective visitor overview')).not.toBeInTheDocument();
  });

  it('shows the prospective visitor view to a logged-in member without plaa.access', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });

    render(<OverviewPage {...PROPS} />);

    expect(screen.getByText('Prospective visitor overview')).toBeInTheDocument();
  });

  it('shows the prospective visitor view to a guest', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });

    render(<OverviewPage {...PROPS} />);

    expect(screen.getByText('Prospective visitor overview')).toBeInTheDocument();
  });

  it('shows the prospective visitor view when the permission lookup fails', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: true });

    render(<OverviewPage {...PROPS} />);

    expect(screen.getByText('Prospective visitor overview')).toBeInTheDocument();
  });

  it('renders neither view until the session and permissions are known', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: true, isError: false });

    const { container } = render(<OverviewPage {...PROPS} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders neither view before the session store hydrates', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: false });
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });

    const { container } = render(<OverviewPage {...PROPS} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('ignores the old ?persona= preview flag', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: true, isLoading: false, isError: false });

    render(<OverviewPage {...PROPS} {...({ isProspectiveVisitor: true } as object)} />);

    expect(screen.getByText('Active member overview')).toBeInTheDocument();
  });
});
