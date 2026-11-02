import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import ActiveMemberOverview, {
  RoundHistoryEntry,
} from '@/components/page/aligement-assets/overview/active-member-overview';
import OverviewTopline from '@/components/page/aligement-assets/overview/overview-topline';
import { OVERVIEW_SECTION_IDS } from '@/components/page/aligement-assets/overview/section-ids';
import type { KpiWeightEntry } from '@/services/plaa/kpi-weights.service';
import type { RoundStatsResponse } from '@/services/plaa/rounds.service';

const mockOnHowStepClicked = jest.fn();
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onOverviewActivitiesLinkClicked: jest.fn(),
    onOverviewPortfolioLinkClicked: jest.fn(),
    onOverviewFaqLinkClicked: jest.fn(),
    onOverviewSnapshotRoundChanged: jest.fn(),
    onOverviewHowStepClicked: mockOnHowStepClicked,
  }),
}));

jest.mock('@/hooks/useScrollDepthTracking', () => ({ useScrollDepthTracking: jest.fn() }));

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

const CURRENT = { roundNumber: 18, month: 'September', year: 2026 } as RoundStatsResponse;

const KPI_WEIGHTS: KpiWeightEntry[] = [
  { category: 'Network Tooling', weight: 1.2, percentOfTotal: 60, emissionsPerSnapshot: 6000 },
];

const HISTORY: RoundHistoryEntry[] = [
  { roundNumber: 18, label: 'September 2026', categories: [{ name: 'Network Tooling', points: 1800, plaa: 1935 }] },
];

/** The step a member clicks, and the section they expect to land on. */
const STEP_TARGETS: Array<[string, string, string]> = [
  ['Contribute', OVERVIEW_SECTION_IDS.whoItsFor, 'Who It’s For'],
  ['Collect', OVERVIEW_SECTION_IDS.snapshotsAndPoints, 'Snapshots & Points'],
  ['Convert', OVERVIEW_SECTION_IDS.pointsToPlaa, 'Points → PLAA Conversion'],
  ['Capitalize', OVERVIEW_SECTION_IDS.redeemingPlaa, 'Redeeming PLAA'],
];

function renderOverview() {
  return render(<ActiveMemberOverview kpiWeights={KPI_WEIGHTS} roundStats={CURRENT} roundHistory={HISTORY} />);
}

describe('How It Works steps jump to the section they explain', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(STEP_TARGETS)('%s links to #%s', (step, targetId) => {
    renderOverview();
    expect(screen.getByRole('link', { name: step })).toHaveAttribute('href', `#${targetId}`);
  });

  it.each(STEP_TARGETS)('%s has a real section to land on, headed "%s"', (_step, targetId, heading) => {
    const { container } = renderOverview();

    const section = container.querySelector(`#${targetId}`);
    expect(section).toBeInTheDocument();
    // The anchor is the section itself, not a stray wrapper: its heading is inside it.
    expect(section).toHaveTextContent(heading);
  });

  it('records which step was used, so the jump is attributable', () => {
    renderOverview();

    fireEvent.click(screen.getByRole('link', { name: 'Capitalize' }));

    expect(mockOnHowStepClicked).toHaveBeenCalledWith('Capitalize', OVERVIEW_SECTION_IDS.redeemingPlaa);
  });

  it('keeps "See activities" clickable on the Contribute card rather than swallowing it', () => {
    render(<OverviewTopline />);

    const activities = screen.getByRole('link', { name: /See activities/ });
    expect(activities).toHaveAttribute('href', '/alignment-asset/activities');
    // Two distinct links on that card: the step anchor and the activities link.
    expect(screen.getByRole('link', { name: 'Contribute' })).not.toBe(activities);
  });
});
