import { useEffect, useState } from 'react';

interface useStepsIndicatorProps {
  steps: string[];
  defaultStep?: string;
  uniqueKey: string;
}
function useStepsIndicator(props: useStepsIndicatorProps) {
  const steps = props.steps;
  const defaultStep = props?.defaultStep ?? steps.length > 0 ? steps[0] : '';
  const uniqueKey = props?.uniqueKey;
  const [currentStep, setStep] = useState(defaultStep);

  const setCurrentStep = (stepName: string) => {
    document.dispatchEvent(new CustomEvent(`${uniqueKey}-set-step`, { detail: stepName }));
  };

  const goToNextStep = () => {
    const currentStepIndex = steps.findIndex(v => v === currentStep);
    if(currentStepIndex >= 0 && currentStepIndex - 1 < steps.length) {
      setCurrentStep(steps[currentStepIndex + 1])
    }
  }

  const goToPreviousStep = () => {
    const currentStepIndex = steps.findIndex(v => v === currentStep);
    if(currentStepIndex > 0 ) {
      setCurrentStep(steps[currentStepIndex - 1])
    }
  }

  useEffect(() => {
    function handler(e: any) {
      setStep(e.detail);
    }
    document.addEventListener(`${uniqueKey}-set-step`, handler);
    return function () {
      document.removeEventListener(`${uniqueKey}-set-step`, handler);
    };
  }, []);
  return { currentStep, setCurrentStep, goToNextStep, goToPreviousStep };
}

export default useStepsIndicator;
