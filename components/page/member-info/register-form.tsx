'use client';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import RegisterFormLoader from '@/components/core/register/register-form-loader';
import MemberBasicInfo from '@/components/page/member-info/member-basic-info';
import MemberContributionInfo from '@/components/page/member-info/member-contributions-info';
import MemberSkillsInfo from '@/components/page/member-info/member-skills-info';
import MemberSocialInfo from '@/components/page/member-info/member-social-info';
import useStepsIndicator from '@/hooks/useStepsIndicator';
import { createParticipantRequest } from '@/services/participants-request.service';
import { saveRegistrationImage } from '@/services/registration.service';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { formInputsToMemberObj, getMemberInfoFormValues, memberRegistrationDefaults, validateBasicForms, validateContributionErrors, validateTeamsAndSkills } from '@/utils/member.utils';
import { toast } from 'react-toastify';
import RegisterActions from '@/components/core/register/register-actions';
import RegisterSuccess from '@/components/core/register/register-success';
import { useJoinNetworkAnalytics } from '@/analytics/join-network.analytics';


interface RegisterFormProps {
  onCloseForm: () => void;
}

interface AllData {
  teams: any[];
  projects: any[];
  skills: any[];
  isError: boolean;
}

interface InitialValues {
  basicInfo: any;
  contributionInfo: any;
  skillsInfo: any;
  socialInfo: any;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onCloseForm }) => {
  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({
    steps: ['basic', 'skills', 'contributions', 'social', 'success'],
    defaultStep: 'basic',
    uniqueKey: 'register',
  });

  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState<AllData>({ teams: [], projects: [], skills: [], isError: false });
  const [basicErrors, setBasicErrors] = useState<string[]>([]);
  const [contributionErrors, setContributionErrors] = useState<Record<number, string[]>>({});
  const [skillsErrors, setSkillsErrors] = useState<string[]>([]);
  const [socialErrors, setSocialErrors] = useState<string[]>([]);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const [initialValues, setInitialValues] = useState<InitialValues>({ ...memberRegistrationDefaults });
  const analytics = useJoinNetworkAnalytics();

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        const formValues = formInputsToMemberObj(Object.fromEntries(formData));
        analytics.recordMemberJoinNetworkSave("save-click", formValues);

        // Upload image if available
        if (formValues.memberProfile && formValues.memberProfile.size > 0) {
          const imgResponse = await saveRegistrationImage(formValues.memberProfile);
          const image = imgResponse?.image;
          formValues.imageUid = image.uid;
          formValues.imageUrl = image.url;
          delete formValues.imageFile;
          delete formValues.memberProfile;
        }

        if (formValues.plnStartDate === '') {
          formValues.plnStartDate = null;
        }

        // Create registration request
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
          analytics.recordMemberJoinNetworkSave("save-success", bodyData);
        } else {
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          analytics.recordMemberJoinNetworkSave("save-error", bodyData);
        }
      }
    } catch (err) {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      analytics.recordMemberJoinNetworkSave("save-error");
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
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    const formData = new FormData(formRef.current);
    const formattedData = formInputsToMemberObj(Object.fromEntries(formData));
    if (currentStep === 'basic') {
      const basicInfoErrors = await validateBasicForms(formattedData);
      if (basicInfoErrors.length > 0) {
        setBasicErrors(basicInfoErrors);
        scrollToTop();
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        analytics.recordMemberJoinNetworkNextClick(currentStep, 'error');
        return;
      }
      setBasicErrors([]);
    } else if (currentStep === 'skills') {
      const teamAndSkillsErrors = await validateTeamsAndSkills(formattedData);
      if (teamAndSkillsErrors.length > 0) {
        setSkillsErrors(teamAndSkillsErrors);
        scrollToTop();
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        analytics.recordMemberJoinNetworkNextClick(currentStep, 'error');
        return;
      }
      setSkillsErrors([]);
    } else if (currentStep === 'contributions') {
      const contributionErrorsObj = await validateContributionErrors(formattedData);
      if (Object.keys(contributionErrorsObj).length > 0) {
        setContributionErrors(contributionErrorsObj);
        scrollToTop();
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        analytics.recordMemberJoinNetworkNextClick(currentStep, 'error');
        return;
      }
      setContributionErrors({});
    }
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    goToNextStep();
    analytics.recordMemberJoinNetworkNextClick(currentStep, 'success');
  };

  const onBackClicked = () => {
    goToPreviousStep();
    analytics.recordMemberJoinNetworkBackClick(currentStep);
  };

  useEffect(() => {
    getMemberInfoFormValues()
      .then((d) => {
        if (!d.isError) {
          setAllData(d as unknown as AllData);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    const resetHandler = () => {
      if (formRef.current) {
        formRef.current.reset();
      }
      setBasicErrors([]);
      setContributionErrors({});
      setSkillsErrors([]);
      setSocialErrors([]);
      setCurrentStep('basic');
    };
    document.addEventListener('reset-member-register-form', resetHandler);
    return () => {
      document.removeEventListener('reset-member-register-form', resetHandler);
    };
  }, [setCurrentStep]);

  return (
    <>
      <RegisterFormLoader />
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
          <RegisterActions currentStep={currentStep} onCloseForm={onCloseForm} onBackClicked={onBackClicked} onNextClicked={onNextClicked} />
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

          @media (min-width: 1024px) {
            .rf__form {
              padding: 24px 32px;
              overflow-y: auto;
            }

            .success {
              height: 100%;
            }
            .success__desc {
              font-size: 16px;
            }
          }
        `}
      </style>
    </>
  );
};

export default RegisterForm;
