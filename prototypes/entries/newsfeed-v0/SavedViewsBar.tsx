'use client';

import clsx from 'clsx';

import type { StoredSavedView } from './feedView';
import local from './NewsfeedV0.module.scss';

interface Props {
  views: StoredSavedView[];
  /** id of the view currently applied, or null when the user is off-view. */
  activeId: string | null;
  onApply: (view: StoredSavedView) => void;
  onDelete: (id: string) => void;
}

/**
 * PARKED — not wired into the feed. Kept as the artifact of the "save a
 * collection of named views" option, which lost to the single saved filter
 * suggested in-stream (`SavedFilterBanner`). Re-import it here if that
 * conversation reopens.
 *
 * Saved views as a chip row above the tabs — production's affordance from
 * `InvestorsFilterRail` (a body button to apply + an × to delete, active chip
 * highlighted), which lives at the top of the filter rail there for the same
 * reason: a saved view is the widest thing on the page, so it sits above the
 * axes it sets. Renders nothing until the first view is saved, so the row never
 * costs vertical space it hasn't earned.
 */
export function SavedViewsBar({ views, activeId, onApply, onDelete }: Props) {
  if (views.length === 0) return null;

  return (
    <div className={local.savedViewRow}>
      <span className={local.savedViewLabel}>Saved views</span>
      <div className={local.savedViewChips}>
        {views.map((v) => {
          const active = v.id === activeId;
          return (
            <span key={v.id} className={clsx(local.savedView, active && local.savedViewActive)}>
              <button
                type="button"
                className={local.savedViewBody}
                aria-pressed={active}
                onClick={() => onApply(v)}
                title={v.name}
              >
                {v.name}
              </button>
              <button
                type="button"
                className={local.savedViewDelete}
                aria-label={`Delete saved view ${v.name}`}
                onClick={() => onDelete(v.id)}
              >
                <CloseGlyph />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// The DS close glyph (same stroke cross the platform's dismissible chips use),
// sized down for a 16px hit area inside the chip.
const CloseGlyph = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
