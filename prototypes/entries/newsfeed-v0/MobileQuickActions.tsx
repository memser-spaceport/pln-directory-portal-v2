'use client';

import local from './NewsfeedV0.module.scss';
import { QUICK_ACTIONS } from './quickActions';

/**
 * Mobile-only Quick Actions: a horizontally-scrolling row of stacked cards
 * (icon on top, title, then subtitle) — the launcher-style layout, more compact
 * per card than the production icon-left ActionCard so more peek onto the row.
 * Desktop keeps the production Cards grid (QuickActionsMock).
 */
export function MobileQuickActions() {
  return (
    <section className={local.mqa} aria-label="Quick actions">
      <h2 className={local.mqaTitle}>Quick Actions</h2>
      <div className={local.mqaRow}>
        {QUICK_ACTIONS.map((action) => (
          <a key={action.href} href={action.href} className={local.mqaCard}>
            <span className={local.mqaIcon}>{action.icon}</span>
            <span className={local.mqaCardTitle}>{action.title}</span>
            <span className={local.mqaSub}>{action.description}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
