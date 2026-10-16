import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import SnapshotPanel from '@/components/page/aligement-assets/leaderboard/snapshot-panel';
import type { LeaderboardSnapshot } from '@/components/page/aligement-assets/leaderboard/leaderboard.types';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const mockUseIsInfraMember = jest.fn(() => false);
jest.mock('@/services/plaa/hooks/useIsInfraMember', () => ({ useIsInfraMember: () => mockUseIsInfraMember() }));

// Live snapshot where Network Tooling is underutilized, so it gets a "boost these" card.
const snapshot: LeaderboardSnapshot = {
  roundNumber: 21,
  label: 'Round 21',
  period: 'October 1–31, 2026',
  isCurrentRound: true,
  points: 10000,
  participants: 60,
  categories: [
    { name: 'Programs', value: 6000 },
    { name: 'Projects', value: 3800 },
    { name: 'Network Tooling', value: 200 },
  ],
} as LeaderboardSnapshot;

const renderPanel = () =>
  render(<SnapshotPanel snapshots={[snapshot]} index={0} onIndexChange={jest.fn()} categoryWeights={[]} />);

describe('Leaderboard boost suggestions and infra-only activities', () => {
  it('never suggests an infra-only activity to a non-infra member', () => {
    mockUseIsInfraMember.mockReturnValue(false);
    renderPanel();

    expect(screen.getByText('Network Tooling', { selector: '.snap-under-name' })).toBeInTheDocument();
    expect(screen.queryByText(/Build an AI App/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Contribute a Reusable Prompt or Skill/)).not.toBeInTheDocument();
  });

  it('can suggest an infra-only activity to an infra member', () => {
    mockUseIsInfraMember.mockReturnValue(true);
    renderPanel();

    expect(screen.getByText(/Build an AI App/)).toBeInTheDocument();
  });
});
