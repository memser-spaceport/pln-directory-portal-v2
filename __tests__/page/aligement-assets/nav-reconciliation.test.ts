import {
  MonthReconciliation,
  reconcileMonth,
  StatementHolding,
  StatementMovement,
  toCents,
  TrustStatement,
} from '@/components/page/aligement-assets/trust-holdings/reconciliation/reconciliation';
import { reconcileStatements } from '@/components/page/aligement-assets/trust-holdings/reconciliation/monthly-reconciliation';

const holding = (
  id: string,
  opening: string,
  closing: string,
  extra: Partial<StatementHolding> = {},
): StatementHolding => ({
  id,
  name: id.toUpperCase(),
  assets: [id.toUpperCase()],
  opening,
  closing,
  basis: 'market',
  ...extra,
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

const statement = (holdings: StatementHolding[], movements: StatementMovement[] = []): TrustStatement => {
  const total = (pick: (h: StatementHolding) => string) =>
    (holdings.reduce((cents, h) => cents + toCents(pick(h)), 0) / 100).toFixed(2);
  return {
    periodKey: 'M1-2030',
    file: 'statement.pdf',
    openingDate: 'Dec 31',
    closingDate: 'Jan 31',
    openingNav: total((h) => h.opening),
    closingNav: total((h) => h.closing),
    holdings,
    movements,
  };
};

const lineOf = (month: MonthReconciliation, category: string) => month.lines.find((line) => line.category === category);
const subtotalOf = (month: MonthReconciliation, key: string) =>
  month.groups.find((group) => group.key === key)?.subtotal;

describe('toCents', () => {
  it('parses statement amounts exactly', () => {
    expect(toCents('12,345,678.91')).toBe(1_234_567_891);
    expect(toCents('-14,583.33')).toBe(-1_458_333);
    expect(toCents('−$4,849')).toBe(-484_900);
    expect(toCents('.5')).toBe(50);
  });

  it('rejects anything that is not an amount', () => {
    expect(() => toCents('')).toThrow();
    expect(() => toCents('1.234')).toThrow();
    expect(() => toCents('n/a')).toThrow();
  });
});

describe('reconcileMonth', () => {
  it('bridges opening to closing NAV when the holdings add up', () => {
    const month = reconcileMonth(
      statement(
        [holding('cash', '1,000.00', '1,090.00', { basis: 'carrying' }), holding('fil', '500.00', '560.00')],
        [movement('cashContribution', '100.00'), movement('admin', '-10.00')],
      ),
    );

    expect(month.totalChange).toBe(15_000);
    expect(month.difference).toBe(0);
    expect(month.balanced).toBe(true);
    expect(month.checks.every((check) => check.passed)).toBe(true);
  });

  it('merges movements with the same label into one line', () => {
    const month = reconcileMonth(
      statement(
        [holding('cash', '1,000.00', '970.00', { basis: 'carrying' })],
        [movement('admin', '-20.00'), movement('admin', '-10.00')],
      ),
    );

    const admin = month.lines.filter((line) => line.category === 'admin');
    expect(admin).toHaveLength(1);
    expect(admin[0].amount).toBe(-3_000);
    expect(admin[0].sources).toHaveLength(2);
  });

  it('puts each category in its bridge group', () => {
    const month = reconcileMonth(
      statement(
        [
          holding('cash', '1,000.00', '1,085.00', { basis: 'carrying' }),
          holding('spv', '500.00', '540.00', { basis: 'carrying' }),
        ],
        [
          movement('cashContribution', '100.00'),
          movement('auctionProceeds', '-20.00'),
          movement('interest', '15.00'),
          movement('admin', '-10.00'),
          movement('spvContribution', '50.00', { holding: 'spv' }),
          movement('spvValuation', '-10.00', { holding: 'spv' }),
        ],
      ),
    );

    expect(subtotalOf(month, 'contributionsDistributions')).toBe(13_000);
    expect(subtotalOf(month, 'incomeExpenses')).toBe(500);
    expect(subtotalOf(month, 'valuation')).toBe(-1_000);
  });

  it('shows the always-shown categories with no amount when a month has none of them', () => {
    const month = reconcileMonth(statement([holding('cash', '1,000.00', '1,000.00', { basis: 'carrying' })]));

    expect(lineOf(month, 'cashContribution')?.amount).toBeNull();
    expect(lineOf(month, 'admin')?.amount).toBeNull();
    expect(lineOf(month, 'assetContribution')).toBeUndefined();
  });

  it('counts the unexplained change of a market holding as a valuation change', () => {
    const month = reconcileMonth(
      statement([holding('fil', '500.00', '650.00')], [movement('assetContribution', '100.00', { holding: 'fil' })]),
    );

    expect(lineOf(month, 'valuation')?.amount).toBe(5_000);
    expect(lineOf(month, 'unclassified')).toBeUndefined();
  });

  it('verifies a valuation change when the reported unrealized gain moved by the same amount', () => {
    const fil = holding('fil', '500.00', '550.00', { openingUnrealized: '10.00', closingUnrealized: '60.00' });
    const month = reconcileMonth(statement([fil]));

    expect(lineOf(month, 'valuation')?.status).toBe('verified');
    expect(month.needsReview).toBe(false);
  });

  it('marks a valuation change unresolved when the reported unrealized gain disagrees', () => {
    const fil = holding('fil', '500.00', '550.00', { openingUnrealized: '10.00', closingUnrealized: '20.00' });
    const month = reconcileMonth(statement([fil]));

    expect(lineOf(month, 'valuation')?.status).toBe('unresolved');
    expect(month.needsReview).toBe(true);
  });

  it('marks a valuation change inferred with nothing to check it against, unless the opening value has a source', () => {
    expect(lineOf(reconcileMonth(statement([holding('fil', '500.00', '550.00')])), 'valuation')?.status).toBe(
      'inferred',
    );
    const sourced = holding('fil', '500.00', '550.00', { openingSource: 'holdings table' });
    expect(lineOf(reconcileMonth(statement([sourced])), 'valuation')?.status).toBe('verified');
  });

  it('surfaces an unexplained carrying-value change as unresolved, never as a gain', () => {
    const month = reconcileMonth(
      statement(
        [holding('cash', '1,000.00', '1,150.00', { basis: 'carrying' })],
        [movement('cashContribution', '100.00')],
      ),
    );

    expect(lineOf(month, 'unclassified')?.amount).toBe(5_000);
    expect(lineOf(month, 'unclassified')?.status).toBe('unresolved');
    expect(lineOf(month, 'valuation')).toBeUndefined();
    expect(month.balanced).toBe(true);
    expect(month.needsReview).toBe(true);
  });

  it('flags holdings that do not add up to the NAV instead of forcing a balance', () => {
    const month = reconcileMonth({
      ...statement(
        [holding('cash', '1,000.00', '1,100.00', { basis: 'carrying' })],
        [movement('cashContribution', '100.00')],
      ),
      closingNav: '1,150.00',
    });

    expect(month.difference).toBe(5_000);
    expect(month.balanced).toBe(false);
    expect(month.needsReview).toBe(true);
  });

  it('nets contributions, interest and expenses, and leaves auction payouts and value changes out', () => {
    const month = reconcileMonth(
      statement(
        [holding('cash', '1,000.00', '1,085.00', { basis: 'carrying' }), holding('fil', '500.00', '600.00')],
        [
          movement('cashContribution', '100.00'),
          movement('auctionProceeds', '-20.00'),
          movement('interest', '15.00'),
          movement('admin', '-10.00'),
        ],
      ),
    );

    expect(month.activity).toEqual({ contributions: 10_000, interest: 1_500, admin: -1_000 });
    expect(month.netActivity).toBe(10_500);
  });

  it('carries Class B ownership through without changing any amount', () => {
    const base = statement(
      [holding('spv', '500.00', '550.00', { basis: 'carrying' })],
      [movement('spvContribution', '50.00', { holding: 'spv' })],
    );
    const spvOwnership = { classBPercent: '90.00', priorClassBPercent: '80.00', source: 'schedule' };

    const withOwnership = reconcileMonth({ ...base, spvOwnership });

    expect(withOwnership.spvOwnership).toEqual(spvOwnership);
    expect(withOwnership.lines).toEqual(reconcileMonth(base).lines);
  });
});

describe('reconcileStatements', () => {
  const january = statement([holding('cash', '1,000.00', '1,000.00', { basis: 'carrying' })]);
  const february = { ...january, periodKey: 'M2-2030' };

  it('keys each month by its period key', () => {
    expect(Object.keys(reconcileStatements([january, february])).sort()).toEqual(['M1-2030', 'M2-2030']);
  });

  it('leaves out a statement that cannot be reconciled instead of throwing', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const broken = { ...february, openingNav: 'n/a' };
    expect(Object.keys(reconcileStatements([january, broken]))).toEqual(['M1-2030']);
    errorSpy.mockRestore();
  });

  it('returns nothing for no statements', () => {
    expect(reconcileStatements([])).toEqual({});
  });
});
