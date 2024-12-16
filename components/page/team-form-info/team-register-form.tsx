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
import { teamRegisterDefault, transformRawInputsToFormObj } from '@/utils/team.utils';
import RegisterActions from '@/components/core/register/register-actions';
import RegisterSuccess from '@/components/core/register/register-success';
import { useJoinNetworkAnalytics } from '@/analytics/join-network.analytics';
import { useRouter } from 'next/navigation';

interface ITeamRegisterForm {
  // onCloseForm: () => void;
}

function TeamRegisterForm(props: ITeamRegisterForm) {
  // const onCloseForm = props.onCloseForm;
  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({ steps: ['basic', 'project details', 'social', 'success'], defaultStep: 'basic', uniqueKey: 'register' });
  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState({ technologies: [], fundingStage: [], membershipSources: [], industryTags: [], isError: false });
  const [basicErrors, setBasicErrors] = useState<string[]>([]);
  const [projectDetailsErrors, setProjectDetailsErrors] = useState<string[]>([]);
  const [socialErrors, setSocialErrors] = useState<string[]>([]);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const [initialValues, setInitialValues] = useState({...teamRegisterDefault});
  const [content, setContent] = useState(initialValues?.basicInfo.longDescription ?? '');

  const router = useRouter();
  
  const analytics = useJoinNetworkAnalytics();

  const scrollToTop = () => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollTop = 0;
    }
  };

  const onCloseForm = ()=>{
    router.push('/');
  }

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformRawInputsToFormObj(Object.fromEntries(formData));
      analytics.recordTeamJoinNetworkSave("save-click", formattedData);
      if (currentStep === 'social') {
        const validationResponse = validateForm(socialSchema, formattedData);
        if (!validationResponse?.success) {
          setSocialErrors(validationResponse.errors);
          scrollToTop();
          analytics.recordTeamJoinNetworkSave("validation-error", formattedData);
          return;
        }
        setSocialErrors([]);

        
        try {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
          if (formattedData?.teamProfile && formattedData.teamProfile.size > 0) {
            const imgResponse = await saveRegistrationImage(formattedData?.teamProfile);
            const image: any = imgResponse?.image;
            formattedData.logoUid = image.uid;
            formattedData.logoUrl = image.url;
            delete formattedData.teamProfile;
            delete formattedData.imageFile;
          }
          const data = {
            participantType: 'TEAM',
            status: 'PENDING',
            requesterEmailId: formattedData?.requestorEmail,
            uniqueIdentifier: formattedData?.name,
            newData: { ...formattedData },
          };

          const response = await createParticipantRequest(data);

          if (response.ok) {
            goToNextStep();
            document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
            analytics.recordTeamJoinNetworkSave("save-success", data);
          } else {
            document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
            toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
            analytics.recordTeamJoinNetworkSave("save-error", data);
          }
        } catch (err) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          analytics.recordTeamJoinNetworkSave("save-error");
        }
      }
    }
  };

  const validateForm = (schema: any, data: any) => {
    const validationResponse = schema.safeParse(data);
    if (!validationResponse.success) {
      const formattedErrors = validationResponse?.error?.errors?.map((error: any) => error.message);
      return { success: false, errors: formattedErrors };
    }
    return { success: true, errors: [] };
  };

  const validateTeamBasicErrors = async (formattedData: any) => {
    const errors = [];
    const validationResponse = validateForm(basicInfoSchema, formattedData);
    const nameVerification = await validatePariticipantsEmail(formattedData.name, ENROLLMENT_TYPE.TEAM);
    const imageFile = formattedData?.teamProfile;

    if (!validationResponse.success) {
      errors.push(...validationResponse.errors);
    }

    if (!nameVerification.isValid) {
      errors.push('Name Already exists!');
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

    return errors;

  }

  const onNextClicked = async () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformRawInputsToFormObj(Object.fromEntries(formData));
      formattedData['longDescription'] = content;
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      if (currentStep === 'basic') {
        const teamBasicInfoErrors = await validateTeamBasicErrors(formattedData)
        if (teamBasicInfoErrors.length > 0) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
          setBasicErrors([...teamBasicInfoErrors]);
          scrollToTop();
          analytics.recordTeamJoinNetworkNextClick(currentStep, 'error');
          return;
        }
        setBasicErrors([]);
      } else if (currentStep === 'project details') {
        const validationResponse = validateForm(projectDetailsSchema, formattedData);
        if (!validationResponse.success) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
          setProjectDetailsErrors(validationResponse.errors);
          scrollToTop();
          analytics.recordTeamJoinNetworkNextClick(currentStep, 'error');
          return;
        }
        setProjectDetailsErrors([]);
      }
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      goToNextStep();
      analytics.recordTeamJoinNetworkNextClick(currentStep, 'success');
    }
  };

  const onBackClicked = () => {
    goToPreviousStep();
    analytics.recordTeamJoinNetworkBackClick(currentStep);
  };

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
      {currentStep !== 'success' && (
        <form className="trf" onSubmit={onFormSubmit} ref={formRef} noValidate>
          <div ref={formContainerRef} className="trf__form">
            <div className={currentStep !== 'basic' ? 'hidden' : 'form'}>
              <TeamBasicInfo errors={basicErrors} initialValues={initialValues.basicInfo} longDesc={content} setLongDesc={setContent}/>
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
          </div>
          <RegisterActions currentStep={currentStep} onNextClicked={onNextClicked} onBackClicked={onBackClicked} onCloseForm={onCloseForm} />
        </form>
      )}

      {currentStep === 'success' && <RegisterSuccess onCloseForm={onCloseForm} />}

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

          @media (min-width: 1024px) {
            .trf__form {
              padding: 24px 32px;
              overflow-y: auto;
            }
          }
        `}
      </style>
    </>
  );
}

export default TeamRegisterForm;
