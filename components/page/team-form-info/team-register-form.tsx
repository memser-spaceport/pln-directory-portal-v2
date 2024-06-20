'use client';
import useStepsIndicator from '@/hooks/useStepsIndicator';
import { useEffect, useRef, useState } from 'react';
import TeamBasicInfo from './team-basic-info';
import { basicInfoSchema } from '@/schema/team-forms';

function TeamRegisterForm(props: any) {
  const onCloseForm = props.onCloseForm;
  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({ steps: ['basic', 'skills', 'contributions', 'social'], defaultStep: 'basic', uniqueKey: 'register' });
  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState({ protocals: [], isError: false });
  const [basicErrors, setBasicErrors] = useState([]);

  const onFormSubmit = async (e) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      console.log(JSON.stringify(transformObject(Object.fromEntries(formData))));
    }
  };

  const onNextClicked = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const stringifiedData = transformObject(Object.fromEntries(formData));
      if (currentStep === 'basic') {
        const validationResponse = basicInfoSchema.safeParse(stringifiedData);
        if (!validationResponse.success) {
          const formattedErrors = validationResponse.error.errors.reduce((acc, error) => {
            acc.push({ key: error.path[0], message: error.message });
            return acc;
          }, []);
          setBasicErrors(formattedErrors);
          return;
        }
        setBasicErrors([]);
      }
      goToNextStep();
    }
  };

  const onBackClicked = () => {
    goToPreviousStep();
  };

  function transformObject(obj: any) {
    const result: any = {};
    const teams: any = {};
    const contrubutions: any = {};
    const skills: any = {};

    for (const key in obj) {
      if (key.startsWith('teamInfo')) {
        const [teamInfo, subKey] = key.split('-');
        const teamIndex = teamInfo.match(/\d+$/)[0];

        if (!teams[teamIndex]) {
          teams[teamIndex] = {};
        }

        const subKeyName = subKey.replace(/^team/, '');
        teams[teamIndex][subKeyName] = obj[key];
      } else if (key.startsWith('contributionInfo')) {
        const [contributionInfo, subKey] = key.split('-');
        const contributionIndex = contributionInfo.match(/\d+$/)[0];

        if (!contrubutions[contributionIndex]) {
          contrubutions[contributionIndex] = {};
        }

        const subKeyName = subKey.replace(/^contribution/, '');
        contrubutions[contributionIndex][subKeyName] = obj[key];
      } else if (key.startsWith('skillsInfo')) {
        const [skillInfo, subKey] = key.split('-');
        const skillIndex = skillInfo.match(/\d+$/)[0];

        if (!skills[skillIndex]) {
          skills[skillIndex] = {};
        }

        const subKeyName = subKey.replace(/^contribution/, '');
        skills[skillIndex][subKeyName] = obj[key];
      } else {
        //contributionInfo
        result[key] = obj[key];
      }
    }

    result.teams = Object.values(teams);
    result.contributions = Object.values(contrubutions);
    result.skills = Object.values(skills);
    return result;
  }

  useEffect(() => {
    // getTeamsFormOptions();
  }, []);

  return (
    <>
      <form className="rf" onSubmit={onFormSubmit} ref={formRef}>
        <div className="rf__form">
          <div className={currentStep !== 'basic' ? 'hidden' : 'form'}>
            <TeamBasicInfo errors={basicErrors} />
          </div>
          <div className={currentStep !== 'contributions' ? 'hidden' : 'form'}>
            {/* <TeamProjectsInfo /> */}
          </div>
          {/* <div className={currentStep !== 'contributions' ? 'hidden' : 'form'}>
            <MemberContributionInfo />
          </div>
          <div className={currentStep !== 'social' ? 'hidden' : 'form'}>
            <MemberSocialInfo />
          </div>
          <div className={currentStep !== 'skills' ? 'hidden' : 'form'}>
            <MemberSkillsInfo teamsOptions={allData.teams} skillsOptions={allData.skills} />
          </div> */}
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
