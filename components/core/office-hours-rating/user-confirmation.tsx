'use client'
import { createFeedBack } from '@/services/office-hours.service';
import { OFFICE_HOURS_STEPS } from '@/utils/constants';
import { useEffect } from 'react';

interface IUserConfirmation {
  onClose: () => void;
  setCurrentStep: any;
}

const UserConfirmation = (props: any) => {
  const onClose = props.onClose;
  const currentFollowUp = props?.currentFollowup;
  const setCurrentStep = props?.setCurrentStep;
  const userInfo = props?.userInfo;

  const onYesClickHandler = async () => {
    console.log(currentFollowUp)
    await createFeedBack(userInfo.uid, currentFollowUp.interactionUid, userInfo?.authToken ?? '', {
      data: {},
      type: `${currentFollowUp?.type}_FEED_BACK`,
      rating: 3,
      comments: [],
      response: 'POSITIVE',
    });
    onClose();
  };

  const onNoClickHandler = () => {
    setCurrentStep(OFFICE_HOURS_STEPS.NOT_HAPPENED.name);
  };

  useEffect(() => {
    console.log(currentFollowUp)
  }, [currentFollowUp])

  return (
    <>
      <div className="usercfr">
        <div className="usercfr__titlesec">
          <h2 className="usercfr__titlesec__title">{`Did you schedule Office Hours with ${currentFollowUp}?`}</h2>
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
