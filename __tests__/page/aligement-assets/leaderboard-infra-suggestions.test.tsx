import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import SnapshotPanel from '@/components/page/aligement-assets/leaderboard/snapshot-panel';
import type { LeaderboardSnapshot } from '@/components/page/aligement-assets/leaderboard/leaderboard.types';
import { activitiesData } from '@/components/page/aligement-assets/activities/data';
import type { Activity } from '@/components/page/aligement-assets/activities/types';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const mockUseIsInfraMember = jest.fn(() => false);
jest.mock('@/services/plaa/hooks/useIsInfraMember', () => ({ useIsInfraMember: () => mockUseIsInfraMember() }));

const base = activitiesData.activities[0];
const tooling = (overrides: Partial<Activity>): Activity => ({
  ...base,
  category: 'Network Tooling',
  isSunset: false,
  audience: undefined,
  ...overrides,
});

const sunsetting = tooling({ id: 'sunsetting', activity: 'Sunsetting activity', points: '2000', isSunset: true });
const infraOnly = tooling({
  id: 'infra-only',
  activity: 'Infra activity',
  points: '1000',
  audience: 'pl-infra-members',
});
const open = tooling({ id: 'open', activity: 'Open activity', points: '250' });

const snapshot = {
  roundNumber: 21,
  label: 'Round 21',
  period: 'October 1–31, 2026',
  isCurrentRound: true,
  points: 10000,
  participants: 60,
  plaaDistributed: 0,
  categories: [
    { name: 'Programs', value: 6000, plaa: 0 },
    { name: 'Projects', value: 3800, plaa: 0 },
    { name: 'Network Tooling', value: 200, plaa: 0 },
  ],
} as LeaderboardSnapshot;

const suggestion = () => {
  render(<SnapshotPanel snapshots={[snapshot]} index={0} onIndexChange={jest.fn()} categoryWeights={[]} />);
  return screen.getByText('Network Tooling', { selector: '.snap-under-name' }).closest('.snap-under')!;
};

beforeEach(() => {
  jest.replaceProperty(activitiesData, 'activities', [sunsetting, infraOnly, open]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Leaderboard boost suggestions', () => {
  it('suggests the best activity a non-infra member can see', () => {
    mockUseIsInfraMember.mockReturnValue(false);

    expect(suggestion()).toHaveTextContent('Open activity');
  });

  it('can suggest an infra-only activity to an infra member', () => {
    mockUseIsInfraMember.mockReturnValue(true);

    expect(suggestion()).toHaveTextContent('Infra activity');
  });

  it('never suggests a sunsetting activity, even when it has the most points', () => {
    mockUseIsInfraMember.mockReturnValue(true);

    expect(suggestion()).not.toHaveTextContent('Sunsetting activity');
  });
});
