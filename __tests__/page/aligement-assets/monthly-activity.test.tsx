import { fireEvent, render, screen, within } from '@testing-library/react';
import TrustHoldings from '@/components/page/aligement-assets/trust-holdings/trust-holdings';
import MonthlyActivity, {
  formatBalance,
  formatSigned,
} from '@/components/page/aligement-assets/trust-holdings/monthly-activity';
import {
  reconcileMonth,
  StatementMovement,
  TrustStatement,
} from '@/components/page/aligement-assets/trust-holdings/reconciliation/reconciliation';
import { NavPoint, TrustHoldingsData } from '@/services/plaa/trust-holdings.service';

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));
jest.mock('@/hooks/useScrollDepthTracking', () => ({ useScrollDepthTracking: jest.fn() }));

// The default graph view mounts recharts' ResponsiveContainer, which needs this.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const movement = (
  category: StatementMovement['category'],
  amount: string,
  extra: Partial<StatementMovement> = {},
): StatementMovement => ({
  category,
  amount,
  holding: 'cash',
  source: `${category} ${amount}`,
  status: 'verified',
  ...extra,
});

const statementFor = (periodKey: string, movements: StatementMovement[]): TrustStatement => ({
  periodKey,
  file: 'statement.pdf',
  openingDate: 'Opening day',
  closingDate: 'Closing day',
  openingNav: '1,000.00',
  closingNav: '1,085.00',
  holdings: [
    { id: 'cash', name: 'Cash', assets: ['Cash'], opening: '1,000.00', closing: '1,085.00', basis: 'carrying' },
  ],
  movements,
});

const SEPTEMBER = statementFor('M9-2026', [
  movement('cashContribution', '100.00'),
  movement('interest', '15.00'),
  movement('admin', '-30.00'),
]);
const AUGUST = statementFor('M8-2026', [
  movement('cashContribution', '125.00'),
  movement('auctionProceeds', '-30.00'),
  movement('auctionProceeds', '-10.00'),
]);

const point = (date: string, nav: number): NavPoint => ({
  label: date,
  date,
  totalPlaa: 600_000,
  nav,
  navPerPlaa: 20,
  treasuries: 600_000,
  btc: 100_000,
  eth: 100_000,
  fil: 1_000_000,
  plvh: 10_000_000,
});

const data: TrustHoldingsData = {
  navPerPlaaHeadline: '$20.00',
  asOfDate: 'September 30th, 2026',
  trustTotalValue: '$3M',
  portfolioCompanies: 1,
  quarterly: [],
  monthly: [point("Jul '26", 1_111_111), point("Aug '26", 2_222_222), point("Sep '26", 3_333_333)],
  buybackMetrics: [],
  focusAreas: [],
  trustComposition: [],
  disclaimers: [],
  statements: [AUGUST, SEPTEMBER],
};

const openTable = (pageData: TrustHoldingsData = data) => {
  render(<TrustHoldings data={pageData} />);
  fireEvent.click(screen.getByRole('button', { name: 'Table View' }));
};

const monthToggle = (month: string) => screen.getByRole('button', { name: month });
const panelOf = (toggle: HTMLElement) => document.getElementById(toggle.getAttribute('aria-controls')!)!;
const rowText = (scope: HTMLElement, header: string) =>
  within(scope).getByRole('rowheader', { name: header }).closest('tr')!.textContent;

describe('formatting', () => {
  it('signs movements with two decimals', () => {
    expect(formatSigned(12_345_678)).toBe('+$123,456.78');
    expect(formatSigned(-167_500)).toBe('−$1,675.00');
    expect(formatSigned(null)).toBe('—');
    expect(formatBalance(1_234_567_891)).toBe('$12,345,678.91');
  });
});

describe('MonthlyActivity', () => {
  it('shows every bridge line and group with its signed amount, between opening and closing NAV', () => {
    const reconciliation = reconcileMonth(SEPTEMBER);
    render(<MonthlyActivity month="Sep '26" reconciliation={reconciliation} />);
    const [bridge] = screen.getAllByRole('table');

    expect(rowText(bridge, 'Opening NAV (Opening day)')).toContain(formatBalance(reconciliation.openingNav));
    expect(rowText(bridge, 'Closing NAV (Closing day)')).toContain(formatBalance(reconciliation.closingNav));
    [
      ...reconciliation.groups.map((g) => [g.label, g.subtotal] as const),
      ...reconciliation.lines.map((l) => [l.label, l.amount] as const),
    ].forEach(([label, amount]) => expect(rowText(bridge, label)).toContain(formatSigned(amount)));
  });

  it('shows the net of contributions, interest and expenses', () => {
    const reconciliation = reconcileMonth(SEPTEMBER);
    render(<MonthlyActivity month="Sep '26" reconciliation={reconciliation} />);
    const [, activity] = screen.getAllByRole('table');

    expect(within(activity).getByText(formatSigned(reconciliation.netActivity))).toBeTruthy();
    expect(reconciliation.netActivity).toBe(8_500);
  });

  it('shows the Class B interest next to the Class B adjustment', () => {
    const reconciliation = reconcileMonth({
      ...statementFor('M9-2026', [movement('spvContribution', '85.00')]),
      spvOwnership: { classBPercent: '90.00', priorClassBPercent: '80.00', source: 'schedule' },
    });
    render(<MonthlyActivity month="Sep '26" reconciliation={reconciliation} />);

    expect(screen.getByText(/90\.00%.*80\.00%/)).toBeTruthy();
  });

  it('shows no review flag when every movement is verified', () => {
    render(<MonthlyActivity month="Sep '26" reconciliation={reconcileMonth(SEPTEMBER)} />);
    expect(screen.queryByText(/inferred/)).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('flags a statement that does not add up, with the amount unaccounted for', () => {
    render(
      <MonthlyActivity month="Sep '26" reconciliation={reconcileMonth({ ...SEPTEMBER, closingNav: '1,185.00' })} />,
    );
    expect(screen.getByText(/Does not reconcile — \+\$100\.00 unaccounted for/)).toBeTruthy();
    expect(screen.getByText('Reconciliation Difference')).toBeTruthy();
  });

  it('flags an inferred movement and shows its note', () => {
    const [first, ...rest] = SEPTEMBER.movements;
    const reconciliation = reconcileMonth({
      ...SEPTEMBER,
      movements: [{ ...first, status: 'inferred', note: 'Confirm with the PLAA team.' }, ...rest],
    });
    render(<MonthlyActivity month="Sep '26" reconciliation={reconciliation} />);
    expect(screen.getByText(/Some movements are inferred/)).toBeTruthy();
    expect(within(screen.getByRole('list')).getByText('Confirm with the PLAA team.')).toBeTruthy();
  });

  it('says so when a month has no trust statement', () => {
    render(<MonthlyActivity month="Jul '26" />);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText(/No trust statement has been published for Jul '26/)).toBeTruthy();
  });
});

describe('NavTable month accordion', () => {
  it('starts collapsed and keeps the asset columns unchanged', () => {
    openTable();
    ["Jul '26", "Aug '26", "Sep '26"].forEach((month) =>
      expect(monthToggle(month).getAttribute('aria-expanded')).toBe('false'),
    );
    expect(screen.getByText('$3,333,333')).toBeTruthy();
  });

  it('expands a month on click and collapses it on a second click', () => {
    openTable();
    const toggle = monthToggle("Sep '26");
    const panel = panelOf(toggle);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('aria-hidden')).toBe('false');
    expect(within(panel).getByText(formatSigned(reconcileMonth(SEPTEMBER).netActivity))).toBeTruthy();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });

  it('toggles from anywhere on the row, not just the date', () => {
    openTable();
    fireEvent.click(screen.getByText('$3,333,333'));
    expect(monthToggle("Sep '26").getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps only one month open at a time', () => {
    openTable();
    fireEvent.click(monthToggle("Aug '26"));
    fireEvent.click(monthToggle("Sep '26"));
    expect(monthToggle("Aug '26").getAttribute('aria-expanded')).toBe('false');
    expect(monthToggle("Sep '26").getAttribute('aria-expanded')).toBe('true');
  });

  it('reports a month of auction payouts once, as one amount in the bridge', () => {
    openTable();
    const toggle = monthToggle("Aug '26");
    fireEvent.click(toggle);
    const rows = within(panelOf(toggle))
      .getAllByRole('rowheader', { name: 'Auction Proceeds Paid' })
      .map((header) => header.closest('tr')!.textContent);
    expect(rows).toEqual([`Auction Proceeds Paid${formatSigned(-4_000)}`]);
  });

  it('reads each month from the statements the API sends', () => {
    openTable({ ...data, statements: [AUGUST] });
    const toggle = monthToggle("Sep '26");
    fireEvent.click(toggle);
    expect(within(panelOf(toggle)).getByText(/No trust statement has been published for Sep '26/)).toBeTruthy();
  });

  it('shows no statement for any month when the API sends none (an older plaa-service)', () => {
    const { statements, ...olderApi } = data;
    openTable(olderApi);
    const toggle = monthToggle("Aug '26");
    fireEvent.click(toggle);
    expect(within(panelOf(toggle)).getByText(/No trust statement has been published for Aug '26/)).toBeTruthy();
  });
});
