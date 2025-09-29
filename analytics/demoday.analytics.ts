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

  return {
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
  };
};
