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
    items: [{ category: 'Programs', title: 'Make a Network Introduction', points: 300 }],
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
    items: [{ category: 'Programs', title: 'Complete a Survey', points: 50 }],
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
    expect(screen.getByText('Make a Network Introduction')).toBeInTheDocument();
    expect(screen.getByText('Activity rewards')).toBeInTheDocument();
    expect(screen.getByText('Infra Member')).toBeInTheDocument();
    expect(screen.getByText('+30 PLAA')).toBeInTheDocument();
    expect(screen.getByText('Jul 2026 total')).toBeInTheDocument();

    // Only one row open at a time.
    fireEvent.click(screen.getByText('May 2026'));
    expect(screen.queryByText('Make a Network Introduction')).not.toBeInTheDocument();
    expect(screen.getByText('Complete a Survey')).toBeInTheDocument();
    expect(screen.queryByText('Infra Member')).not.toBeInTheDocument();
  });

  it('collapses a row when clicked again', () => {
    render(<SnapshotHistoryTab entries={entries} />);

    fireEvent.click(screen.getByText('Jul 2026'));
    expect(screen.getByText('Activities this snapshot')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Jul 2026'));
    expect(screen.queryByText('Activities this snapshot')).not.toBeInTheDocument();
  });

  describe('real PLAA data, points/activities/categories/items not yet wired (PLAA-57)', () => {
    const realEntries: SnapshotHistoryEntry[] = [
      {
        period: 'Jul 2026',
        activities: null,
        categories: null,
        points: null,
        activityPlaa: 205,
        hasInfra: false,
        infra: 0,
        plaaTotal: 205,
        items: null,
      },
      {
        period: 'May 2026',
        activities: null,
        categories: null,
        points: null,
        activityPlaa: 304,
        hasInfra: true,
        infra: 4300,
        plaaTotal: 4604,
        items: null,
      },
    ];

    it('shows a dash for unavailable activities/categories/points, but a real PLAA total', () => {
      render(<SnapshotHistoryTab entries={realEntries} />);

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
      expect(screen.getByText('4,604')).toBeInTheDocument();
    });

    it('shows a "not yet available" message instead of an empty activity list when expanded', () => {
      render(<SnapshotHistoryTab entries={realEntries} />);

      fireEvent.click(screen.getByText('Jul 2026'));
      expect(screen.getByText('Per-activity breakdown not yet available')).toBeInTheDocument();
    });

    it('shows a dash for the footer points total when any entry has unavailable points', () => {
      render(<SnapshotHistoryTab entries={realEntries} />);

      expect(screen.getByText('Total to date')).toBeInTheDocument();
      expect(screen.getByText('4,809')).toBeInTheDocument(); // 205 + 4604 PLAA total
    });
  });
});
