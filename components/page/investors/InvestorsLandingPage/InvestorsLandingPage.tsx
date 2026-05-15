'use client';

import s from './InvestorsLandingPage.module.scss';

/**
 * Shown when a logged-in user lacks `investor_db.view`. Mirrors the
 * deals-landing pattern: explain what the page is + a request-access CTA.
 */
export function InvestorsLandingPage() {
  return (
    <div className={s.root}>
      <div className={s.card}>
        <div className={s.icon}>📊</div>
        <h1 className={s.title}>Investor DB</h1>
        <p className={s.subtitle}>An internal database for the PL investment team.</p>

        <div className={s.featureGrid}>
          <div className={s.feature}>
            <div className={s.featureIcon}>🌐</div>
            <h3>The full investor superset</h3>
            <p>Every investor we've enriched, ranked by engagement and matched against PL portfolio cap tables.</p>
          </div>
          <div className={s.feature}>
            <div className={s.featureIcon}>🤝</div>
            <h3>Co-investor surface</h3>
            <p>See which investors have backed PL portfolio teams. Find warm intros via shared cap tables.</p>
          </div>
          <div className={s.feature}>
            <div className={s.featureIcon}>⚡</div>
            <h3>Find warm intros</h3>
            <p>Pick a portfolio team that's fundraising — we surface investors with the strongest network path.</p>
          </div>
        </div>

        <div className={s.access}>
          <h3 className={s.accessTitle}>Need access?</h3>
          <p className={s.accessDesc}>
            This page is gated by the <code>investor_db.view</code> permission. Reach out to your admin or the PL operations team to be added.
          </p>
        </div>
      </div>
    </div>
  );
}
