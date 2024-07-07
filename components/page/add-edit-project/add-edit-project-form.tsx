'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { EVENTS, PROJECT_FORM_STEPS } from '@/utils/constants';
import { useRef, useState } from 'react';
import ProjectGeneralInfo from './project-general-info';
import ProjectContributorsInfo from './project-contributors-info';
import ProjectKpisInfo from './project-kpis-info';
import { ProjectMoreDetails } from './project-more-details';

export default function AddEditProjectForm(props: any) {
  const addFormRef = useRef(null);

  const initialValue = {
    name: '',
    tagline: '',
    description: '',
    lookingForFunding: false,
    readMe:
      '## Sample Template\n### Goals \nExplain the problems, use case or user goals this project focuses on\n### Proposed Solution\nHow will this project solve the user problems & achieve it’s goals\n### Milestones\n| Milestone | Milestone Description | When |\n| - | - | - |\n| content | content | content |\n| content | content | content |\n                \n### Contributing Members\n| Member Name | Member Role | GH Handle | Twitter/Telegram |\n| - | - | - | - |\n| content | content | content | content |\n| content | content | content | content |\n\n### Reference Documents\n- [Reference Document](https://plsummit23.labweek.io/)\n\n',
    maintainingTeamUid: '',
    contactEmail: '',
    kpis: [],
    logoUid: '',
    projectLinks: [],
    contributingTeams: [],
    contributions: [],
    focusAreas: [],
  };

  const project = props?.project ?? initialValue;

  const [basicErrors, setBasicErrors] = useState([]);

  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({
    steps: PROJECT_FORM_STEPS,
    defaultStep: 'General',
    uniqueKey: 'add-project',
  });

  const onNextClicked = () => {
    goToNextStep();
  };

  const onFormSubmitHandler = (event: any) => {
    event.preventDefault();
  };

  return (
    <>
      <form ref={addFormRef} onSubmit={onFormSubmitHandler} noValidate>
        <div>
          <div className={`${currentStep === 'General' ? 'form' : 'hidden'}`}>
            <ProjectGeneralInfo errors={basicErrors} project = {project} />
          </div>
          <div className={`${currentStep === 'Contributors' ? 'form' : 'hidden'}`}>
            <ProjectContributorsInfo />
          </div>
          <div className={`${currentStep === 'KPIs' ? 'form' : 'hidden'}`}>
            <ProjectKpisInfo />
          </div>
          <div className={`${currentStep === 'More Details' ? 'form' : 'hidden'}`}>
            <ProjectMoreDetails />
          </div>
        </div>

        <div>
          {currentStep !== 'General' && (
            <div>
              <button type="button" onClick={goToPreviousStep}>
                Back
              </button>
            </div>
          )}
          {currentStep !== 'More Details' && (
            <div>
              <button type="button" onClick={goToNextStep}>
                Next
              </button>
            </div>
          )}
          {currentStep === 'More Details' && (
            <div>
              <button type="submit">Submit</button>{' '}
            </div>
          )}
        </div>
      </form>
      <style jsx>
        {`

          .hidden {
            visibility: hidden;
            height: 0;
            overflow: hidden;
          }

          .form {
            visibility: default;
          }
        `}
      </style>
    </>
  );
}
