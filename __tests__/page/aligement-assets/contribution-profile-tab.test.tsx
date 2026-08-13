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
    render(<ContributionProfileTab entries={entries} />);

    expect(screen.getByText('Points and PLAA balance over time')).toBeInTheDocument();
    // Each period appears twice: once as a chart x-axis label, once as a table row.
    expect(screen.getAllByText('May 2026')).toHaveLength(2);
    expect(screen.getAllByText('Jun 2026')).toHaveLength(2);
    expect(screen.getAllByText('Jul 2026')).toHaveLength(2);
  });

  it('renders the contribution history table with a Total to date row summing every column', () => {
    render(<ContributionProfileTab entries={entries} />);

    expect(screen.getByText('Contribution History')).toBeInTheDocument();
    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;

    // Totals: points 1020, plaa 102, infra 60, redeemed 50, balance = last cum 112.
    // Scoped to the footer row so chart axis-tick text (which can repeat these same
    // numbers) can't produce false matches.
    expect(within(totalRow).getByText('1,020')).toBeInTheDocument();
    expect(within(totalRow).getByText('102')).toBeInTheDocument();
    expect(within(totalRow).getByText('60')).toBeInTheDocument();
    expect(within(totalRow).getByText('50')).toBeInTheDocument();
    expect(within(totalRow).getByText('112')).toBeInTheDocument();
  });

  it('renders each bar\'s points value and a numeric scale on both Y axes', () => {
    const { container } = render(<ContributionProfileTab entries={entries} />);

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
    const { container } = render(<ContributionProfileTab entries={entries} />);

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
});
