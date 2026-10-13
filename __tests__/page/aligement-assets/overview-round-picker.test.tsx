import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import ActiveMemberOverview, {
  RoundHistoryEntry,
} from '@/components/page/aligement-assets/overview/active-member-overview';
import type { RoundStatsResponse } from '@/services/plaa/rounds.service';

const mockOnRoundChanged = jest.fn();
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onOverviewActivitiesLinkClicked: jest.fn(),
    onOverviewFaqLinkClicked: jest.fn(),
    onOverviewSnapshotRoundChanged: mockOnRoundChanged,
  }),
}));

jest.mock('@/hooks/useScrollDepthTracking', () => ({ useScrollDepthTracking: jest.fn() }));

jest.mock('@/components/page/aligement-assets/overview/overview-topline', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('recharts', () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Passthrough,
    RadarChart: Passthrough,
    Radar: () => null,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    Tooltip: () => null,
  };
});

const round = (roundNumber: number, label: string, points: number, plaa: number): RoundHistoryEntry => ({
  roundNumber,
  label,
  categories: [
    { name: 'Network Tooling', points, plaa },
    { name: 'Projects', points: points / 2, plaa: plaa / 2 },
  ],
});

// Newest first, as the Overview route builds it.
const HISTORY: RoundHistoryEntry[] = [
  round(18, 'September 2026', 1800, 1935),
  round(17, 'August 2026', 1700, 1900),
  round(16, 'July 2026', 1600, 1850),
];

const CURRENT = { roundNumber: 18, month: 'September', year: 2026 } as RoundStatsResponse;

const renderOverview = (roundHistory = HISTORY, roundStats: RoundStatsResponse | undefined = CURRENT) =>
  render(<ActiveMemberOverview roundStats={roundStats} roundHistory={roundHistory} />);

describe('ActiveMemberOverview snapshot round picker', () => {
  afterEach(() => jest.clearAllMocks());

  it('opens on the current round', () => {
    renderOverview();

    expect(screen.getByText('Round 18 — September 2026', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Current round' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1,800 points')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next round' })).toBeDisabled();
  });

  it('steps back to the previous round and reports it', () => {
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Previous round' }));

    expect(screen.getByText('Round 17 — August 2026', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('1,700 points')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Current round' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to current round' })).toHaveAttribute('aria-pressed', 'false');
    expect(mockOnRoundChanged).toHaveBeenCalledWith(18, 17, 'prev');
  });

  it('snaps back to the current round from a past one', () => {
    renderOverview();

    fireEvent.change(screen.getByRole('combobox', { name: 'Snapshot round' }), { target: { value: '16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Go to current round' }));

    expect(screen.getByText('Round 18 — September 2026', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Current round' })).toHaveAttribute('aria-pressed', 'true');
    expect(mockOnRoundChanged).toHaveBeenLastCalledWith(16, 18, 'current');
  });

  it('does nothing when Current round is pressed while already on it', () => {
    renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Current round' }));

    expect(mockOnRoundChanged).not.toHaveBeenCalled();
  });

  it('jumps to any round from the dropdown and disables Previous on the oldest', () => {
    renderOverview();

    fireEvent.change(screen.getByRole('combobox', { name: 'Snapshot round' }), { target: { value: '16' } });

    expect(screen.getByText('Round 16 — July 2026', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous round' })).toBeDisabled();
    expect(mockOnRoundChanged).toHaveBeenCalledWith(18, 16, 'select');
  });

  it('lists rounds newest first', () => {
    renderOverview();

    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Round 18 — September 2026', 'Round 17 — August 2026', 'Round 16 — July 2026']);
  });

  it('flags the current round as in progress while no PLAA has converted', () => {
    renderOverview([round(18, 'September 2026', 1800, 0), ...HISTORY.slice(1)]);

    expect(screen.getByText(/Points convert to PLAA at the end of the snapshot period/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous round' }));

    expect(screen.queryByText(/Points convert to PLAA at the end of the snapshot period/)).not.toBeInTheDocument();
  });

  it('hides the picker and shows the illustrative example without round data', () => {
    render(<ActiveMemberOverview roundHistory={[]} />);

    expect(screen.getByText('Illustrative example, not a specific snapshot')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Snapshot round' })).not.toBeInTheDocument();
  });
});
