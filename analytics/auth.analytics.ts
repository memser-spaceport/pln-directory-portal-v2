import { AUTH_ANALYTICS } from '@/utils/constants';
import { usePostHog } from 'posthog-js/react';

export const useAuthAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        postHogProps.capture(eventName, { ...allParams });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onLoginBtnClicked = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_LOGIN_BTN_CLICKED);
  };

  const onProceedToLogin = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_PROCEED_TO_LOGIN_CLICKED);
  };

  const onAuthInfoClosed = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_INFO_POPUP_CLOSED);
  };

  const onPrivyLoginSuccess = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_LOGIN_SUCCESS, { ...privyUser });
  };

  const onDirectoryLoginInit = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_DIRECTORY_LOGIN_INIT, { ...privyUser });
  };

  const onDirectoryLoginSuccess = () => {
    captureEvent(AUTH_ANALYTICS.AUTH_DIRECTORY_LOGIN_SUCCESS);
  };

  const onDirectoryLoginFailure = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_DIRECTORY_LOGIN_FAILURE, { ...privyUser });
  };

  const onPrivyUnlinkEmail = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_UNLINK_EMAIL, { ...privyUser });
  };

  const onPrivyUserDelete = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_DELETE_USER, { ...privyUser });
  };

  const onPrivyLinkSuccess = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_LINK_SUCCESS, { ...privyUser });
  };

  const onAccountLinkError = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_PRIVY_LINK_ERROR, { ...privyUser });
  };

  const onPrivyAccountLink = (privyUser:any) => {
    captureEvent(AUTH_ANALYTICS.AUTH_SETTINGS_PRIVY_ACCOUNT_LINK, { ...privyUser });
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
  };
};
