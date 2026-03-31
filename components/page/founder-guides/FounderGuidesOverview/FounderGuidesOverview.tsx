import s from './FounderGuidesOverview.module.scss';

const STATS = [
  { value: '200+', label: 'Founders Supported' },
  { value: '85+', label: 'Office Hours Booked' },
  { value: '1.2k', label: 'Guide Views' },
];

export default function FounderGuidesOverview() {
  return (
    <div className={s.root}>
      <div className={s.card}>
        <h1 className={s.title}>Guides for founders — written and human</h1>

        <div className={s.statsRow}>
          {STATS.map(({ value, label }) => (
            <div key={label} className={s.statCard}>
              <span className={s.statValue}>{value}</span>
              <span className={s.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        <div className={s.body}>
          <p>
            These guides distill the most asked questions and battle-tested resources from founders who have built in
            and around the Protocol Labs ecosystem. Each guide is written to be actionable — not theoretical.
          </p>
          <p>
            Browse by topic in the sidebar, or book time directly with the expert behind each guide to go deeper on
            your specific situation.
          </p>
        </div>

        <hr className={s.divider} />

        <p className={s.cta}>← Select a guide to begin</p>
      </div>
    </div>
  );
}
