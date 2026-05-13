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
    render(<Welcome />);
    expect(screen.getByText('Welcome to')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'LabOS' })).toBeInTheDocument();
  });

  it('renders an <h1>', () => {
    render(<Welcome />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the pitch and shows the Sign in button', () => {
    render(<Welcome />);
    expect(screen.getByText(/collaboration platform for the Protocol Labs network/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect, book office hours, and join IRL Gatherings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });
});
