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

  function onInvestorPendingViewPageOpened(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_PAGE_OPENED, eventParams);
  }

  function onInvestorPendingViewGoToInvestorProfileButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_GO_TO_INVESTOR_PROFILE_BUTTON_CLICKED);
  }

  function onInvestorPendingViewAddToCalendarButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_ADD_TO_CALENDAR_BUTTON_CLICKED);
  }

  function onInvestorPendingViewGoToDemoDayButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_GO_TO_DEMO_DAY_BUTTON_CLICKED);
  }

  function onInvestorProfilePageOpened(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_PAGE_OPENED, eventParams);
  }

  function onInvestorProfileEditStarted() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_EDIT_STARTED);
  }

  function onInvestorProfileUpdated() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_UPDATED);
  }

  function onFounderPendingViewPageOpened(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_PENDING_VIEW_PAGE_OPENED, eventParams);
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

  function onFounderPendingViewWebsiteLinkClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_FOUNDER_PENDING_VIEW_WEBSITE_LINK_CLICKED, eventParams);
  }

  function onActiveViewPageOpened(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_PAGE_OPENED, eventParams);
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

  function onConfidentialityModalSubmitted(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_CONFIDENTIALITY_MODAL_SUBMITTED, eventParams);
  }

  function onConfidentialityModalClosed(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_CONFIDENTIALITY_MODAL_CLOSED, eventParams);
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

  function onActiveViewReferCompanyClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_REFER_COMPANY_CLICKED, eventParams);
  }

  function onActiveViewIntroCompanyClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INTRO_COMPANY_CLICKED, eventParams);
  }

  function onActiveViewIntroCompanyCancelClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INTRO_COMPANY_CANCEL_CLICKED, eventParams);
  }

  function onActiveViewIntroCompanyConfirmClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_INTRO_COMPANY_CONFIRM_CLICKED, eventParams);
  }

  function onActiveViewWelcomeVideoViewed(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_WELCOME_VIDEO_VIEWED, eventParams);
  }

  function onActiveViewTeamCardViewed(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_CARD_VIEWED, eventParams);
  }

  function onLandingPageOpened(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_LANDING_PAGE_OPENED, eventParams);
  }

  function onLandingLoginButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_LANDING_LOGIN_BUTTON_CLICKED);
  }

  function onLandingRequestInviteButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_LANDING_REQUEST_INVITE_BUTTON_CLICKED);
  }

  function onLandingTeamCardClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_LANDING_TEAM_CARD_CLICKED, eventParams);
  }

  function onLandingTeamWebsiteClicked(eventParams = {}) {
    captureEvent(DEMO_DAY_ANALYTICS.ON_LANDING_TEAM_WEBSITE_CLICKED, eventParams);
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
    onLandingTeamCardClicked,
    onLandingTeamWebsiteClicked,
    onAccessDeniedModalShown,
    onAccessDeniedUserNotWhitelistedModalShown,
    onAccessDeniedRequestInviteClicked,
    onInvestorPendingViewPageOpened,
    onInvestorPendingViewGoToInvestorProfileButtonClicked,
    onInvestorPendingViewAddToCalendarButtonClicked,
    onInvestorPendingViewGoToDemoDayButtonClicked,
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
    onFounderPendingViewWebsiteLinkClicked,
    onActiveViewPageOpened,
    onActiveViewTimeOnPage,
    onActiveViewFiltersApplied,
    onActiveViewTeamCardClicked,
    onActiveViewTeamCardViewed,
    onActiveViewTeamPitchDeckViewed,
    onActiveViewTeamPitchVideoViewed,
    onActiveViewLikeCompanyClicked,
    onActiveViewConnectCompanyClicked,
    onActiveViewInvestCompanyClicked,
    onActiveViewReferCompanyClicked,
    onActiveViewIntroCompanyClicked,
    onActiveViewIntroCompanyCancelClicked,
    onActiveViewIntroCompanyConfirmClicked,
    onActiveViewWelcomeVideoViewed,
    onConfidentialityModalSubmitted,
    onConfidentialityModalClosed,
  };
};
