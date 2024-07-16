'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { EVENTS, PROJECT_FORM_STEPS } from '@/utils/constants';

function FormStepIndicatorMob(props: any) {
  const { currentStep } = useStepsIndicator({ steps: PROJECT_FORM_STEPS, defaultStep: 'General', uniqueKey: 'add-project' });
  const currentStepIndex = PROJECT_FORM_STEPS.findIndex((v: string) => v === currentStep);

  const activeIcon = '/icons/hexagon-active-blue.svg';

  return (
    <>
        <div className="mri__stepsm">
          <div className="mri__stepsm__cn">
            <div className="mri__stepsd__item__icon">
              <img className="mri__stepsd__item__icon__img" src={activeIcon} alt="step icon" width="24" height="24" />
              {currentStepIndex <= currentStepIndex + 1 && <p className="mri__stepsd__item__icon__text">{currentStepIndex + 1}</p>}
            </div>
            <p className="mri__stepsm__stepname">{currentStep}</p>
          </div>
          <p className="mri__stepsm__stepinfo">{`Step ${currentStepIndex + 1} of ${PROJECT_FORM_STEPS.length}`}</p>
        </div>

        <div className='mri__stepsm__titles'>
            <div>
            <h1 className='mri__stepsm__titles__title'>Add Project</h1>
            </div>
            <div className='mri__stepsm__titles__desc'>Share your project details</div>
        </div>
      <style jsx>
        {`
          .mri {
          }

          .mri__stepsm {
            width: 100%;
            height: 60px;
            background: white;
            padding: 0 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid lightgrey;
            box-shadow: 0px 2px 6px 0px #0F172A29;
          }

          .mri__stepsm__stepname {
            text-transform: Capitalize;
            font-size: 16px;
            font-weight: 600;
          }

          .mri__stepsm__stepinfo {
            font-size: 14px;
            font-weight: 600;
            color: #156ff7;
            background-color: #dbeafe;
            padding: 4px 16px;
            border-radius: 53px;
          }

          .mri__stepsm__cn {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .mri__stepsd__item__icon {
            position: relative;
            height: 24px;
            width: 24px;
          }

          .mri__stepsd__item__icon__img {
            display: inline-block;
          }

          .mri__stepsd__item__icon__text {
            position: absolute;
            top: 50%;
            left: 50%;
            color: #0f172a;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            transform: translate(-50%, -50%);
          }

          .mri__stepsm__titles {
          display: flex;
          padding: 12px 20px;
          flex-direction: column;
          background-color: #DBEAFE;
          }

          .mri__stepsm__titles__title {
          font-size: 14px;
          font-weight: 700;
          line-height: 17px;
          }

          .mri__stepsm__titles__desc {
          font-weight: 400;
          font-size: 14px;
          line-height: 24px;
          }

        `}
      </style>
    </>
  );
}

export default FormStepIndicatorMob;
