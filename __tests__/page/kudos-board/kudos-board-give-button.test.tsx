import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import KudosBoardComponent from '@/components/page/aligement-assets/kudos-board/kudos-board-component';

const DEFAULT_POOL = {
  pointsRemaining: 100,
  totalBudget: 100,
  pointsUsed: 0,
  eligible: true,
  pointsMin: 10,
  pointsMax: 100,
  pointsStep: 10,
  messageMin: 25,
  messageMax: 500,
};
const poolReturn = { data: { ...DEFAULT_POOL } };

jest.mock('@/hooks/use-kudos', () => ({
  useKudosFeed: () => ({ isLoading: false, isError: false, data: { items: [] }, refetch: jest.fn() }),
  useCommunityPool: () => poolReturn,
  useRecipients: () => ({ data: { items: [] } }),
  useGiveCommunityKudos: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/analytics/kudos.analytics', () => ({
  useKudosAnalytics: () => ({
    onKudosPageViewed: jest.fn(),
    onGiveKudosOpened: jest.fn(),
    onCommunityKudosSubmitted: jest.fn(),
  }),
}));
jest.mock('@/utils/plaa-round.utils', () => ({ getCurrentRoundNumber: () => 5 }));

const giveButtons = () => screen.getAllByRole('button', { name: /give community kudos/i });

function renderWithPool(pointsRemaining: number) {
  poolReturn.data.pointsRemaining = pointsRemaining;
  return render(<KudosBoardComponent />);
}

describe('KudosBoardComponent — Give Community Kudos trigger', () => {
  beforeEach(() => {
    poolReturn.data = { ...DEFAULT_POOL };
  });

  test('disables every give-kudos trigger when the pool cannot afford the minimum gift', () => {
    renderWithPool(0);
    giveButtons().forEach((btn) => expect(btn).toBeDisabled());
  });

  test('disables the trigger when remaining is below the minimum gift (e.g. 5)', () => {
    renderWithPool(5);
    giveButtons().forEach((btn) => expect(btn).toBeDisabled());
  });

  test('enables the trigger when the pool can afford at least one gift', () => {
    renderWithPool(100);
    giveButtons().forEach((btn) => expect(btn).toBeEnabled());
  });
});
