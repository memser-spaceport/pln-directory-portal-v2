'use client';

import { Button } from '@/components/common/Button';
// The production job-alert banner, reused: the shell is a pure wrapper (info
// glyph + space-between row) and its two SCSS modules carry the tinted slab and
// the type. Only the presentational innards are written here — `JobAlertBanner`
// itself pulls React Query mutations, PostHog, the auth store, the router and
// the toast container, none of which a prototype hosts.
import { JobAlertShell } from '@/components/page/jobs/JobAlertShell/JobAlertShell';
import banner from '@/components/page/jobs/JobAlertBanner/JobAlertBanner.module.scss';
import indicator from '@/components/page/jobs/JobAlertIndicator/JobAlertIndicator.module.scss';

import { isNarrowed, summarizeView, type FeedView } from './feedView';
import local from './NewsfeedV0.module.scss';

interface Props {
  /** The view being read right now. */
  view: FeedView;
  /** The one saved filter, or null when nothing is saved. */
  savedFilter: FeedView | null;
  onSave: () => void;
  /** Session dismiss — a feed people read daily can't carry a permanent slab. */
  onDismiss: () => void;
}

/**
 * In-stream "save this filter" offer: the job board's affordance, with the email
 * swapped for a saved filter.
 *
 * It sits above the results the filters just produced rather than in the rail —
 * that placement is why the job-alert version converts, and a rail module is
 * ambient furniture people skip.
 *
 * It is strictly a *first-time* offer. It shows only while there is nothing
 * saved; once you have a filter, the chip beside Sort is its permanent home and
 * this never comes back. That means there is no in-banner "update" path — to
 * change what's saved, clear it from the chip and save the new combination.
 *
 * It also renders nothing on an unfiltered feed — production's
 * `if (!hasActiveFilters) return null`. On a daily surface those two guards are
 * the whole defence against this becoming wallpaper.
 */
export function SavedFilterBanner({ view, savedFilter, onSave, onDismiss }: Props) {
  if (savedFilter || !isNarrowed(view)) return null;

  return (
    <div className={local.streamBanner}>
      {/* The shell's own dismiss floats at top-right and would sit on top of the
          action button — which is why production's banner never passes one. The
          dismiss goes inline in the actions row instead, exactly as
          `JobAlertIndicator` does it. */}
      <JobAlertShell>
        <div className={banner.body}>
          <div className={banner.copy}>
            <p className={banner.title}>Save these filters.</p>
            <p className={banner.subtitle}>
              Your feed will open on <strong>{summarizeView(view)}</strong> next time.
            </p>
          </div>
        </div>
        <div className={banner.actions}>
          <Button size="m" type="button" style="fill" variant="primary" onClick={onSave}>
            Save filter
          </Button>
          <button type="button" className={indicator.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
            <CloseIcon />
          </button>
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
