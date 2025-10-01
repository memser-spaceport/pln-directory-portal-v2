import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useDemoDayAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = getUserInfo();
        const loggedInUserUid = userInfo?.uid;
        const loggedInUserEmail = userInfo?.email;
        const loggedInUserName = userInfo?.name;
        postHogProps.capture(eventName, { ...allParams, loggedInUserUid, loggedInUserEmail, loggedInUserName });
      }
    } catch (e) {
      console.error(e);
    }
  };

  function onInvestorPendingViewPageOpened() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_PAGE_OPENED);
  }

  function onInvestorPendingViewGoToInvestorProfileButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_GO_TO_INVESTOR_PROFILE_BUTTON_CLICKED);
  }

  function onInvestorProfilePageOpened() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_PAGE_OPENED);
  }

  function onInvestorProfileEditStarted() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_EDIT_STARTED);
  }

  function onInvestorProfileUpdated() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_UPDATED);
  }

  function onFounderPendingViewPageOpened() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_PENDING_VIEW_PAGE_OPENED);
  }

  function onFounderTeamFundraisingCardClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_TEAM_FUNDRAISING_CARD_CLICKED);
  }

  function onFounderEditTeamProfileButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_EDIT_TEAM_PROFILE_BUTTON_CLICKED);
  }

  function onFounderSaveTeamDetailsClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_SAVE_TEAM_DETAILS_CLICKED);
  }

  function onFounderCancelTeamDetailsClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_CANCEL_TEAM_DETAILS_CLICKED);
  }

  function onFounderDemoMaterialUploadStarted(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_STARTED, eventParams);
  }

  function onFounderDemoMaterialUploadSuccess(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_SUCCESS, eventParams);
  }

  function onFounderDemoMaterialUploadFailed(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_UPLOAD_FAILED, eventParams);
  }

  function onFounderDemoMaterialDeleted(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_DELETED, eventParams);
  }

  function onFounderDemoMaterialViewed(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_DEMO_MATERIAL_VIEWED, eventParams);
  }

  function onActiveViewPageOpened() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_PAGE_OPENED);
  }

  function onActiveViewTimeOnPage(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TIME_ON_PAGE, eventParams);
  }

  function onActiveViewFiltersApplied(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_FILTERS_APPLIED, eventParams);
  }

  function onActiveViewTeamCardClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_CARD_CLICKED, eventParams);
  }

  function onActiveViewTeamPitchDeckViewed(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_PITCH_DECK_VIEWED, eventParams);
  }

  function onActiveViewTeamPitchVideoViewed(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_PITCH_VIDEO_VIEWED, eventParams);
  }

  function onActiveViewLikeCompanyClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_LIKE_COMPANY_CLICKED, eventParams);
  }

  function onActiveViewConnectCompanyClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_CONNECT_COMPANY_CLICKED, eventParams);
  }

  function onActiveViewInvestCompanyClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INVEST_COMPANY_CLICKED, eventParams);
  }

  function onLandingPageOpened() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_LANDING_PAGE_OPENED);
  }

  function onLandingLoginButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_LANDING_LOGIN_BUTTON_CLICKED);
  }

  function onLandingRequestInviteButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_LANDING_REQUEST_INVITE_BUTTON_CLICKED);
  }

  function onAccessDeniedModalShown(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACCESS_DENIED_MODAL_SHOWN, eventParams);
  }

  function onAccessDeniedUserNotWhitelistedModalShown(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACCESS_DENIED_USER_NOT_WHITELISTED_MODAL_SHOWN, eventParams);
  }

  function onAccessDeniedRequestInviteClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACCESS_DENIED_REQUEST_INVITE_CLICKED, eventParams);
  }

  return {
    onLandingPageOpened,
    onLandingLoginButtonClicked,
    onLandingRequestInviteButtonClicked,
    onAccessDeniedModalShown,
    onAccessDeniedUserNotWhitelistedModalShown,
    onAccessDeniedRequestInviteClicked,
    onInvestorPendingViewPageOpened,
    onInvestorPendingViewGoToInvestorProfileButtonClicked,
    onInvestorProfilePageOpened,
    onInvestorProfileEditStarted,
    onInvestorProfileUpdated,
    onFounderPendingViewPageOpened,
    onFounderTeamFundraisingCardClicked,
    onFounderEditTeamProfileButtonClicked,
    onFounderSaveTeamDetailsClicked,
    onFounderCancelTeamDetailsClicked,
    onFounderDemoMaterialUploadStarted,
    onFounderDemoMaterialUploadSuccess,
    onFounderDemoMaterialUploadFailed,
    onFounderDemoMaterialDeleted,
    onFounderDemoMaterialViewed,
    onActiveViewPageOpened,
    onActiveViewTimeOnPage,
    onActiveViewFiltersApplied,
    onActiveViewTeamCardClicked,
    onActiveViewTeamPitchDeckViewed,
    onActiveViewTeamPitchVideoViewed,
    onActiveViewLikeCompanyClicked,
    onActiveViewConnectCompanyClicked,
    onActiveViewInvestCompanyClicked,
  };
};
