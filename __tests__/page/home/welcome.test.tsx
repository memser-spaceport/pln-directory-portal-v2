import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Welcome } from '@/components/page/home/Welcome/Welcome';

const mockOnLoginBtnClicked = jest.fn();

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

describe('Welcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('leads with the personalization offer and the team and member counts', () => {
    render(<Welcome teamCount={1019} memberCount={3241} />);
    expect(screen.getByText(/See personalized updates from/i)).toBeInTheDocument();
    expect(screen.getByText(/1,019\s+PL network teams and 3,241 members/i)).toBeInTheDocument();
  });

  it('renders the mechanism line and the sign-in door', () => {
    render(<Welcome teamCount={1019} memberCount={3241} />);
    expect(
      screen.getByText(/reorders around your skills, your focus areas, and the teams you follow/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create account/i })).not.toBeInTheDocument();
  });

  it('singularizes the counts', () => {
    render(<Welcome teamCount={1} memberCount={1} />);
    expect(screen.getByText(/1\s+PL network team and 1 member$/i)).toBeInTheDocument();
  });

  it('drops the counts when they are unavailable', () => {
    render(<Welcome />);
    expect(screen.getByText(/See personalized updates from/i)).toBeInTheDocument();
    expect(screen.getByText(/^PL network teams$/i)).toBeInTheDocument();
  });
});
