import styles from './nav-summary-card.module.scss';

export interface NavSummaryCardProps {
  navUsd: number | null | undefined;
  totalUnits: number | null | undefined;
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

export default function NavSummaryCard({ navUsd, totalUnits }: NavSummaryCardProps) {
  // Zero units is treated as missing, not divided by.
  const perUnit = navUsd != null && totalUnits ? navUsd / totalUnits : null;

  const navLabel = navUsd != null ? formatNavUsd(navUsd) : '—';
  const totalUnitsLabel = totalUnits != null ? unitFormatter.format(totalUnits) : '—';
  const perUnitLabel = perUnit != null ? currency2dpFormatter.format(perUnit) : '—';

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.panelPrimary}>
          <dl className={styles.fieldGroup}>
            <div className={styles.field}>
              <dt className={styles.label}>NAV per PLAA</dt>
              <dd className={styles.hero}>{perUnitLabel}</dd>
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
              <dd className={styles.secondaryValue}>{totalUnitsLabel}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
