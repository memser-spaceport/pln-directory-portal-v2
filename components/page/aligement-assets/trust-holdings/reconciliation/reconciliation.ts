// Monthly NAV reconciliation built from Surus trust statement facts. Pure —
// no React, no fetching — so the same logic can move server-side once
// statements come from plaa-service instead of a checked-in file.
//
// All arithmetic is in integer cents. Statement amounts are kept as the
// strings printed on the statement and parsed here, so a figure can be
// checked against its PDF line by eye.

export type Cents = number;

// verified: the statement states it. inferred: derived or classified by us,
// pending confirmation. unresolved: we can't say what it is.
export type ClassificationStatus = 'verified' | 'inferred' | 'unresolved';

export type MovementCategory =
  | 'cashContribution'
  | 'assetContribution'
  | 'interest'
  | 'legal'
  | 'admin'
  | 'auctionProceeds'
  | 'spvContribution'
  | 'spvValuation'
  | 'valuation'
  | 'unclassified';

// A transaction transcribed from a statement's Activity Detail.
export interface StatementMovement {
  category: Exclude<MovementCategory, 'valuation' | 'unclassified'>;
  // Signed, as it moves NAV: inflows positive, outflows negative.
  amount: string;
  // The StatementHolding.id whose balance this lands in.
  holding: string;
  asset?: string;
  // Display label override, e.g. 'FIL Contributions'.
  label?: string;
  // Statement line(s), as printed. Never participant names.
  source: string;
  status: ClassificationStatus;
  note?: string;
}

// A line, or group of lines, from a statement's Portfolio Assets Detail.
export interface StatementHolding {
  id: string;
  name: string;
  assets: string[];
  opening: string;
  closing: string;
  // Reported unrealized gain/loss, when the statements give both ends —
  // corroborates the derived valuation movement.
  openingUnrealized?: string;
  closingUnrealized?: string;
  // market: any change not explained by a transaction is a valuation
  // movement. carrying: held at cost/carrying value, so an unexplained
  // change is unclassified, never a gain.
  basis: 'market' | 'carrying';
  valuationLabel?: string;
  valuationNote?: string;
}

export interface TrustStatement {
  periodKey: string; // 'M9-2026', the NAV table's period key
  file: string;
  account: string;
  openingDate: string;
  closingDate: string;
  openingNav: string; // TOTAL ACCOUNT at the prior month end
  closingNav: string; // TOTAL ACCOUNT at this month end
  holdings: StatementHolding[];
  movements: StatementMovement[];
  // The Trust's Class B interest in PL Venture Holdings, held through PLAA
  // SPV LLC — context for the SPV's carrying value. Not the SPV's share of
  // trust assets; the two are never derived from each other.
  spvOwnership?: SpvOwnership;
}

export interface SpvOwnership {
  classBPercent: string;
  priorClassBPercent?: string;
  source: string;
}

export interface ReconciliationLine {
  key: string;
  label: string;
  category: MovementCategory;
  // null: no activity in a category that's always shown — renders as an em dash.
  amount: Cents | null;
  status: ClassificationStatus;
  assets: string[];
  sources: string[];
  notes: string[];
}

export type BridgeGroupKey = 'contributionsDistributions' | 'incomeExpenses' | 'valuation' | 'unclassified';

export interface ReconciliationGroup {
  key: BridgeGroupKey;
  label: string;
  subtotal: Cents;
  lines: ReconciliationLine[];
}

export interface ReconciliationCheck {
  label: string;
  expected: Cents;
  actual: Cents;
  passed: boolean;
}

// Auction payouts are a distribution, so they stay in the bridge only.
export type ActivityCategory = 'contributions' | 'interest' | 'legal' | 'admin';

export const ACTIVITY_CATEGORIES: { key: ActivityCategory; label: string }[] = [
  { key: 'contributions', label: 'Trust Contributions' },
  { key: 'interest', label: 'Interest Income' },
  { key: 'legal', label: 'Legal Expenses' },
  { key: 'admin', label: 'Trust Administrative Expenses' },
];

export interface MonthReconciliation {
  periodKey: string;
  statement: string;
  openingDate: string;
  closingDate: string;
  openingNav: Cents;
  closingNav: Cents;
  totalChange: Cents;
  // The bridge, grouped. Every line appears in exactly one group.
  groups: ReconciliationGroup[];
  lines: ReconciliationLine[];
  spvOwnership?: SpvOwnership;
  // closing − opening − Σ lines, computed independently of the lines' own math.
  difference: Cents;
  balanced: boolean;
  checks: ReconciliationCheck[];
  // Unbalanced, a failed check, or any line short of verified.
  needsReview: boolean;
  // The simplified view: a regrouping of lines already in the bridge, not
  // additional amounts.
  activity: Record<ActivityCategory, Cents | null>;
  netActivity: Cents;
}

export const TOLERANCE_CENTS = 1;

export function toCents(amount: string): Cents {
  const text = amount.replace(/[$,\s]/g, '').replace(/−/g, '-');
  const match = text.match(/^(-?)(\d*)(?:\.(\d{1,2}))?$/);
  if (!match || (!match[2] && !match[3])) throw new Error(`Not a currency amount: "${amount}"`);
  const [, sign, whole, fraction = ''] = match;
  const cents = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
  return sign ? -cents : cents;
}

const sum = (values: Cents[]) => values.reduce((total, value) => total + value, 0);

const STATUS_RANK: Record<ClassificationStatus, number> = { verified: 0, inferred: 1, unresolved: 2 };
const worst = (statuses: ClassificationStatus[]): ClassificationStatus =>
  statuses.reduce<ClassificationStatus>((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a), 'verified');

const CATEGORY_LABELS: Record<MovementCategory, string> = {
  cashContribution: 'Cash Contributions',
  assetContribution: 'Asset Contributions',
  interest: 'Interest Income',
  legal: 'Legal Expenses',
  admin: 'Trust Administrative Expenses',
  auctionProceeds: 'Auction Proceeds Paid',
  spvContribution: 'PLVH SPV Class B Interest Adjustment',
  spvValuation: 'PLVH SPV',
  valuation: 'Valuation Changes',
  unclassified: 'Unclassified NAV Movement',
};

// Bridge groups, in order. A PLVH SPV carrying-value change splits by
// cause: a larger Class B interest (Schedule I) is a contribution; a revised
// PLVH valuation on the same interest is an asset value change.
const GROUPS: { key: BridgeGroupKey; label: string; categories: MovementCategory[] }[] = [
  {
    key: 'contributionsDistributions',
    label: 'Contributions & Distributions',
    categories: ['cashContribution', 'assetContribution', 'spvContribution', 'auctionProceeds'],
  },
  { key: 'incomeExpenses', label: 'Income & Expenses', categories: ['interest', 'legal', 'admin'] },
  { key: 'valuation', label: 'Asset Value Changes', categories: ['spvValuation', 'valuation'] },
  { key: 'unclassified', label: 'Unclassified NAV Movement', categories: ['unclassified'] },
];

// Categories in ALWAYS_SHOWN render every month, with an em dash when
// empty; the rest appear only when a month has them.
const CATEGORY_ORDER: MovementCategory[] = GROUPS.flatMap((group) => group.categories);
const ALWAYS_SHOWN = new Set<MovementCategory>([
  'cashContribution',
  'spvContribution',
  'auctionProceeds',
  'interest',
  'legal',
  'admin',
  'spvValuation',
]);

const ACTIVITY_OF: Partial<Record<MovementCategory, ActivityCategory>> = {
  cashContribution: 'contributions',
  assetContribution: 'contributions',
  spvContribution: 'contributions',
  interest: 'interest',
  legal: 'legal',
  admin: 'admin',
};

interface Entry {
  category: MovementCategory;
  label: string;
  amount: Cents;
  status: ClassificationStatus;
  assets: string[];
  source: string;
  note?: string;
}

// Whatever a holding's transactions don't explain. Market holdings call it
// valuation; carrying-value holdings can't move on price, so any remainder
// is unclassified.
function residualEntries(statement: TrustStatement, checks: ReconciliationCheck[]): Entry[] {
  return statement.holdings.flatMap((holding): Entry[] => {
    const flows = sum(statement.movements.filter((m) => m.holding === holding.id).map((m) => toCents(m.amount)));
    const residual = toCents(holding.closing) - toCents(holding.opening) - flows;
    const source = `${holding.name}: ${holding.opening} → ${holding.closing}`;

    let corroborated: boolean | null = null;
    if (holding.openingUnrealized != null && holding.closingUnrealized != null) {
      const reported = toCents(holding.closingUnrealized) - toCents(holding.openingUnrealized);
      const expected = holding.basis === 'market' ? residual : 0;
      corroborated = Math.abs(reported - expected) <= TOLERANCE_CENTS;
      checks.push({
        label: `${holding.name} change in reported unrealized gain/loss`,
        expected,
        actual: reported,
        passed: corroborated,
      });
    }

    if (holding.basis === 'carrying') {
      if (residual === 0) return [];
      return [
        {
          category: 'unclassified',
          label: CATEGORY_LABELS.unclassified,
          amount: residual,
          status: 'unresolved',
          assets: holding.assets,
          source,
          note: `${holding.name} changed by more than its recorded transactions. Balancing difference only — not a verified gain, contribution or adjustment.`,
        },
      ];
    }

    return [
      {
        category: 'valuation',
        label: holding.valuationLabel ?? `${holding.name} Valuation Changes`,
        amount: residual,
        // Verified only when the statement's own unrealized gain/loss moved by the same amount.
        status: corroborated === true ? 'verified' : corroborated === false ? 'unresolved' : 'inferred',
        assets: holding.assets,
        source,
        note: holding.valuationNote,
      },
    ];
  });
}

export function reconcileMonth(statement: TrustStatement): MonthReconciliation {
  const openingNav = toCents(statement.openingNav);
  const closingNav = toCents(statement.closingNav);
  const checks: ReconciliationCheck[] = [];

  // The holdings must add up to the statement's own totals, or the
  // per-holding residuals below are built on a bad transcription.
  const holdingsCheck = (label: string, expected: Cents, values: string[]) => {
    const actual = sum(values.map(toCents));
    checks.push({ label, expected, actual, passed: Math.abs(actual - expected) <= TOLERANCE_CENTS });
  };
  holdingsCheck(
    'Opening holdings sum to opening NAV',
    openingNav,
    statement.holdings.map((h) => h.opening),
  );
  holdingsCheck(
    'Closing holdings sum to closing NAV',
    closingNav,
    statement.holdings.map((h) => h.closing),
  );

  const entries: Entry[] = [
    ...statement.movements.map((m) => ({
      category: m.category,
      label: m.label ?? CATEGORY_LABELS[m.category],
      amount: toCents(m.amount),
      status: m.status,
      assets: m.asset ? [m.asset] : [],
      source: m.source,
      note: m.note,
    })),
    ...residualEntries(statement, checks),
  ];

  const lines: ReconciliationLine[] = [];
  CATEGORY_ORDER.forEach((category) => {
    const inCategory = entries.filter((e) => e.category === category);
    if (!inCategory.length) {
      if (ALWAYS_SHOWN.has(category)) {
        lines.push({
          key: category,
          label: CATEGORY_LABELS[category],
          category,
          amount: null,
          status: 'verified',
          assets: [],
          sources: [],
          notes: [],
        });
      }
      return;
    }
    const labels = Array.from(new Set(inCategory.map((e) => e.label)));
    labels.forEach((label) => {
      const group = inCategory.filter((e) => e.label === label);
      lines.push({
        key: `${category}:${label}`,
        label,
        category,
        amount: sum(group.map((e) => e.amount)),
        status: worst(group.map((e) => e.status)),
        assets: Array.from(new Set(group.flatMap((e) => e.assets))),
        sources: group.map((e) => e.source),
        notes: Array.from(new Set(group.flatMap((e) => (e.note ? [e.note] : [])))),
      });
    });
  });

  const groups: ReconciliationGroup[] = GROUPS.map((group) => {
    const own = lines.filter((line) => group.categories.includes(line.category));
    return { key: group.key, label: group.label, subtotal: sum(own.map((l) => l.amount ?? 0)), lines: own };
  }).filter((group) => group.lines.length > 0);

  const totalChange = closingNav - openingNav;
  const difference = totalChange - sum(lines.map((line) => line.amount ?? 0));
  const balanced = Math.abs(difference) <= TOLERANCE_CENTS;
  checks.push({
    label: 'Opening NAV + movements = closing NAV',
    expected: closingNav,
    actual: closingNav - difference,
    passed: balanced,
  });

  const activity: Record<ActivityCategory, Cents | null> = {
    contributions: null,
    interest: null,
    legal: null,
    admin: null,
  };
  lines.forEach((line) => {
    const key = ACTIVITY_OF[line.category];
    if (key && line.amount != null) activity[key] = (activity[key] ?? 0) + line.amount;
  });

  return {
    periodKey: statement.periodKey,
    statement: statement.file,
    openingDate: statement.openingDate,
    closingDate: statement.closingDate,
    openingNav,
    closingNav,
    totalChange,
    groups,
    lines,
    spvOwnership: statement.spvOwnership,
    difference,
    balanced,
    checks,
    needsReview: !balanced || checks.some((c) => !c.passed) || lines.some((l) => l.status !== 'verified'),
    activity,
    netActivity: sum(Object.values(activity).map((v) => v ?? 0)),
  };
}
