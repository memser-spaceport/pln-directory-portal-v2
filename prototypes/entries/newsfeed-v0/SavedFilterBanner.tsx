'use client';

import { Button } from '@/components/common/Button';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
// The production job-alert banner, reused: the shell is a pure wrapper (info
// glyph + space-between row + floating dismiss) and its two SCSS modules carry
// the tinted slab and the type. Only the presentational innards are written
// here — `JobAlertBanner` itself pulls React Query mutations, PostHog, the auth
// store, the router and the toast container, none of which a prototype hosts.
import { JobAlertShell } from '@/components/page/jobs/JobAlertShell/JobAlertShell';
import banner from '@/components/page/jobs/JobAlertBanner/JobAlertBanner.module.scss';
import indicator from '@/components/page/jobs/JobAlertIndicator/JobAlertIndicator.module.scss';

import { isNarrowed, summarizeView, viewHashKey, type FeedView } from './feedView';
import local from './NewsfeedV0.module.scss';

interface Props {
  /** The view being read right now. */
  view: FeedView;
  /** The one saved filter, or null when nothing is saved. */
  savedFilter: FeedView | null;
  onSave: () => void;
  onClear: () => void;
  /** Session dismiss — a feed people read daily can't carry a permanent slab. */
  onDismiss: () => void;
}

/**
 * In-stream "save this filter" banner: the job board's affordance, with the
 * email swapped for a saved filter.
 *
 * It sits above the results the filters just produced rather than in the rail —
 * that placement is why the job-alert version converts, and a rail module is
 * ambient furniture people skip. Same three states, and the same demotion once
 * saved: the offer becomes a single quiet line.
 *
 * Saving is a singleton, not a collection: one filter, no naming step, labelled
 * from its own criteria (production's `summarizeFilterState` convention). The
 * payoff is that the feed opens on it next visit.
 *
 * Renders nothing on an unfiltered feed — production's `if (!hasActiveFilters)
 * return null`. On a daily surface that guard is the whole defence against this
 * becoming wallpaper.
 */
export function SavedFilterBanner({ view, savedFilter, onSave, onClear, onDismiss }: Props) {
  if (!isNarrowed(view)) return null;

  const summary = summarizeView(view);
  const matches = savedFilter !== null && viewHashKey(savedFilter) === viewHashKey(view);

  // Reading exactly what's saved: nothing to offer, so the slab drops to one
  // line that says where you are and how to get out.
  if (savedFilter && matches) {
    return (
      <div className={local.streamBanner}>
        <JobAlertShell>
          <p className={indicator.label}>Showing your saved filter: {summary}</p>
          <div className={indicator.actions}>
            <Button style="link" size="xl" underline type="button" onClick={onClear}>
              Clear
            </Button>
            <button type="button" className={indicator.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
              <CloseIcon />
            </button>
          </div>
        </JobAlertShell>
      </div>
    );
  }

  const updating = Boolean(savedFilter);

  return (
    <div className={local.streamBanner}>
      <JobAlertShell onDismiss={onDismiss}>
        <div className={banner.body}>
          <div className={banner.copy}>
            <p className={banner.title}>
              {updating ? 'These filters differ from your saved filter.' : 'Save these filters.'}
            </p>
            <p className={banner.subtitle}>
              {updating ? (
                'Update it and your feed will open here instead.'
              ) : (
                <>
                  Your feed will open on <strong>{summary}</strong> next time.
                </>
              )}
            </p>
          </div>
        </div>
        <div className={banner.actions}>
          <Button
            size="m"
            type="button"
            style={updating ? 'border' : 'fill'}
            variant="primary"
            className={local.savedFilterBtn}
            onClick={onSave}
          >
            {updating ? (
              <>
                <span>Update saved filter</span>
                <ArrowUpRightIcon />
              </>
            ) : (
              'Save filter'
            )}
          </Button>
        </div>
      </JobAlertShell>
    </div>
  );
}

// Same 20px stroke cross the shell's own dismiss draws (its Icons module isn't
// exported from the package root, so the glyph is redrawn rather than deep-imported).
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M15 5L5 15M5 5l10 10" stroke="#455468" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
