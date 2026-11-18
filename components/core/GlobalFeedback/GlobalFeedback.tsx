'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { isBareRoute } from '@/utils/isBareRoute';
import { isAiAppsRoute } from '@/utils/isAiAppsRoute';
import { scheduleFontCache } from '@/ai-apps-bridge/font-cache';
import { capturePageViewport, scrollPage } from '@/components/page/ai-apps/components/screenshot-feedback/capturePage';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedbackDrawerStore } from '@/services/feedback/store';
import { useFeedbackAnalytics, type FeedbackButtonSource } from '@/analytics/feedback.analytics';
import { useSetShowFeedbackButton } from '@/services/members/hooks/useSetShowFeedbackButton';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useFeedbackShortcuts } from '@/components/page/ai-apps/hooks/useFeedbackShortcuts';
import { FeedbackFabButton } from '@/components/page/ai-apps/components/FeedbackFabButton';
import { GiveAiAppFeedbackDialog } from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog';
import { LabosAgentCorner } from '@/components/core/labos-agent/LabosAgentCorner/LabosAgentCorner';
import { useLabosAgentAccess } from '@/services/labos-agent/hooks/useLabosAgentAccess';

interface Props {
  isLoggedIn?: boolean;
}

/**
 * The LabOS-wide feedback door (LAB-2879), mounted once in the root layout: the
 * floating button and drawer, on every page, sending to "LabOS - AI Apps".
 * Signed-in members only — the drawer posts as the member, and signed-out
 * visitors keep the support form (LAB-2882).
 *
 * AI Apps pages draw their own button, so there this one keeps only its drawer,
 * which the (?) menu's Give feedback opens. Bare routes (`isBareRoute`) have no
 * site chrome at all, so they get no button either. A member who hid the button
 * (`showFeedbackButton` preference) keeps the drawer for the (?) menu too. `?`
 * belongs to the page here, so only the open shortcut is taken.
 *
 * LAB-3302: for a member with agent access (`useLabosAgentAccess`), the button becomes the agent corner: one pill
 * with Agent and Feedback tabs, plus Ctrl/⌘ J. The Feedback tab opens this same drawer. Everyone else keeps the
 * button as it was.
 */
export function GlobalFeedback({ isLoggedIn }: Props) {
  const pathname = usePathname() ?? '';
  const open = useFeedbackDrawerStore((state) => state.open);
  const { openDrawer, closeDrawer } = useFeedbackDrawerStore((state) => state.actions);
  const analytics = useFeedbackAnalytics();
  const uid = useCurrentUserStore((state) => state.currentUser?.uid);
  const { data: preferences, isLoading } = useGetMemberPreferences(isLoggedIn ? uid : undefined);
  const setShowFeedbackButton = useSetShowFeedbackButton(uid);
  const [isFormHidden, setIsFormHidden] = useState(false);
  const agentEnabled = useLabosAgentAccess();

  /* Off until the preference loads, so a member who hid the button never sees it flash in. */
  const buttonOn = !isLoading && preferences?.memberPreferences?.showFeedbackButton !== false;
  const hasCorner = Boolean(isLoggedIn) && !isAiAppsRoute(pathname) && !isBareRoute(pathname);
  const showButton = hasCorner && buttonOn;
  /* The agent corner waits for the preference too, so its Feedback tab does not flash in. */
  const showAgentCorner = hasCorner && agentEnabled && !isLoading;

  const openFrom = useCallback(
    (source: FeedbackButtonSource) => {
      analytics.onFeedbackButtonClick({ source, page: pathname });
      openDrawer();
    },
    [analytics, pathname, openDrawer],
  );
  const onOpenKey = useCallback(() => openFrom('shortcut'), [openFrom]);
  const onOpenFloating = useCallback(() => openFrom('floating-button'), [openFrom]);

  /* The drawer screenshots this page. Fetch its fonts while idle, before Give feedback. */
  useEffect(() => {
    if (!showButton) {
      return;
    }
    return scheduleFontCache();
  }, [showButton]);

  useFeedbackShortcuts({ isEnabled: showButton && !open, onOpenKey });

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {showAgentCorner && (
        <LabosAgentCorner
          showFeedback={showButton}
          feedbackOpen={open}
          feedbackHidden={isFormHidden}
          onOpenFeedback={onOpenFloating}
          onCloseFeedback={closeDrawer}
        />
      )}
      {showButton && !showAgentCorner && (
        <FeedbackFabButton name="Give feedback" isDrawerOpen={open} isHidden={isFormHidden} onClick={onOpenFloating} />
      )}
      <GiveAiAppFeedbackDialog
        variant="drawer"
        isOpen={open}
        onClose={closeDrawer}
        onSent={() => analytics.onFeedbackSubmit({ page: pathname })}
        capture={capturePageViewport}
        scrollApp={scrollPage}
        pickViewport
        onHiddenChange={setIsFormHidden}
        labosOnly
        onHideButton={
          showButton
            ? () => {
                closeDrawer();
                setShowFeedbackButton(false);
              }
            : undefined
        }
      />
    </>
  );
}
