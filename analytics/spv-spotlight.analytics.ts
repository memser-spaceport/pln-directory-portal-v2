import { usePostHog } from 'posthog-js/react';
import { useCurrentUserStore } from '@/services/auth/store';
import type { SpvViewState } from '@/services/spv-spotlight/resolveSpvViewState';
import type { SpvAccessRequestBlockReason, SpvSpotlightStatus } from '@/services/spv-spotlight/types';
import { SPV_SPOTLIGHT_ANALYTICS } from '@/utils/constants';

/**
 * Every event carries the spotlight and where the viewer stands. Never form
 * values (email, name, organization): `captureEvent` already stamps the
 * signed-in identity, and a signed-out requester stays anonymous.
 */
export type SpvSpotlightBaseParams = {
  spotlight_slug: string;
  spotlight_status: SpvSpotlightStatus;
  view_state: SpvViewState;
};

export type SpvSignInSource = 'card' | 'already-requested-prompt' | 'applied-steps' | 'success-sheet';
export type SpvInvestorProfileSource = 'hero' | 'applied-steps' | 'success-sheet';

export const useSpvSpotlightAnalytics = () => {
  const postHog = usePostHog();

  const captureEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
    try {
      if (!postHog?.capture) return;
      const userInfo = useCurrentUserStore.getState().currentUser;
      const loggedInUserUid = userInfo?.uid;
      const loggedInUserEmail = userInfo?.email;
      const loggedInUserName = userInfo?.name;
      const is_authenticated = Boolean(loggedInUserUid);
      postHog.capture(eventName, {
        ...eventParams,
        is_authenticated,
        loggedInUserUid,
        loggedInUserEmail,
        loggedInUserName,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const onPageViewed = (params: SpvSpotlightBaseParams) => captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_PAGE_VIEWED, params);

  const onRequestAccessClicked = (params: SpvSpotlightBaseParams) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_REQUEST_ACCESS_CLICKED, params);

  const onRequestAccessSubmitted = (params: SpvSpotlightBaseParams & { is_new_member: boolean }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_REQUEST_ACCESS_SUBMITTED, params);

  const onRequestAccessBlocked = (params: SpvSpotlightBaseParams & { reason: SpvAccessRequestBlockReason }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_REQUEST_ACCESS_BLOCKED, params);

  const onRequestAccessFailed = (params: SpvSpotlightBaseParams) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_REQUEST_ACCESS_FAILED, params);

  const onSignInClicked = (params: SpvSpotlightBaseParams & { source: SpvSignInSource }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_SIGN_IN_CLICKED, params);

  const onViewMaterialsClicked = (params: SpvSpotlightBaseParams) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_VIEW_MATERIALS_CLICKED, params);

  const onInvestorProfileClicked = (params: SpvSpotlightBaseParams & { source: SpvInvestorProfileSource }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_INVESTOR_PROFILE_CLICKED, params);

  const onExploreTileClicked = (params: SpvSpotlightBaseParams) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_EXPLORE_TILE_CLICKED, params);

  return {
    onPageViewed,
    onRequestAccessClicked,
    onRequestAccessSubmitted,
    onRequestAccessBlocked,
    onRequestAccessFailed,
    onSignInClicked,
    onViewMaterialsClicked,
    onInvestorProfileClicked,
    onExploreTileClicked,
  };
};
