import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import KudosBoardComponent from '@/components/page/aligement-assets/kudos-board/kudos-board-component';

const POOL = {
  roundId: 'r5',
  pointsRemaining: 250,
  totalBudget: 250,
  pointsUsed: 0,
  eligible: true,
  pointsMin: 10,
  pointsMax: 100,
  pointsStep: 10,
  messageMin: 25,
  messageMax: 500,
};

const kudos = (id: string) => ({
  id,
  giver: { memberId: 'uid-a', name: 'Alice Doe' },
  recipient: { memberId: 'uid-b', name: 'Bob Roe' },
  roundId: 'r5',
  points: 30,
  message: 'Carried the migration over the line.',
  createdAt: new Date().toISOString(),
});

const feedCalls: Array<{ limit?: number; page?: number }> = [];
let totalPages = 3;

jest.mock('@/hooks/use-kudos', () => ({
  useKudosFeed: (params: { limit?: number; page?: number }) => {
    feedCalls.push(params);
    return {
      isPending: false,
      isLoading: false,
      isError: false,
      data: { items: [kudos(`k-page-${params.page}`)], nextCursor: null, total: totalPages * 24, totalPages },
      refetch: jest.fn(),
    };
  },
  useCommunityPool: () => ({ data: POOL }),
  useRecipients: () => ({ data: { items: [] } }),
  useGiveCommunityKudos: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdateCommunityKudos: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/analytics/kudos.analytics', () => ({
  useKudosAnalytics: () => ({
    onKudosPageViewed: jest.fn(),
    onGiveKudosOpened: jest.fn(),
    onCommunityKudosSubmitted: jest.fn(),
    onEditKudosOpened: jest.fn(),
    onCommunityKudosUpdated: jest.fn(),
  }),
}));
jest.mock('@/utils/plaa-round.utils', () => ({ getCurrentRoundNumber: () => 5 }));

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  feedCalls.length = 0;
  totalPages = 3;
});

const lastCall = () => feedCalls[feedCalls.length - 1];

describe('KudosBoardComponent — pagination', () => {
  test('requests page 1 of 24 kudos first', () => {
    render(<KudosBoardComponent />);
    expect(lastCall()).toMatchObject({ limit: 24, page: 1 });
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });

  test('shows a button for every page', () => {
    render(<KudosBoardComponent />);
    expect(screen.getAllByRole('button', { name: /^Page \d+$/ })).toHaveLength(3);
  });

  test('loads the chosen page', () => {
    render(<KudosBoardComponent />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(lastCall()).toMatchObject({ page: 3 });
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  test('steps with Prev and Next', () => {
    render(<KudosBoardComponent />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(lastCall()).toMatchObject({ page: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(lastCall()).toMatchObject({ page: 1 });
  });

  test('hides the pager when everything fits on one page', () => {
    totalPages = 1;
    render(<KudosBoardComponent />);
    expect(screen.queryByRole('navigation', { name: /kudos board pages/i })).not.toBeInTheDocument();
  });
});
