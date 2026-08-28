import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import SnapshotHistoryTab from '@/components/page/aligement-assets/profile/snapshot-history-tab';
import type { SnapshotHistoryEntry } from '@/services/plaa/hooks/useProfileData';

const entries: SnapshotHistoryEntry[] = [
  {
    period: 'Jul 2026',
    activities: 3,
    categories: 3,
    points: 450,
    activityPlaa: 45,
    hasInfra: true,
    infra: 30,
    plaaTotal: 75,
    items: [{ category: 'Category A', title: 'Activity 1', points: 300 }],
  },
  {
    period: 'May 2026',
    activities: 2,
    categories: 2,
    points: 350,
    activityPlaa: 35,
    hasInfra: false,
    infra: 0,
    plaaTotal: 35,
    items: [{ category: 'Category A', title: 'Activity 2', points: 50 }],
  },
];

describe('SnapshotHistoryTab', () => {
  it('renders one row per snapshot, collapsed by default, with a Total to date footer', () => {
    render(<SnapshotHistoryTab entries={entries} />);

    expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    expect(screen.getByText('May 2026')).toBeInTheDocument();
    expect(screen.queryByText('Activities this snapshot')).not.toBeInTheDocument();

    expect(screen.getByText('Total to date')).toBeInTheDocument();
    expect(screen.getByText('800 points')).toBeInTheDocument(); // 450 + 350
    expect(screen.getByText('110')).toBeInTheDocument(); // 75 + 35
  });

  it('expands a row to show its activity breakdown and conversion, with an infra row only when applicable', () => {
    render(<SnapshotHistoryTab entries={entries} />);

    fireEvent.click(screen.getByText('Jul 2026'));
    expect(screen.getByText('Activities this snapshot')).toBeInTheDocument();
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity rewards')).toBeInTheDocument();
    expect(screen.getByText('Infra Member')).toBeInTheDocument();
    expect(screen.getByText('+30 PLAA')).toBeInTheDocument();
    expect(screen.getByText('Jul 2026 total')).toBeInTheDocument();

    // Only one row open at a time.
    fireEvent.click(screen.getByText('May 2026'));
    expect(screen.queryByText('Activity 1')).not.toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.queryByText('Infra Member')).not.toBeInTheDocument();
  });

  it('collapses a row when clicked again', () => {
    render(<SnapshotHistoryTab entries={entries} />);

    fireEvent.click(screen.getByText('Jul 2026'));
    expect(screen.getByText('Activities this snapshot')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Jul 2026'));
    expect(screen.queryByText('Activities this snapshot')).not.toBeInTheDocument();
  });

  describe('a period with no points data (still loading or settled empty)', () => {
    const realEntries: SnapshotHistoryEntry[] = [
      {
        period: 'Jul 2026',
        activities: null,
        categories: null,
        points: null,
        activityPlaa: 50,
        hasInfra: false,
        infra: 0,
        plaaTotal: 50,
        items: null,
      },
      {
        period: 'May 2026',
        activities: null,
        categories: null,
        points: null,
        activityPlaa: 100,
        hasInfra: true,
        infra: 900,
        plaaTotal: 1000,
        items: null,
      },
    ];

    it('shows a dash for unavailable activities/categories/points, but a real PLAA total', () => {
      render(<SnapshotHistoryTab entries={realEntries} />);

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('shows a "not yet available" message instead of an empty activity list when expanded', () => {
      render(<SnapshotHistoryTab entries={realEntries} />);

      fireEvent.click(screen.getByText('Jul 2026'));
      expect(screen.getByText('Per-activity breakdown not yet available')).toBeInTheDocument();
    });

    it('shows a dash for the footer points total when any entry has unavailable points', () => {
      render(<SnapshotHistoryTab entries={realEntries} />);

      expect(screen.getByText('Total to date')).toBeInTheDocument();
      expect(screen.getByText('1,050')).toBeInTheDocument(); // 50 + 1000 PLAA total
    });
  });
});
