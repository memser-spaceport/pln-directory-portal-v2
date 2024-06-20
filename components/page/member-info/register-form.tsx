'use client';
import MemberBasicInfo from '@/components/page/member-info/member-basic-info';
import MemberContributionInfo from '@/components/page/member-info/member-contributions-info';
import MemberSkillsInfo from '@/components/page/member-info/member-skills-info';
import MemberSocialInfo from '@/components/page/member-info/member-social-info';
import useStepsIndicator from '@/hooks/useStepsIndicator';
import { TeamAndSkillsInfoSchema, basicInfoSchema } from '@/schema/member-forms';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

function RegisterForm(props) {
  const onCloseForm = props.onCloseForm;
  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({ steps: ['basic', 'skills', 'contributions', 'social'], defaultStep: 'basic', uniqueKey: 'register' });
  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState({ teams: [], projects: [], skills: [], isError: false });

  const [basicErrors, setBasicErrors] = useState<string[]>([]);
  const [contributionErrors, setContributionErrors] = useState<string[]>([]);
  const [skillsErrors, setSkillsErrors] = useState<string[]>([]);
  const [socialErrors, setSocialErrors] = useState<string[]>([]);

  const onFormSubmit = async (e) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      console.log(JSON.stringify(transformObject(Object.fromEntries(formData))));
    }
  };

  const onNextClicked = () => {
    if (!formRef.current) {
      return;
    }
    const formData = new FormData(formRef.current);
    const formattedData = transformObject(Object.fromEntries(formData));
    console.log(formattedData);
    if (currentStep === 'basic') {
      const result = basicInfoSchema.safeParse(formattedData);
      if (!result.success) {
        setBasicErrors(result.error.errors.map((v) => v.message));
        return;
      }
      setBasicErrors([]);
    } else if (currentStep === 'skills') {
      const result = TeamAndSkillsInfoSchema.safeParse(formattedData);
      if (!result.success) {
        console.log(result.error.errors);
        setSkillsErrors(result.error.errors.map((v) => v.message));
        return;
      }
      setSkillsErrors([]);
    }

    goToNextStep();
  };

  const onBackClicked = () => {
    goToPreviousStep();
  };

  function transformObject(obj: any) {
    const result: any = {};
    const teamAndRoles: any = {};
    const projectContributions: any = {};
    const skills: any = {};

    for (const key in obj) {
      if (key.startsWith('teamInfo')) {
        const [teamInfo, subKey] = key.split('-');
        const teamIndex = teamInfo.match(/\d+$/)[0];

        if (!teamAndRoles[teamIndex]) {
          teamAndRoles[teamIndex] = {};
        }

        teamAndRoles[teamIndex][subKey] = obj[key];
      } else if (key.startsWith('contributionInfo')) {
        const [contributionInfo, subKey] = key.split('-');
        const contributionIndex = contributionInfo.match(/\d+$/)[0];

        if (!projectContributions[contributionIndex]) {
          projectContributions[contributionIndex] = {};
        }
        projectContributions[contributionIndex][subKey] = obj[key];
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

    result.teamAndRoles = Object.values(teamAndRoles);
    result.projectContributions = Object.values(projectContributions);
    result.skills = Object.values(skills);
    return result;
  }

  const getFormOptions = async () => {
    const [teamsInfo, projectsInfo, skillsInfo] = await Promise.all([
      fetch(`${process.env.DIRECTORY_API_URL}/v1/teams`, { method: 'GET' }),
      fetch(`${process.env.DIRECTORY_API_URL}/v1/projects`, { method: 'GET' }),
      fetch(`${process.env.DIRECTORY_API_URL}/v1/skills`, { method: 'GET' }),
    ]);
    if (!teamsInfo.ok || !projectsInfo.ok || !skillsInfo.ok) {
      return { isError: true };
    }

    const teamsData = await teamsInfo.json();
    const projectsData = await projectsInfo.json();
    const skillsData = await skillsInfo.json();

    return {
      teams: teamsData.map((d) => {
        return {
          teamUid: d.uid,
          teamTitle: d.name,
          role: '',
        };
      }),
      skills: skillsData.map((d) => {
        return {
          id: d.uid,
          name: d.title,
        };
      }),
      projects: projectsData,
    };
  };

  useEffect(() => {
    getFormOptions()
      .then((d) => {
        if (!d.isError) {
          console.log(d);
          setAllData(d);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  return (
    <>
      <form className="rf" onSubmit={onFormSubmit} ref={formRef}>
        <div className="rf__form">
          <div className={currentStep !== 'basic' ? 'hidden' : 'form'}>
            <MemberBasicInfo errors={basicErrors} />
          </div>
          <div className={currentStep !== 'contributions' ? 'hidden' : 'form'}>
            <MemberContributionInfo projectOptions={allData.projects} errors={contributionErrors} />
          </div>
          <div className={currentStep !== 'social' ? 'hidden' : 'form'}>
            <MemberSocialInfo errors={socialErrors} />
          </div>
          <div className={currentStep !== 'skills' ? 'hidden' : 'form'}>
            <MemberSkillsInfo errors={skillsErrors} teamsOptions={allData.teams} skillsOptions={allData.skills} />
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

export default RegisterForm;
