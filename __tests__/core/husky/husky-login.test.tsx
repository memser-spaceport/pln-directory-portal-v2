import { render, screen, fireEvent } from '@testing-library/react';
import HuskyLogin from '../../../components/core/husky/husky-login';
import { useHuskyAnalytics } from '../../../analytics/husky.analytics';
import '@testing-library/jest-dom';

// Mock the analytics hook
jest.mock('../../../analytics/husky.analytics');

describe('HuskyLogin Component', () => {
  const mockOnLoginBoxClose = jest.fn();
  const mockOnLoginClick = jest.fn();
  const mockTrackHuskyLogin = jest.fn();

  beforeEach(() => {
    (useHuskyAnalytics as jest.Mock).mockReturnValue({
      trackHuskyLogin: jest.fn(),
    });
  });

  test('renders correctly', () => {
    render(<HuskyLogin onLoginBoxClose={mockOnLoginBoxClose} onLoginClick={mockOnLoginClick} />);
    
    // Check if the title and description are rendered
    expect(screen.getByText(/Login to continue using Husky/i)).toBeInTheDocument();
    expect(screen.getByText(/Husky is purpose built to improve your speed & quality of learning/i)).toBeInTheDocument();
  });

  test('calls onLoginBoxClose when dismiss button is clicked', () => {
    render(<HuskyLogin onLoginBoxClose={mockOnLoginBoxClose} onLoginClick={mockOnLoginClick} />);
    
    fireEvent.click(screen.getByTestId('dismiss-button'));
    expect(mockOnLoginBoxClose).toHaveBeenCalledTimes(1);
  });

  test('calls trackHuskyLogin and onLoginClick when login button is clicked', () => {
    render(<HuskyLogin onLoginBoxClose={mockOnLoginBoxClose} onLoginClick={mockOnLoginClick} />);
    
    const { trackHuskyLogin } = useHuskyAnalytics();
    fireEvent.click(screen.getByTestId('login-button'));
    
    expect(trackHuskyLogin).toHaveBeenCalledTimes(1);
    expect(mockOnLoginClick).toHaveBeenCalledTimes(1);
  });
});

