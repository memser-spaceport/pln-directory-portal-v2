'use client';
import Tabs from '@/components/ui/tabs';
import MemberBasicInfo from '../member-info/member-basic-info';
import { useEffect, useMemo, useRef, useState } from 'react';
import MemberSkillsInfo from '../member-info/member-skills-info';
import MemberContributionInfo from '../member-info/member-contributions-info';
import MemberSocialInfo from '../member-info/member-social-info';
import { compareObjects, getMemberInfoFormValues, apiObjsToMemberObj, formInputsToMemberObj, utcDateToDateFieldString, getInitialMemberFormValues } from '@/utils/member.utils';
import SettingsAction from './actions';
import SingleSelect from '@/components/form/single-select';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { saveRegistrationImage } from '@/services/registration.service';
import { compareObjsIfSame, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { toast } from 'react-toastify';
import { updateMember } from '@/services/members.service';
import { TeamAndSkillsInfoSchema, basicInfoSchema, projectContributionSchema } from '@/schema/member-forms';
import { validatePariticipantsEmail } from '@/services/participants-request.service';
import { validateLocation } from '@/services/location.service';
import Modal from '@/components/core/modal';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { IUserInfo } from '@/types/shared.types';

interface MemberSettingsProps {
  memberInfo: any;
  userInfo: IUserInfo
}

function MemberSettings({ memberInfo, userInfo }: MemberSettingsProps) {
  const steps = [{ name: 'basic' }, { name: 'skills' }, { name: 'contributions' }, { name: 'social' }];
  const [activeTab, setActiveTab] = useState({ name: 'basic' });
  const [allData, setAllData] = useState({ teams: [], projects: [], skills: [], isError: false });
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const errorDialogRef = useRef<HTMLDialogElement>(null);
  const [errors, setErrors] = useState<any>({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });

  const [allErrors, setAllErrors] = useState<any[]>([]);
  const tabsWithError = {
    basic: errors.basicErrors.length > 0,
    skills: errors.skillsErrors.length > 0,
    contributions: Object.keys(errors.contributionErrors).length > 0,
    social: errors.socialErrors.length > 0,
  };
  const initialValues = useMemo(() => getInitialMemberFormValues(memberInfo), [memberInfo]);
  const analytics = useSettingsAnalytics();

  const handleTabClick = (v: string) => {
    analytics.recordUserProfileFormEdit(getAnalyticsUserInfo(userInfo), v.toUpperCase());
    setActiveTab({ name: v })
  }

  const onModalClose = () => {
    if (errorDialogRef.current) {
      errorDialogRef.current.close();
    }
  };

  const onShowErrorModal = () => {
    if (errorDialogRef.current) {
      errorDialogRef.current.showModal();
    }
  };

  const onResetForm = async (e: any) => {
    const isSame = onFormChange();
    if(isSame) {
      e.preventDefault()
      toast.info('There are no changes to reset')
      return;
    }
    const proceed = confirm('Do you want to reset the changes ?');
    if(!proceed) {
      e.preventDefault()
      return;
    }
    if(formRef.current) {
      formRef.current.reset()
    }
    document.dispatchEvent(new CustomEvent('reset-member-register-form'));
  };

  const checkContributionInfoForm = async (formattedData: any) => {
    const allErrorObj: any = {};
    const contributions = formattedData.projectContributions;
    contributions.forEach((contribution: any, index: number) => {
      if (contribution.endDate && new Date(contribution.startDate) >= new Date(contribution.endDate)) {
        if (!allErrorObj[index]) {
          allErrorObj[index] = [];
        }
        allErrorObj[index].push('Your contribution end date cannot be less than or equal to start date');
      }
      if (contribution.startDate && new Date(contribution.startDate) > new Date()) {
        if (!allErrorObj[index]) {
          allErrorObj[index] = [];
        }
        allErrorObj[index].push('Your contribution start date cannot be greater than current date');
      }
    });
    const result = projectContributionSchema.safeParse(formattedData);
    if (!result.success) {
      result.error.errors.reduce((acc: any, error) => {
        const [name, index, key] = error.path;
        if (!acc[index]) {
          acc[index] = [];
        }
        acc[index].push(error.message);

        return acc;
      }, allErrorObj);
    }
    return allErrorObj;
  };

  const checkSkillInfoForm = async (formattedData: any) => {
    const result = TeamAndSkillsInfoSchema.safeParse(formattedData);
    if (!result.success) {
      const errors = result.error.errors.map((v) => v.message);
      const uniqueErrors = Array.from(new Set(errors));
      return uniqueErrors;
    }

    return [];
  };

  const checkBasicInfoForm = async (formattedData: any) => {
    if (!formRef.current) {
      return [];
    }
    const errors = [];
    const result = basicInfoSchema.safeParse(formattedData);
    if (!result.success) {
      errors.push(...result.error.errors.map((v) => v.message));
    }

    const locationInfo = {
      ...(formattedData.city && { city: formattedData.city }),
      ...(formattedData.country && { country: formattedData.country }),
      ...(formattedData.region && { region: formattedData.region }),
    };

    if (Object.keys(locationInfo).length > 0) {
      const locationVerification = await validateLocation(locationInfo);
      if (!locationVerification.isValid) {
        errors.push('location info provided is invalid');
      }
    }

    //const imageFile = formattedData?.memberProfile;
    const memberProfile = formattedData?.memberProfile;

    if (memberProfile.name) {
      if (!['image/jpeg', 'image/png'].includes(memberProfile.type)) {
        errors.push('Please upload image in jpeg or png format');
      } else {
        if (memberProfile.size > 4 * 1024 * 1024) {
          errors.push('Please upload a file less than 4MB');
        }
      }
    }
    return errors;
  };

  const onFormSubmitted = async (e: any) => {
    try {
      triggerLoader(true);
      e.preventDefault();
      e.stopPropagation();
      analytics.recordUserProfileFormEdit(getAnalyticsUserInfo(userInfo), 'COMPLETED');
      if(!formRef.current) {
        triggerLoader(false);
        return;
      }
      const isBothSame = onFormChange();
      if(isBothSame) {
        toast.info("There are no changes to save")
        triggerLoader(false);
        return;
      }
     
      const formData = new FormData(formRef.current);
      const formValues = formInputsToMemberObj(Object.fromEntries(formData));
      const formattedForms = { ...formValues };
      analytics.recordManageMemberSave("save-click", getAnalyticsUserInfo(userInfo), formattedForms);

      const basicErrors: any[] = await checkBasicInfoForm({ ...formattedForms });
      const skillsErrors: any[] = await checkSkillInfoForm({ ...formattedForms });
      const contributionErrors: any = await checkContributionInfoForm({ ...formattedForms });
      const allFormErrors = [...basicErrors, ...skillsErrors, ...Object.keys(contributionErrors)];
      setAllErrors([...allErrors]);
      setErrors((v: any) => {
        return {
          ...v,
          basicErrors: [...basicErrors],
          skillsErrors: [...skillsErrors],
          contributionErrors: { ...contributionErrors },
        };
      });
      if (allFormErrors.length > 0) {
        triggerLoader(false);
        onShowErrorModal();
        analytics.recordManageMemberSave("validation-error", getAnalyticsUserInfo(userInfo), formattedForms);
        return;
      }

      if (formattedForms.plnStartDate === '') {
        formattedForms.plnStartDate = null;
      }

      if (formattedForms.memberProfile && formattedForms.memberProfile.size > 0) {
        const imgResponse = await saveRegistrationImage(formattedForms.memberProfile);
        const image = imgResponse?.image;
        formattedForms.imageUid = image.uid;
        formattedForms.image = image.url;
        delete formattedForms.memberProfile;
        delete formattedForms.imageFile;
        const imgEle: any = document.getElementById('member-info-basic-image');
        if (imgEle) {
          imgEle.value = image.url;
        }
      }
      else if (memberInfo?.image?.uid && memberInfo?.image?.url && formattedForms.imageFile === memberInfo?.image?.url) {
        formattedForms.imageUid = memberInfo?.image?.uid;
      }
     
      delete formattedForms.memberProfile;
      delete formattedForms.imageFile;

      const bodyData = {
        participantType: 'MEMBER',
        referenceUid: memberInfo.uid,
        uniqueIdentifier: formattedForms.email,
        newData: { ...formattedForms},
      };

      const rawAuthToken = Cookies.get('authToken');
      if(!rawAuthToken) {
        return;
      }
      const authToken = JSON.parse(rawAuthToken);

      const formResult = await updateMember(memberInfo?.uid, bodyData, authToken);
     
      if (!formResult.isError) {
        /* if (actionRef.current) {
          actionRef.current.style.visibility = 'hidden';
        } */
        triggerLoader(false);
        toast.success('Profile has been updated successfully');
        analytics.recordManageMemberSave("save-success", getAnalyticsUserInfo(userInfo), bodyData);
        router.refresh();
      } else {
        triggerLoader(false);
        toast.error('Profile updated failed. Please try again later.');
        analytics.recordManageMemberSave("save-error", getAnalyticsUserInfo(userInfo), bodyData);
      }
    } catch (e) {
      toast.error('Failed to update profile. Something went wrong');
      analytics.recordManageMemberSave("save-error", getAnalyticsUserInfo(userInfo));
      triggerLoader(false);
    }
  };

  const onFormChange = (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if(!formRef.current) {
      return
    }
    const formData = new FormData(formRef.current);
    const formValues = formInputsToMemberObj(Object.fromEntries(formData));
    const apiObjs = apiObjsToMemberObj(initialValues);
    const imgEle: any = document.getElementById('member-info-basic-image');
    delete formValues.memberProfile;
    formValues.imageFile = imgEle?.value;
    const isBothSame = compareObjsIfSame(apiObjs, formValues);
    return isBothSame;
  };

  useEffect(() => {
    analytics.recordUserProfileFormEdit(getAnalyticsUserInfo(userInfo), 'BASIC');
    getMemberInfoFormValues()
      .then((d) => {
        if (!d.isError) {
          setAllData(d as any);
        }
      })
      .catch((e) => console.error(e));
     
  }, []);

  useEffect(() => {
    triggerLoader(false)
    function handleNavigate(e: any) {
      const url = e.detail.url;
      let proceed = true;
      const isSame = onFormChange();
      if(!isSame) {
        proceed = confirm('There are some unsaved changed. Do you want to proceed?')
      }
      if(!proceed) {
        return;
      }
      triggerLoader(true)
      router.push(url);
      router.refresh();
    }
    document.addEventListener('settings-navigate', handleNavigate)
    return function() {
      document.removeEventListener('settings-navigate', handleNavigate)
    }
  }, [initialValues])

  return (
    <>
      <form ref={formRef} onSubmit={onFormSubmitted} onReset={onResetForm}  className="ms" noValidate>
        <div className="ms__tab">
          <div className="ms__tab__desktop">
            <Tabs errorInfo={tabsWithError} activeTab={activeTab.name} onTabClick={(v) => handleTabClick(v)} tabs={steps.map((v) => v.name)} />
          </div>
          <div className="ms__tab__mobile">
            <SingleSelect uniqueKey="name" arrowImgUrl="/icons/arrow-down.svg" onItemSelect={(item: any) => setActiveTab(item)} displayKey="name" options={steps} selectedOption={activeTab} id="settings-member-steps" />
          </div>
        </div>
        <div className="ms__content">
          <div className={`${activeTab.name !== 'basic' ? 'hidden' : ''}`}>
            <MemberBasicInfo errors={errors.basicErrors} uid={memberInfo.uid} isMemberSelfEdit={true} initialValues={initialValues.basicInfo} />
          </div>
          <div className={`${activeTab.name !== 'skills' ? 'hidden' : ''}`}>
            <MemberSkillsInfo errors={errors.skillsErrors} isEdit={true} initialValues={initialValues.skillsInfo} skillsOptions={allData.skills} teamsOptions={allData.teams} />
          </div>
          <div className={`${activeTab.name !== 'contributions' ? 'hidden' : ''}`}>
            <MemberContributionInfo errors={errors.contributionErrors} initialValues={initialValues.contributionInfo} projectsOptions={allData.projects} />
          </div>
          <div className={`${activeTab.name !== 'social' ? 'hidden' : ''}`}>
            <MemberSocialInfo initialValues={initialValues.socialInfo} />
          </div>
        </div>
        <SettingsAction/>
      </form>
      <Modal modalRef={errorDialogRef} onClose={onModalClose}>
        <div className="error">
          <h2 className="error__title">Validation Errors</h2>
          <div className='error__info'>
            <img width="16" height="16" src='/icons/alert-red.svg'/>
            <p>Some fields require your attention. Please review the fields below & submit again.</p>
          </div>
          {errors.basicErrors.length > 0 && (
            <div className="error__item">
              <h3 className="error__item__title">Basic Info</h3>
              <ul className="error__item__list">
                {errors.basicErrors.map((v: any, i: any) => (
                  <li className="error__item__list__msg" key={`basic-error-${i}`}>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errors.skillsErrors.length > 0 && (
            <div className="error__item">
              <h3 className="error__item__title">Skills Info</h3>
              <ul className="error__item__list">
                {errors.skillsErrors.map((v: any, i: any) => (
                  <li className="error__item__list__msg" key={`basic-error-${i}`}>{v}</li>
                ))}
              </ul>
            </div>
          )}
          {Object.keys(errors.contributionErrors).length > 0 && (
            <div className="error__item">
              <h3 className="error__item__title">Contribution Info</h3>
              <div className="error__item__list">
                {Object.keys(errors.contributionErrors).map((v: string, i) => (
                  <ul key={`contrib-${v}`}>
                    {errors.contributionErrors[v].map((item: any, index: any) => (
                      <li className="error__item__list__msg" key={`${v}-${index}`}>{`Project ${Number(v) + 1} - ${item}`}</li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
      <style jsx>
        {`
          .error {
            width: calc(100vw - 32px);
            height: auto;
             padding: 16px;
          }
          .error__info {
            color: #0F172A;
            background: #DD2C5A1A;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 400;
            display: flex;
            gap: 8px;
            align-items: center;
            margin: 24px 0 18px 0;
          }
          .error__item {
            padding: 8px 0;
          }
          .error__item__title {
            font-size: 15px;
            font-weight: 600;
          }
            .error__item__list {
              padding: 8px 16px;
            }
            .error__item__list__msg {
            font-size: 14px;
            color: #DD2C5A;
            
            }
          .fa {
            position: sticky;
            border-top: 2px solid #ff820e;
            margin: 0;
            width: 100%;
            flex-direction: column;
            bottom: 0px;
            padding: 16px;
            left: auto;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            
          }
          .fa__info {
            display: flex;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            align-items: center;
            gap: 6px;
          }

          .fa__action {
            display: flex;
            gap: 16px;
          }
          .fa__action__save {
            padding: 10px 24px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
          }
          .fa__action__cancel {
            padding: 10px 24px;
            background: white;
            color: #0f172a;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            font-weight: 500;
            border-radius: 8px;
          }

          

          .hidden {
            visibility: hidden;
            height: 0;
            overflow: hidden;
          }
          .ms {
            width: 100%;
            margin-bottom: 0px;
            height: 100%;
          }

          .ms__tab {
            position: sticky;
            top: 128px;
            background: white;
             padding-top: 10px;
            padding-bottom: 10px;
            z-index: 3;
          }
          .ms__tab__desktop {
            display: none;
          }
          .ms__tab__mobile {
            display: block;
            padding: 0 24px;
          }
          .ms__content {
            padding: 0px 24px;
            padding-bottom: 32px;
            height: fit-content;
            min-height: calc(100svh - 128px);
          }
          @media (min-width: 1024px) {
           .error {
             width: 60vw;
              padding: 24px;
            }
            .ms {
              width: 656px;
              border: 1px solid #e2e8f0;
            }
            .cs {
              width: 656px;
            }
            .ms__content {
              padding: 0px 54px;
              padding-bottom: 32px;
            }
            .ms__tab {
              top: 128.5px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 0;
            }
            .ms__tab__desktop {
              display: block;
            }
            .ms__tab__mobile {
              display: none;
            }
            .fa {
              height: 72px;
              flex-direction: row;
              left: auto;
              justify-content: center;
              align-items: center;
           
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberSettings;
