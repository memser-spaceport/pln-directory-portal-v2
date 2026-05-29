import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { GantryAccessGuard } from '@/components/page/gantry/GantryAccessGuard';

const mockUseGantryAccess = jest.fn();

jest.mock('@/services/rbac/hooks/useGantryAccess', () => ({
  useGantryAccess: () => mockUseGantryAccess(),
}));

describe('GantryAccessGuard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user has access', () => {
    mockUseGantryAccess.mockReturnValue({
      canView: true,
      isLoading: false,
      isError: false,
    });

    render(
      <GantryAccessGuard>
        <div>Allowed content</div>
      </GantryAccessGuard>,
    );

    expect(screen.getByText('Allowed content')).toBeInTheDocument();
  });

  it('renders nothing while access is loading', () => {
    mockUseGantryAccess.mockReturnValue({
      canView: false,
      isLoading: true,
      isError: false,
    });

    const { container } = render(
      <GantryAccessGuard>
        <div>Allowed content</div>
      </GantryAccessGuard>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/do not have access to Gantry/i)).not.toBeInTheDocument();
  });

  it('renders fallback when user has no access', () => {
    mockUseGantryAccess.mockReturnValue({
      canView: false,
      isLoading: false,
      isError: false,
    });

    render(
      <GantryAccessGuard>
        <div>Allowed content</div>
      </GantryAccessGuard>,
    );

    expect(screen.getByText(/do not have access to Gantry/i)).toBeInTheDocument();
    expect(screen.queryByText('Allowed content')).not.toBeInTheDocument();
  });
});
