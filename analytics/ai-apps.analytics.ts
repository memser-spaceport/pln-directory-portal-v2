import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

import { AI_APPS_ANALYTICS } from '@/utils/constants';

export function useAiAppsAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, props: Record<string, unknown> = {}) => {
      posthog?.capture(event, props);
    },
    [posthog],
  );

  return {
    onPageViewed: () => capture(AI_APPS_ANALYTICS.PAGE_VIEWED, { path: '/pl-infra/ai-apps' }),
    onCreateModalOpened: () => capture(AI_APPS_ANALYTICS.CREATE_MODAL_OPENED),
    onCreateModalClosed: () => capture(AI_APPS_ANALYTICS.CREATE_MODAL_CLOSED),
    onStarterKitDownloaded: () => capture(AI_APPS_ANALYTICS.STARTER_KIT_DOWNLOADED),
    onStarterKitDownloadFailed: () => capture(AI_APPS_ANALYTICS.STARTER_KIT_DOWNLOAD_FAILED),
    onCardClicked: (appUid: string, appName: string) => capture(AI_APPS_ANALYTICS.CARD_CLICKED, { appUid, appName }),
    onAuthorClicked: (appUid: string, memberUid: string, memberName: string) =>
      capture(AI_APPS_ANALYTICS.AUTHOR_CLICKED, { appUid, memberUid, memberName }),
    onDetailPageViewed: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.DETAIL_PAGE_VIEWED, { appUid, appName, path: `/pl-infra/ai-apps/${appUid}` }),
    onOpenInNewTabClicked: (appUid: string, appName: string, appUrl: string) =>
      capture(AI_APPS_ANALYTICS.OPEN_IN_NEW_TAB_CLICKED, { appUid, appName, appUrl }),
  };
}
