import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Welcome } from '@/components/page/home/Welcome/Welcome';

const mockOnLoginBtnClicked = jest.fn();

jest.mock('@/components/core/navbar/components/LoginBtn', () => {
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

  it('renders the brand title with "Welcome to" and "LabOS"', () => {
    render(<Welcome />);
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    expect(screen.getByText('LabOS')).toBeInTheDocument();
  });

  it('renders the pitch and shows the Sign in button', () => {
    render(<Welcome />);
    expect(screen.getByText(/collaboration platform for the Protocol Labs network/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });
});
