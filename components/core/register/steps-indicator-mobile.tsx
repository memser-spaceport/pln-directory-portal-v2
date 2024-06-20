'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';

function StepsIndicatorMobile(props) {
  const steps = props.steps ?? [];
  const { currentStep } = useStepsIndicator({ steps, defaultStep: 'basic', uniqueKey: 'register' });
  const currentStepIndex = steps.findIndex((v) => v === currentStep);
  return (
    <>
      <div className="mri__stepsm">
        <p className='mri__stepsm__stepname'>{currentStep}</p>
        <p className='mri__stepsm__stepinfo'>{`Step ${currentStepIndex + 1} of ${steps.length}`}</p>
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
           
          }

          .mri__stepsm__stepname {
            text-transform: Capitalize;
            font-size: 16px;
            font-weight: 600;
          }

          .mri__stepsm__stepinfo {
            font-size: 14px;
            font-weight: 600;
            color: #156FF7;
            background-color: #DBEAFE;
            padding: 4px 16px;
            border-radius: 53px;
          }
          
         
        `}
      </style>
    </>
  );
}

export default StepsIndicatorMobile;
