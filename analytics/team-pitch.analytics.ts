import { TEAM_PITCH_ANALYTICS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';

export const useTeamPitchAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
    try {
      if (postHogProps?.capture) {
        const userInfo = useCurrentUserStore.getState().currentUser;
        postHogProps.capture(eventName, {
          ...eventParams,
          loggedInUserUid: userInfo?.uid,
          loggedInUserEmail: userInfo?.email,
          loggedInUserName: userInfo?.name,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return {
    onPageOpened: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_PAGE_OPENED, eventParams),
    onTimeOnPage: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_TIME_ON_PAGE, eventParams),
    onConfidentialityModalSubmitted: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_CONFIDENTIALITY_MODAL_SUBMITTED, eventParams),
    onConfidentialityModalClosed: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_CONFIDENTIALITY_MODAL_CLOSED, eventParams),
    onLoginClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_LOGIN_CLICKED, eventParams),
    onInvestorProfileCtaClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_INVESTOR_PROFILE_CTA_CLICKED, eventParams),
    onContactSupportClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_CONTACT_SUPPORT_CLICKED, eventParams),
    onRestrictedAccessSupportClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_RESTRICTED_ACCESS_SUPPORT_CLICKED, eventParams),
    onSpotlightTeamLinkClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_SPOTLIGHT_TEAM_LINK_CLICKED, eventParams),
    onSpotlightMemberProfileLinkClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_SPOTLIGHT_MEMBER_PROFILE_LINK_CLICKED, eventParams),
    onTeamCardViewed: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_TEAM_CARD_VIEWED, eventParams),
    onTeamCardClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_TEAM_CARD_CLICKED, eventParams),
    onDeckViewed: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_DECK_VIEWED, eventParams),
    onVideoViewed: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_VIDEO_VIEWED, eventParams),
    onVideoWatchTime: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_VIDEO_WATCH_TIME, eventParams),
    onConnectClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_CONNECT_CLICKED, eventParams),
    onInvestClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_INVEST_CLICKED, eventParams),
    onIntroClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_INTRO_CLICKED, eventParams),
    onIntroCancelClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_INTRO_CANCEL_CLICKED, eventParams),
    onIntroConfirmClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_INTRO_CONFIRM_CLICKED, eventParams),
    onGiveFeedbackClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_GIVE_FEEDBACK_CLICKED, eventParams),
    onFeedbackSubmitted: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_FEEDBACK_SUBMITTED, eventParams),
    onEditProfileClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_EDIT_PROFILE_CLICKED, eventParams),
    onSaveProfileClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_SAVE_PROFILE_CLICKED, eventParams),
    onCancelProfileClicked: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_CANCEL_PROFILE_CLICKED, eventParams),
    onMaterialUploadStarted: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_MATERIAL_UPLOAD_STARTED, eventParams),
    onMaterialUploadSuccess: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_MATERIAL_UPLOAD_SUCCESS, eventParams),
    onMaterialUploadFailed: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_MATERIAL_UPLOAD_FAILED, eventParams),
    onMaterialDeleted: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_MATERIAL_DELETED, eventParams),
    onMaterialViewed: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_MATERIAL_VIEWED, eventParams),
    onProfileReady: (eventParams: Record<string, unknown> = {}) =>
      captureEvent(TEAM_PITCH_ANALYTICS.ON_PROFILE_READY, eventParams),
  };
};
