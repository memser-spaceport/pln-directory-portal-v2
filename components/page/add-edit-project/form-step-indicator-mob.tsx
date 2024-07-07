'use client';

import useStepsIndicator from "@/hooks/useStepsIndicator";
import { PROJECT_FORM_STEPS } from "@/utils/constants";
import { useState } from "react";

export default function FormStepIndicatorMob (props: any) {


    const { currentStep } = useStepsIndicator({ steps: PROJECT_FORM_STEPS, defaultStep: 'General', uniqueKey: 'register' });
    const currentStepIndex = PROJECT_FORM_STEPS.findIndex((v: string) => v === currentStep);

    return (
        <div>
            {currentStep}
        </div>
    )
}