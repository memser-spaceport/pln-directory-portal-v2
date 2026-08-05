'use client';

import clsx from 'clsx';

import { Button } from '@/components/common/Button';

// The job board's alert chrome, reused exactly as `MonitorView` and
// `../newsfeed-v0/SavedFilterBanner` reuse it — production already ships this
// slab at `components/page/jobs/JobAlertBanner`.
import { JobAlertShell } from '@/components/page/jobs/JobAlertShell/JobAlertShell';
import banner from '@/components/page/jobs/JobAlertBanner/JobAlertBanner.module.scss';
import indicator from '@/components/page/jobs/JobAlertIndicator/JobAlertIndicator.module.scss';

import local from './NewsfeedCurated.module.scss';

interface SubscribeBannerProps {
  /** Human summary of the filter in force, from `summarizeView`. */
  label: string;
  onSubscribe: () => void;
  /** Session dismiss — a feed people read weekly can't carry a permanent slab. */
  onDismiss: () => void;
}

/**
 * "You filtered — want this by email?"
 *
 * The complement of the top-stories block: unfiltered, the curator tells you what
 * mattered; filtered, you've said what matters to you, and the useful next move
 * is to stop having to come back and check. That is a *subscription*, not a saved
 * filter — `SavedFilterBanner` next door offers persistence ("your feed will open
 * on this next time"), which is a different promise, so the copy here is the
 * alert framing instead and the object it creates is a Monitor subscription.
 *
 * The caller owns both guards, matching `SavedFilterBanner`: render only while
 * the view is narrowed, and only while nothing is subscribed yet. On a surface
 * that already carries a hero, tabs, pills, sort, search and two notes, an
 * unguarded slab is just wallpaper.
 */
export function SubscribeBanner({ label, onSubscribe, onDismiss }: SubscribeBannerProps) {
  return (
    <div className={local.subscribeSlot}>
      {/* The shell's own dismiss floats top-right and would collide with the
          action button — production's banner never passes one either, so the
          dismiss goes inline in the actions row the way `JobAlertIndicator`
          does it. */}
      <JobAlertShell>
        {/* Production's chrome and colours throughout — only the scale is dialled
            down, via the `local.subscribe*` overrides. */}
        <div className={banner.body}>
          <div className={clsx(banner.copy, local.subscribeCopy)}>
            <p className={clsx(banner.title, local.subscribeTitle)}>Get notified when new items match this filter.</p>
            <p className={clsx(banner.subtitle, local.subscribeSubtitle)}>
              You&apos;re looking at <strong>{label}</strong>. We&apos;ll send it to your notifications, only when there
              are new matches.
            </p>
          </div>
        </div>
        <div className={clsx(banner.actions, local.subscribeActions)}>
          <Button size="s" type="button" style="fill" variant="primary" onClick={onSubscribe}>
            Subscribe
          </Button>
          <button
            type="button"
            className={clsx(indicator.dismissBtn, local.subscribeDismiss)}
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
        </div>
      </JobAlertShell>
    </div>
  );
}

// The same stroke cross the shell's own dismiss draws (its Icons module isn't
// exported from the package root, so the glyph is redrawn rather than deep-imported),
// drawn at 16px to sit with the smaller copy rather than production's 20px.
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M15 5L5 15M5 5l10 10" stroke="#455468" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
