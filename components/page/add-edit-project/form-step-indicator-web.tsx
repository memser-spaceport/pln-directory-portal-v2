'use client'

import useStepsIndicator from "@/hooks/useStepsIndicator";
import { EVENTS, PROJECT_FORM_STEPS } from "@/utils/constants";
import { useEffect, useState } from "react";



export function FormStepIndicatorWeb() {

    const { currentStep } = useStepsIndicator({ steps: PROJECT_FORM_STEPS, defaultStep: 'General', uniqueKey: 'register' });
    return <>

        <div className="formstep">
            {PROJECT_FORM_STEPS?.map((step: string, index: number) => (

                <div key={`${step} + ${index}`}>
                {step}
                    </div>
            ))}
        </div>

        <style jsx>
            {
                `
                .formstep {
                display: flex;
                flex-direction: column;
                }
                `
            }
        </style>
    </>
}