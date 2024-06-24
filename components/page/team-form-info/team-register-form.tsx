'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { FormEvent, useEffect, useRef, useState } from 'react';
import TeamBasicInfo from './team-basic-info';
import { basicInfoSchema, projectDetailsSchema, socialSchema } from '@/schema/team-forms';
import { getTeamsFormOptions, saveRegistrationImage } from '@/services/registration.service';
import TeamProjectsInfo from './team-projects-info';
import TeamSocialInfo from './team-social-info';
import { createParticipantRequest, validatePariticipantsEmail } from '@/services/participants-request.service';
import { ENROLLMENT_TYPE, EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { toast } from 'react-toastify';

interface ITeamRegisterForm {
  onCloseForm: () => void;
}

function TeamRegisterForm(props: ITeamRegisterForm) {
  const onCloseForm = props.onCloseForm;
  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({ steps: ['basic', 'project details', 'social', 'success'], defaultStep: 'basic', uniqueKey: 'register' });
  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState({ technologies: [], fundingStage: [], membershipSources: [], industryTags: [], isError: false });
  const [basicErrors, setBasicErrors] = useState<string[]>([]);
  const [projectDetailsErrors, setProjectDetailsErrors] = useState<string[]>([]);
  const [socialErrors, setSocialErrors] = useState<string[]>([]);
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  const initialValues = {
    basicInfo: {
      requestorEmail: '',
      teamProfile: '',
      name: '',
      shortDescription: '',
      longDescription: '',
      officeHoures: '',
    },
    projectsInfo: {
      technologies: [],
      membershipSources: [],
      industryTags: [],
      fundingStage: { id: '', name: '' },
    },
    socialInfo: {
      contactMethod: '',
      website: '',
      linkedinHandler: '',
      twitterHandler: '',
      telegramHandler: '',
      blog: '',
    },
  };

  const scrollToTop = () => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollTop = 0;
    }
  };

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformObject(Object.fromEntries(formData));
      if (currentStep === 'social') {
        const validationResponse = validateForm(socialSchema, formattedData);
        if (!validationResponse?.success) {
          setSocialErrors(validationResponse.errors);
          scrollToTop();
          return;
        }
        setSocialErrors([]);

        let image: any;
        try {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
          if (formattedData?.teamProfile && formattedData.teamProfile.size > 0) {
            const imgResponse = await saveRegistrationImage(formattedData?.teamProfile);
            image = imgResponse?.image;
            formattedData.logoUid = image.uid;
            formattedData.logoUrl = image.url;
          }
          const data = {
            participantType: 'TEAM',
            status: 'PENDING',
            requesterEmailId: formattedData?.requestorEmail,
            uniqueIdentifier: formattedData?.name,
            newData: { ...formattedData},
          };
          

          const response = await createParticipantRequest(data);

          if (response.ok) {
            goToNextStep();
            document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
          } else {
            document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
            toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          }
        } catch (err) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        }
      }
    }
  };

  const validateForm = (schema: any, data: any) => {
    const validationResponse = schema.safeParse(data);
    if (!validationResponse.success) {
      const formattedErrors = validationResponse?.error?.errors?.map((error: any) => (error.message));
      return { success: false, errors: formattedErrors };
    }
    return { success: true, errors: [] };
  };

  const onNextClicked = async () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformObject(Object.fromEntries(formData));
      if (currentStep === 'basic') {
        const errors = [];
        const validationResponse = validateForm(basicInfoSchema, formattedData);
        const nameVerification = await validatePariticipantsEmail(formattedData.name, ENROLLMENT_TYPE.TEAM);
        const imageFile = formattedData?.teamProfile;

        if (!validationResponse.success) {
          errors.push(...validationResponse.errors);
        }

        if (!nameVerification.isValid) {
          errors.push('Name Already exists');
        }

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
      } else if (currentStep === 'project details') {
        const validationResponse = validateForm(projectDetailsSchema, formattedData);
        if (!validationResponse.success) {
          setProjectDetailsErrors(validationResponse.errors);
          scrollToTop();
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
    const membershipSources: any = {};
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
      } else if (key.startsWith('membershipSource')) {
        const [membershipSource, subKey] = key.split('-');
        const membershipSourceIndexMatch = membershipSource.match(/\d+$/);
        if (membershipSourceIndexMatch) {
          const membershipSourceIndex = membershipSourceIndexMatch[0];
          if (!membershipSources[membershipSourceIndex]) {
            membershipSources[membershipSourceIndex] = {};
          }
          membershipSources[membershipSourceIndex][subKey] = obj[key];
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
    result.membershipSources = Object.values(membershipSources);
    result.industryTags = Object.values(industryTags);
    return result;
  }

  useEffect(() => {
    getTeamsFormOptions()
      .then((data) => {
        if (!data.isError) {
          setAllData(data as any);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    function resetHandler() {
      if (formRef.current) {
        formRef.current.reset();
        // Toggle reset flag to force re-render
      }
      setCurrentStep('basic');
      setBasicErrors([]);
      setProjectDetailsErrors([]);
      setSocialErrors([]);
    }
    document.addEventListener('reset-team-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-team-register-form', resetHandler);
    };
  }, []);

  return (
    <>
      <form className="trf" onSubmit={onFormSubmit} ref={formRef}>
        <div ref={formContainerRef} className="trf__form">
          <div className={currentStep !== 'basic' ? 'hidden' : 'form'}>
            <TeamBasicInfo errors={basicErrors} initialValues={initialValues.basicInfo} />
          </div>
          <div className={currentStep !== 'project details' ? 'hidden' : 'form'}>
            <TeamProjectsInfo
              errors={projectDetailsErrors}
              protocolOptions={allData?.technologies}
              fundingStageOptions={allData?.fundingStage}
              membershipSourceOptions={allData?.membershipSources}
              industryTagOptions={allData?.industryTags}
              initialValues={initialValues.projectsInfo}
            />
          </div>
          <div className={currentStep !== 'social' ? 'hidden' : 'form'}>
            <TeamSocialInfo errors={socialErrors} />
          </div>
          <div className={currentStep !== 'success' ? 'hidden' : 'form'}>
            <div className="trf__success">
              <p className="trf__success__ttl">Thank You for Submitting</p>
              <p className="trf__success__desc">Our team will review your request shortly and get back</p>
              <button onClick={onCloseForm} className="trf__success__cls">
                Close
              </button>
            </div>
          </div>
        </div>
        {currentStep !== 'success' && (
          <div className="trf__actions">
            {currentStep === 'basic' && (
              <button onClick={onCloseForm} className="trf__actions__cancel" type="button">
                Cancel
              </button>
            )}
            {currentStep !== 'basic' && (
              <button className="trf__actions__back" onClick={onBackClicked} type="button">
                Back
              </button>
            )}
            {currentStep !== 'social' && (
              <button className="trf__actions__next" onClick={onNextClicked} type="button">
                Next
              </button>
            )}
            {currentStep === 'social' && (
              <button className="trf__actions__submit" type="submit">
                Submit
              </button>
            )}
          </div>
        )}
      </form>

      <style jsx>
        {`
          .hidden {
            visibility: hidden;
            height: 0;
            overflow: hidden;
          }
          .trf {
            width: 100%;
            position: relative;
            height: 100%;
          }
          .trf__form {
            padding: 24px;
            height: calc(100% - 70px);
            overflow-y: auto;
          }
          .form {
            height: 100%;
            width: 100%;
          }

          .trf__actions {
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

          .trf__actions__cancel,
          .trf__actions__back {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          }
          .trf__actions__next,
          .trf__actions__submit {
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #156ff7;
            cursor: pointer;
            color: white;
            font-size: 14px;
            font-weight: 500;
          }

          .trf__success {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            margin: auto;
          }

          .trf__success__ttl {
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
            color: #0f172a;
          }

          .trf__success__desc {
            font-size: 18px;
            font-weight: 400;
            line-height: 20px;
            text-align: center;
            color: #0f172a;
            margin: 8px 0px 0px 0px;
          }

          .trf__success__cls {
            width: 86px;
            height: 40px;
            padding: 10px 24px 10px 24px;
            gap: 8px;
            border-radius: 8px;
            border: 1px 0px 0px 0px;
            background: #156ff7;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #ffffff;
            margin: 18px 0px 0px 0px;
          }

          @media (min-width: 1024px) {
            .trf__form {
              padding: 24px 32px;
              overflow-y: auto;
            }
            .trf__actions {
              position: relative;
            }
            .trf__success__desc {
             font-size: 16px;
            }
          }
        `}
      </style>
    </>
  );
}

export default TeamRegisterForm;
