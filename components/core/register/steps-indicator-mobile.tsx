'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';

function StepsIndicatorMobile() {
  const steps = ['basic', 'skills', 'contributions', 'social'];
  const { currentStep, setCurrentStep } = useStepsIndicator({ steps, defaultStep: 'basic', uniqueKey: 'register' });
  const currentStepIndex = steps.findIndex((v) => v === currentStep);
  return (
    <>
      <div className="mri__stepsm"></div>
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
            position: sticky;
            top: 0;
          }
          
          @media (min-width: 1200px) {
           
            .mri__stepsm {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
}

export default StepsIndicatorMobile;
