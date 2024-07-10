'use client';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import MemberBasicInfo from '@/components/page/member-info/member-basic-info';
import MemberContributionInfo from '@/components/page/member-info/member-contributions-info';
import MemberSkillsInfo from '@/components/page/member-info/member-skills-info';
import MemberSocialInfo from '@/components/page/member-info/member-social-info';
import useStepsIndicator from '@/hooks/useStepsIndicator';
import { TeamAndSkillsInfoSchema, basicInfoSchema, projectContributionSchema } from '@/schema/member-forms';
import { validateLocation } from '@/services/location.service';
import { createParticipantRequest, validatePariticipantsEmail } from '@/services/participants-request.service';
import { saveRegistrationImage } from '@/services/registration.service';
import { triggerLoader } from '@/utils/common.utils';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

function RegisterForm(props: any) {
  const onCloseForm = props.onCloseForm;
  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({
    steps: ['basic', 'skills', 'contributions', 'social', 'success'],
    defaultStep: 'basic',
    uniqueKey: 'register',
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState({ teams: [], projects: [], skills: [], isError: false });

  const [basicErrors, setBasicErrors] = useState<string[]>([]);
  const [contributionErrors, setContributionErrors] = useState<any>({});
  const [skillsErrors, setSkillsErrors] = useState<string[]>([]);
  const [socialErrors, setSocialErrors] = useState<string[]>([]);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const [initialValues, setInitialState] = useState({
    skillsInfo: {
      teamsAndRoles: [{ teamTitle: '', role: '', teamUid: '' }],
      skills: [],
    },
    contributionInfo: [],
    basicInfo: {
      name: '',
      email: '',
      imageFile: '',
      plnStartDate: '',
      city: '',
      region: '',
      country: '',
    },
    socialInfo: {
      linkedinHandler: '',
      discordHandler: '',
      twitterHandler: '',
      githubHandler: '',
      telegramHandler: '',
      officeHours: '',
      comments: '',
    },
  });

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        const formValues = transformObject(Object.fromEntries(formData));
        if (formValues.memberProfile && formValues.memberProfile.size > 0) {
          const imgResponse = await saveRegistrationImage(formValues.memberProfile);
          const image = imgResponse?.image;
          formValues.imageUid = image.uid;
          formValues.imageUrl = image.url;
        }

        if (formValues.plnStartDate === '') {
          formValues.plnStartDate = null;
        }

        const bodyData = {
          participantType: 'MEMBER',
          status: 'PENDING',
          requesterEmailId: formValues.email,
          uniqueIdentifier: formValues.email,
          newData: { ...formValues, openToWork: false },
        };
        const formResult = await createParticipantRequest(bodyData);
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        if (formResult.ok) {
          formRef.current.reset();
          setCurrentStep('success');
        } else {
          //onCloseForm();
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        }
      }
    } catch (err) {
      //onCloseForm();
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    }
  };

  const scrollToTop = () => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollTop = 0;
    }
  };

  const onNextClicked = async () => {
    if (!formRef.current) {
      return;
    }
    const formData = new FormData(formRef.current);
    const formattedData = transformObject(Object.fromEntries(formData));
    console.log(JSON.stringify(formattedData))
    if (currentStep === 'basic') {
      const errors = [];
      const result = basicInfoSchema.safeParse(formattedData);
      if (!result.success) {
        errors.push(...result.error.errors.map((v) => v.message));
      }
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      const email = formattedData?.email?.toLowerCase().trim();
      const emailVerification = await validatePariticipantsEmail(email, 'MEMBER');
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      if (!emailVerification.isValid) {
        errors.push('Email already exists');
      }

      const locationInfo = {
          ...(formattedData.city && { city: formattedData.city }),
          ...(formattedData.country && { country: formattedData.country }),
          ...(formattedData.region && { region: formattedData.region })
        };
      
     if(Object.keys(locationInfo).length > 0) {
      const locationVerification = await validateLocation(locationInfo)
      if(!locationVerification.isValid) {
        errors.push('location info provided is invalid');
      }
     }


      const imageFile = formattedData?.memberProfile;

      if (imageFile.name) {
        if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
          errors.push('Please upload image in jpeg or png format');
        } else {
          if (imageFile.size > 4 * 1024 * 1024) {
            errors.push('Please upload a file less than 4MB');
          }
        }
      }

      if (errors.length > 0) {
        setBasicErrors(errors);
        scrollToTop();
        return;
      }

      setBasicErrors([]);
    } else if (currentStep === 'skills') {
      const result = TeamAndSkillsInfoSchema.safeParse(formattedData);
      if (!result.success) {
        const errors = result.error.errors.map((v) => v.message);
        const uniqueErrors = Array.from(new Set(errors));
        setSkillsErrors([...uniqueErrors]);
        scrollToTop();
        return;
      }
      setSkillsErrors([]);
    } else if (currentStep === 'contributions') {
      const allErrorObj: any = {};
      const contributions = formattedData.projectContributions;
      contributions.forEach((contribution: any, index: number) => {
        if (contribution.endDate && new Date(contribution.startDate) >= new Date(contribution.endDate)) {
          if (!allErrorObj[index]) {
            allErrorObj[index] = [];
          }
          allErrorObj[index].push('Your contribution end date cannot be less than or equal to start date');
        }
        if(contribution.startDate && new Date(contribution.startDate) > new Date()) {
          if (!allErrorObj[index]) {
            allErrorObj[index] = [];
          }
          allErrorObj[index].push('Your contribution start date cannot be greater than current date');
        }
      });
      const result = projectContributionSchema.safeParse(formattedData);
      if (!result.success) {
        const formatted = result.error.errors.reduce((acc: any, error) => {
          const [name, index, key] = error.path;
          if (!acc[index]) {
            acc[index] = [];
          }
          acc[index].push(error.message);

          return acc;
        }, allErrorObj);
        setContributionErrors(formatted);
        scrollToTop();
        return;
      }

      if (Object.keys(allErrorObj).length > 0) {
        setContributionErrors(allErrorObj);
        scrollToTop();
        return;
      }

      setContributionErrors({});
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
        const teamIndexMatch = teamInfo.match(/\d+$/);

        if (teamIndexMatch) {
          const teamIndex = teamIndexMatch[0];
          if (!teamAndRoles[teamIndex]) {
            teamAndRoles[teamIndex] = {};
          }
          teamAndRoles[teamIndex][subKey] = obj[key];
        }
      } else if (key.startsWith('contributionInfo')) {
        const [contributionInfo, subKey] = key.split('-');
        const contributionIndexMatch = contributionInfo.match(/\d+$/);
        if (contributionIndexMatch) {
          const contributionIndex = contributionIndexMatch[0];

          if (!projectContributions[contributionIndex]) {
            projectContributions[contributionIndex] = {};
          }
          if (subKey === 'currentProject') {
            projectContributions[contributionIndex][subKey] = (obj[key] && obj[key]) === 'on' ? true : false;
          } else {
            projectContributions[contributionIndex][subKey] = obj[key];
          }
        }
      } else if (key.startsWith('skillsInfo')) {
        const [skillInfo, subKey] = key.split('-');
        const skillIndexMatch = skillInfo.match(/\d+$/);
        if (skillIndexMatch) {
          const skillIndex = skillIndexMatch[0];
          if (!skills[skillIndex]) {
            skills[skillIndex] = {};
          }
          skills[skillIndex][subKey] = obj[key];
        }
      } else {
        //contributionInfo
        result[key] = obj[key];
      }
    }

    result.teamAndRoles = Object.values(teamAndRoles);
    result.projectContributions = Object.values(projectContributions);
    result.skills = Object.values(skills);

    result.projectContributions = result.projectContributions.map((v: any) => {
      if (!v.currentProject) {
        v['currentProject'] = false;
      }
      v['startDate'] = v.startDate === '' ? null : new Date(v.startDate).toISOString();
      if (v['endDate'] === '') {
        delete v['endDate'];
      } else {
        v['endDate'] = new Date(v.endDate).toISOString();
      }

      return v;
    });
    if (result['plnStartDate']) {
      result['plnStartDate'] = new Date(result['plnStartDate']).toISOString();
    }
    return result;
  }

  const getFormOptions = async () => {
    const [teamsInfo, projectsInfo, skillsInfo] = await Promise.all([
      fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?pagination=false`, { method: 'GET' }),
      fetch(`${process.env.DIRECTORY_API_URL}/v1/projects?pagination=false`, { method: 'GET' }),
      fetch(`${process.env.DIRECTORY_API_URL}/v1/skills?pagination=false`, { method: 'GET' }),
    ]);
    if (!teamsInfo.ok || !projectsInfo.ok || !skillsInfo.ok) {
      return { isError: true };
    }

    const teamsData = await teamsInfo.json();
    const projectsData = await projectsInfo.json();
    const skillsData = await skillsInfo.json();
    return {
      teams: teamsData
        .map((d: any) => {
          return {
            teamUid: d.uid,
            teamTitle: d.name,
            role: '',
          };
        })
        .sort((a: any, b: any) => a.teamTitle - b.teamTitle),
      skills: skillsData
        .map((d: any) => {
          return {
            id: d.uid,
            name: d.title,
          };
        })
        .sort((a: any, b: any) => a.name - b.name),
      projects: projectsData
        .map((d: any) => {
          return {
            projectUid: d.uid,
            projectName: d.name,
            projectLogo: d.logo?.url ?? '/icons/default-project.svg',
          };
        })
        .sort((a: any, b: any) => a.projectName - b.projectName),
    };
  };

  useEffect(() => {
    getFormOptions()
      .then((d) => {
        if (!d.isError) {
          setAllData(d as any);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    function resetHandler() {
      if (formRef.current) {
        formRef.current.reset();
      }
      setBasicErrors([]);
      setContributionErrors([]);
      setSkillsErrors([]);
      setSocialErrors([]);
      setCurrentStep('basic');
    }
    document.addEventListener('reset-member-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-member-register-form', resetHandler);
    };
  }, []);

  return (
    <>
      <RegsiterFormLoader />
      {currentStep !== 'success' && (
        <form className="rf" onSubmit={onFormSubmit} ref={formRef} noValidate>
          <div ref={formContainerRef} className="rf__form">
            <div className={currentStep !== 'basic' ? 'hidden' : 'form'}>
              <MemberBasicInfo initialValues={initialValues.basicInfo} errors={basicErrors} />
            </div>
            <div className={currentStep !== 'contributions' ? 'hidden' : 'form'}>
              <MemberContributionInfo initialValues={initialValues.contributionInfo} projectsOptions={allData.projects} errors={contributionErrors} />
            </div>
            <div className={currentStep !== 'social' ? 'hidden' : 'form'}>
              <MemberSocialInfo initialValues={initialValues.socialInfo} errors={socialErrors} />
            </div>
            <div className={currentStep !== 'skills' ? 'hidden' : 'form'}>
              <MemberSkillsInfo initialValues={initialValues.skillsInfo} errors={skillsErrors} teamsOptions={allData.teams} skillsOptions={allData.skills} />
            </div>
          </div>
          <div className="rf__actions rf__actions--desktop">
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
          <div className="rf__actions rf__actions--mobile">
            <div className="rf__actions__cancelmobile">
              <button onClick={onCloseForm} className="rf__actions__cancel" type="button">
                Cancel
              </button>
            </div>
            <div className="rf__actions__group">
              {currentStep !== 'basic' && (
                <div className="rf__actions__back" onClick={onBackClicked}>
                  Back
                </div>
              )}
              {currentStep !== 'social' && (
                <div className="rf__actions__next" onClick={onNextClicked}>
                  Next
                </div>
              )}
              {currentStep === 'social' && (
                <button className="rf__actions__submit" type="submit">
                  Submit
                </button>
              )}
            </div>
          </div>
        </form>
      )}
      {currentStep === 'success' && (
        <div className="success">
          <h2 className="success__title">Thank You for Submitting</h2>
          <p className="success__desc">Our team will review your request and get back to you shortly</p>
          <button onClick={onCloseForm} type="button" className="success__btn">
            Close
          </button>
        </div>
      )}
      <style jsx>
        {`
          .hidden {
            visibility: hidden;
            height: 0;
            overflow: hidden;
          }
          .success {
            width: 100%;
            position: relative;
            height: 100%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }
          .success__title {
            font-size: 24px;
            font-weight: 700;
          }
          .success__desc {
            font-size: 18px;
            font-weight: 400;
            text-align: center;
          }
          .success__btn {
            padding: 10px 24px;
            border-radius: 8px;
            background: #156ff7;
            outline: none;
            border: none;
            color: white;
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

          .rf__actions--mobile {
            display: flex;
          }
          .rf__actions--desktop {
            display: none;
          }

          .rf__actions__group {
            display: flex;
            gap: 8px;
          }
          .rf__actions__cancelmobile {
            flex: 1;
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
          @media (min-width: 1024px) {
            .rf__form {
              padding: 24px 32px;
              overflow-y: auto;
            }
            .rf__actions {
              position: relative;
            }
            .success {
              height: 100%;
            }
            .success__desc {
              font-size: 16px;
            }

            .rf__actions--mobile {
              display: none;
            }
            .rf__actions--desktop {
              display: flex;
            }
          }
        `}
      </style>
    </>
  );
}

export default RegisterForm;
