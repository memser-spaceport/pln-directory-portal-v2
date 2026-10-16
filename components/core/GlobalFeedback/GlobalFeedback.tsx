'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { useFeedbackAnalytics, type FeedbackButtonSource } from '@/analytics/feedback.analytics';
import { FloatingFeedbackButton } from '@/components/page/ai-apps/components/FloatingFeedbackButton';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedbackDrawerStore } from '@/services/feedback/store';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useSetShowFeedbackButton } from '@/services/members/hooks/useSetShowFeedbackButton';
import { isAiAppsRoute } from '@/utils/isAiAppsRoute';
import { isBareRoute } from '@/utils/isBareRoute';

interface Props {
  isLoggedIn?: boolean;
}

/**
 * The LabOS-wide feedback door (LAB-2879), mounted once in the root layout: the
 * AI Apps floating button and drawer, on every page, sending to "LabOS - AI
 * Apps". Signed-in members only — the drawer posts as the member, and signed-out
 * visitors keep the support form (LAB-2882).
 *
 * AI Apps pages draw their own button, so there this one keeps only its drawer,
 * which the (?) menu's Give feedback opens. Bare routes (`isBareRoute`) have no
 * site chrome at all, so they get no button either. A member who hid the button
 * (`showFeedbackButton` preference) keeps the drawer for the (?) menu too.
 */
export function GlobalFeedback({ isLoggedIn }: Props) {
  const pathname = usePathname() ?? '';
  const open = useFeedbackDrawerStore((state) => state.open);
  const { openDrawer, closeDrawer } = useFeedbackDrawerStore((state) => state.actions);
  const analytics = useFeedbackAnalytics();
  const uid = useCurrentUserStore((state) => state.currentUser?.uid);
  const { data: preferences, isLoading } = useGetMemberPreferences(isLoggedIn ? uid : undefined);
  const setShowFeedbackButton = useSetShowFeedbackButton(uid);

  /* Off until the preference loads, so a member who hid the button never sees it flash in. */
  const buttonOn = !isLoading && preferences?.memberPreferences?.showFeedbackButton !== false;
  const showButton = buttonOn && !isAiAppsRoute(pathname) && !isBareRoute(pathname);

  /* Stable between renders: the button keys its callbacks on this object. */
  const global = useMemo(
    () => ({
      open,
      showButton,
      onOpen: (source: FeedbackButtonSource = 'floating-button') => {
        analytics.onFeedbackButtonClick({ source, page: pathname });
        openDrawer();
      },
      onClose: closeDrawer,
      onSent: () => analytics.onFeedbackSubmit({ page: pathname }),
      onHideButton: showButton
        ? () => {
            closeDrawer();
            setShowFeedbackButton(false);
          }
        : undefined,
    }),
    [open, showButton, pathname, analytics, openDrawer, closeDrawer, setShowFeedbackButton],
  );

  if (!isLoggedIn) {
    return null;
  }

  return <FloatingFeedbackButton global={global} />;
}
