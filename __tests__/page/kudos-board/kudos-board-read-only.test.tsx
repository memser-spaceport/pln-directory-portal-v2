import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import KudosBoardComponent from '@/components/page/aligement-assets/kudos-board/kudos-board-component';

const POOL_LIMITS = { pointsMin: 10, pointsMax: 100, pointsStep: 10, messageMin: 25, messageMax: 500 };
const ELIGIBLE_POOL = {
  roundId: 'r5',
  pointsRemaining: 100,
  totalBudget: 100,
  pointsUsed: 0,
  eligible: true,
  ...POOL_LIMITS,
};
const INELIGIBLE_POOL = {
  roundId: 'r5',
  pointsRemaining: 0,
  totalBudget: 0,
  pointsUsed: 0,
  eligible: false,
  ...POOL_LIMITS,
};

const poolReturn: { data: Record<string, unknown> | undefined } = { data: undefined };
const feedReturn = {
  isLoading: false,
  isError: false,
  data: {
    items: [
      {
        id: 'k1',
        giver: { memberId: 'uid-a', name: 'Alice Doe' },
        recipient: { memberId: 'uid-b', name: 'Bob Roe' },
        roundId: 'r5',
        points: 30,
        message: 'Carried the migration over the line.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  refetch: jest.fn(),
};

jest.mock('@/hooks/use-kudos', () => ({
  useKudosFeed: () => feedReturn,
  useCommunityPool: () => poolReturn,
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

const poolModule = () => screen.queryByText(/community points to give this round/i);
const giveButtons = () => screen.queryAllByRole('button', { name: /give community kudos/i });

describe('KudosBoardComponent — viewers who cannot give points', () => {
  test('hides the pool module for a member who is not on the roster', () => {
    poolReturn.data = { ...INELIGIBLE_POOL };
    render(<KudosBoardComponent />);
    expect(poolModule()).not.toBeInTheDocument();
  });

  test('offers no give-kudos trigger anywhere to that member', () => {
    poolReturn.data = { ...INELIGIBLE_POOL };
    render(<KudosBoardComponent />);
    expect(giveButtons()).toHaveLength(0);
  });

  test('still lets that member read the shared board', () => {
    poolReturn.data = { ...INELIGIBLE_POOL };
    render(<KudosBoardComponent />);
    expect(screen.getByText('Shared Board')).toBeInTheDocument();
    expect(screen.getByText(/carried the migration over the line/i)).toBeInTheDocument();
  });

  test('hides the empty-state give button too when the board has no kudos yet', () => {
    poolReturn.data = { ...INELIGIBLE_POOL };
    const empty = { ...feedReturn, data: { items: [] } };
    jest.spyOn(require('@/hooks/use-kudos'), 'useKudosFeed').mockReturnValue(empty);
    render(<KudosBoardComponent />);
    expect(screen.getByText(/no kudos on the board yet/i)).toBeInTheDocument();
    expect(giveButtons()).toHaveLength(0);
    jest.restoreAllMocks();
  });

  test('does not flash the pool module while eligibility is still unknown', () => {
    poolReturn.data = undefined;
    render(<KudosBoardComponent />);
    expect(poolModule()).not.toBeInTheDocument();
  });

  test('keeps the pool module for an eligible giver', () => {
    poolReturn.data = { ...ELIGIBLE_POOL };
    render(<KudosBoardComponent />);
    expect(poolModule()).toBeInTheDocument();
    expect(giveButtons().length).toBeGreaterThan(0);
  });
});
