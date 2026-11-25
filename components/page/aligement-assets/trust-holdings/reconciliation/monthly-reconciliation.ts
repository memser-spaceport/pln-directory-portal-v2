import { MonthReconciliation, reconcileMonth, TrustStatement } from './reconciliation';

export function reconcileStatements(statements: TrustStatement[]): Record<string, MonthReconciliation> {
  return Object.fromEntries(
    statements.flatMap((statement) => {
      try {
        return [[statement.periodKey, reconcileMonth(statement)]];
      } catch (error) {
        console.error(`[trust-holdings] Could not reconcile statement ${statement.periodKey}:`, error);
        return [];
      }
    }),
  );
}
