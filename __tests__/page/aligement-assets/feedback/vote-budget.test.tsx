import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { VoteButton } from '@/components/page/aligement-assets/feedback/feedback-bits';
import FeedbackPage from '@/components/page/aligement-assets/feedback/feedback-page';
import { emptyRoadmap, item } from './__fixtures__/feedback.fixtures';

const searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => '/alignment-asset/feedback',
  useSearchParams: () => searchParams,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const mockMe = jest.fn();

jest.mock('@/services/plaa/feedback/useFeedback', () => ({
  useFeedbackMe: () => mockMe(),
  useFeedbackList: () => ({ data: { items: [item()] }, isLoading: false, isError: false, refetch: jest.fn() }),
  useFeedbackRoadmap: () => ({ data: emptyRoadmap, isLoading: false, isError: false, refetch: jest.fn() }),
  useFeedbackTriage: () => ({ data: { items: [] }, isLoading: false, isError: false, refetch: jest.fn() }),
  useVote: () => ({ mutate: jest.fn() }),
  useCreateFeedback: () => ({ mutate: jest.fn(), isPending: false, error: null }),
  useChangeStatus: () => ({ mutate: jest.fn() }),
  useRetryLinear: () => ({ mutate: jest.fn(), isPending: false, variables: undefined }),
}));

jest.mock('@/analytics/plaa-feedback.analytics', () => ({
  usePlaaFeedbackAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

function renderPage(budget?: { limit: number; used: number; remaining: number }) {
  searchParams.delete('tab');
  mockMe.mockReturnValue({ data: { is_admin: false, ...(budget ? { vote_budget: budget } : {}) } });
  render(<FeedbackPage />);
}

describe('vote button respects the budget', () => {
  it('is enabled on an unvoted item while votes remain', () => {
    const onToggle = jest.fn();
    render(<VoteButton item={item({ has_voted: false })} onToggle={onToggle} votesRemaining={1} />);

    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalled();
  });

  it('is disabled on an unvoted item once the budget is spent', () => {
    const onToggle = jest.fn();
    render(<VoteButton item={item({ has_voted: false })} onToggle={onToggle} votesRemaining={0} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', expect.stringContaining('Remove one'));
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('stays enabled on an item already voted for, so a vote can be freed', () => {
    const onToggle = jest.fn();
    render(<VoteButton item={item({ has_voted: true })} onToggle={onToggle} votesRemaining={0} />);

    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalled();
  });

  it('does not enforce a cap before the budget has loaded', () => {
    render(<VoteButton item={item({ has_voted: false })} onToggle={jest.fn()} votesRemaining={undefined} />);
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('still blocks voting on a closed item, budget or not', () => {
    render(<VoteButton item={item({ status: 'completed', has_voted: false })} onToggle={jest.fn()} votesRemaining={5} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('the board states the allowance', () => {
  it('shows how many upvotes are left', () => {
    renderPage({ limit: 5, used: 2, remaining: 3 });
    expect(screen.getByTestId('fb-vote-budget')).toHaveTextContent('3 of 5');
  });

  it('says so plainly when none are left', () => {
    renderPage({ limit: 5, used: 5, remaining: 0 });
    expect(screen.getByTestId('fb-vote-budget')).toHaveTextContent(/No upvotes left/);
  });

  it('shows nothing until the budget loads, rather than a misleading zero', () => {
    renderPage(undefined);
    expect(screen.queryByTestId('fb-vote-budget')).not.toBeInTheDocument();
  });
});

describe('subheader', () => {
  it('describes all four things a member can do', () => {
    renderPage({ limit: 5, used: 0, remaining: 5 });
    expect(
      screen.getByText(
        /A single place to suggest new features, upvote feature ideas from others, report any bugs, and follow what the PLAA team is currently building\./,
      ),
    ).toBeInTheDocument();
  });
});
