import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import ContributionProfileTab from '@/components/page/aligement-assets/profile/contribution-profile-tab';
import type { ContributionHistoryEntry } from '@/services/plaa/hooks/useProfileData';

const entries: ContributionHistoryEntry[] = [
  { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: 0, isPending: false, cum: 35 },
  { period: 'Jun 2026', points: 220, plaa: 22, infra: 30, redeemed: 0, isPending: false, cum: 87 },
  { period: 'Jul 2026', points: 450, plaa: 45, infra: 30, redeemed: 50, isPending: false, cum: 112 },
];

describe('ContributionProfileTab', () => {
  it('does not crash when entries arrives empty on first render and real data lands on a later one', () => {
    const { rerender } = render(<ContributionProfileTab entries={[]} currentBalance={null} totalRedeemed={null} />);
    expect(screen.getByText('No snapshot history yet.')).toBeInTheDocument();

    expect(() =>
      rerender(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />)
    ).not.toThrow();
    expect(screen.getByText('Contribution History')).toBeInTheDocument();
  });

  it('does not crash when entries goes from real data back to empty (e.g. a filter clears the history)', () => {
    const { rerender } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);
    expect(screen.getByText('Contribution History')).toBeInTheDocument();

    expect(() =>
      rerender(<ContributionProfileTab entries={[]} currentBalance={null} totalRedeemed={null} />)
    ).not.toThrow();
    expect(screen.getByText('No snapshot history yet.')).toBeInTheDocument();
  });

  it('renders the chart axis labels and every period', () => {
    render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

    expect(screen.getByText('Points and PLAA earned over time')).toBeInTheDocument();
    // Each period appears twice: once as a chart x-axis label, once as a table row.
    expect(screen.getAllByText('May 2026')).toHaveLength(2);
    expect(screen.getAllByText('Jun 2026')).toHaveLength(2);
    expect(screen.getAllByText('Jul 2026')).toHaveLength(2);
  });

  it('renders the contribution history table with a Total to date row summing every column', () => {
    render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

    expect(screen.getByText('Contribution History')).toBeInTheDocument();
    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;

    // Scoped to the footer row so chart axis-tick text (which can repeat these same
    // numbers) can't produce false matches.
    expect(within(totalRow).getByText('1,020')).toBeInTheDocument();
    expect(within(totalRow).getByText('102')).toBeInTheDocument();
    expect(within(totalRow).getByText('60')).toBeInTheDocument();
    expect(within(totalRow).getByText('50')).toBeInTheDocument();
    expect(within(totalRow).getByText('112')).toBeInTheDocument();
  });

  it('renders the footer balance from the real currentBalance prop, not entries\' own last cum — the two can legitimately differ', () => {
    render(<ContributionProfileTab entries={entries} currentBalance={999} totalRedeemed={50} />);

    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
    expect(within(totalRow).getByText('999')).toBeInTheDocument();
    // entries' own last cum (112) must not appear as if it were the balance.
    expect(within(totalRow).queryByText('112')).not.toBeInTheDocument();
  });

  it('renders a placeholder, not a fabricated balance, when currentBalance is null (not yet confirmed)', () => {
    render(<ContributionProfileTab entries={entries} currentBalance={null} totalRedeemed={null} />);

    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
    expect(within(totalRow).queryByText('112')).not.toBeInTheDocument();
    expect(within(totalRow).queryByText('0')).not.toBeInTheDocument();
  });

  it('renders the real total redeemed in the footer even though no per-period breakdown exists', () => {
    const noRedemptionSource: ContributionHistoryEntry[] = entries.map((e) => ({ ...e, redeemed: null }));
    const { container } = render(
      <ContributionProfileTab entries={noRedemptionSource} currentBalance={112} totalRedeemed={231} />
    );

    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
    expect(within(totalRow).getByText('231')).toBeInTheDocument();
    // Every per-row Redeemed cell still shows a dash — there's no month-by-month source.
    const periodCells = Array.from(container.querySelectorAll('[class*="period"]'));
    const dataRows = periodCells.map((el) => el.closest('[class*="dataRow"]') as HTMLElement);
    expect(dataRows).toHaveLength(noRedemptionSource.length);
    for (const row of dataRows) {
      expect(within(row).getAllByText('—').length).toBeGreaterThan(0);
    }
  });

  it('renders a dash for the footer Redeemed cell when the real total is null, not a summed zero', () => {
    render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={null} />);

    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
    expect(within(totalRow).getByText('—')).toBeInTheDocument();
  });

  it('renders each bar\'s points value and a numeric scale on both Y axes', () => {
    const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

    // Each period's points value renders twice: once as a bar label in the chart,
    // once in its table row — assert the SVG bar label specifically.
    const svgTexts = Array.from(container.querySelectorAll('svg text'));
    const barLabelValues = svgTexts
      .filter((el) => el.getAttribute('font-weight') === '600' && el.getAttribute('fill') === '#4f9eff')
      .map((el) => el.textContent);
    expect(barLabelValues).toEqual(['350', '220', '450']);

    // Left (points) and right (PLAA balance) axis tick text exist and are colored distinctly.
    const leftAxisTexts = svgTexts.filter((el) => el.getAttribute('fill') === '#4f9eff' && el.getAttribute('text-anchor') === 'end');
    const rightAxisTexts = svgTexts.filter((el) => el.getAttribute('fill') === '#156ff7' && el.getAttribute('text-anchor') === 'start');
    expect(leftAxisTexts.length).toBeGreaterThan(0);
    expect(rightAxisTexts.length).toBeGreaterThan(0);
  });

  it('shows a tooltip with the month, points collected, and PLAA earned when hovering a snapshot, hidden otherwise', () => {
    const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

    const hoverZones = Array.from(container.querySelectorAll('rect[fill="transparent"]'));
    expect(hoverZones).toHaveLength(3);
    expect(screen.queryByText(/PLAA earned:/)).not.toBeInTheDocument();

    const tooltipTitle = () => container.querySelector('svg text[font-weight="700"][fill="#ffffff"]');

    fireEvent.mouseEnter(hoverZones[0]);
    expect(tooltipTitle()?.textContent).toBe('May 2026');
    expect(screen.getByText('Points collected: 350')).toBeInTheDocument();
    expect(screen.getByText('PLAA earned: 35')).toBeInTheDocument();

    fireEvent.mouseLeave(hoverZones[0]);
    expect(screen.queryByText(/PLAA earned:/)).not.toBeInTheDocument();

    fireEvent.mouseEnter(hoverZones[2]);
    expect(tooltipTitle()?.textContent).toBe('Jul 2026');
    expect(screen.getByText('PLAA earned: 112')).toBeInTheDocument();
    expect(screen.queryByText('PLAA earned: 35')).not.toBeInTheDocument();
  });

  describe('a period with no points data (still loading or settled empty)', () => {
    const realEntries: ContributionHistoryEntry[] = [
      { period: 'May 2026', points: null, plaa: 100, infra: 900, redeemed: null, isPending: false, cum: 1000 },
      { period: 'Jun 2026', points: null, plaa: 0, infra: 0, redeemed: null, isPending: false, cum: 1000 },
      { period: 'Jul 2026', points: null, plaa: 50, infra: 0, redeemed: null, isPending: false, cum: 1050 },
    ];

    it('hides the points bars and left axis, keeps the real PLAA balance line and right axis', () => {
      const { container } = render(<ContributionProfileTab entries={realEntries} currentBalance={1050} totalRedeemed={null} />);

      expect(screen.getByText('PLAA earned over time')).toBeInTheDocument();
      expect(screen.queryByText('Points collected')).not.toBeInTheDocument();
      expect(screen.queryByText('Points per snapshot')).not.toBeInTheDocument();

      const svgTexts = Array.from(container.querySelectorAll('svg text'));
      const barLabels = svgTexts.filter((el) => el.getAttribute('font-weight') === '600' && el.getAttribute('fill') === '#4f9eff');
      expect(barLabels).toHaveLength(0);

      const rightAxisTexts = svgTexts.filter((el) => el.getAttribute('fill') === '#156ff7' && el.getAttribute('text-anchor') === 'start');
      expect(rightAxisTexts.length).toBeGreaterThan(0);
    });

    it('shows a dash for Points and Redeemed columns, real values for Activities/Infra/Balance', () => {
      render(<ContributionProfileTab entries={realEntries} currentBalance={1050} totalRedeemed={null} />);

      const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
      expect(within(totalRow).getByText('150')).toBeInTheDocument(); // plaa total: 100+0+50
      expect(within(totalRow).getByText('900')).toBeInTheDocument(); // infra total
      expect(within(totalRow).getByText('1,050')).toBeInTheDocument(); // real currentBalance
    });

    it('omits Points collected from the hover tooltip when no period has real points data', () => {
      const { container } = render(<ContributionProfileTab entries={realEntries} currentBalance={1050} totalRedeemed={null} />);

      const hoverZones = Array.from(container.querySelectorAll('rect[fill="transparent"]'));
      fireEvent.mouseEnter(hoverZones[0]);

      expect(screen.queryByText(/Points collected:/)).not.toBeInTheDocument();
      expect(screen.getByText('PLAA earned: 1,000')).toBeInTheDocument();
    });
  });

  it('renders a "no snapshot history yet" placeholder instead of an empty chart/table when there are no entries', () => {
    render(<ContributionProfileTab entries={[]} currentBalance={null} totalRedeemed={null} />);

    expect(screen.getByText('No snapshot history yet.')).toBeInTheDocument();
    expect(screen.queryByText('Contribution History')).not.toBeInTheDocument();
  });

  it('caps x-axis labels at 6 and keeps them evenly spaced, so none ever sit adjacent and overlap', () => {
    const manyEntries: ContributionHistoryEntry[] = Array.from({ length: 17 }, (_, i) => ({
      period: `P${i + 1}`,
      points: 100,
      plaa: 10,
      infra: 0,
      redeemed: 0,
      isPending: false,
      cum: (i + 1) * 10,
    }));
    const { container } = render(<ContributionProfileTab entries={manyEntries} currentBalance={170} totalRedeemed={0} />);

    // Every period still gets a table row...
    expect(screen.getAllByText('P17')).toHaveLength(2);

    // ...but the chart itself renders at most 6 x-axis labels.
    const axisLabels = Array.from(container.querySelectorAll('svg text[fill="#94a3b8"]'));
    expect(axisLabels.length).toBeLessThanOrEqual(6);
    expect(axisLabels.some((el) => el.textContent === 'P17')).toBe(true);

    // No two labels sit close enough to overlap — each is at least one slot's width apart.
    const plotWidth = 668 - 52;
    const slotWidth = plotWidth / manyEntries.length;
    const xs = axisLabels.map((el) => Number(el.getAttribute('x'))).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(slotWidth - 1);
    }
  });

  describe('an open snapshot (not yet closed)', () => {
    const withPending: ContributionHistoryEntry[] = [
      { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: null, isPending: false, cum: 35 },
      { period: 'Jun 2026', points: 220, plaa: 22, infra: 30, redeemed: null, isPending: true, cum: 87 },
    ];

    it('shows Pending in place of the snapshot\'s own points and PLAA figures', () => {
      const { container } = render(
        <ContributionProfileTab entries={withPending} currentBalance={35} totalRedeemed={null} />
      );

      const pendingRow = (screen.getAllByText('Jun 2026')[1].closest('[class*="dataRow"]')) as HTMLElement;
      expect(within(pendingRow).getAllByText('Pending')).toHaveLength(3);
      expect(within(pendingRow).queryByText('220')).not.toBeInTheDocument();
      expect(within(pendingRow).queryByText('22')).not.toBeInTheDocument();
    });

    it('leaves a closed snapshot\'s own figures untouched', () => {
      render(<ContributionProfileTab entries={withPending} currentBalance={35} totalRedeemed={null} />);

      const closedRow = (screen.getAllByText('May 2026')[1].closest('[class*="dataRow"]')) as HTMLElement;
      expect(within(closedRow).queryByText('Pending')).not.toBeInTheDocument();
      expect(within(closedRow).getByText('350')).toBeInTheDocument();
    });

    it('does not mark the footer balance pending — it only ever reflects closed snapshots', () => {
      render(<ContributionProfileTab entries={withPending} currentBalance={35} totalRedeemed={null} />);

      const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
      expect(within(totalRow).queryByText('Pending')).not.toBeInTheDocument();
    });
  });

  it('renders a per-period redeemed figure when one is attributed to that month', () => {
    const redeemed: ContributionHistoryEntry[] = [
      { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: null, isPending: false, cum: 35 },
      { period: 'Jun 2026', points: 220, plaa: 22, infra: 30, redeemed: 640, isPending: false, cum: 87 },
    ];
    render(<ContributionProfileTab entries={redeemed} currentBalance={35} totalRedeemed={640} />);

    const row = (screen.getAllByText('Jun 2026')[1].closest('[class*="dataRow"]')) as HTMLElement;
    expect(within(row).getByText('640')).toBeInTheDocument();
  });

  it('renders an empty state without crashing when there are no entries', () => {
    render(<ContributionProfileTab entries={[]} currentBalance={null} totalRedeemed={null} />);

    expect(screen.getByText('No snapshot history yet.')).toBeInTheDocument();
  });
});
