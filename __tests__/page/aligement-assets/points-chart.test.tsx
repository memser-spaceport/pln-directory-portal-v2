import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import PointsChart from '@/components/page/aligement-assets/profile/points-chart';
import type { ContributionHistoryEntry } from '@/services/plaa/hooks/useProfileData';

const entries: ContributionHistoryEntry[] = [
  { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: 0, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 35 },
  { period: 'Jun 2026', points: 220, plaa: 22, infra: 30, redeemed: 0, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 87 },
  { period: 'Jul 2026', points: 450, plaa: 45, infra: 30, redeemed: 50, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 112 },
];

describe('PointsChart', () => {
  it('renders nothing at all when there is no history, rather than an empty frame', () => {
    const { container } = render(<PointsChart entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no snapshot has a points count yet', () => {
    const noPoints = entries.map((e) => ({ ...e, points: null }));
    const { container } = render(<PointsChart entries={noPoints} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the chart title and every period on the x axis, oldest first', () => {
    const { container } = render(<PointsChart entries={entries} />);

    expect(screen.getByText('Points collected per snapshot')).toBeInTheDocument();
    const axisLabels = Array.from(container.querySelectorAll('svg text[fill="#94a3b8"]')).map((n) => n.textContent);
    expect(axisLabels).toEqual(['May 2026', 'Jun 2026', 'Jul 2026']);
  });

  it('labels each bar with its points and scales them against a points axis', () => {
    const { container } = render(<PointsChart entries={entries} />);

    const svgTexts = Array.from(container.querySelectorAll('svg text'));
    const barLabelValues = svgTexts
      .filter((el) => el.getAttribute('font-weight') === '600' && el.getAttribute('fill') === '#4f9eff')
      .map((el) => el.textContent);
    expect(barLabelValues).toEqual(['350', '220', '450']);

    const axisTexts = svgTexts.filter((el) => el.getAttribute('fill') === '#4f9eff' && el.getAttribute('text-anchor') === 'end');
    expect(axisTexts.length).toBeGreaterThan(0);
  });

  it('leaves the balance out: that story belongs to the Balance History tab', () => {
    const { container } = render(<PointsChart entries={entries} />);

    expect(container.querySelectorAll('svg polyline')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/balance/i);
  });

  it('skips a snapshot still waiting on its count rather than drawing it as zero', () => {
    const partial = entries.map((e, i) => (i === 1 ? { ...e, points: null } : e));
    const { container } = render(<PointsChart entries={partial} />);

    expect(container.querySelectorAll('svg rect')).toHaveLength(2);
    // The missing month still keeps its slot on the x axis.
    expect(Array.from(container.querySelectorAll('svg text[fill="#94a3b8"]'))).toHaveLength(3);
  });

  it('caps x-axis labels at 6 and keeps them evenly spaced, so none ever sit adjacent and overlap', () => {
    const manyEntries: ContributionHistoryEntry[] = Array.from({ length: 17 }, (_, i) => ({
      period: `P${i + 1}`,
      points: 100,
      plaa: 10,
      infra: 0,
      redeemedUsd: null,
      redeemedPrice: null,
      redeemedPriceIsAverage: false,
      redeemed: 0,
      isPending: false,
      cum: (i + 1) * 10,
    }));
    const { container } = render(<PointsChart entries={manyEntries} />);

    const axisLabels = Array.from(container.querySelectorAll('svg text[fill="#94a3b8"]'));
    expect(axisLabels.length).toBeLessThanOrEqual(6);
    expect(axisLabels.some((el) => el.textContent === 'P17')).toBe(true);

    const plotWidth = 668 - 52;
    const slotWidth = plotWidth / manyEntries.length;
    const xs = axisLabels.map((el) => Number(el.getAttribute('x'))).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(slotWidth - 1);
    }
  });

  it('never uses "earned" or "cumulative" wording', () => {
    const { container } = render(<PointsChart entries={entries} />);
    expect(container.textContent).not.toMatch(/earned|cumulative/i);
  });
});
