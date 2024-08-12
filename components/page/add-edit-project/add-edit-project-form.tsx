'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { EVENTS, PROJECT_FORM_STEPS, TOAST_MESSAGES } from '@/utils/constants';
import { SyntheticEvent, useRef, useState } from 'react';
import ProjectGeneralInfo from './project-general-info';
import ProjectContributorsInfo from './project-contributors-info';
import ProjectKpisInfo from './project-kpis-info';
import { ProjectMoreDetails } from './project-more-details';
import { generalInfoSchema, kpiSchema, projectKpiSchema } from '@/schema/project-form';
import { saveRegistrationImage } from '@/services/registration.service';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { addProject, updateProject } from '@/services/projects.service';
import { useRouter } from 'next/navigation';
import { getAnalyticsUserInfo, getParsedValue, triggerLoader } from '@/utils/common.utils';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { IUserInfo } from '@/types/shared.types';
import { IProjectResponse } from '@/types/project.types';

interface IAddEditProjectForm {
  userInfo: IUserInfo;
  project: IProjectResponse;
}

export default function AddEditProjectForm(props: any) {
  const addFormRef = useRef(null);
  const userInfo = props.userInfo;
  const initialValue = {
    name: '',
    tagline: '',
    description: '',
    lookingForFunding: false,
    readMe:
      '## Sample Template\n### Goals \nExplain the problems, use case or user goals this project focuses on\n### Proposed Solution\nHow will this project solve the user problems & achieve it’s goals\n### Milestones\n| Milestone | Milestone Description | When |\n| - | - | - |\n| content | content | content |\n| content | content | content |\n                \n### Contributing Members\n| Member Name | Member Role | GH Handle | Twitter/Telegram |\n| - | - | - | - |\n| content | content | content | content |\n| content | content | content | content |\n\n### Reference Documents\n- [Reference Document](https://plsummit23.labweek.io/)\n\n',
    maintainingTeamUid: '',
    contactEmail: userInfo?.email ?? null,
    kpis: [{ key: '', value: '' }],
    logoUid: null,
    projectLinks: [{ text: '', url: '' }],
    contributingTeams: [],
    contributions: [],
    focusAreas: [],
  };

  const project = props?.project ?? initialValue;
  const type = props?.type;

  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [kpiErrors, setKpiErrors] = useState<string[]>([]);
  const [contributorsErrors, setcontributorsErrors] = useState<string[]>([]);

  const analytics = useProjectAnalytics();

  const router = useRouter();

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
      let errors: string[] = [];
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
      let errors: string[] = [];
      const result = kpiSchema.safeParse(formattedData);
      if (!result.success) {
        errors = result.error.errors.map((v) => v.message);
        const uniqueErrors = Array.from(new Set(errors));
        errors = [...uniqueErrors];
      }

      if (errors.length > 0) {
        setKpiErrors([...errors]);
        scrollToTop();
        return;
      }
      setKpiErrors([]);
    } else if (currentStep === 'Contributors') {
      if (!formattedData.maintainingTeamUid) {
        const error = [];
        error.push('Please add maintainer team details');
        setcontributorsErrors(error);
        return;
      } else {
        setcontributorsErrors([]);
      }
    }
    document.body.scrollTop = 0;
    goToNextStep();
  };

  const onBackClicked = () => {
    document.body.scrollTop = 0;
    goToPreviousStep();
  }

  const onFormSubmitHandler = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (!addFormRef?.current) {
      return;
    }
    try {
      triggerLoader(true);
      const formData = new FormData(addFormRef.current);

      let formattedData = transformObject(Object.fromEntries(formData));
      formattedData = {
        ...formattedData,
        logoUid: project?.logoUid,
      }

      if (type === 'Add') {
        analytics.onProjectAddSaveClicked();
      } else {
        analytics.onProjectEditSaveClicked(project?.id);
      }

      if (formattedData?.projectProfile?.size > 0) {
        const imgResponse = await saveRegistrationImage(formattedData?.projectProfile);
        const image = imgResponse?.image;
        formattedData.logoUid = image.uid;
      } else if (formattedData?.logoUid && !formattedData?.imageFile) {
        formattedData.logoUid = null;
      }

      const authToken = getParsedValue(Cookies.get('authToken'));

      if (!authToken) {
        toast.success(TOAST_MESSAGES.LOGOUT_MSG);
        router.push('/');
        triggerLoader(false);
        return;
      }

      delete formattedData["imageFile"];
      delete formattedData["projectProfile"];

      if (type === 'Add') {
        analytics.onProjectAddInitiated(getAnalyticsUserInfo(userInfo), formattedData);
        const result = await addProject(formattedData, authToken);
        if (result?.error) {
          analytics.onProjectAddFailed(getAnalyticsUserInfo(userInfo), formattedData);
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          triggerLoader(false);
          return;
        }
        analytics.onProjectAddSuccess(getAnalyticsUserInfo(userInfo), formattedData);
        triggerLoader(false);
        router.push('/projects');
        toast.info('Project added successfully.');
      }

      if (type === 'Edit') {
        analytics.onProjectEditInitiated(getAnalyticsUserInfo(userInfo), formattedData);
        const deletedContributorsIds: string[] = [];
        const previousContributors = project?.contributions ?? [];
        const currentContributors = formattedData?.contributions ?? [];

        for (const contributor of previousContributors) {
          const isDeleted = !currentContributors.some((crt: any) => crt?.memberUid === contributor.uid);
          if (isDeleted) {
            deletedContributorsIds.push(contributor.uid);
          }
        }
        const updatedCurrentContributors = previousContributors
          ?.filter((contributor: any) => deletedContributorsIds?.includes(contributor?.uid))
          .map((ctr: any) => {
            return {
              memberUid: ctr.uid,
              uid: ctr.cuid,
              isDeleted: true,
            };
          });

        formattedData = {
          ...formattedData,
          contributions: [...updatedCurrentContributors, ...currentContributors],
        };
        const result = await updateProject(project?.id, formattedData, authToken);
        if (result?.error) {
          analytics.onProjectEditFailed(getAnalyticsUserInfo(userInfo), formattedData, project?.id);
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          triggerLoader(false);
          return;
        }
        analytics.onProjectEditSuccess(getAnalyticsUserInfo(userInfo), formattedData, project?.id);
        triggerLoader(false);
        toast.info('Project updated successfully.');
        router.push(`/projects/${project?.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      triggerLoader(false);
    }
  };

  function transformObject(object: any) {
    let result: any = {};
    const projectLinks: any = {};
    const kpis: any = {};
    const contributingTeams: any = {};
    const contributions: any = {};

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
      } else if (key.startsWith('contributingTeams')) {
        const [contributingTeam, subKey] = key.split('-');
        const contributingTeamIndexMatch = contributingTeam.match(/\d+$/);
        if (contributingTeamIndexMatch) {
          const contributingTeamIndex = contributingTeamIndexMatch[0];
          if (!contributingTeams[contributingTeamIndex]) {
            contributingTeams[contributingTeamIndex] = {};
          }
          if (object[key]) {
            contributingTeams[contributingTeamIndex][subKey] = object[key];
          }
        }
      } else if (key.startsWith('contributions')) {
        const [teamContributions, subKey] = key.split('-');
        const contributionsIndexMatch = teamContributions.match(/\d+$/);
        if (contributionsIndexMatch) {
          const contributionsTeamIndex = contributionsIndexMatch[0];
          if (!contributions[contributionsTeamIndex]) {
            contributions[contributionsTeamIndex] = {};
          }
          if (object[key]) {
            contributions[contributionsTeamIndex][subKey] = object[key];
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

    result.contributingTeams = Object.values(contributingTeams);
    result.contributions = Object.values(contributions);
    result.focusAreas = [];
    return result;
  }

  function scrollToTop() {
    document.body.scrollTop = 0;
  }

  const onCancelClicHandler = () => {
    if (type === 'Edit') {
      analytics.onProjectEditCancelClicked(project?.id);
    } else {
      analytics.onProjectAddCancelClicked();
    }
    router.back();
  };

  return (
    <>
      <form className="addEditForm" ref={addFormRef} onSubmit={onFormSubmitHandler} noValidate>
        <div className="addEditForm__container">
          <div className={`${currentStep === 'General' ? 'form addEditForm__container__general ' : 'hidden'}`}>
            <ProjectGeneralInfo errors={generalErrors} project={project} />
          </div>
          <div className={`${currentStep === 'Contributors' ? 'form' : 'hidden'}`}>
            <ProjectContributorsInfo project={project} errors={contributorsErrors} />
          </div>
          <div className={`${currentStep === 'KPIs' ? 'form' : 'hidden'}`}>
            <ProjectKpisInfo project={project} errors={kpiErrors} />
          </div>
          <div className={`${currentStep === 'More Details' ? 'form' : 'hidden'}`}>
            <ProjectMoreDetails readMe={project?.readMe} />
          </div>
        </div>

        <div className="addEditForm__opts">
          <div>
            {currentStep === 'General' && (
              <button onClick={onCancelClicHandler} className="addEditForm__opts__cancel" type="button">
                Cancel
              </button>
            )}
          </div>

          <div className="addEditForm__opts__acts">
            {currentStep !== 'General' && (
              <div>
                <button type="button" className="addEditForm__opts__acts__back" onClick={onBackClicked}>
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
                {type === 'Add' && (
                  <button className="addEditForm__opts__acts__next" type="submit">
                    Add Project
                  </button>
                )}
                {type === 'Edit' && (
                  <button className="addEditForm__opts__acts__next" type="submit">
                    Update Project
                  </button>
                )}
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
            padding-bottom: 80px;
          }

          .addEditForm__opts {
            height: 60px;
            background-color: white;
            box-shadow: 0px -2px 6px 0px #0f172a29;
            position: fixed;
            bottom: 0;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            display: flex;
            gap: 8px;
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
            height: fit-content;
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

            . .addEditForm__container__general {
              padding-bottom: unset;
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
