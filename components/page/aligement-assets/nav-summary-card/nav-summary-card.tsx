import styles from './nav-summary-card.module.scss';

export interface NavSummaryCardProps {
  /** Total trust net asset value, in USD. `null`/`undefined` renders a loading dash, never "$0.00M". */
  navUsd: number | null | undefined;
  /** Total PLAA outstanding. `null`/`0` renders a loading/undefined dash for the derived per-unit value. */
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

// Compact currency notation rounds to significant digits, not a fixed 2dp, so
// the "$19.07M" shape is built by hand: scale, format the scaled number as
// currency, then append the unit suffix.
function formatNavUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${currency2dpFormatter.format(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${currency2dpFormatter.format(value / 1_000_000)}M`;
  return currency0dpFormatter.format(value);
}

export default function NavSummaryCard({ navUsd, totalUnits }: NavSummaryCardProps) {
  // navUsd / totalUnits is derived here, not accepted as a prop, so it can
  // never drift from the two source figures.
  const perUnit = navUsd != null && totalUnits ? navUsd / totalUnits : null;

  const navLabel = navUsd != null ? formatNavUsd(navUsd) : '—';
  const totalUnitsLabel = totalUnits != null ? unitFormatter.format(totalUnits) : '—';
  const perUnitLabel = perUnit != null ? currency2dpFormatter.format(Math.round(perUnit * 100) / 100) : '—';

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
