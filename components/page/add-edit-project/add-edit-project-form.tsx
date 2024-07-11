'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { EVENTS, PROJECT_FORM_STEPS } from '@/utils/constants';
import { useRef, useState } from 'react';
import ProjectGeneralInfo from './project-general-info';
import ProjectContributorsInfo from './project-contributors-info';
import ProjectKpisInfo from './project-kpis-info';
import { ProjectMoreDetails } from './project-more-details';
import { generalInfoSchema, kpiSchema, projectKpiSchema } from '@/schema/project-form';

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
    kpis: [{ key: '', value: '' }],
    logoUid: '',
    projectLinks: [{ text: '', url: '' }],
    contributingTeams: [],
    contributions: [],
    focusAreas: [],
  };

  const project = props?.project ?? initialValue;

  const [generalErrors, setGeneralErrors] = useState<any>([]);
  const [kpiErrors, setKpiErrors]  = useState<any>([]);

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

    console.log("formattedDaa is", formattedData);
    if (currentStep === 'General') {
      let errors: any = [];
      const result = generalInfoSchema.safeParse(formattedData);
      if (!result.success) {
        errors = result.error.errors.map((v) => v.message);
        const uniqueErrors = Array.from(new Set(errors));
        errors = [...uniqueErrors];
      }

      const imageFile = formattedData?.projectProfile;
      if (imageFile?.name) {
        if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
          errors.push('Please upload image in jpeg or png format');
        } else {
          if (imageFile.size > 4 * 1024 * 1024) {
            errors.push('Please upload a file less than 4MB');
          }
        }
      }

      if (errors.length > 0) {
        setGeneralErrors(errors);
        scrollToTop();
        return;
      }
      setGeneralErrors([]);
      goToNextStep();
    } else if (currentStep === 'KPIs') {
      let errors: any = [];
      const result = kpiSchema.safeParse(formattedData);
      if (!result.success) {
        errors = result.error.errors.map((v) => v.message);
        const uniqueErrors = Array.from(new Set(errors));
        errors = [...uniqueErrors];
      }

      if(errors.length > 0) {
        setKpiErrors([...errors])
        scrollToTop();
        return;
      }

      setKpiErrors([]);
      goToNextStep();
    }
    goToNextStep();
  };

  const onFormSubmitHandler = (event: any) => {
    event.preventDefault();
  };

  function transformObject(object: any) {
    let result: any = {};

    const projectLinks: any = {};
    const kpis: any = {};

    for (const key in object) {
      if (key.startsWith('projectLinks')) {
        const [projectLink, subKey] = key.split('-');
        const projectLinkIndexMatch = projectLink.match(/\d+$/);

        if (projectLinkIndexMatch) {
          const projectLinkIndex = projectLinkIndexMatch[0];
          if (!projectLinks[projectLinkIndex]) {
            projectLinks[projectLinkIndex] = {};
          }
          if (object[key]) {
            projectLinks[projectLinkIndex][subKey] = object[key];
          }
        }
      } else if (key.startsWith('projectKpis')) {
        const [projectKpi, subKey] = key.split('-');
        const projectKpiIndexMatch = projectKpi.match(/\d+$/);
        if (projectKpiIndexMatch) {
          const projectKpiIndex = projectKpiIndexMatch[0];
          if (!kpis[projectKpiIndex]) {
            kpis[projectKpiIndex] = {};
          }
          if (object[key]) {
            kpis[projectKpiIndex][subKey] = object[key];
          }
        }
      } else {
        result[key] = object[key];
      }
    }

    if (object?.lookingForFunding) {
      result = {
        ...result,
        lookingForFunding: true,
      };
    } else {
      result = {
        ...result,
        lookingForFunding: false,
      };
    }

    result.projectLinks = Object.values(projectLinks).filter((link: any) => {
      return Object.keys(link).length > 0;
    });

    result.kpis = Object.values(kpis).filter((kpi: any) => {
      return Object.keys(kpi).length > 0;
    });

    return result;
  }

  function scrollToTop() {
    // window.scrollTo({ top: 0, behavior: 'smooth' });

    document.body.scrollTop = 0;
  }

  return (
    <>
      <form className="addEditForm" ref={addFormRef} onSubmit={onFormSubmitHandler} noValidate>
        <div className="addEditForm__container">
          <div className={`${currentStep === 'General' ? 'form addEditForm__container__general ' : 'hidden'}`}>
            <ProjectGeneralInfo errors={generalErrors} project={project} />
          </div>
          <div className={`${currentStep === 'Contributors' ? 'form' : 'hidden'}`}>
            <ProjectContributorsInfo />
          </div>
          <div className={`${currentStep === 'KPIs' ? 'form' : 'hidden'}`}>
            <ProjectKpisInfo project={project} errors={kpiErrors}/>
          </div>
          <div className={`${currentStep === 'More Details' ? 'form' : 'hidden'}`}>
            <ProjectMoreDetails readMe = {project?.readMe}/>
          </div>
        </div>

        <div className="addEditForm__opts">
          {currentStep === 'General' && (
            <button className="addEditForm__opts__cancel" type="button">
              Cancel
            </button>
          )}

          <div className="addEditForm__opts__acts">
            {currentStep !== 'General' && (
              <div>
                <button type="button" className="addEditForm__opts__acts__back" onClick={goToPreviousStep}>
                  Back
                </button>
              </div>
            )}
            {currentStep !== 'More Details' && (
              <button type="button" className="addEditForm__opts__acts__next" onClick={onNextClicked}>
                Next
              </button>
            )}
            {currentStep === 'More Details' && (
              <div>
                <button type="submit">Submit</button>{' '}
              </div>
            )}
          </div>
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

          .addEditForm__container__general {
            background-color: white;
            padding: 24px 26px;
          }

          .addEditForm__opts {
            height: 60px;
            background-color: white;
            box-shadow: 0px -2px 6px 0px #0f172a29;
            position: fixed;
            bottom: 0;
            width: 100%;
          }

          .addEditForm__opts__acts {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .addEditForm__opts__acts__next {
            background: #156ff7;
            color: white;
            border-radius: 8px;
            padding: 10px 24px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
          }

          .addEditForm__opts__cancel {
            border-radius: 8px;
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
            background-color: white;
            color: #0f172a;
          }

          .addEditForm__opts__acts__back {
            border-radius: 8px;
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
            background-color: white;
            color: #0f172a;
          }

          @media (min-width: 1024px) {
            .addEditForm__container {
              width: 656px;
              border-radius: 8px;
            }

            .addEditForm__container__general {
              background-color: white;
              padding: 32px 54px;
              border-radius: 8px;
            }

            .addEditForm__opts {
              position: unset;
              background-color: unset;
              box-shadow: unset;
              margin-top: 20px;
              margin-bottom: 20px;
              display: flex;
              gap: 8px;
              align-items: center;
              justify-content: end;
            }
          }
        `}
      </style>
    </>
  );
}
