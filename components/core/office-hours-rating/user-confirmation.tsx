'use client';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { createFeedBack } from '@/services/office-hours.service';
import { IFollowUp } from '@/types/officehours.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsNotificationInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENTS, FEEDBACK_RESPONSE_TYPES, OFFICE_HOURS_STEPS, TOAST_MESSAGES } from '@/utils/constants';
import { SetStateAction, useEffect } from 'react';
import { toast } from 'react-toastify';

interface IUserConfirmation {
  onClose: (isUpdateRequired: boolean) => void;
  setCurrentStep: SetStateAction<any>;
  currentFollowup: IFollowUp | null;
  userInfo: IUserInfo;
  authToken: string;
}

const UserConfirmation = (props: IUserConfirmation) => {
  const onClose = props.onClose;
  const currentFollowUp = props?.currentFollowup;
  const setCurrentStep = props?.setCurrentStep;
  const userInfo = props?.userInfo;
  const authToken = props?.authToken;
  const name = currentFollowUp?.interaction?.targetMember?.name;
  const analytics = useNotificationAnalytics();

  const onYesClickHandler = async () => {
    try {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      const feedback = {
        data: {},
        type: `${currentFollowUp?.type}_FEED_BACK`,
        rating: 0,
        comments: [],
        response: FEEDBACK_RESPONSE_TYPES.positive.name,
      };
      const result = await createFeedBack(userInfo?.uid ?? '', currentFollowUp?.uid ?? '', authToken ?? '', feedback);
      analytics.onOfficeHoursFeedbackSubmitted(getAnalyticsUserInfo(userInfo), getAnalyticsNotificationInfo(currentFollowUp), feedback);

      if (result?.error) {
        console.error(result.error);
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        analytics.onOfficeHoursFeedbackFailed(getAnalyticsUserInfo(userInfo), getAnalyticsNotificationInfo(currentFollowUp), feedback);
        if (result?.error?.data?.message?.includes('There is no follow-up')) {
          toast.success(TOAST_MESSAGES.FEEDBACK__ALREADY__RECORDED);
        } else {
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        }
      }
      
      if (result?.data) {
        analytics.onOfficeHoursFeedbackSuccess(getAnalyticsUserInfo(userInfo), getAnalyticsNotificationInfo(currentFollowUp), feedback);
        toast.success(TOAST_MESSAGES.FEEDBACK_INITIATED_SUCCESS);
      }
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      onClose(false);
    } catch (error) {
      console.error(error);
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      onClose(false);
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    }
  };

  const onNoClickHandler = () => {
    setCurrentStep(OFFICE_HOURS_STEPS?.NOT_HAPPENED?.name);
  };

  return (
    <>
      <div className="usercfr">
        <div className="usercfr__titlesec">
          <h2 className="usercfr__titlesec__title">{`Did you schedule Office Hours with ${name}?`}</h2>
        </div>
        <div className="usercfr__opts">
          <button className="usercfr__opts__no" onClick={onNoClickHandler}>
            <span className="usercfr__opts__no__icon">&#128078;</span>
            <span>No</span>
          </button>

          <button className="usercfr__opts__yes" onClick={onYesClickHandler}>
            <span className="usercfr__opts__yes__icon">&#128077;</span>
            <span>Yes</span>
          </button>
        </div>
      </div>

      <style jsx>
        {`
          button {
            background: none;
            cursor: pointer;
            border: none;
          }

          .usercfr {
            padding: 24px;
            display: flex;
            gap: 24px;
            flex-direction: column;
            width: 80vw;
          }

          .usercfr__title {
          }

          .usercfr__opts {
            align-self: end;
            gap: 10px;
            display: flex;
            align-items: end;
          }

          .usercfr__opts__no {
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            display: flex;
            gap: 8px;
            align-items: center;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
            color: #0f172a;
          }

          .usercfr__opts__yes {
            border: 1px solid #cbd5e1;
            background: #156ff7;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            display: flex;
            gap: 8px;
            align-items: center;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
            color: white;
          }

          .usercfr__opts__no__icon {
            font-size: 16px;
          }

          .usercfr__titlesec {
          padding-top: 10px;}

          .usercfr__titlesec__title {
            font-size: 16px;
            font-weight: 700;
            line-height: 20px;
            padding-right: 15px;
          }

          @media (min-width: 1024px) {
            .usercfr {
              width: 650px;
            }

            .usercfr__titlesec__title {
              font-weight: 700;
              font-size: 24px;
              line-height: 32px;
            }
          }
        `}
      </style>
    </>
  );
};

export default UserConfirmation;
