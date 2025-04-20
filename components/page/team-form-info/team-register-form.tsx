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
import { useJoinNetworkAnalytics } from '@/analytics/join-network.analytics';
import { useRouter } from 'next/navigation';
import { STEP_INDICATOR_KEY, TEAM_FORM_STEPS } from '@/utils/constants/team-constants';

/**
 * TeamRegisterForm Component
 *
 * This component manages the multi-step registration form for teams, including basic info, project details, and social info.
 * It handles form validation, step navigation, and submission logic.
 *
 * @component
 * @param {ITeamRegisterFormProps} props - The component props
 * @returns {JSX.Element} The rendered team registration form
 */
interface ITeamRegisterFormProps {
  /** Callback when registration is successful */
  onSuccess: () => void;
  /** User information object (should contain at least email) */
  userInfo: { email?: string; [key: string]: any };
}

function TeamRegisterForm({ onSuccess, userInfo }: ITeamRegisterFormProps) {
  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({ steps: TEAM_FORM_STEPS, defaultStep: TEAM_FORM_STEPS[0], uniqueKey: STEP_INDICATOR_KEY });
  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState({ technologies: [], fundingStage: [], membershipSources: [], industryTags: [], isError: false });
  const [basicErrors, setBasicErrors] = useState<string[]>([]);
  const [projectDetailsErrors, setProjectDetailsErrors] = useState<string[]>([]);
  const [socialErrors, setSocialErrors] = useState<string[]>([]);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  if(userInfo?.email){
    teamRegisterDefault.basicInfo.requestorEmail = userInfo.email;
  }

  const [initialValues, setInitialValues] = useState({...teamRegisterDefault});
  const [content, setContent] = useState(initialValues?.basicInfo.longDescription ?? '');

  const router = useRouter();
  
  const analytics = useJoinNetworkAnalytics();

  /**
   * Scrolls the page to the top (for error visibility)
   */
  function scrollToTop() {
    document.body.scrollTop = 0;
  }

  /**
   * Handles closing the form and navigating to the home page
   */
  const onCloseForm = () => {
    router.push('/');
  };

  /**
   * Handles form submission for the last step (social info)
   * Validates, uploads image if present, and submits the registration request
   * @param {FormEvent<HTMLFormElement>} e - The form submit event
   */
  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformRawInputsToFormObj(Object.fromEntries(formData));
      analytics.recordTeamJoinNetworkSave("save-click", formattedData);
      if (currentStep === TEAM_FORM_STEPS[2]) {
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
          // Handle image upload if present
          if (formattedData?.teamProfile && formattedData.teamProfile.size > 0) {
            const imgResponse = await saveRegistrationImage(formattedData?.teamProfile);
            const image: any = imgResponse?.image;
            formattedData.logoUid = image.uid;
            formattedData.logoUrl = image.url;
            delete formattedData.teamProfile;
            delete formattedData.imageFile;
          }
          // Prepare data for API
          const data = {
            participantType: 'TEAM',
            status: 'PENDING',
            requesterEmailId: formattedData?.requestorEmail,
            uniqueIdentifier: formattedData?.name,
            newData: { ...formattedData },
          };

          const response = await createParticipantRequest(data);

          if (response.ok) {
            onSuccess();
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

  /**
   * Validates form data using a Zod schema
   * @param schema - Zod schema to validate against
   * @param data - Data to validate
   * @returns Validation result with success and errors
   */
  const validateForm = (schema: any, data: any) => {
    const validationResponse = schema.safeParse(data);
    if (!validationResponse.success) {
      const formattedErrors = validationResponse?.error?.errors?.map((error: any) => error.message);
      return { success: false, errors: formattedErrors };
    }
    return { success: true, errors: [] };
  };

  /**
   * Validates the basic info step, including async name check and image validation
   * @param formattedData - Formatted form data
   * @returns Array of error messages
   */
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
  };

  /**
   * Handles the Next button click for step navigation and validation
   */
  const onNextClicked = async () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformRawInputsToFormObj(Object.fromEntries(formData));
      formattedData['longDescription'] = content;
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      if (currentStep === TEAM_FORM_STEPS[0]) {
        const teamBasicInfoErrors = await validateTeamBasicErrors(formattedData)
        if (teamBasicInfoErrors.length > 0) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
          setBasicErrors([...teamBasicInfoErrors]);
          analytics.recordTeamJoinNetworkNextClick(currentStep, 'error');
          scrollToTop();
          return;
        }
        setBasicErrors([]);
      } else if (currentStep === TEAM_FORM_STEPS[1]) {
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
      scrollToTop();
      analytics.recordTeamJoinNetworkNextClick(currentStep, 'success');
    }
  };

  /**
   * Handles the Back button click for step navigation
   */
  const onBackClicked = () => {
    goToPreviousStep();
    scrollToTop();
    analytics.recordTeamJoinNetworkBackClick(currentStep);
  };

  // Fetch dropdown/select options on mount
  useEffect(() => {
    getTeamsFormOptions()
      .then((data) => {
        if (!data.isError) {
          setAllData(data as any);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Reset form and errors on custom event
  useEffect(() => {
    function resetHandler() {
      if (formRef.current) {
        formRef.current.reset();
        // Toggle reset flag to force re-render
      }
      setCurrentStep(TEAM_FORM_STEPS[0]);
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
      {(
        <form className="trf" onSubmit={onFormSubmit} ref={formRef} noValidate data-testid="team-register-form">
          <div ref={formContainerRef} className="trf__form">
            <div className={currentStep !== TEAM_FORM_STEPS[0] ? 'hidden' : 'form'}>
              <TeamBasicInfo errors={basicErrors} initialValues={initialValues.basicInfo} longDesc={content} setLongDesc={setContent}/>
            </div>
            <div className={currentStep !== TEAM_FORM_STEPS[1] ? 'hidden' : 'form'}>
              <TeamProjectsInfo
                errors={projectDetailsErrors}
                protocolOptions={allData?.technologies}
                fundingStageOptions={allData?.fundingStage}
                membershipSourceOptions={allData?.membershipSources}
                industryTagOptions={allData?.industryTags}
                initialValues={initialValues.projectsInfo}
              />
            </div>
            <div className={currentStep !== TEAM_FORM_STEPS[2] ? 'hidden' : 'form'}>
              <TeamSocialInfo errors={socialErrors} />
            </div>
          </div>
          <RegisterActions currentStep={currentStep} onNextClicked={onNextClicked} onBackClicked={onBackClicked} onCloseForm={onCloseForm} />
        </form>
      )}

      {/* {currentStep === 'success' && <RegisterSuccess onCloseForm={onCloseForm} />} */}

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
