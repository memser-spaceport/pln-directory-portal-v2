import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import SnapshotPanel from '@/components/page/aligement-assets/leaderboard/snapshot-panel';
import type { LeaderboardSnapshot } from '@/components/page/aligement-assets/leaderboard/leaderboard.types';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const snapshot = (overrides: Partial<LeaderboardSnapshot>): LeaderboardSnapshot => ({
  roundNumber: 19,
  label: 'Round 19',
  period: 'August 1–31, 2026',
  isCurrentRound: false,
  points: 1500,
  participants: 40,
  plaaDistributed: 4000,
  categories: [
    { name: 'Programs', value: 1200, plaa: 2500 },
    { name: 'Projects', value: 900, plaa: 1000 },
    { name: 'Brand', value: 300, plaa: 500 },
  ],
  ...overrides,
});

const renderPanel = (snapshots: LeaderboardSnapshot[]) =>
  render(<SnapshotPanel snapshots={snapshots} index={0} onIndexChange={jest.fn()} categoryWeights={[]} />);

describe('Leaderboard PLAA conversion', () => {
  it('shows PLAA distributed for a closed snapshot, with the change from the round before', () => {
    renderPanel([snapshot({}), snapshot({ roundNumber: 18, label: 'Round 18', plaaDistributed: 3200 })]);

    expect(screen.getByText('PLAA distributed', { selector: '.snap-metric-label span' })).toBeInTheDocument();
    expect(screen.getByText('4,000')).toBeInTheDocument();
    expect(screen.getByText('+25%')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Points collected and PLAA distributed per activity category' }),
    ).toBeInTheDocument();
  });

  it('marks PLAA as pending while the live snapshot has not converted', () => {
    renderPanel([
      snapshot({
        isCurrentRound: true,
        plaaDistributed: 0,
        categories: [
          { name: 'Programs', value: 1200, plaa: 0 },
          { name: 'Brand', value: 300, plaa: 0 },
        ],
      }),
    ]);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Points convert to PLAA when the snapshot closes')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Points collected per activity category' })).toBeInTheDocument();
  });

  it('marks PLAA as not published for a closed snapshot that has not converted yet', () => {
    renderPanel([
      snapshot({
        plaaDistributed: 0,
        categories: [
          { name: 'Programs', value: 1200, plaa: 0 },
          { name: 'Brand', value: 300, plaa: 0 },
        ],
      }),
      snapshot({ roundNumber: 18, label: 'Round 18', plaaDistributed: 3200 }),
    ]);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getAllByText(/PLAA for this snapshot is not published yet/).length).toBeGreaterThan(0);
    expect(screen.queryByText('-100%')).not.toBeInTheDocument();
    expect(screen.queryByText('PLAA distributed', { selector: '.lb-conv-head span' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Points collected per activity category' })).toBeInTheDocument();
  });

  it('offers "boost these" categories on the live snapshot and conversion bars on closed ones', () => {
    const lopsided = [
      { name: 'Programs', value: 1200, plaa: 2500 },
      { name: 'Projects', value: 900, plaa: 1000 },
      { name: 'Brand', value: 100, plaa: 500 },
    ];

    const { unmount } = renderPanel([snapshot({ isCurrentRound: true, plaaDistributed: 0, categories: lopsided })]);
    expect(screen.getByText('Underutilized — boost these')).toBeInTheDocument();
    expect(screen.getByText(/are underutilized, so points make a bigger impact/)).toBeInTheDocument();
    unmount();

    renderPanel([snapshot({ categories: lopsided })]);
    expect(screen.queryByText('Underutilized — boost these')).not.toBeInTheDocument();
    expect(screen.getByText(/were underutilized in this snapshot/)).toBeInTheDocument();
    expect(screen.getByText('PLAA distributed', { selector: '.lb-conv-head span' })).toBeInTheDocument();
    expect(screen.getByText('1,200 points')).toBeInTheDocument();
    expect(screen.getByText('2,500')).toBeInTheDocument();
  });

  it('highlights the same category on both sides when either is hovered', () => {
    const { container } = renderPanel([snapshot({})]);
    const row = (name: string) => screen.getByText(name, { selector: '.lb-conv-name' }).closest('.lb-conv-row')!;

    fireEvent.mouseEnter(row('Projects'));
    expect(row('Projects')).toHaveClass('lb-conv-row--active');
    expect(row('Programs')).toHaveClass('lb-conv-row--dim');
    fireEvent.mouseLeave(row('Projects'));
    expect(row('Projects')).not.toHaveClass('lb-conv-row--active');

    // Radar hover targets are drawn in category order, after the chart.
    const wedges = container.querySelectorAll('.lb-radar path');
    fireEvent.mouseEnter(wedges[2]);
    expect(row('Brand')).toHaveClass('lb-conv-row--active');
  });
});
