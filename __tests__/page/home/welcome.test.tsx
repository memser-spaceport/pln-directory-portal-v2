import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Welcome } from '@/components/page/home/Welcome/Welcome';

const mockOnLoginBtnClicked = jest.fn();

jest.mock('@/components/core/navbar/login-btn', () => {
  return {
    __esModule: true,
    default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <button type="button" className={className} onClick={() => mockOnLoginBtnClicked()}>
        {children}
      </button>
    ),
  };
});

describe('Welcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the brand title and "Welcome to" eyebrow', () => {
    render(<Welcome firstName={null} isLoggedIn={false} />);
    expect(screen.getByText('Welcome to')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'LabOS' })).toBeInTheDocument();
  });

  describe('unauth state', () => {
    it('renders the unauth pitch and shows the Sign in button', () => {
      render(<Welcome firstName={null} isLoggedIn={false} />);
      expect(
        screen.getByText(/collaboration platform for the Protocol Labs network/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Connect, book office hours, and join IRL Gatherings/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });
  });

  describe('auth state', () => {
    it('greets the user by first name and hides the Sign in CTA', () => {
      render(<Welcome firstName="Aboud" isLoggedIn={true} />);
      expect(
        screen.getByText(/Hi Aboud — here's what's new across the Protocol Labs Network today\./),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Sign in/i })).not.toBeInTheDocument();
    });

    it('falls back to "Welcome back" when the first name is missing', () => {
      render(<Welcome firstName={null} isLoggedIn={true} />);
      expect(screen.getByText(/Hi Welcome back — here's what's new/)).toBeInTheDocument();
    });

    it('trims the first name before using it', () => {
      render(<Welcome firstName="   Aboud   " isLoggedIn={true} />);
      expect(screen.getByText(/Hi Aboud —/)).toBeInTheDocument();
    });
  });
});
