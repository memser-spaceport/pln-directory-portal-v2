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
  /** Null on a signed-out locked page: the page never reads the spotlight for it. */
  spotlight_status: SpvSpotlightStatus | null;
  view_state: SpvViewState;
};

export type SpvSignInSource =
  | 'top-bar'
  | 'card'
  | 'locked-hero'
  | 'already-requested-prompt'
  | 'applied-steps'
  | 'success-sheet';
export type SpvInvestorProfileSource = 'top-bar' | 'profile-card' | 'applied-steps' | 'success-sheet';
/** Whether the viewer had an investor profile yet: what the profile card's button said. */
export type SpvInvestorProfileState = 'setup' | 'review';
export type SpvContactUsSource = 'locked-signed-out' | 'locked-no-access' | 'rejected';
export type SpvTeamWebsiteSource = 'fact-strip' | 'carousel';
// 'faq' is the FAQ subtitle's link; 'faq-answer' the one inside "Why can't I open this page?".
export type SpvSupportEmailSource = 'faq' | 'faq-answer' | 'footer';
/** Which of the page's two "Access data room" buttons was pressed. */
export type SpvDataRoomSource = 'team-card' | 'band';

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

  const onOpenDataRoomClicked = (params: SpvSpotlightBaseParams & { source: SpvDataRoomSource }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_OPEN_DATA_ROOM_CLICKED, params);

  const onInvestorProfileClicked = (
    params: SpvSpotlightBaseParams & { source: SpvInvestorProfileSource; profile_state: SpvInvestorProfileState },
  ) => captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_INVESTOR_PROFILE_CLICKED, params);

  /** A save in the investor-profile drawer opened from this page. */
  const onInvestorProfileSaved = (params: SpvSpotlightBaseParams) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_INVESTOR_PROFILE_SAVED, params);

  const onContactUsClicked = (params: SpvSpotlightBaseParams & { source: SpvContactUsSource }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_CONTACT_US_CLICKED, params);

  const onExploreTileClicked = (params: SpvSpotlightBaseParams) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_EXPLORE_TILE_CLICKED, params);

  const onFounderProfileClicked = (params: SpvSpotlightBaseParams & { member_uid: string }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_FOUNDER_PROFILE_CLICKED, params);

  const onTeamWebsiteClicked = (params: SpvSpotlightBaseParams & { source: SpvTeamWebsiteSource }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_TEAM_WEBSITE_CLICKED, params);

  const onSupportEmailClicked = (params: SpvSpotlightBaseParams & { source: SpvSupportEmailSource }) =>
    captureEvent(SPV_SPOTLIGHT_ANALYTICS.ON_SUPPORT_EMAIL_CLICKED, params);

  return {
    onPageViewed,
    onRequestAccessClicked,
    onRequestAccessSubmitted,
    onRequestAccessBlocked,
    onRequestAccessFailed,
    onSignInClicked,
    onOpenDataRoomClicked,
    onInvestorProfileClicked,
    onInvestorProfileSaved,
    onContactUsClicked,
    onExploreTileClicked,
    onFounderProfileClicked,
    onTeamWebsiteClicked,
    onSupportEmailClicked,
  };
};
