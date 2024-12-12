'use client';
import Tabs from '@/components/ui/tabs';
import MemberBasicInfo from '../member-info/member-basic-info';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MemberSkillsInfo from '../member-info/member-skills-info';
import MemberContributionInfo from '../member-info/member-contributions-info';
import MemberSocialInfo from '../member-info/member-social-info';
import { getMemberInfoFormValues, apiObjsToMemberObj, formInputsToMemberObj, utcDateToDateFieldString, getInitialMemberFormValues } from '@/utils/member.utils';
import SingleSelect from '@/components/form/single-select';
import { useRouter } from 'next/navigation';
import { compareObjsIfSame, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { toast } from 'react-toastify';
import { updateMember } from '@/services/members.service';
import Cookies from 'js-cookie';
import { validateLocation } from '@/services/location.service';
import { TeamAndSkillsInfoSchema, basicInfoSchema, projectContributionSchema } from '@/schema/member-forms';
import Modal from '@/components/core/modal';
import { saveRegistrationImage } from '@/services/registration.service';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import useObserver from '@/hooks/useObserver';
import SettingsAction from './actions';
import MemberPrivacyReadOnly from './member-privacy-readonly';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { IUserInfo } from '@/types/shared.types';
interface ManageMembersSettingsProps {
  members: any[];
  selectedMember: any;
  viewType: 'profile' | 'privacy';
  preferences: any;
  userInfo: IUserInfo;
  isVerifiedFlag: string;
}

function ManageMembersSettings({ members = [], preferences = {}, selectedMember = {}, viewType = 'profile', userInfo, isVerifiedFlag }: ManageMembersSettingsProps) {
  const steps = [{ name: 'basic' }, { name: 'skills' }, { name: 'contributions' }, { name: 'social' }];
  const profileTypeOptions = [{ name: 'profile' }, { name: 'privacy' }];
  const membersVerificationOptions = [{ name: 'Verified', value: 'true' }, { name: 'Un-Verified', value: 'false' }];
  const selectedProfileType = { name: viewType };
  const [activeTab, setActiveTab] = useState({ name: 'basic' });
  const formRef = useRef<HTMLFormElement | null>(null);
  const errorDialogRef = useRef<HTMLDialogElement>(null);
  const [allData, setAllData] = useState({ teams: [], projects: [], skills: [], isError: false });
  const [errors, setErrors] = useState<any>({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
  const tabsWithError = {
    basic: errors.basicErrors.length > 0,
    skills: errors.skillsErrors.length > 0,
    contributions: Object.keys(errors.contributionErrors).length > 0,
    social: errors.socialErrors.length > 0,
  };
  const router = useRouter();
  const analytics = useSettingsAnalytics();
  const initialValues = useMemo(() => getInitialMemberFormValues(selectedMember), [selectedMember]);
  //useObserver({callback: onFormChange, observeItem: formRef})

  const handleTabClick = (v: string) => {
    analytics.recordMemberProfileFormEdit(getAnalyticsUserInfo(userInfo), v.toUpperCase());
    setActiveTab({ name: v })
  }

  const onMemberChanged = (member: any) => {
    const uid = member?.id;
    if (uid === selectedMember.uid) {
      return false;
    }

    if (selectedProfileType.name === 'profile') {
      let proceed = true;
      const isSame = onFormChange();
      if (!isSame) {
        proceed = confirm('There are some unsaved changes. Do you wish to continue');
      }
      if (!proceed) {
        return proceed;
      }
    }

    triggerLoader(true);
    window.location.href = `/settings/members?id=${uid}&viewType=${selectedProfileType.name}&isVerified=${isVerifiedFlag}`;
    analytics.recordManageMembersMemberChange(member, getAnalyticsUserInfo(userInfo));
  };

  const onVerifiedFlagChange = (item: any) => {
    window.location.href = `/settings/members?viewType=${selectedProfileType.name}&isVerified=${item.value}`;
  }

  const onResetForm = async (e?: any) => {
    const isSame = onFormChange();
    if (isSame) {
      e.preventDefault();
      toast.info('There are no changes to reset');
      return;
    }
    const proceed = confirm('Do you want to reset the changes ?');
    if (!proceed && e) {
      e.preventDefault();
      return;
    }
    setErrors({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
    document.dispatchEvent(new CustomEvent('reset-member-register-form'));
  };

  const onFormSubmitted = async (e: any) => {
    try {
      triggerLoader(true);
      e.stopPropagation();
      e.preventDefault();
      analytics.recordMemberProfileFormEdit(getAnalyticsUserInfo(userInfo), 'COMPLETED');
      if (!formRef.current) {
        triggerLoader(false);
        return;
      }

      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      const formattedInputValues = formInputsToMemberObj(formValues);
      analytics.recordManageMemberSave('save-click', getAnalyticsUserInfo(userInfo), formattedInputValues);

      const basicErrors: any[] = await checkBasicInfoForm({ ...formattedInputValues });
      const skillsErrors: any[] = await checkSkillInfoForm({ ...formattedInputValues });
      const contributionErrors: any = await checkContributionInfoForm({ ...formattedInputValues });
      const allFormErrors = [...basicErrors, ...skillsErrors, ...Object.keys(contributionErrors)];

      if (allFormErrors.length > 0) {
        setErrors((v: any) => {
          return {
            ...v,
            basicErrors: [...basicErrors],
            skillsErrors: [...skillsErrors],
            contributionErrors: { ...contributionErrors },
          };
        });
        triggerLoader(false);
        onShowErrorModal();
        analytics.recordManageMemberSave('validation-error', getAnalyticsUserInfo(userInfo), formattedInputValues);
        return;
      }
      setErrors({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
      const isBothSame = onFormChange();
      if (isBothSame) {
        toast.info('There are no changes to save');
        triggerLoader(false);
        return;
      }

      if (formattedInputValues.memberProfile && formattedInputValues.memberProfile.size > 0) {
        const imgResponse = await saveRegistrationImage(formattedInputValues.memberProfile);
        const image = imgResponse?.image;
        formattedInputValues.imageUid = image.uid;
        formattedInputValues.image = image.url;

        const imgEle: any = document.getElementById('member-info-basic-image');
        if (imgEle) {
          imgEle.value = image.url;
        }
      } else if (selectedMember?.image?.uid && selectedMember?.image?.url && formattedInputValues.imageFile === selectedMember?.image?.url) {
        formattedInputValues.imageUid = selectedMember?.image?.uid;
      }

      delete formattedInputValues.memberProfile;
      delete formattedInputValues.imageFile;

      const payload = {
        participantType: 'MEMBER',
        referenceUid: selectedMember.uid,
        uniqueIdentifier: selectedMember.email,
        newData: { ...formattedInputValues },
      };

      const rawToken = Cookies.get('authToken');
      if (!rawToken) {
        return;
      }
      const authToken = JSON.parse(rawToken);
      const { data, isError, errorMessage, errorData } = await updateMember(selectedMember.uid, payload, authToken);
      triggerLoader(false);
      if (isError) {
        if (errorData?.message && errorData?.message === 'Email already exists. Please try again with different email') {
          toast.error('Email already exists. Please try again with different email');
        } else {
          toast.error('People update failed. Something went wrong, please try again later');
        }

        analytics.recordManageMemberSave('save-error', getAnalyticsUserInfo(userInfo), payload);
      } else {
        /* if (actionRef.current) {
            actionRef.current.style.visibility = 'hidden';
          } */

        setErrors({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
        toast.success('People updated successfully');
        analytics.recordManageMemberSave('save-success', getAnalyticsUserInfo(userInfo), payload);
        window.location.href = `/settings/members?id=${selectedMember.uid}&isVerified=${isVerifiedFlag}`;
      }
    } catch (e) {
      triggerLoader(false);
      toast.error('People update failed. Something went wrong, please try again later');
      analytics.recordManageMemberSave('save-error', getAnalyticsUserInfo(userInfo));
    }
  };

  const checkContributionInfoForm = async (formattedData: any) => {
    const allErrorObj: any = {};
    let errors = [];
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
      errors = result.error.errors.reduce((acc: any, error) => {
        const [name, index, key] = error.path;
        if (!acc[index]) {
          acc[index] = [];
        }
        acc[index].push(error.message);

        return acc;
      }, allErrorObj);
    }
    return errors;
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
  function onFormChange() {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      const apiObjs = apiObjsToMemberObj({ ...initialValues });
      const formattedInputValues = formInputsToMemberObj(formValues);
      delete formattedInputValues.memberProfile;
      if (!formattedInputValues.imageFile) {
        formattedInputValues.imageFile = '';
      }
      const isBothSame = compareObjsIfSame(apiObjs, formattedInputValues);
      return isBothSame;
    }
  }

  const onProfileTypeSelected = useCallback(
    (item: any) => {
      if (item.name === viewType) {
        return false;
      }

      router.push(`/settings/members?id=${selectedMember.uid}&viewType=${item.name}&isVerified=${isVerifiedFlag}`);
    },
    [viewType, selectedMember, isVerifiedFlag]
  );

  useEffect(() => {
    triggerLoader(false);
    analytics.recordMemberProfileFormEdit(getAnalyticsUserInfo(userInfo), 'BASIC');
    getMemberInfoFormValues()
      .then((d) => {
        if (!d.isError) {
          setAllData(d as any);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    triggerLoader(false);
  }, [initialValues]);

  useEffect(() => {
    function handleNavigate(e: any) {
      const url = e.detail.url;
      if (viewType === 'profile') {
        let proceed = true;
        const isSame = onFormChange();
        if (!isSame) {
          proceed = confirm('There are some unsaved changed. Do you want to proceed?');
        }
        if (!proceed) {
          return;
        }
      }
      triggerLoader(true);
      router.push(url);
      router.refresh();
    }
    document.addEventListener('settings-navigate', handleNavigate);
    return function () {
      document.removeEventListener('settings-navigate', handleNavigate);
    };
  }, [initialValues, viewType]);

  return (
    <>
      <div className="ms">
        <div className="ms__head">
          <div className="ms__member-selection">
            <div className="ms__member-selection__dp">
              <SingleSelect
                arrowImgUrl="/icons/arrow-down.svg"
                uniqueKey="name"
                onItemSelect={(item: any) => onVerifiedFlagChange(item)}
                displayKey="name"
                options={membersVerificationOptions}
                selectedOption={membersVerificationOptions.find(v => v.value === isVerifiedFlag)}
                id="manage-teams-settings-verified"
              />
            </div>
            <div className="ms__member-selection__dp">
              <SearchableSingleSelect
                arrowImgUrl="/icons/arrow-down.svg"
                displayKey="name"
                id="manage-teams-settings"
                onChange={(item: any) => onMemberChanged(item)}
                name=""
                formKey="name"
                onClear={() => {}}
                options={members}
                selectedOption={selectedMember}
                uniqueKey="id"
                iconKey="imageUrl"
                defaultImage="/icons/default-user-profile.svg"
              />
            </div>
            <div className="ms__member-selection__dp">
              <SingleSelect
                displayKey="name"
                arrowImgUrl="/icons/arrow-down.svg"
                id="manage-teams-settings-profiletype-selection"
                onItemSelect={onProfileTypeSelected}
                options={[...profileTypeOptions]}
                selectedOption={selectedProfileType}
                uniqueKey="name"
              />
            </div>
          </div>
          {viewType === 'profile' && (
            <div className="ms__tab">
              <div className="ms__tab__desktop">
                <Tabs errorInfo={tabsWithError} activeTab={activeTab.name} onTabClick={(v) => handleTabClick(v)} tabs={steps.map((v) => v.name)} />
              </div>
              <div className="ms__tab__mobile">
                <SingleSelect
                  arrowImgUrl="/icons/arrow-down.svg"
                  uniqueKey="name"
                  onItemSelect={(item: any) => setActiveTab(item)}
                  displayKey="name"
                  options={steps}
                  selectedOption={activeTab}
                  id="settings-member-steps"
                />
              </div>
            </div>
          )}
        </div>
        {viewType === 'profile' && (
          <form noValidate onReset={onResetForm} onSubmit={onFormSubmitted} ref={formRef} className="ms__content">
            <div className="ms__content__cn">
              <div className={`${activeTab.name !== 'basic' ? 'hidden' : ''}`}>
                <MemberBasicInfo isAdminEdit={true} errors={errors.basicErrors} initialValues={initialValues.basicInfo} />
              </div>
              <div className={`${activeTab.name !== 'skills' ? 'hidden' : ''}`}>
                <MemberSkillsInfo isEdit={true} errors={errors.skillsErrors} initialValues={initialValues.skillsInfo} skillsOptions={allData.skills} teamsOptions={allData.teams} />
              </div>
              <div className={`${activeTab.name !== 'contributions' ? 'hidden' : 'contribution'}`}>
                <MemberContributionInfo errors={errors.contributionErrors} initialValues={initialValues.contributionInfo} projectsOptions={allData.projects} />
              </div>
              <div className={`${activeTab.name !== 'social' ? 'hidden' : ''}`}>
                <MemberSocialInfo initialValues={initialValues.socialInfo} />
              </div>
            </div>
            <SettingsAction />
          </form>
        )}
        {viewType === 'privacy' && <MemberPrivacyReadOnly preferences={preferences} />}
      </div>

      <Modal modalRef={errorDialogRef} onClose={onModalClose}>
        <div className="error">
          <h2 className="error__title">Validation Errors</h2>
          <div className="error__info">
            <img width="16" height="16" src="/icons/alert-red.svg" />
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
                  <li className="error__item__list__msg" key={`basic-error-${i}`}>
                    {v}
                  </li>
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
          .contribution {
            min-height: calc(100vh - 250px);
          }
          .error__info {
            color: #0f172a;
            background: #dd2c5a1a;
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
            font-size: 12px;
            color: #ef4444;
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
          .ms__tab__desktop {
            display: none;
          }
          .ms__tab__mobile {
            display: block;
            padding: 0 24px;
          }
          .ms__head {
            background: white;
            position: sticky;
            top: 128px;
            z-index: 3;
            padding-bottom: 8px;
          }

          .ms__member-selection {
            padding: 0 24px;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            gap: 4px;
            width: 100%;
          }

          .ms__member-selection__dp {
            width: 100%;
          }

          .ms__sc {
            height: 72px;
            position: sticky;
            border: 2px solid #ff820e;
            margin: 0 24px;
            width: calc(100% - 48px);
            bottom: 16px;
            border-radius: 8px;
            padding: 16px;
            left: auto;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .ms__sc__info {
            display: flex;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            align-items: center;
            gap: 6px;
          }
          .ms__sc__action {
            display: flex;
            gap: 6px;
          }
          .ms__sc__action__save {
            padding: 10px 24px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
          }
          .ms__sc__action__cancel {
            padding: 10px 24px;
            background: white;
            color: #0f172a;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            font-weight: 500;
            border-radius: 8px;
          }
          .ms__tab {
            padding-top: 10px;
          }
          .ms__content {
            height: fit-content;
            min-height: calc(100svh - 128px);
          }
          .ms__content__cn {
            padding: 0px 24px;
            padding-bottom: 32px;
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
            .ms__head {
              top: 128.5px;
              padding-bottom: 0px;
            }
            .ms__member-selection {
              padding: 8px 16px;
              justify-content: space-between;
            }
            .ms__member-selection__dp {
              width: 250px;
            }
            .cs {
              width: 656px;
            }
            .ms__tab {
              border-bottom: 1px solid #e2e8f0;
              padding-top: 0;
            }
            .ms__tab__desktop {
              display: block;
            }
            .ms__tab__mobile {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
}

export default ManageMembersSettings;
