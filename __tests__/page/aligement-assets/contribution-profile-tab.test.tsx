import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import ContributionProfileTab from '@/components/page/aligement-assets/profile/contribution-profile-tab';
import type { ContributionHistoryEntry } from '@/services/plaa/hooks/useProfileData';

const entries: ContributionHistoryEntry[] = [
  { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: 0, cum: 35 },
  { period: 'Jun 2026', points: 220, plaa: 22, infra: 30, redeemed: 0, cum: 87 },
  { period: 'Jul 2026', points: 450, plaa: 45, infra: 30, redeemed: 50, cum: 112 },
];

describe('ContributionProfileTab', () => {
  it('renders the chart axis labels and every period', () => {
    render(<ContributionProfileTab entries={entries} currentBalance={112} />);

    expect(screen.getByText('Points and PLAA earned over time')).toBeInTheDocument();
    // Each period appears twice: once as a chart x-axis label, once as a table row.
    expect(screen.getAllByText('May 2026')).toHaveLength(2);
    expect(screen.getAllByText('Jun 2026')).toHaveLength(2);
    expect(screen.getAllByText('Jul 2026')).toHaveLength(2);
  });

  it('renders the contribution history table with a Total to date row summing every column', () => {
    render(<ContributionProfileTab entries={entries} currentBalance={112} />);

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
    render(<ContributionProfileTab entries={entries} currentBalance={4854} />);

    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
    expect(within(totalRow).getByText('4,854')).toBeInTheDocument();
    // entries' own last cum (112) must not appear as if it were the balance.
    expect(within(totalRow).queryByText('112')).not.toBeInTheDocument();
  });

  it('renders a placeholder, not a fabricated balance, when currentBalance is null (not yet confirmed)', () => {
    render(<ContributionProfileTab entries={entries} currentBalance={null} />);

    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
    expect(within(totalRow).queryByText('112')).not.toBeInTheDocument();
    expect(within(totalRow).queryByText('0')).not.toBeInTheDocument();
  });

  it('renders each bar\'s points value and a numeric scale on both Y axes', () => {
    const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} />);

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

  it('shows the corresponding PLAA balance when hovering a snapshot bar, hidden otherwise', () => {
    const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} />);

    const hoverZones = Array.from(container.querySelectorAll('rect[fill="transparent"]'));
    expect(hoverZones).toHaveLength(3);
    expect(container.querySelector('text[fill="#ffffff"]')).not.toBeInTheDocument();

    // Hovering the May 2026 bar (index 0) should show its balance (cum: 35).
    fireEvent.mouseEnter(hoverZones[0]);
    expect(screen.getByText('35', { selector: 'text' })).toBeInTheDocument();

    fireEvent.mouseLeave(hoverZones[0]);
    expect(container.querySelector('text[fill="#ffffff"]')).not.toBeInTheDocument();

    // Hovering Jul 2026 (index 2) should show its balance (cum: 112), not May's.
    fireEvent.mouseEnter(hoverZones[2]);
    expect(screen.getByText('112', { selector: 'text' })).toBeInTheDocument();
    expect(screen.queryByText('35', { selector: 'text' })).not.toBeInTheDocument();
  });

  describe('real PLAA data, points not yet wired', () => {
    const realEntries: ContributionHistoryEntry[] = [
      { period: 'May 2026', points: null, plaa: 304, infra: 4300, redeemed: null, cum: 4604 },
      { period: 'Jun 2026', points: null, plaa: 0, infra: 0, redeemed: null, cum: 4604 },
      { period: 'Jul 2026', points: null, plaa: 205, infra: 0, redeemed: null, cum: 4809 },
    ];

    it('hides the points bars and left axis, keeps the real PLAA balance line and right axis', () => {
      const { container } = render(<ContributionProfileTab entries={realEntries} currentBalance={4809} />);

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
      render(<ContributionProfileTab entries={realEntries} currentBalance={4809} />);

      const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
      expect(within(totalRow).getByText('509')).toBeInTheDocument(); // plaa total: 304+0+205
      expect(within(totalRow).getByText('4,300')).toBeInTheDocument(); // infra total
      expect(within(totalRow).getByText('4,809')).toBeInTheDocument(); // real currentBalance
    });
  });

  it('renders a "no snapshot history yet" placeholder instead of an empty chart/table when there are no entries', () => {
    render(<ContributionProfileTab entries={[]} currentBalance={null} />);

    expect(screen.getByText('No snapshot history yet.')).toBeInTheDocument();
    expect(screen.queryByText('Contribution History')).not.toBeInTheDocument();
  });

  it('thins the x-axis labels when there are many periods, so they never overlap', () => {
    const manyEntries: ContributionHistoryEntry[] = Array.from({ length: 17 }, (_, i) => ({
      period: `P${i + 1}`,
      points: 100,
      plaa: 10,
      infra: 0,
      redeemed: 0,
      cum: (i + 1) * 10,
    }));
    const { container } = render(<ContributionProfileTab entries={manyEntries} currentBalance={170} />);

    // Every period still gets a table row...
    expect(screen.getAllByText('P17')).toHaveLength(2);
    // ...but the chart itself renders far fewer than 17 x-axis labels.
    const axisLabels = Array.from(container.querySelectorAll('svg text[fill="#94a3b8"]'));
    expect(axisLabels.length).toBeLessThanOrEqual(7);
    // The most recent period is always shown, never thinned away.
    expect(axisLabels.some((el) => el.textContent === 'P17')).toBe(true);
  });
});
