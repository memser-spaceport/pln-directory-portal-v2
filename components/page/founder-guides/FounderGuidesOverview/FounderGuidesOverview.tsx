import s from './FounderGuidesOverview.module.scss';

const STATS = [
  { value: '200+', label: 'Founders Supported' },
  { value: '85+', label: 'Office Hours Booked' },
  { value: '1.2k', label: 'GuideViews' },
];

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M11.0833 7H2.91667M2.91667 7L6.41667 10.5M2.91667 7L6.41667 3.5"
        stroke="#455468"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FounderGuidesOverview() {
  return (
    <div className={s.root}>
      <div className={s.page}>

        {/* Section heading: title + stats + body — all gap 24px */}
        <div className={s.sectionHeading}>
          <h1 className={s.title}>Guides for founders — written and human</h1>

          <div className={s.statsRow}>
            {STATS.map(({ value, label }) => (
              <div key={label} className={s.statCard}>
                <span className={s.statValue}>{value}</span>
                <span className={s.statLabel}>{label}</span>
              </div>
            ))}
          </div>

          <p className={s.bodyText}>
            These guides distill the most asked questions and battle-tested resources from across our portfolio —
            covering legal structures, fundraising mechanics, hiring playbooks, and more.
          </p>

          <p className={s.bodyText}>
            Browse by topic in the sidebar, or book time directly with the expert behind each guide when you are ready
            to talk specifics.
          </p>
        </div>

        {/* Link button */}
        <div className={s.linkButton}>
          <ArrowLeftIcon />
          <span className={s.linkText}>Select a guide to begin</span>
        </div>

        {/* Divider */}
        <div className={s.divider} />
      </div>
    </div>
  );
}
