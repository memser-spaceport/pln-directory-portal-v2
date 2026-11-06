import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import ContributionProfileTab from '@/components/page/aligement-assets/profile/contribution-profile-tab';
import type { ContributionHistoryEntry } from '@/services/plaa/hooks/useProfileData';

const entries: ContributionHistoryEntry[] = [
  { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: 0, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 35 },
  { period: 'Jun 2026', points: 220, plaa: 22, infra: 30, redeemed: 0, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 87 },
  { period: 'Jul 2026', points: 450, plaa: 45, infra: 30, redeemed: 50, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 112 },
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

    expect(screen.getByRole('heading', { name: 'PLAA balance' })).toBeInTheDocument();
    // The points chart lives on the Snapshot history tab, not here.
    expect(screen.queryByText('Points collected per snapshot')).not.toBeInTheDocument();
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
    expect(within(totalRow).getByText('1,020 points')).toBeInTheDocument();
    expect(within(totalRow).getByText('+102')).toBeInTheDocument();
    expect(within(totalRow).getByText('+60')).toBeInTheDocument();
    expect(within(totalRow).getByText('\u2212\u0035\u0030')).toBeInTheDocument();
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
    expect(within(totalRow).getByText('\u2212\u0032\u0033\u0031')).toBeInTheDocument();
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

  describe('the monthly flow chart', () => {
    /** Bars in draw order: one group per snapshot, oldest first. */
    function barGroups(container: HTMLElement): SVGRectElement[][] {
      return Array.from(container.querySelectorAll('svg g')).
        map((g) => Array.from(g.querySelectorAll('rect')) as SVGRectElement[]).
        filter((rects) => rects.length > 0 && rects[0].getAttribute('fill') === '#1b4dff');
    }

    const yOf = (rect: SVGRectElement) => Number(rect.getAttribute('y'));
    const hOf = (rect: SVGRectElement) => Number(rect.getAttribute('height'));
    const zeroLineY = (container: HTMLElement) =>
      Number((container.querySelector('svg line[stroke="#cbd5e1"]') as SVGLineElement).getAttribute('y1'));

    it('stacks infra rewards on top of activities above the zero line', () => {
      const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);
      const groups = barGroups(container);
      expect(groups).toHaveLength(3);

      const zero = zeroLineY(container);
      const [activity, infra] = groups[2]; // Jul 2026: 45 activities + 30 infra
      expect(yOf(activity) + hOf(activity)).toBeCloseTo(zero, 5); // sits on the line
      expect(yOf(infra) + hOf(infra)).toBeCloseTo(yOf(activity), 5); // stacked directly on it
      // The two segments keep the 45:30 ratio of the figures they represent.
      expect(hOf(activity) / hOf(infra)).toBeCloseTo(45 / 30, 5);
    });

    it('hangs redemptions below the zero line, in the room kept under it', () => {
      const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);
      const zero = zeroLineY(container);

      // Only Jul 2026 redeemed, so exactly one bar hangs below the line.
      const below = Array.from(container.querySelectorAll('svg rect[fill="#f59e0b"]')) as SVGRectElement[];
      expect(below).toHaveLength(1);
      expect(yOf(below[0])).toBeCloseTo(zero, 5);
      expect(hOf(below[0])).toBeGreaterThan(0);
    });

    /** Additions keep 3\u20134x the room redemptions get, whatever the figures are. */
    function redeemedShareOfPlot(container: HTMLElement): number {
      const plotHeight = 240 - 16;
      return (240 - zeroLineY(container)) / plotHeight;
    }

    it('keeps additions 3\u20134x the room redemptions get for a 20k-up / 10k-down month', () => {
      const whale: ContributionHistoryEntry[] = [
        { period: 'May 2026', points: 9000, plaa: 12000, infra: 8000, redeemed: 10000, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 10000 },
      ];
      const { container } = render(<ContributionProfileTab entries={whale} currentBalance={10000} totalRedeemed={10000} />);

      const share = redeemedShareOfPlot(container);
      // The band plus its 8px padding, against the whole plot.
      expect(share).toBeGreaterThanOrEqual(0.2);
      expect(share).toBeLessThanOrEqual(0.28);

      // Both bands are still fully used: the tallest bar reaches the top padding...
      const [, infra] = barGroups(container)[0];
      expect(yOf(infra)).toBeLessThan(30);
      // ...and the deepest redemption reaches the bottom of its band.
      const redeemed = container.querySelector('svg rect[fill="#f59e0b"]') as SVGRectElement;
      expect(yOf(redeemed) + hOf(redeemed)).toBeGreaterThan(230);
    });

    it('keeps a small redemption readable rather than squashing it to a sliver', () => {
      const lopsided: ContributionHistoryEntry[] = [
        { period: 'May 2026', points: 9000, plaa: 12000, infra: 8000, redeemed: 200, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 19800 },
      ];
      const { container } = render(<ContributionProfileTab entries={lopsided} currentBalance={19800} totalRedeemed={200} />);

      // Proportionally it would be ~2px; it gets its own band instead.
      expect(redeemedShareOfPlot(container)).toBeGreaterThanOrEqual(0.2);
    });

    it('gives no room below the line when nothing has ever been redeemed', () => {
      const noRedemptions = entries.map((e) => ({ ...e, redeemed: 0 }));
      const { container } = render(<ContributionProfileTab entries={noRedemptions} currentBalance={112} totalRedeemed={0} />);

      expect(container.querySelectorAll('svg rect[fill="#f59e0b"]')).toHaveLength(0);
      expect(zeroLineY(container)).toBe(240); // the plot floor
    });

    it('draws the balance as a line over the bars, with a dot per snapshot', () => {
      const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

      const line = container.querySelector('svg polyline[stroke="#7c3aed"]') as SVGPolylineElement;
      expect(line).toBeInTheDocument();
      const ys = (line.getAttribute('points') ?? '').split(' ').map((p) => Number(p.split(',')[1]));
      expect(ys).toHaveLength(3);
      // The balance rises across these three snapshots, so the line climbs.
      expect(ys[0]).toBeGreaterThan(ys[1]);
      expect(ys[1]).toBeGreaterThan(ys[2]);
      // It never strays below zero into the redemptions.
      expect(Math.max(...ys)).toBeLessThanOrEqual(zeroLineY(container));

      expect(container.querySelectorAll('svg circle[stroke="#7c3aed"]')).toHaveLength(3);
    });

    it('charts no points: those belong to the Snapshot history tab', () => {
      const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

      expect(container.querySelectorAll('svg text[font-weight="600"]')).toHaveLength(0);
    });
  });

  describe('the hover card accounts for the whole snapshot', () => {
    /** The rows of the hover card, in the order they are drawn. */
    function tooltipRows(container: HTMLElement): string[] {
      return Array.from(container.querySelectorAll('svg text[fill="#dbeafe"]')).map((n) => n.textContent ?? '');
    }

    it('lists the month\'s movements, signed as the table signs them', () => {
      const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);
      const hoverZones = Array.from(container.querySelectorAll('rect[fill="transparent"]'));
      expect(hoverZones).toHaveLength(3);
      expect(screen.queryByText(/Activities:/)).not.toBeInTheDocument();

      const tooltipTitle = () => container.querySelector('svg text[font-weight="700"][fill="#ffffff"]');

      // Jul 2026: 45 from activities, 30 infra, 50 redeemed, 450 points.
      fireEvent.mouseEnter(hoverZones[2]);
      expect(tooltipTitle()?.textContent).toBe('Jul 2026');
      expect(tooltipRows(container)).toEqual([
        'PLAA balance: 112',
        'Activities: +45',
        'Infra rewards: +30',
        'Redeemed: \u2212\u0035\u0030',
        'Points collected: 450',
      ]);

      fireEvent.mouseLeave(hoverZones[2]);
      expect(screen.queryByText(/Activities:/)).not.toBeInTheDocument();
    });

    it('shows a month with no infra or redemption as 0 rather than omitting the rows', () => {
      const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

      fireEvent.mouseEnter(container.querySelectorAll('rect[fill="transparent"]')[0]);
      expect(tooltipRows(container)).toEqual([
        'PLAA balance: 35',
        'Activities: +35',
        'Infra rewards: 0',
        'Redeemed: 0',
        'Points collected: 350',
      ]);
    });

    it('reads Pending for an open snapshot, whose PLAA is not final', () => {
      const pending: ContributionHistoryEntry[] = [
        ...entries,
        { period: 'Aug 2026', points: 120, plaa: 12, infra: 8, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: true, cum: 112 },
      ];
      const { container } = render(<ContributionProfileTab entries={pending} currentBalance={112} totalRedeemed={50} />);

      fireEvent.mouseEnter(container.querySelectorAll('rect[fill="transparent"]')[3]);
      expect(tooltipRows(container)).toEqual([
        'PLAA balance: Pending',
        'Activities: Pending',
        'Infra rewards: Pending',
        'Redeemed: —',
        'Points collected: 120',
      ]);
    });

    it('drops only the points row when the member has no points data', () => {
      const noPoints: ContributionHistoryEntry[] = [
        { period: 'May 2026', points: null, plaa: 100, infra: 900, redeemed: 200, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 800 },
      ];
      const { container } = render(<ContributionProfileTab entries={noPoints} currentBalance={800} totalRedeemed={200} />);

      fireEvent.mouseEnter(container.querySelectorAll('rect[fill="transparent"]')[0]);
      expect(tooltipRows(container)).toEqual([
        'PLAA balance: 800',
        'Activities: +100',
        'Infra rewards: +900',
        'Redeemed: \u2212\u0032\u0030\u0030',
      ]);
    });
  });

  describe('a period with no points data (still loading or settled empty)', () => {
    const realEntries: ContributionHistoryEntry[] = [
      { period: 'May 2026', points: null, plaa: 100, infra: 900, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 1000 },
      { period: 'Jun 2026', points: null, plaa: 0, infra: 0, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 1000 },
      { period: 'Jul 2026', points: null, plaa: 50, infra: 0, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 1050 },
    ];

    it('keeps the PLAA bars, their axis, and the balance line, which do not depend on points', () => {
      const { container } = render(<ContributionProfileTab entries={realEntries} currentBalance={1050} totalRedeemed={null} />);

      expect(screen.queryByText('Points collected')).not.toBeInTheDocument();
      expect(screen.queryByText('Points per snapshot')).not.toBeInTheDocument();
      expect(container.querySelectorAll('svg polyline[stroke="#7c3aed"]')).toHaveLength(1);

      const svgTexts = Array.from(container.querySelectorAll('svg text'));
      const rightAxisTexts = svgTexts.filter((el) => el.getAttribute('fill') === '#156ff7' && el.getAttribute('text-anchor') === 'start');
      expect(rightAxisTexts.length).toBeGreaterThan(0);
    });

    it('omits the points line entirely, keeping real values for Activities/Infra/Balance', () => {
      render(<ContributionProfileTab entries={realEntries} currentBalance={1050} totalRedeemed={null} />);

      expect(screen.queryByText(/points/)).not.toBeInTheDocument();

      const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
      expect(within(totalRow).getByText('+150')).toBeInTheDocument(); // plaa total: 100+0+50
      expect(within(totalRow).getByText('+900')).toBeInTheDocument(); // infra total
      expect(within(totalRow).getByText('1,050')).toBeInTheDocument(); // real currentBalance
    });

    it('omits Points collected from the hover tooltip when no period has real points data', () => {
      const { container } = render(<ContributionProfileTab entries={realEntries} currentBalance={1050} totalRedeemed={null} />);

      const hoverZones = Array.from(container.querySelectorAll('rect[fill="transparent"]'));
      fireEvent.mouseEnter(hoverZones[0]);

      expect(screen.queryByText(/Points collected:/)).not.toBeInTheDocument();
      expect(screen.getByText('Activities: +100')).toBeInTheDocument();
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
      redeemedUsd: null,
      redeemedPrice: null,
      redeemedPriceIsAverage: false,
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

  it('never uses "earned" or "cumulative" wording anywhere in the tab, including the tooltip', () => {
    const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

    for (const zone of Array.from(container.querySelectorAll('rect[fill="transparent"]'))) {
      fireEvent.mouseEnter(zone);
      expect(container.textContent).not.toMatch(/earned|cumulative/i);
      fireEvent.mouseLeave(zone);
    }
  });

  describe('an open snapshot (not yet closed)', () => {
    // cum on the open row carries the confirmed balance forward; its own PLAA is not in it yet.
    const withPending: ContributionHistoryEntry[] = [
      { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 35 },
      { period: 'Jun 2026', points: 220, plaa: 22, infra: 30, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: true, cum: 35 },
    ];

    const pendingRow = () => screen.getAllByText('Jun 2026')[1].closest('[class*="dataRow"]') as HTMLElement;

    it('shows Pending for the snapshot\'s own PLAA figures and balance', () => {
      render(<ContributionProfileTab entries={withPending} currentBalance={35} totalRedeemed={null} />);

      expect(within(pendingRow()).getAllByText('Pending')).toHaveLength(3);
      expect(within(pendingRow()).queryByText('22')).not.toBeInTheDocument();
      expect(within(pendingRow()).queryByText('30')).not.toBeInTheDocument();
      expect(within(pendingRow()).queryByText('35')).not.toBeInTheDocument();
    });

    it('still shows the open snapshot\'s points as they come in, marked as not final', () => {
      render(<ContributionProfileTab entries={withPending} currentBalance={35} totalRedeemed={null} />);

      expect(within(pendingRow()).getByText('220 points so far')).toBeInTheDocument();
    });

    it('shows Pending for the open snapshot\'s own PLAA in its tooltip', () => {
      const { container } = render(<ContributionProfileTab entries={withPending} currentBalance={35} totalRedeemed={null} />);

      fireEvent.mouseEnter(container.querySelectorAll('rect[fill="transparent"]')[1]);
      expect(screen.getByText('Activities: Pending')).toBeInTheDocument();
      expect(screen.getByText('Points collected: 220')).toBeInTheDocument();
    });

    it('leaves a closed snapshot\'s own figures untouched', () => {
      render(<ContributionProfileTab entries={withPending} currentBalance={35} totalRedeemed={null} />);

      const closedRow = screen.getAllByText('May 2026')[1].closest('[class*="dataRow"]') as HTMLElement;
      expect(within(closedRow).queryByText('Pending')).not.toBeInTheDocument();
      expect(within(closedRow).getByText('350 points')).toBeInTheDocument();
      expect(within(closedRow).queryByText(/so far/)).not.toBeInTheDocument();
    });

    it('keeps the open snapshot\'s PLAA out of the footer totals, but counts its points', () => {
      render(<ContributionProfileTab entries={withPending} currentBalance={35} totalRedeemed={null} />);

      const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
      expect(within(totalRow).queryByText('Pending')).not.toBeInTheDocument();
      expect(within(totalRow).getByText('570 points')).toBeInTheDocument(); // points 350 + 220
      expect(within(totalRow).getByText('+35')).toBeInTheDocument(); // activity PLAA, May only
      expect(within(totalRow).getByText('35')).toBeInTheDocument(); // balance
      expect(within(totalRow).getByText('0')).toBeInTheDocument(); // infra, May only \u2014 zero carries no sign
    });
  });

  it('renders a per-period redeemed figure when one is attributed to that month', () => {
    const redeemed: ContributionHistoryEntry[] = [
      { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 35 },
      { period: 'Jun 2026', points: 220, plaa: 22, infra: 30, redeemed: 640, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 87 },
    ];
    render(<ContributionProfileTab entries={redeemed} currentBalance={35} totalRedeemed={640} />);

    const row = (screen.getAllByText('Jun 2026')[1].closest('[class*="dataRow"]')) as HTMLElement;
    expect(within(row).getByText('\u2212\u0036\u0034\u0030')).toBeInTheDocument();
  });

  it('renders an empty state without crashing when there are no entries', () => {
    render(<ContributionProfileTab entries={[]} currentBalance={null} totalRedeemed={null} />);

    expect(screen.getByText('No snapshot history yet.')).toBeInTheDocument();
  });

  it('totals the points it has, rather than blanking the whole total when one month has none', () => {
    const someMissing: ContributionHistoryEntry[] = [
      { period: 'May 2026', points: 350, plaa: 35, infra: 0, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 35 },
      { period: 'Jun 2026', points: null, plaa: 22, infra: 30, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 87 },
      { period: 'Jul 2026', points: 450, plaa: 45, infra: 30, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: false, cum: 112 },
    ];
    render(<ContributionProfileTab entries={someMissing} currentBalance={112} totalRedeemed={null} />);

    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
    expect(within(totalRow).getByText('800 points')).toBeInTheDocument();
  });

  it('drops the points line from the total only when no month has any points', () => {
    const noneAtAll: ContributionHistoryEntry[] = entries.map((e) => ({ ...e, points: null }));
    render(<ContributionProfileTab entries={noneAtAll} currentBalance={112} totalRedeemed={null} />);

    const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
    expect(within(totalRow).queryByText(/points/)).not.toBeInTheDocument();
  });

  describe('what a redemption fetched', () => {
    const priced: ContributionHistoryEntry[] = [
      {
        period: 'May 2026',
        points: 350,
        plaa: 35,
        infra: 0,
        redeemed: 180,
        redeemedUsd: 256,
        redeemedPrice: 1.42,
        redeemedPriceIsAverage: false,
        isPending: false,
        cum: 35,
      },
      {
        period: 'Jul 2026',
        points: 450,
        plaa: 45,
        infra: 30,
        redeemed: 400,
        redeemedUsd: 592,
        redeemedPrice: 1.48,
        redeemedPriceIsAverage: false,
        isPending: false,
        cum: 112,
      },
    ];

    function rowFor(period: string): HTMLElement {
      return screen.getAllByText(period)[1].closest('[class*="dataRow"]') as HTMLElement;
    }

    it('shows the dollar value and the price it cleared at, under the PLAA', () => {
      render(<ContributionProfileTab entries={priced} currentBalance={112} totalRedeemed={580} />);

      const redeemedCell = rowFor('Jul 2026').children[3];
      expect(redeemedCell.children[0].textContent).toBe('\u2212\u0034\u0030\u0030');
      expect(redeemedCell.children[1].textContent).toBe('$592 at $1.48');
    });

    it('marks a blended rate as an average, so it is not read as a price anyone got', () => {
      const blended = [{ ...priced[1], redeemedPrice: 1.468, redeemedPriceIsAverage: true }];
      render(<ContributionProfileTab entries={blended} currentBalance={112} totalRedeemed={400} />);

      expect(screen.getByText('$592 at avg $1.47')).toBeInTheDocument();
    });

    it('shows the PLAA alone when the month has no price, rather than a fabricated figure', () => {
      const unpriced = [{ ...priced[1], redeemedUsd: null, redeemedPrice: null }];
      render(<ContributionProfileTab entries={unpriced} currentBalance={112} totalRedeemed={400} />);

      const redeemedCell = rowFor('Jul 2026').children[3];
      expect(redeemedCell.textContent).toBe('\u2212\u0034\u0030\u0030');
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it('totals the dollars across months and shows the lifetime average rate', () => {
      render(<ContributionProfileTab entries={priced} currentBalance={112} totalRedeemed={580} />);

      const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
      expect(within(totalRow).getByText('\u2212\u0035\u0038\u0030')).toBeInTheDocument();
      // 848 over 580 PLAA = 1.462...
      expect(within(totalRow).getByText('$848 \u00b7 avg $1.46')).toBeInTheDocument();
    });

    it('leaves the dollar total off when no month could be priced', () => {
      const unpriced = priced.map((e) => ({ ...e, redeemedUsd: null, redeemedPrice: null }));
      render(<ContributionProfileTab entries={unpriced} currentBalance={112} totalRedeemed={580} />);

      const totalRow = screen.getByText('Total to date').closest('div') as HTMLElement;
      expect(within(totalRow).getByText('\u2212\u0035\u0038\u0030')).toBeInTheDocument();
      expect(within(totalRow).queryByText(/\$/)).not.toBeInTheDocument();
    });

    it('rounds dollars to whole units but keeps cents on the price', () => {
      const awkward = [{ ...priced[1], redeemedUsd: 591.62, redeemedPrice: 1.4795 }];
      render(<ContributionProfileTab entries={awkward} currentBalance={112} totalRedeemed={400} />);

      expect(screen.getByText('$592 at $1.48')).toBeInTheDocument();
    });
  });

  describe('row order', () => {
    function tablePeriods(): string[] {
      return Array.from(document.querySelectorAll('[class*="dataRow"]')).map((r) => r.children[0].textContent ?? '');
    }

    it('leads with the newest period, the one a member came to look at', () => {
      render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);
      expect(tablePeriods()).toEqual(['Jul 2026', 'Jun 2026', 'May 2026']);
    });

    it('keeps each row\'s own figures with it when the order flips', () => {
      render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

      const top = document.querySelectorAll('[class*="dataRow"]')[0];
      expect(Array.from(top.children).map((c) => c.textContent)).toEqual([
        'Jul 2026',
        '+45450 points', // 45 PLAA on one line, 450 points on the next
        '+30',
        '\u2212\u0035\u0030',
        '112',
      ]);
    });

    it('still draws the chart oldest-first, so the balance line reads left to right', () => {
      const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

      const axisLabels = Array.from(container.querySelectorAll('svg text[fill="#94a3b8"]')).map((n) => n.textContent);
      expect(axisLabels).toEqual(['May 2026', 'Jun 2026', 'Jul 2026']);
    });

    it('puts an open snapshot at the top, above the closed periods', () => {
      const withPending: ContributionHistoryEntry[] = [
        ...entries,
        { period: 'Aug 2026', points: 120, plaa: 12, infra: 8, redeemed: null, redeemedUsd: null, redeemedPrice: null, redeemedPriceIsAverage: false, isPending: true, cum: 112 },
      ];
      render(<ContributionProfileTab entries={withPending} currentBalance={112} totalRedeemed={50} />);

      expect(tablePeriods()[0]).toBe('Aug 2026');
    });
  });

  describe('points sit under the PLAA they produced, not in a column of their own', () => {
    function headers(): string[] {
      return Array.from(document.querySelectorAll('[class*="headerRow"] span')).map((n) => n.textContent ?? '');
    }

    it('has no Points column', () => {
      render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);
      expect(headers()).toEqual(['Snapshot', 'Activities', 'Infra rewards', 'Redeemed', 'Balance']);
    });

    it('puts the count on a second line inside the Activities cell', () => {
      render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

      const row = screen.getAllByText('Jul 2026')[1].closest('[class*="dataRow"]') as HTMLElement;
      const activities = row.children[1];
      expect(activities.children[0].textContent).toBe('+45'); // the PLAA
      expect(activities.children[1].textContent).toBe('450 points'); // what produced it, underneath

      // One cell per column on every row, so the grid stays aligned.
      expect(row.children).toHaveLength(5);
    });
  });

  it('describes the balance as after redemptions, with no before-redemptions disclaimer', () => {
    const { container } = render(<ContributionProfileTab entries={entries} currentBalance={112} totalRedeemed={50} />);

    expect(container.textContent).not.toMatch(/before redemptions/i);
  });
});
