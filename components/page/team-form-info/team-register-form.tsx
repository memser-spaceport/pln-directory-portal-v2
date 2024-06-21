'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { FormEvent, useEffect, useRef, useState } from 'react';
import TeamBasicInfo from './team-basic-info';
import { basicInfoSchema, projectDetailsSchema, socialSchema } from '@/schema/team-forms';
import { getTeamsFormOptions } from '@/services/registration.service';
import TeamProjectsInfo from './team-projects-info';
import TeamSocialInfo from './team-social-info';

interface ITeamRegisterForm {
  onCloseForm: () => void;
}

function TeamRegisterForm(props: ITeamRegisterForm) {
  const onCloseForm = props.onCloseForm;
  const { currentStep, goToNextStep, goToPreviousStep } = useStepsIndicator({ steps: ['basic', 'project details', 'social'], defaultStep: 'basic', uniqueKey: 'register' });
  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState({ technologies: [], fundingStage: [], membershipSources: [], industryTags: [], isError: false });
  const [basicErrors, setBasicErrors] = useState([]);
  const [projectDetailsErrors, setProjectDetailsErrors] = useState([]);
  const [socialErrors, setSocialErrors] = useState([]);

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformObject(Object.fromEntries(formData));
      if (currentStep === 'social') {
        const validationResponse = validateForm(socialSchema, formattedData);
        if (!validationResponse?.success) {
          setSocialErrors(validationResponse.errors);
          return;
        }
        setSocialErrors([]);
        console.log('final', formattedData);
      }
    }
  };

  const validateForm = (schema: any, data: any) => {
    const validationResponse = schema.safeParse(data);
    if (!validationResponse.success) {
      const formattedErrors = validationResponse.error.errors.map((error: any) => ({
        key: error.path[0],
        message: error.message,
      }));
      return { success: false, errors: formattedErrors };
    }
    return { success: true, errors: [] };
  };

  const onNextClicked = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformObject(Object.fromEntries(formData));
      if (currentStep === 'basic') {
        const validationResponse = validateForm(basicInfoSchema, formattedData);
        if (!validationResponse.success) {
          setBasicErrors(validationResponse.errors);
          return;
        }
        setBasicErrors([]);
      } else if (currentStep === 'project details') {
        const validationResponse = validateForm(projectDetailsSchema, formattedData);
        if (!validationResponse.success) {
          setProjectDetailsErrors(validationResponse.errors);
          return;
        }
        setProjectDetailsErrors([]);
      }
      goToNextStep();
    }
  };

  const onBackClicked = () => {
    goToPreviousStep();
  };

  function transformObject(obj: any) {
    const result: any = {};
    const fundingStage: any = {};
    const technologies: any = {};
    const membershipResources: any = {};
    const industryTags: any = {};

    for (const key in obj) {
      if (key.startsWith('fundingStage')) {
        const subKey = key.split('-')[1];
        fundingStage[subKey] = obj[key];
      } else if (key.startsWith('technology')) {
        const [technology, subKey] = key.split('-');
        const technologyIndexMatch = technology?.match(/\d+$/);
        if (technologyIndexMatch) {
          const technologyIndex = technologyIndexMatch[0];
          if (!technologies[technologyIndex]) {
            technologies[technologyIndex] = {};
          }
          technologies[technologyIndex][subKey] = obj[key];
        }
      } else if (key.startsWith('membershipResource')) {
        const [membershipResource, subKey] = key.split('-');
        const membershipResourceIndexMatch = membershipResource.match(/\d+$/);
        if (membershipResourceIndexMatch) {
          const membershipResourceIndex = membershipResourceIndexMatch[0];
          if (!membershipResources[membershipResourceIndex]) {
            membershipResources[membershipResourceIndex] = {};
          }
          membershipResources[membershipResourceIndex][subKey] = obj[key];
        }
      } else if (key.startsWith('industryTag')) {
        const [industryTag, subKey] = key.split('-');
        const industryTagIndexMatch = industryTag.match(/\d+$/);
        if (industryTagIndexMatch) {
          const industryTagIndex = industryTagIndexMatch[0];
          if (!industryTags[industryTagIndex]) {
            industryTags[industryTagIndex] = {};
          }
          industryTags[industryTagIndex][subKey] = obj[key];
        }
      } else {
        result[key] = obj[key];
      }
    }

    result.fundingStage = fundingStage;
    result.technologies = Object.values(technologies);
    result.membershipResources = Object.values(membershipResources);
    result.industryTags = Object.values(industryTags);
    return result;
  }

  useEffect(() => {
    getTeamsFormOptions()
      .then((d) => {
        if (!d.isError) {
          setAllData(d as any);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  return (
    <>
      <form className="rf" onSubmit={onFormSubmit} ref={formRef}>
        <div className="rf__form">
          <div className={currentStep !== 'basic' ? 'hidden' : 'form'}>
            <TeamBasicInfo errors={basicErrors} />
          </div>
          <div className={currentStep !== 'project details' ? 'hidden' : 'form'}>
            <TeamProjectsInfo
              errors={projectDetailsErrors}
              protocolOptions={allData?.technologies}
              fundingStageOptions={allData?.fundingStage}
              membershipResourceOptions={allData?.membershipSources}
              industryTagOptions={allData?.industryTags}
            />
          </div>
          <div className={currentStep !== 'social' ? 'hidden' : 'form'}>
            <TeamSocialInfo errors={socialErrors} />
          </div>
        </div>
        <div className="rf__actions">
          {currentStep === 'basic' && (
            <button onClick={onCloseForm} className="rf__actions__cancel" type="button">
              Cancel
            </button>
          )}
          {currentStep !== 'basic' && (
            <button className="rf__actions__back" onClick={onBackClicked} type="button">
              Back
            </button>
          )}
          {currentStep !== 'social' && (
            <button className="rf__actions__next" onClick={onNextClicked} type="button">
              Next
            </button>
          )}
          {currentStep === 'social' && (
            <button className="rf__actions__submit" type="submit">
              Submit
            </button>
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
          .rf {
            width: 100%;
            position: relative;
            height: 100%;
          }
          .rf__form {
            padding: 24px;
            height: calc(100% - 70px);
            overflow-y: auto;
          }
          .form {
            height: 100%;
            width: 100%;
          }

          .rf__actions {
            position: sticky;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 32px;
            border-top: 1px solid #e2e8f0;
            background: white;
            width: 100%;
          }

          .rf__actions__cancel,
          .rf__actions__back {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          }
          .rf__actions__next,
          .rf__actions__submit {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #156ff7;
            cursor: pointer;
            color: white;
            font-size: 14px;
            font-weight: 500;
          }
          @media (min-width: 1200px) {
            .rf__form {
              padding: 24px 32px;
              overflow-y: auto;
            }
            .rf__actions {
              position: relative;
            }
          }
        `}
      </style>
    </>
  );
}

export default TeamRegisterForm;
