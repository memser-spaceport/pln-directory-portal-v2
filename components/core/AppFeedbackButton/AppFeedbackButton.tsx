'use client';

import { usePathname } from 'next/navigation';
import { useContactSupportStore } from '@/services/contact-support/store';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { CommentIcon } from '@/components/icons';
import { isBareRoute } from '@/utils/isBareRoute';

import s from './AppFeedbackButton.module.scss';

// Routes that already ship their own dedicated feedback entry point, so the
// app-wide button would just be a redundant, overlapping floating element.
const EXCLUDED_PATH_PREFIXES = ['/pl-infra/ai-apps'];

export function AppFeedbackButton() {
  const pathname = usePathname();
  const { openModal } = useContactSupportStore((state) => state.actions);
  const analytics = useCommonAnalytics();

  const isExcludedRoute = EXCLUDED_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (isExcludedRoute || isBareRoute(pathname)) {
    return null;
  }

  return (
    <button
      type="button"
      className={s.floatingButton}
      onClick={() => {
        analytics.onAppFeedbackButtonClicked(pathname);
        openModal(undefined, 'giveFeedback');
      }}
    >
      <CommentIcon />
      Feedback
    </button>
  );
}
