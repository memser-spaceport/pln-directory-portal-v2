'use client';

import { Drawer } from '@/components/common/Drawer/Drawer';
import s from './ScoringMethodologyModal.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Explains the Fit score (0–100) shown next to each warm-intros candidate.
 * Scoring is computed server-side by the warm-intros endpoint.
 */
export function ScoringMethodologyModal({ open, onClose }: Props) {
  return (
    <Drawer isOpen={open} onClose={onClose} width={520}>
      <div className={s.body}>
        <header className={s.header}>
          <h2 className={s.title}>How the Fit score works</h2>
          <button className={s.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <p className={s.lead}>
          The <strong>Fit score</strong> (0–100) ranks each candidate by how strong their path is to the team
          you&apos;re fundraising for. Higher is better. It combines a <strong>warmth</strong> signal (do we
          already know them?) with <strong>criteria fit</strong> (do they invest in the right stage and sector?).
        </p>

        <section className={s.section}>
          <h3 className={s.h3}>1 · Warmth signal</h3>
          <table className={s.table}>
            <thead>
              <tr><th>Signal</th><th className={s.right}>Points</th></tr>
            </thead>
            <tbody>
              <tr><td>Co-invested with PL on <em>this same</em> portfolio team</td><td className={s.right}>+50</td></tr>
              <tr><td>Co-invested with PL on a <em>different</em> portfolio team</td><td className={s.right}>+35</td></tr>
              <tr><td>Registered for a recent PL Demo Day (T1)</td><td className={s.right}>+30</td></tr>
              <tr><td>Clicked a recent PL outreach email (T2)</td><td className={s.right}>+22</td></tr>
              <tr><td>Opened a recent PL outreach email (T3)</td><td className={s.right}>+14</td></tr>
              <tr><td>No prior touch (cold match)</td><td className={s.right}>0</td></tr>
            </tbody>
          </table>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>2 · Criteria fit</h3>
          <table className={s.table}>
            <thead>
              <tr><th>Signal</th><th className={s.right}>Points</th></tr>
            </thead>
            <tbody>
              <tr><td>Each Industry / Sector tag that matches the target</td><td className={s.right}>+10 each</td></tr>
              <tr><td>Stage focus matches the team&apos;s raising round (or stage-agnostic)</td><td className={s.right}>+10</td></tr>
              <tr><td>Email is verified (deliverable)</td><td className={s.right}>+5</td></tr>
            </tbody>
          </table>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>3 · How tiers are assigned</h3>
          <ul className={s.list}>
            <li><strong>Co-invested with PL</strong> — investor has at least one cap-table overlap with a PL portfolio team.</li>
            <li><strong>Engaged with PL</strong> — investor is at T1, T2, or T3 outreach tier but hasn&apos;t co-invested.</li>
            <li><strong>Cold matches</strong> — no warmth signal, but high sector + stage overlap. Rows with zero sector overlap are dropped entirely.</li>
          </ul>
        </section>

        <section className={s.section}>
          <h3 className={s.h3}>Final score</h3>
          <p className={s.p}>
            Warmth points + criteria points, capped at 100. Color coding: <span className={s.fitHi}>80–100 high</span>,
            <span className={s.fitMi}> 60–79 medium</span>, <span className={s.fitLo}>&lt;60 low</span>.
          </p>
        </section>

        <p className={s.note}>
          The scoring is intentionally simple and human-readable. As we learn what actually converts to warm intros, we
          can re-weight or add ML-based signals. Today this is rule-based.
        </p>
      </div>
    </Drawer>
  );
}
