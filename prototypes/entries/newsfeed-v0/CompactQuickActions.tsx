'use client';

import local from './NewsfeedV0.module.scss';
import { QUICK_ACTIONS } from './quickActions';

/**
 * Compact alternative to the full Quick Actions card grid: a single row of
 * icon+label shortcut chips. On desktop it wraps; on mobile it scrolls
 * horizontally (fade + peek + snap) so the whole set stays one line high
 * instead of a tall stack of cards — the grid's biggest space cost on mobile.
 */
export function CompactQuickActions() {
  return (
    <section className={local.qaCompact} aria-label="Quick actions">
      <div className={local.qaChipRow}>
        {QUICK_ACTIONS.map((action) => (
          <a key={action.href} href={action.href} className={local.qaChip} title={action.description}>
            <span className={local.qaChipIcon}>{action.icon}</span>
            <span className={local.qaChipLabel}>{action.short}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
