import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Welcome } from '@/components/page/home/Welcome/Welcome';

const mockOnLoginBtnClicked = jest.fn();

jest.mock('@/components/core/navbar/components/LoginBtn', () => {
  return {
    __esModule: true,
    LoginBtn: ({
      children,
      className,
      onClick,
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) => (
      <button
        type="button"
        className={className}
        onClick={() => {
          onClick?.();
          mockOnLoginBtnClicked();
        }}
      >
        {children}
      </button>
    ),
  };
});

const mockOnWelcomeSignInClicked = jest.fn();
jest.mock('@/analytics/home.analytics', () => ({
  useHomeAnalytics: () => ({
    onWelcomeSignInClicked: () => mockOnWelcomeSignInClicked(),
  }),
}));

describe('Welcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('leads with the team count and the ordering offer', () => {
    render(<Welcome teamCount={1185} />);
    expect(screen.getByText(/Updates from/i)).toHaveTextContent('Updates from 1,185 teams, ordered around your work');
  });

  it('highlights only the count', () => {
    const { container } = render(<Welcome teamCount={1185} />);
    const highlights = container.querySelectorAll('[class*="titleHighlight"]');
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent('1,185');
  });

  it('renders the mechanism line and the sign-in door', () => {
    render(<Welcome teamCount={1185} />);
    expect(
      screen.getByText(
        /Sign in and the updates matching your skills, your team's work, and the teams you follow show first/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create account/i })).not.toBeInTheDocument();
  });

  it('singularizes the count', () => {
    render(<Welcome teamCount={1} />);
    expect(screen.getByText(/Updates from/i)).toHaveTextContent('Updates from 1 team, ordered around your work');
  });

  it('drops the count when it is unavailable', () => {
    render(<Welcome />);
    expect(screen.getByText(/Updates from/i)).toHaveTextContent('Updates from teams, ordered around your work');
  });

  it('fires the welcome sign-in event from the CTA', () => {
    render(<Welcome teamCount={1185} />);
    screen.getByRole('button', { name: /Sign In/i }).click();
    expect(mockOnWelcomeSignInClicked).toHaveBeenCalledTimes(1);
  });
});
