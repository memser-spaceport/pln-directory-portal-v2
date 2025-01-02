'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { EVENTS, PROJECT_FORM_STEPS } from '@/utils/constants';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function FormStepIndicatorWeb() {
  const { currentStep } = useStepsIndicator({ steps: PROJECT_FORM_STEPS, defaultStep: 'General', uniqueKey: 'add-project' });

  const currentStepIndex = PROJECT_FORM_STEPS.findIndex((v: string) => v === currentStep);

  const activeIcon = '/icons/polygon-blue.svg';
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
      <div className="formstep">
        <div className="formstep__header">
          <h1 className="formstep__header__title">Add Project {currentStep}</h1>

          <p className="formstep__header__desc">Share your project details</p>
        </div>

        <div className="formstep__body">
          {PROJECT_FORM_STEPS?.map((step: string, index: number) => (
            <div className="formstep__body__step" key={`${step} + ${index}`}>
              <div className="formstep__body__step__imgc">
                <img className="formstep__body__step__imgc__img" src={getStepImageSrc(index)} alt="step icon" width="24" height="24" />
                {currentStepIndex <= index && <p className={`formstep__body__step__imgc__img__count ${(currentStepIndex === index ) ? 'currentStep' : ''}`}>{index + 1}</p>}
              </div>
              <div>{step} </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>
        {`
          .formstep {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .formstep__header {
            display: flex;
            flex-direction: column;
            padding-bottom: 16px;
            gap: 8px;
            border-bottom: 1px solid #e7e8ea;
          }

          .formstep__header__title {
            font-weight: 700;
            font-size: 24px;
            line-height: 29px;
            color: #0f172a;
          }

          .formstep__header__desc {
            font-size: 14px;
            font-weight: 400;
            line-height: 24px;
            color: #F172A;
          }

          .formstep__body__step {
            height: 48px;
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .formstep__body__step__imgc {
          position: relative;
            height: 24px;
            width: 24px;
          }

          .formstep__body__step__imgc__img {
          }

          .formstep__body__step__imgc__img__count {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color:  #475569;
            font-size: 14px;
          }

          .currentStep {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          color: black;
          }
        `}
      </style>
    </>
  );
}
