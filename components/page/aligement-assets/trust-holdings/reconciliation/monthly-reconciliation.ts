import { MonthReconciliation, reconcileMonth } from './reconciliation';
import { TRUST_STATEMENTS } from './trust-statements.data';

// Keyed by the NAV table's period key ("Sep '26" → M9-2026).
export const MONTHLY_RECONCILIATION: Record<string, MonthReconciliation> = Object.fromEntries(
  TRUST_STATEMENTS.map((statement) => [statement.periodKey, reconcileMonth(statement)]),
);
