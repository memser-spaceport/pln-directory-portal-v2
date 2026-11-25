import styles from './nav-summary-card.module.scss';

export interface NavSummaryCardProps {
  navUsd: number | null | undefined;
  totalUnits: number | null | undefined;
  reserves?: number | null;
}

const unitFormatter = new Intl.NumberFormat('en-US');
const currency2dpFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const currency0dpFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Intl's compact notation rounds to significant digits, so the "$19.07M" shape is built by hand.
function formatNavUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${currency2dpFormatter.format(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${currency2dpFormatter.format(value / 1_000_000)}M`;
  return currency0dpFormatter.format(value);
}

export default function NavSummaryCard({ navUsd, totalUnits, reserves }: NavSummaryCardProps) {
  // Zero units is treated as missing, not divided by.
  const perUnit = navUsd != null && totalUnits ? navUsd / totalUnits : null;
  const outstandingUnits = totalUnits != null ? totalUnits - (reserves ?? 0) : null;
  const perOutstandingUnit = navUsd != null && outstandingUnits ? navUsd / outstandingUnits : null;

  const navLabel = navUsd != null ? formatNavUsd(navUsd) : '—';
  const issuedUnitsLabel = outstandingUnits != null ? unitFormatter.format(outstandingUnits) : '—';
  const perUnitLabel = perUnit != null ? currency2dpFormatter.format(perUnit) : '—';
  const perOutstandingUnitLabel = perOutstandingUnit != null ? currency2dpFormatter.format(perOutstandingUnit) : '—';

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.panelPrimary}>
          <dl className={styles.fieldGroup}>
            <div className={styles.field}>
              <dt className={styles.label}>Fully Diluted NAV</dt>
              <dd className={styles.hero}>{perUnitLabel}</dd>
            </div>
            <div className={styles.inlineField}>
              <dt className={styles.inlineLabel}>Outstanding PLAA NAV</dt>
              <dd className={styles.inlineValue}>{perOutstandingUnitLabel}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.panelSecondary}>
          <dl className={styles.fieldGroup}>
            <div className={styles.field}>
              <dt className={styles.label}>Net asset value</dt>
              <dd className={styles.secondaryValue}>{navLabel}</dd>
            </div>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.field}>
              <dt className={styles.label}>Total PLAA outstanding</dt>
              <dd className={styles.secondaryValue}>{issuedUnitsLabel}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
