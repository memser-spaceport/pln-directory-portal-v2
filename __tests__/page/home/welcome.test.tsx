import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Welcome } from '@/components/page/home/Welcome/Welcome';

const mockOnLoginBtnClicked = jest.fn();
const mockOnSignUpBtnClicked = jest.fn();

jest.mock('@/components/core/navbar/components/LoginBtn', () => {
  return {
    __esModule: true,
    LoginBtn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <button type="button" className={className} onClick={() => mockOnLoginBtnClicked()}>
        {children}
      </button>
    ),
  };
});

jest.mock('@/components/page/home/Welcome/components/SignUpBtn', () => {
  return {
    __esModule: true,
    SignUpBtn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <button type="button" className={className} onClick={() => mockOnSignUpBtnClicked()}>
        {children}
      </button>
    ),
  };
});

describe('Welcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('leads with the personalization offer and the team count', () => {
    render(<Welcome teamCount={1019} />);
    expect(screen.getByText(/Personalize your updates from/i)).toBeInTheDocument();
    expect(screen.getByText(/1,019\s+PL network teams/i)).toBeInTheDocument();
  });

  it('renders the mechanism line and both doors', () => {
    render(<Welcome teamCount={1019} />);
    expect(
      screen.getByText(/reorders around your skills, your focus areas, and the teams you follow/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('singularizes the count', () => {
    render(<Welcome teamCount={1} />);
    expect(screen.getByText(/1\s+PL network team$/i)).toBeInTheDocument();
  });

  it('drops the count when it is unavailable', () => {
    render(<Welcome />);
    expect(screen.getByText(/Personalize your updates from/i)).toBeInTheDocument();
    expect(screen.getByText(/^PL network teams$/i)).toBeInTheDocument();
  });
});
