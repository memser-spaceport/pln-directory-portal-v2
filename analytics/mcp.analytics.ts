import { useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';

import { useCurrentUserStore } from '@/services/auth/store';
import { MCP_ANALYTICS_EVENTS } from '@/utils/constants';

export type McpConnectView = 'invalid' | 'signedOut' | 'pending' | 'denied' | 'error';
export type McpSnippetType = 'server' | 'claude' | 'codex';
export type McpConnectDenyReason = 'user_denied' | 'missing_permission';
export type McpConnectErrorKind = 'approve_failed' | 'redirect_invalid';

export type McpWarmPathParams = {
  warmPathUid: string;
  investorProfileUid: string;
};

export type McpWarmPathEditParams = McpWarmPathParams & {
  isEdit: boolean;
};

export function useMcpAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, props: Record<string, unknown> = {}) => {
      try {
        if (!posthog?.capture) return;
        const userInfo = useCurrentUserStore.getState().currentUser;
        posthog.capture(event, {
          ...props,
          loggedInUserUid: userInfo?.uid,
          loggedInUserEmail: userInfo?.email,
          loggedInUserName: userInfo?.name,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [posthog],
  );

  return {
    onSettingsSectionViewed: (params: { connectedClientCount: number }) =>
      capture(MCP_ANALYTICS_EVENTS.SETTINGS_SECTION_VIEWED, params),
    onSetupSnippetCopied: (params: { snippetType: McpSnippetType }) =>
      capture(MCP_ANALYTICS_EVENTS.SETUP_SNIPPET_COPIED, params),
    onConnectPageViewed: (params: { view: McpConnectView; clientId: string }) =>
      capture(MCP_ANALYTICS_EVENTS.CONNECT_PAGE_VIEWED, params),
    onConnectSignInClicked: (params: { clientId: string }) =>
      capture(MCP_ANALYTICS_EVENTS.CONNECT_SIGN_IN_CLICKED, params),
    onConnectApproved: (params: { clientId: string }) => capture(MCP_ANALYTICS_EVENTS.CONNECT_APPROVED, params),
    onConnectDenied: (params: { clientId: string; reason: McpConnectDenyReason }) =>
      capture(MCP_ANALYTICS_EVENTS.CONNECT_DENIED, params),
    onConnectError: (params: { clientId: string; errorKind: McpConnectErrorKind }) =>
      capture(MCP_ANALYTICS_EVENTS.CONNECT_ERROR, params),
    onAuthorizationRevoked: (params: { authorizationUid: string; clientName: string }) =>
      capture(MCP_ANALYTICS_EVENTS.AUTHORIZATION_REVOKED, params),
    onAuthorizationRevokeFailed: (params: { authorizationUid: string }) =>
      capture(MCP_ANALYTICS_EVENTS.AUTHORIZATION_REVOKE_FAILED, params),
    onWarmPathFeedbackOpened: (params: McpWarmPathEditParams) =>
      capture(MCP_ANALYTICS_EVENTS.WARM_PATH_FEEDBACK_OPENED, params),
    onWarmPathFeedbackSubmitted: (params: McpWarmPathEditParams) =>
      capture(MCP_ANALYTICS_EVENTS.WARM_PATH_FEEDBACK_SUBMITTED, params),
    onWarmPathNoteOpened: (params: McpWarmPathEditParams) =>
      capture(MCP_ANALYTICS_EVENTS.WARM_PATH_NOTE_OPENED, params),
    onWarmPathNoteSubmitted: (params: McpWarmPathEditParams) =>
      capture(MCP_ANALYTICS_EVENTS.WARM_PATH_NOTE_SUBMITTED, params),
    onWarmPathNoteCleared: (params: McpWarmPathParams) => capture(MCP_ANALYTICS_EVENTS.WARM_PATH_NOTE_CLEARED, params),
  };
}
