import { SIGN_UP_ANALYTICS_EVENTS } from '@/utils/constants';
import { usePostHog } from 'posthog-js/react';

/**
 * Custom hook to handle sign-up related analytics events using PostHog.
 *
 * @returns {object} An object containing functions to record various sign-up events.
 *
 * @function recordSignUpSave
 * Records the event when a sign-up form is submitted.
 * @param {string} type - The type of sign-up event.
 * @param {any} [payload] - Additional data to be sent with the event.
 *
 */
export const useSignUpAnalytics = () => {
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

  /**
   * Records the sign-up save event with the specified type and payload.
   *
   * @param {string} type - The type of the sign-up event.
   * @param {any} [payload] - Optional additional data to include with the event.
   *
   * @returns {void}
   */
  function recordSignUpSave(type: string, payload?: any) {
    const params = {
      type,
      ...payload,
    };
    captureEvent(SIGN_UP_ANALYTICS_EVENTS.SIGN_UP_FORM_SUBMIT, params);
  }

  /**
   * Records the event when a user cancels the sign-up process.
   *
   * This function captures the `SIGN_UP_FORM_CANCEL` event using the `captureEvent` method.
   * It is used to track when users abandon the sign-up form.
   */
  function recordSignUpCancel() {
    captureEvent(SIGN_UP_ANALYTICS_EVENTS.SIGN_UP_FORM_CANCEL);
  }

  /**
   * Records an event when a Policy URL is clicked during the sign-up process.
   *
   * @param url - The URL that was clicked.
   */
  function recordURLClick(url: string) {
    captureEvent(SIGN_UP_ANALYTICS_EVENTS.SIGN_UP_POLICY_URL_CLICK, { url });
  }

  /**
   * Records an analytics event when the user clicks on the home button after a successful sign-up.
   * 
   * This function captures the `SIGN_UP_HOME_CLICK_AFTER_SUCCESS` event to track user behavior
   * post sign-up completion.
   */
  function recordHomeClickAfterSuccess() {
    captureEvent(SIGN_UP_ANALYTICS_EVENTS.SIGN_UP_HOME_CLICK_AFTER_SUCCESS);
  }

  return {
    recordSignUpSave,
    recordSignUpCancel,
    recordURLClick,
    recordHomeClickAfterSuccess,
  };
};
