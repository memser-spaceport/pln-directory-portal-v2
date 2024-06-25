'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';

function StepsIndicatorDesktop(props: any) {
  const steps = props.steps ?? [];
  const stepsToSkip = props.skip ?? [];
  const filteredSteps = [...steps].filter((v) => !stepsToSkip.includes(v));
  const { currentStep } = useStepsIndicator({ steps, defaultStep: 'basic', uniqueKey: 'register' });
  const currentStepIndex = steps.findIndex((v: string) => v === currentStep);
  const activeIcon = '/icons/hexagon-active.svg';
  const completedIcon = '/icons/hexagon-completed.svg';
  const defaultIcon = '/icons/hexagon.svg';
  const getStepImageSrc = (index: number) => {
    if (index === currentStepIndex) {
      return activeIcon;
    }

    if (currentStepIndex > index) {
      return completedIcon;
    }

    return defaultIcon;
  };
  return (
    <>
      <div className="mri">
        <ul className="mri__stepsd">
          {filteredSteps.map((step: string, index: number) => (
            <li className={`mri__stepsd__item`} key={`register-step-desktop-${index}`}>
              <div className="mri__stepsd__item__icon">
                <img className="mri__stepsd__item__icon__img" src={getStepImageSrc(index)} alt="step icon" width="24" height="24" />
                {currentStepIndex <= index && <p className="mri__stepsd__item__icon__text">{index + 1}</p>}
              </div>
              <p className={`mri__stepsd__item__text ${index === currentStepIndex || currentStepIndex > index ? 'active--step' : ''}`}>{step}</p>
            </li>
          ))}
        </ul>
      </div>
      <style jsx>
        {`
          .mri {
          }

          .mri__stepsd {
            display: none;
            flex-direction: column;
            gap: 24px;
            padding: 0 24px;
          }
          .mri__stepsd__item {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          .mri__stepsd__item__text {
            font-size: 16px;
            color: white;
            text-transform: capitalize;
            opacity: 50%;
            font-weight: 600;
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
            font-size: 12px;
            font-weight: 600;
            color: white;
            transform: translate(-50%, -50%);
          }

          .mri__stepsd__item__hexagon__step {
            color: white;
            opacity: 1 !important;
          }

          .active--step {
            opacity: unset;
          }

          @media (min-width: 1024px) {
            .mri__stepsd {
              display: flex;
            }
            .mri__stepsm {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
}

export default StepsIndicatorDesktop;
