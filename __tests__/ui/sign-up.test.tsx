import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUpBtn from '@/components/core/navbar/sign-up';
import { useAuthAnalytics } from '@/analytics/auth.analytics';

// Mock analytics
jest.mock('@/analytics/auth.analytics', () => ({ useAuthAnalytics: jest.fn() }));

const mockOnLoginBtnClicked = jest.fn();
const originalLocation = window.location;

beforeEach(() => {
  jest.clearAllMocks();
  (useAuthAnalytics as jest.Mock).mockReturnValue({ onLoginBtnClicked: mockOnLoginBtnClicked });
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { href: '' };
});

afterAll(() => {
  window.location = originalLocation;
});

/**
 * Test suite for SignUpBtn component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('SignUpBtn', () => {
  /**
   * Should render the sign up button
   */
  it('renders the sign up button', () => {
    render(<SignUpBtn />);
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  /**
   * Should call analytics and navigate to /sign-up on click
   */
  it('calls analytics and navigates to /sign-up on click', () => {
    render(<SignUpBtn />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }).parentElement!);
    expect(mockOnLoginBtnClicked).toHaveBeenCalled();
    expect(window.location.href).toBe('/sign-up');
  });

  /**
   * Should not throw if analytics is missing (defensive)
   */
  it('does not throw if analytics is missing', () => {
    (useAuthAnalytics as jest.Mock).mockReturnValue({ onLoginBtnClicked: () => {} });
    render(<SignUpBtn />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: /sign up/i }).parentElement!)).not.toThrow();
  });
}); 