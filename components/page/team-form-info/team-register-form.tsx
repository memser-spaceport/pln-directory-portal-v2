'use client';

import useStepsIndicator from '@/hooks/useStepsIndicator';
import { FormEvent, useEffect, useRef, useState } from 'react';
import TeamBasicInfo from './team-basic-info';
import { basicInfoSchema, projectDetailsSchema, socialSchema } from '@/schema/team-forms';
import { getTeamsFormOptions, saveRegistrationImage } from '@/services/registration.service';
import TeamProjectsInfo from './team-projects-info';
import TeamSocialInfo from './team-social-info';
import { validatePariticipantsEmail } from '@/services/participants-request.service';

interface ITeamRegisterForm {
  onCloseForm: () => void;
}

function TeamRegisterForm(props: ITeamRegisterForm) {
  const onCloseForm = props.onCloseForm;
  const { currentStep, goToNextStep, goToPreviousStep, setCurrentStep } = useStepsIndicator({ steps: ['basic', 'project details', 'social'], defaultStep: 'basic', uniqueKey: 'register' });
  const formRef = useRef<HTMLFormElement>(null);
  const [allData, setAllData] = useState({ technologies: [], fundingStage: [], membershipSources: [], industryTags: [], isError: false });
  const [basicErrors, setBasicErrors] = useState<any>([]);
  const [projectDetailsErrors, setProjectDetailsErrors] = useState([]);
  const [socialErrors, setSocialErrors] = useState<any>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

        let image: any;
        setIsSubmitted(true);
        // try {
        //   if (formattedData?.teamImage?.name) {
        //     const imgResponse = await saveRegistrationImage(formattedData?.teamImage);
        //     image = imgResponse?.image;
        //   }

        //   console.log('jjj', image);

        //   const data = {
        //     participantType: 'TEAM',
        //     status: 'PENDING',
        //     requesterEmailId: formattedData?.requestorEmail,
        //     uniqueIdentifier: formattedData?.name,
        //     newData: { ...formattedData, logoUid: image?.uid ?? '', logoUrl: image?.url ?? '' },
        //   };
        //   delete data.newData.profileImage;
        //   delete data.newData.teamImage;

        //   const tokenResult = await fetch(`${process.env.DIRECTORY_API_URL}/token`, {
        //     method: 'GET',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //   });

        //   const output = await tokenResult.json();
        //   const token = output.token;

        //   const formResult = await fetch(`${process.env.DIRECTORY_API_URL}/v1/participants-request`, {
        //     method: 'POST',
        //     body: JSON.stringify(data),
        //     credentials: 'include',
        //     headers: {
        //       'csrf-token': token,
        //       'Content-Type': 'application/json',
        //     },
        //   });

        //   if (formResult.ok) {
        //     goToNextStep();
        //   } else {
        //     console.log(await formResult.json());
        //   }
        // } catch (err) {}
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

  const onNextClicked = async () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formattedData = transformObject(Object.fromEntries(formData));
      if (currentStep === 'basic') {
        const validationResponse = validateForm(basicInfoSchema, formattedData);
        const nameVerification = await validatePariticipantsEmail(formattedData.name, 'TEAM');

        if (!validationResponse.success || !nameVerification.isValid) {
          setBasicErrors((prevErrors) => {
            const newErrors = [...validationResponse.errors];
            if (!nameVerification.isValid) {
              const errorIndex = prevErrors.findIndex((error) => error.key === 'uniqueName');
              if (errorIndex !== -1) {
                newErrors[errorIndex] = { ...prevErrors[errorIndex], message: 'Name Already exists' };
              } else {
                newErrors.push({ key: 'uniqueName', message: 'Name Already exists' });
              }
            }
            return newErrors;
          });
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
    result.membershipResources = Object.values(membershipSources);
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

  useEffect(() => {
    function resetHandler() {
      if (formRef.current) {
        formRef.current.reset();
        setCurrentStep('basic');
      }
    }
    document.addEventListener('reset-team-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-team-register-form', resetHandler);
    };
  }, []);

  useEffect(() => {
    function handler(e: CustomEvent) {
      setIsSubmitted(false);
    }

    document.addEventListener('team-register-success', handler as EventListener);
    return function () {
      document.removeEventListener('team-register-success', handler as EventListener);
    };
  }, []);

  return (
    <>
      {!isSubmitted && (
        <form className="rf" onSubmit={onFormSubmit} ref={formRef}>
          <div className="rf__form">
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
      )}
      {isSubmitted && (
        <div className="teamReg__cn__content__submit">
          <p className="teamReg__cn__content__submit__ttl">Thank You for Submitting</p>
          <p className="teamReg__cn__content__submit__desc">Our team will review your request shortly and get back</p>
          <button onClick={onCloseForm} className="teamReg__cn__content__submit__cls">Close</button>
        </div>
      )}
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

          .teamReg__cn__content__submit {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            margin: auto;
          }

          .teamReg__cn__content__submit__ttl {
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
            color: #0f172a;
          }

          .teamReg__cn__content__submit__desc {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: #0f172a;
            margin: 8px 0px 0px 0px;
          }

          .teamReg__cn__content__submit__cls {
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
