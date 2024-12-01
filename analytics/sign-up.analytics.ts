import { SIGN_UP_ANALYTICS_EVENTS } from '@/utils/constants';
import { usePostHog } from 'posthog-js/react';

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




  function recordSignUpSave(type: string, payload?: any){
    const params = {
      type,
      ...payload,
    };
    captureEvent(SIGN_UP_ANALYTICS_EVENTS.SIGN_UP_FORM_SUBMIT, params);
  }

  function recordSignUpCancel(){
    captureEvent(SIGN_UP_ANALYTICS_EVENTS.SIGN_UP_FORM_CANCEL);
  }

  function recordURLClick(url: string){
    captureEvent(SIGN_UP_ANALYTICS_EVENTS.SIGN_UP_POLICY_URL_CLICK, { url });
    }

    function recordHomeClickAfterSuccess(){
        captureEvent(SIGN_UP_ANALYTICS_EVENTS.SIGN_UP_HOME_CLICK_AFTER_SUCCESS);
        }
 
  
  return {
    recordSignUpSave,
    recordSignUpCancel,
    recordURLClick,
    recordHomeClickAfterSuccess
  };
};
