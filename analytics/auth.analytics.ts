import { AUTH_ANALYTICS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useAuthAnalytics = () => {
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

  const onLoginBtnClicked = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_LOGIN_BTN_CLICKED);
  };

  const onSignUpBtnClicked = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_SIGN_UP_BTN_CLICKED);
  }

  const onProceedToLogin = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_PROCEED_TO_LOGIN_CLICKED);
  };

  const onAuthInfoClosed = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_INFO_POPUP_CLOSED);
  };

  const onPrivyLoginSuccess = (privyUser: any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_LOGIN_SUCCESS, { ...privyUser });
  };

  const onDirectoryLoginInit = (privyUser: any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_DIRECTORY_LOGIN_INIT, { ...privyUser });
  };

  const onDirectoryLoginSuccess = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_DIRECTORY_LOGIN_SUCCESS);
  };

  const onDirectoryLoginFailure = (privyUser: any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_DIRECTORY_LOGIN_FAILURE, { ...privyUser });
  };

  const onPrivyUnlinkEmail = (privyUser: any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_UNLINK_EMAIL, { ...privyUser });
  };

  const onPrivyUserDelete = (privyUser: any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_DELETE_USER, { ...privyUser });
  };

  const onPrivyLinkSuccess = (privyUser: any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_LINK_SUCCESS, { ...privyUser });
  };

  const onAccountLinkError = (privyUser: any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_LINK_ERROR, { ...privyUser });
  };

  const onPrivyAccountLink = (privyUser: any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_SETTINGS_PRIVY_ACCOUNT_LINK, { ...privyUser });
  };

  const onUpdateEmailClicked = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.SETTINGS_USER_CHANGE_EMAIL_CLICKED, { ...privyUser });
  };

  const onUpdateEmailSuccess = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_SETTINGS_EMAIL_UPDATE_SUCCESS, { ...privyUser });
  };

  const onUpdateEmailFailure = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_SETTINGS_EMAIL_UPDATE_FAILED, { ...privyUser });
  };

  const onUpdateSameEmailProvided = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_SETTINGS_EMAIL_UPDATE_SAME_AS_OLD, { ...privyUser });
  };

  return {
    onLoginBtnClicked,
    onProceedToLogin,
    onAuthInfoClosed,
    onPrivyLinkSuccess,
    onPrivyUnlinkEmail,
    onPrivyUserDelete,
    onPrivyLoginSuccess,
    onDirectoryLoginInit,
    onDirectoryLoginSuccess,
    onDirectoryLoginFailure,
    onAccountLinkError,
    onPrivyAccountLink,
    onUpdateEmailClicked,
    onUpdateEmailSuccess,
    onUpdateEmailFailure,
    onUpdateSameEmailProvided,
    onSignUpBtnClicked
  };
};
