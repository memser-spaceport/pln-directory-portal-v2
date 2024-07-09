'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { EVENTS, PROJECT_FORM_STEPS } from '@/utils/constants';
import { useRef, useState } from 'react';
import ProjectGeneralInfo from './project-general-info';
import ProjectContributorsInfo from './project-contributors-info';
import ProjectKpisInfo from './project-kpis-info';
import { ProjectMoreDetails } from './project-more-details';
import { generalInfoSchema } from '@/schema/project-form';

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
    projectLinks: [{ text: '', url: '' }],
    contributingTeams: [],
    contributions: [],
    focusAreas: [],
  };

  const project = props?.project ?? initialValue;

  const [generalErrors, setGeneralErrors] = useState<any>([]);

  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({
    steps: PROJECT_FORM_STEPS,
    defaultStep: 'General',
    uniqueKey: 'add-project',
  });

  const onNextClicked = () => {
    if (!addFormRef.current) {
      return;
    }

    const formData = new FormData(addFormRef.current);
    const formattedData = transformObject(Object.fromEntries(formData));
    if (currentStep === 'General') {
      let errors: any = [];
      const result = generalInfoSchema.safeParse(formattedData);
      if(!result.success) {
         errors  = result.error.errors.map((v) => v.message);
        const uniqueErrors = Array.from(new Set(errors));
        errors = [...uniqueErrors];
      }

      const imageFile  = formattedData?.projectProfile;
      if (imageFile?.name) {
        if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
          errors.push('Please upload image in jpeg or png format');
        } else {
          if (imageFile.size > 4 * 1024 * 1024) {
            errors.push('Please upload a file less than 4MB');
          }
        }
      }

      if(errors.length > 0) {
        setGeneralErrors(errors);
        scrollToTop();
        return;
      }
      setGeneralErrors([]);
      goToNextStep();
    }
  };


  
  const onFormSubmitHandler = (event: any) => {
    event.preventDefault();
  };

  function transformObject(object: any) {
    let result: any = {};

    const projectLinks: any = {};

    for (const key in object) {
      if (key.startsWith('projectLinks')) {
        const [projectLink, subKey] = key.split('-');
        const projectLinkIndexMatch = projectLink.match(/\d+$/);

        if (projectLinkIndexMatch) {
          const projectLinkIndex = projectLinkIndexMatch[0];
          if (!projectLinks[projectLinkIndex]) {
            projectLinks[projectLinkIndex] = {};
          }
          if(object[key]) {
          projectLinks[projectLinkIndex][subKey] = object[key];
          }
        }
      }
      else {
        result[key] = object[key];
      }
    }

    if(object?.lookingForFunding) {
      result = {
        ...result,
        lookingForFunding: true,
      }
    } else {
      result = {
        ...result,
        lookingForFunding: false,
      }
    }

    result.projectLinks = Object.values(projectLinks).filter((link: any) => {
      return Object.keys(link).length > 0;
    });

  
 
    return result;
  }

  function scrollToTop () {
    // window.scrollTo({ top: 0, behavior: 'smooth' });

document.body.scrollTop = 0;
  }

  return (
    <>
      <form ref={addFormRef} onSubmit={onFormSubmitHandler} noValidate>
        <div>
          <div className={`${currentStep === 'General' ? 'form' : 'hidden'}`}>
            <ProjectGeneralInfo errors={generalErrors} project={project} />
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
              <button type="button" onClick={onNextClicked}>
                Next
              </button>
            </div>
          )}
               <button type="reset">
                Reset
              </button>
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
