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

  it('leads with the personalization offer and the team and member counts', () => {
    render(<Welcome teamCount={1019} memberCount={3241} />);
    expect(screen.getByText(/See personalized updates from/i)).toHaveTextContent(
      'See personalized updates from 1,019 PL network teams and 3,241 members',
    );
  });

  it('highlights only the counts', () => {
    const { container } = render(<Welcome teamCount={1019} memberCount={3241} />);
    const highlights = container.querySelectorAll('[class*="titleHighlight"]');
    expect(highlights).toHaveLength(2);
    expect(highlights[0]).toHaveTextContent('1,019');
    expect(highlights[1]).toHaveTextContent('3,241');
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
    expect(screen.getByText(/See personalized updates from/i)).toHaveTextContent(
      'See personalized updates from 1 PL network team and 1 member',
    );
  });

  it('drops the counts when they are unavailable', () => {
    render(<Welcome />);
    expect(screen.getByText(/See personalized updates from/i)).toHaveTextContent(
      'See personalized updates from PL network teams',
    );
  });

  it('fires the welcome sign-in event from the CTA', () => {
    render(<Welcome teamCount={1019} memberCount={3241} />);
    screen.getByRole('button', { name: /Sign In/i }).click();
    expect(mockOnWelcomeSignInClicked).toHaveBeenCalledTimes(1);
  });
});
