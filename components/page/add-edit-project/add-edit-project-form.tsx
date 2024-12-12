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

// Define the props for the AddEditProjectForm component
interface IAddEditProjectFormProps {
  userInfo: IUserInfo;
  project: IProjectResponse;
  type: 'Add' | 'Edit';
}

export default function AddEditProjectForm({ userInfo, project, type }: any) {
  const addFormRef = useRef<HTMLFormElement | null>(null);
  const initialValue: any = {
    name: '',
    tagline: '',
    description: '',
    lookingForFunding: false,
    readMe:
      '## Sample Template\n### Goals \nExplain the problems, use case or user goals this project focuses on\n### Proposed Solution\nHow will this project solve the user problems & achieve it’s goals\n### Milestones\n| Milestone | Milestone Description | When |\n| - | - | - |\n| content | content | content |\n| content | content | content |\n                \n### Contributing People\n| People Name | People Role | GH Handle | Twitter/Telegram |\n| - | - | - | - |\n| content | content | content | content |\n| content | content | content | content |\n\n### Reference Documents\n- [Reference Document](https://plsummit23.labweek.io/)\n\n',
    maintainingTeamUid: '',
    contactEmail: userInfo?.email ?? null,
    kpis: [{ key: '', value: '' }],
    logoUid: null,
    projectLinks: [{ text: '', url: '' }],
    contributingTeams: [],
    contributions: [],
    focusAreas: [],
  };

  const projectData = project ?? initialValue;
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [kpiErrors, setKpiErrors] = useState<string[]>([]);
  const [contributorsErrors, setContributorsErrors] = useState<string[]>([]);
  const [content, setContent] = useState<string>(projectData?.description ?? '');

  const analytics = useProjectAnalytics();
  const router = useRouter();

  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({
    steps: PROJECT_FORM_STEPS,
    defaultStep: 'General',
    uniqueKey: 'add-project',
  });

  // Handles the click event for the "Next" button
  const onNextClicked = () => {
    if (!addFormRef.current) {
      return;
    }
    const formData = new FormData(addFormRef.current);
    const formattedData = transformObject(Object.fromEntries(formData));

    // formattedData['description'] = content;
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
        setContributorsErrors(error);
        return;
      } else {
        setContributorsErrors([]);
      }
    }
    document.body.scrollTop = 0;
    goToNextStep();
  };

  // Handles the click event for the "Back" button
  const onBackClicked = () => {
    document.body.scrollTop = 0;
    goToPreviousStep();
  }

  // Handles the form submission
  const onFormSubmitHandler = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (!addFormRef?.current) {
      return;
    }
    try {
      triggerLoader(true);
      const formData = new FormData(addFormRef.current);

      let formattedData = transformObject(Object.fromEntries(formData));
      formattedData.description = content;
      formattedData = {
        ...formattedData,
        logoUid: projectData?.logoUid,
      }

      if (type === 'Add') {
        analytics.onProjectAddSaveClicked();
      } else {
        analytics.onProjectEditSaveClicked(projectData?.id);
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
        const previousContributors = projectData?.contributions ?? [];
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
        const result = await updateProject(projectData?.id, formattedData, authToken);
        if (result?.error) {
          analytics.onProjectEditFailed(getAnalyticsUserInfo(userInfo), formattedData, projectData?.id);
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          triggerLoader(false);
          return;
        }
        analytics.onProjectEditSuccess(getAnalyticsUserInfo(userInfo), formattedData, projectData?.id);
        triggerLoader(false);
        toast.info('Project updated successfully.');
        router.push(`/projects/${projectData?.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      triggerLoader(false);
    }
  };

  // Transforms the form data into the desired format
  function transformObject(object: Record<string, string | File>): any {
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
      } else if (key.startsWith('rich-text-editor')) {
        result['description'] = object[key];
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

  // Scrolls the page to the top
  function scrollToTop() {
    document.body.scrollTop = 0;
  }

  // Handles the click event for the "Cancel" button
  const onCancelClickHandler = () => {
    if (type === 'Edit') {
      analytics.onProjectEditCancelClicked(projectData?.id);
    } else {
      analytics.onProjectAddCancelClicked();
    }
    router.back();
  };

  return (
    <>
      <form className="add-edit-form" ref={addFormRef} onSubmit={onFormSubmitHandler} noValidate data-testid="add-edit-project-form">
        <div className="add-edit-form__container" data-testid="form-container">
          <div className={`${currentStep === 'General' ? 'add-edit-form__container--general' : 'hidden'}`} data-testid="general-info">
            <ProjectGeneralInfo errors={generalErrors} project={projectData} longDesc={content} setLongDesc={setContent} />
          </div>
          <div className={`${currentStep === 'Contributors' ? 'add-edit-form__container--contributors' : 'hidden'}`} data-testid="contributors-info">
            <ProjectContributorsInfo project={projectData} errors={contributorsErrors} />
          </div>
          <div className={`${currentStep === 'KPIs' ? 'add-edit-form__container--kpis' : 'hidden'}`} data-testid="kpis-info">
            <ProjectKpisInfo project={projectData} errors={kpiErrors} />
          </div>
          <div className={`${currentStep === 'More Details' ? 'add-edit-form__container--more-details' : 'hidden'}`} data-testid="more-details">
            <ProjectMoreDetails readMe={projectData?.readMe} />
          </div>
        </div>

        <div className="add-edit-form__opts" data-testid="form-options">
          <div>
            {currentStep === 'General' && (
              <button onClick={onCancelClickHandler} className="add-edit-form__opts__cancel" type="button" data-testid="cancel-button">
                Cancel
              </button>
            )}
          </div>

          <div className="add-edit-form__opts__acts">
            {currentStep !== 'General' && (
              <div>
                <button type="button" className="add-edit-form__opts__acts__back" onClick={onBackClicked} data-testid="back-button">
                  Back
                </button>
              </div>
            )}
            {currentStep !== 'More Details' && (
              <button type="button" className="add-edit-form__opts__acts__next" onClick={onNextClicked} data-testid="next-button">
                Next
              </button>
            )}
            {currentStep === 'More Details' && (
              <div>
                {type === 'Add' && (
                  <button className="add-edit-form__opts__acts__next" type="submit" data-testid="add-project-button">
                    Add Project
                  </button>
                )}
                {type === 'Edit' && (
                  <button className="add-edit-form__opts__acts__next" type="submit" data-testid="update-project-button">
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

          .add-edit-form__container--general {
            background-color: white;
            padding: 24px 26px;
            padding-bottom: 80px;
          }

          .add-edit-form__opts {
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

          .add-edit-form__opts__acts {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .add-edit-form__opts__acts__next {
            background: #156ff7;
            color: white;
            border-radius: 8px;
            padding: 10px 24px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
          }

          .add-edit-form__opts__cancel {
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

          .add-edit-form__opts__acts__back {
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
            .add-edit-form__container {
              width: 656px;
              border-radius: 8px;
            }

            .add-edit-form__container--general {
              padding-bottom: unset;
            }

            .add-edit-form__container--general {
              background-color: white;
              padding: 32px 54px;
              border-radius: 8px;
            }

            .add-edit-form__opts {
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
