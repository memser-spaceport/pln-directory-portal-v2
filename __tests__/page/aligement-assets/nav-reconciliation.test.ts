import {
  MonthReconciliation,
  reconcileMonth,
  toCents,
  TrustStatement,
} from '@/components/page/aligement-assets/trust-holdings/reconciliation/reconciliation';
import { TRUST_STATEMENTS } from '@/components/page/aligement-assets/trust-holdings/reconciliation/trust-statements.data';
import { MONTHLY_RECONCILIATION } from '@/components/page/aligement-assets/trust-holdings/reconciliation/monthly-reconciliation';

const amountOf = (periodKey: string, label: string) =>
  MONTHLY_RECONCILIATION[periodKey].lines.find((line) => line.label === label)?.amount;

const subtotals = (month: MonthReconciliation) =>
  Object.fromEntries(month.groups.map((group) => [group.label, group.subtotal]));

describe('toCents', () => {
  it('parses statement amounts exactly', () => {
    expect(toCents('11,465,145.94')).toBe(1_146_514_594);
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

describe('every transcribed statement', () => {
  it.each(TRUST_STATEMENTS.map((s) => [s.periodKey, s] as const))(
    '%s balances and passes every check',
    (_, statement) => {
      const result = reconcileMonth(statement);
      expect(result.difference).toBe(0);
      expect(result.balanced).toBe(true);
      expect(result.checks.filter((check) => !check.passed)).toEqual([]);
    },
  );

  it('never carries participant names into the data', () => {
    const text = JSON.stringify(TRUST_STATEMENTS);
    ['KLOTH', 'STERN', 'PANDEY', 'PAYABLE TO'].forEach((name) => expect(text).not.toContain(name));
  });
});

describe('September 2026', () => {
  const sep = MONTHLY_RECONCILIATION['M9-2026'];

  it('bridges Aug 31 to Sep 30 to the cent', () => {
    expect(sep.openingNav).toBe(toCents('11,465,145.94'));
    expect(sep.closingNav).toBe(toCents('13,472,330.42'));
    expect(sep.totalChange).toBe(toCents('2,007,184.48'));
    expect(sep.difference).toBe(0);
  });

  it('groups the bridge into contributions & distributions, income & expenses and asset value changes', () => {
    expect(subtotals(sep)).toEqual({
      'Contributions & Distributions': toCents('1,485,743.77'),
      'Income & Expenses': toCents('-14,716.94'),
      'Asset Value Changes': toCents('536,157.65'),
    });
  });

  it('classifies each movement as expected', () => {
    expect(amountOf('M9-2026', 'Cash Contributions')).toBe(toCents('110,000.00'));
    expect(amountOf('M9-2026', 'FIL Contributions')).toBe(toCents('193,361.77'));
    expect(amountOf('M9-2026', 'Auction Proceeds Paid')).toBeNull();
    expect(amountOf('M9-2026', 'Interest Income')).toBe(toCents('1,541.39'));
    expect(amountOf('M9-2026', 'Legal Expenses')).toBe(toCents('-1,675.00'));
    expect(amountOf('M9-2026', 'Trust Administrative Expenses')).toBe(toCents('-14,583.33'));
    expect(amountOf('M9-2026', 'PLVH SPV Class B Interest Adjustment')).toBe(toCents('1,182,382.00'));
    expect(amountOf('M9-2026', 'PLVH SPV')).toBe(toCents('-4,849.00'));
    expect(amountOf('M9-2026', 'BTC & ETH')).toBe(toCents('20,314.00'));
    expect(amountOf('M9-2026', 'FIL')).toBe(toCents('520,692.65'));
    expect(sep.lines.some((line) => line.category === 'unclassified')).toBe(false);
  });

  it('nets contributions & expenses, Class B interest included and auction payouts left in the bridge', () => {
    expect(sep.activity).toEqual({
      contributions: toCents('1,485,743.77'),
      interest: toCents('1,541.39'),
      legal: toCents('-1,675.00'),
      admin: toCents('-14,583.33'),
    });
    expect(sep.netActivity).toBe(toCents('1,471,026.83'));
  });

  it('verifies every movement, valuation included via reported unrealized gain/loss', () => {
    expect(sep.lines.filter((line) => line.status !== 'verified')).toEqual([]);
    expect(sep.needsReview).toBe(false);
  });

  it('carries Class B ownership as context, separate from any amount', () => {
    expect(sep.spvOwnership).toMatchObject({ classBPercent: '93.78', priorClassBPercent: '83.25' });
  });
});

describe('August 2026', () => {
  const aug = MONTHLY_RECONCILIATION['M8-2026'];

  it('bridges Jul 31 to Aug 31 with the Class B interest as a contribution and BTC/ETH and FIL value changes', () => {
    expect(aug.totalChange).toBe(toCents('3,073,115.04'));
    expect(subtotals(aug)).toEqual({
      'Contributions & Distributions': toCents('3,073,635.17'),
      'Income & Expenses': toCents('-13,250.60'),
      'Asset Value Changes': toCents('12,730.47'),
    });
    expect(amountOf('M8-2026', 'PLVH SPV')).toBeNull();
    expect(amountOf('M8-2026', 'BTC & ETH')).toBe(toCents('60,295.67'));
    expect(amountOf('M8-2026', 'FIL')).toBe(toCents('-47,565.20'));
    const valuations = aug.lines.filter((line) => line.category === 'valuation');
    expect(valuations.map((line) => line.status)).toEqual(['verified', 'verified']);
    expect(valuations.flatMap((line) => line.sources).join(' ')).toContain('Jul 31 per Trust Holdings, Airtable');
    expect(aug.netActivity).toBe(toCents('3,080,071.12'));
    expect(aug.needsReview).toBe(false);
  });
});

describe('reconcileMonth safeguards', () => {
  const base: TrustStatement = {
    periodKey: 'M1-2030',
    file: 'test.pdf',
    account: 'x',
    openingDate: 'Dec 31',
    closingDate: 'Jan 31',
    openingNav: '1,000.00',
    closingNav: '1,150.00',
    holdings: [
      { id: 'cash', name: 'Cash', assets: ['Cash'], opening: '1,000.00', closing: '1,150.00', basis: 'carrying' },
    ],
    movements: [
      { category: 'cashContribution', amount: '100.00', holding: 'cash', source: 'ADDITION', status: 'verified' },
    ],
  };

  it('surfaces an unexplained carrying-value change as unresolved, never as a gain', () => {
    const result = reconcileMonth(base);
    const line = result.lines.find((l) => l.category === 'unclassified')!;
    expect(line.amount).toBe(5_000);
    expect(line.status).toBe('unresolved');
    expect(result.lines.some((l) => l.category === 'valuation')).toBe(false);
    expect(result.balanced).toBe(true);
    expect(result.needsReview).toBe(true);
  });

  it('flags a transcription that does not add up instead of forcing it to balance', () => {
    const result = reconcileMonth({ ...base, closingNav: '1,200.00' });
    expect(result.difference).toBe(5_000);
    expect(result.balanced).toBe(false);
    expect(result.checks.find((c) => c.label.startsWith('Closing holdings'))?.passed).toBe(false);
  });
});
