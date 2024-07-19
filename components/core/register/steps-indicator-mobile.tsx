'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';

function StepsIndicatorMobile(props: any) {
  const steps = props.steps ?? [];
  const { currentStep } = useStepsIndicator({ steps, defaultStep: 'basic', uniqueKey: 'register' });
  const currentStepIndex = steps.findIndex((v: string) => v === currentStep);

  const activeIcon = '/icons/hexagon-active-blue.svg';

  return (
    <>
      {currentStep !== 'success' && (
        <div className="mri__stepsm">
          <div className="mri__stepsm__cn">
            <div className="mri__stepsd__item__icon">
              <img className="mri__stepsd__item__icon__img" src={activeIcon} alt="step icon" width="24" height="24" />
              {currentStepIndex <= currentStepIndex + 1 && <p className="mri__stepsd__item__icon__text">{currentStepIndex + 1}</p>}
            </div>
            <p className="mri__stepsm__stepname">{currentStep}</p>
          </div>
          <p className="mri__stepsm__stepinfo">{`Step ${currentStepIndex + 1} of ${steps.length - 1}`}</p>
        </div>
      )}
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
            align-items:center;
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
        `}
      </style>
    </>
  );
}

export default StepsIndicatorMobile;
