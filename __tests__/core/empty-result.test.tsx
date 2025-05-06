import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmptyResult from '@/components/core/empty-result';
import { useRouter, usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush });
  mockUsePathname.mockReturnValue('/current-path');
});

/**
 * Test suite for EmptyResult component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('EmptyResult', () => {
  /**
   * Should render the empty result message and clear all link
   */
  it('renders the empty result message and clear all link', () => {
    render(<EmptyResult />);
    expect(screen.getByText(/There are no results for your criteria/)).toBeInTheDocument();
    expect(screen.getByText(/clear all the criteria/)).toBeInTheDocument();
  });

  /**
   * Should call router.push with current pathname when clear all is clicked
   */
  it('calls router.push with current pathname when clear all is clicked', () => {
    render(<EmptyResult />);
    fireEvent.click(screen.getByText(/clear all the criteria/));
    expect(mockPush).toHaveBeenCalledWith('/current-path');
  });

  /**
   * Should show login prompt if not logged in
   */
  it('shows login prompt if not logged in', () => {
    render(<EmptyResult isLoggedIn={false} />);
    expect(screen.getByText(/please login to add a project/)).toBeInTheDocument();
    expect(screen.queryByText(/click here/)).not.toBeInTheDocument();
  });

  /**
   * Should show add project link if logged in
   */
  it('shows add project link if logged in', () => {
    render(<EmptyResult isLoggedIn={true} />);
    expect(screen.getByText(/click here/)).toBeInTheDocument();
    expect(screen.getByText(/to add a project/)).toBeInTheDocument();
    expect(screen.queryByText(/please login to add a project/)).not.toBeInTheDocument();
    // The link should have correct href
    expect(screen.getByText(/click here/).closest('a')).toHaveAttribute('href', '/projects/add');
  });
}); 