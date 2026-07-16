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
    onConnectPageViewed: (params: { sessionId: string; view: string; clientName?: string | null }) =>
      capture(AI_APPS_ANALYTICS.CONNECT_PAGE_VIEWED, params),
    onConnectSignInClicked: (params: { sessionId: string; clientName?: string | null }) =>
      capture(AI_APPS_ANALYTICS.CONNECT_SIGN_IN_CLICKED, params),
    onConnectApproved: (params: { sessionId: string; clientName?: string | null }) =>
      capture(AI_APPS_ANALYTICS.CONNECT_APPROVED, params),
    onConnectDenied: (params: { sessionId: string }) => capture(AI_APPS_ANALYTICS.CONNECT_DENIED, params),
    onConnectExpired: (params: { sessionId: string }) => capture(AI_APPS_ANALYTICS.CONNECT_EXPIRED, params),
    onConnectError: (params: { sessionId: string }) => capture(AI_APPS_ANALYTICS.CONNECT_ERROR, params),
    onAccessDenied: (path: string) => capture(AI_APPS_ANALYTICS.ACCESS_DENIED, { path }),
    onIframeLoaded: (appUid: string, appName: string) => capture(AI_APPS_ANALYTICS.IFRAME_LOADED, { appUid, appName }),
    onIframeLoadFailed: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.IFRAME_LOAD_FAILED, { appUid, appName }),
    onFeedbackSubmitted: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_SUBMITTED, { appUid, appName }),
    onFeedbackSubmitFailed: (appUid: string) => capture(AI_APPS_ANALYTICS.FEEDBACK_SUBMIT_FAILED, { appUid }),
    onFeedbackReviewViewed: () => capture(AI_APPS_ANALYTICS.FEEDBACK_REVIEW_VIEWED),
    onFeedbackTabFiltered: (appName: string) => capture(AI_APPS_ANALYTICS.FEEDBACK_TAB_FILTERED, { appName }),
    onFeedbackExported: (rowCount: number) => capture(AI_APPS_ANALYTICS.FEEDBACK_EXPORTED, { rowCount }),
    onFeedbackDialogOpened: (params: { appUid?: string; appName?: string } = {}) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_DIALOG_OPENED, params),
    onViewFeedbackClicked: (params: { feedbackCount: number }) =>
      capture(AI_APPS_ANALYTICS.VIEW_FEEDBACK_CLICKED, params),
    onSecretsPanelOpened: (params: { appUid: string; isDraft: boolean }) =>
      capture(AI_APPS_ANALYTICS.SECRETS_PANEL_OPENED, params),
    onSecretsDeployClicked: (params: {
      appUid: string;
      isDraft: boolean;
      varsRequiredCount: number;
      varsProvidedCount: number;
    }) => capture(AI_APPS_ANALYTICS.SECRETS_DEPLOY_CLICKED, params),
    onSecretsDeploySucceeded: (params: { appUid: string; isDraft: boolean }) =>
      capture(AI_APPS_ANALYTICS.SECRETS_DEPLOY_SUCCEEDED, params),
    onDraftSetupViewed: (params: { appUid: string; appName: string }) =>
      capture(AI_APPS_ANALYTICS.DRAFT_SETUP_VIEWED, params),
    onManageMenuOpened: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.MANAGE_MENU_OPENED, { appUid, appName }),
    onEditDetailsSaved: (appUid: string) => capture(AI_APPS_ANALYTICS.EDIT_DETAILS_SAVED, { appUid }),
    onEditDetailsFailed: (appUid: string) => capture(AI_APPS_ANALYTICS.EDIT_DETAILS_FAILED, { appUid }),
    onDeploymentSettingsOpened: (params: { appUid: string; isDraft: boolean }) =>
      capture(AI_APPS_ANALYTICS.DEPLOYMENT_SETTINGS_OPENED, params),
    onDeleteAppConfirmed: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.DELETE_APP_CONFIRMED, { appUid, appName }),
    onDeleteAppFailed: (appUid: string) => capture(AI_APPS_ANALYTICS.DELETE_APP_FAILED, { appUid }),
    onAppDetailsOpened: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.APP_DETAILS_OPENED, { appUid, appName }),
  };
}
