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
import { compareObjsIfSame, triggerLoader } from '@/utils/common.utils';
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
interface ManageMembersSettingsProps {
  members: any[];
  selectedMember: any;
  profileType: 'info' | 'preference';
  preferences: any;
}

function ManageMembersSettings({ members = [], preferences = {}, selectedMember = {}, profileType = 'info' }: ManageMembersSettingsProps) {
  const steps = [{ name: 'basic' }, { name: 'skills' }, { name: 'contributions' }, { name: 'social' }];
  const profileTypeOptions = [{ name: 'info' }, { name: 'preference' }];
  const selectedProfileType = { name: profileType };
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
  const initialValues = useMemo(() => getInitialMemberFormValues(selectedMember), [selectedMember]);
  //useObserver({callback: onFormChange, observeItem: formRef})

  const updateBasedOnType = useCallback;

  const onMemberChanged = (uid: string) => {
    if (uid === selectedMember.uid) {
      return false;
    }

    if (selectedProfileType.name === 'info') {
      let proceed = true;
      const isSame = onFormChange();
      if (!isSame) {
        proceed = confirm('There are some unsaved changes. Do you wish to continue');
      }
      if (!proceed) {
        return proceed;
      }
      setActiveTab({ name: 'basic' });
      if (formRef.current) {
        formRef.current.reset();
        setErrors({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
        document.dispatchEvent(new CustomEvent('reset-member-register-form'));
      }
    }

    triggerLoader(true);
    router.push(`/settings/members?id=${uid}&profileType=${selectedProfileType.name}`, { scroll: false });
  };

  const onResetForm = async (e?: any) => {
    const isSame = onFormChange();
    if (isSame) {
      e.preventDefault();
      toast.info('There are no changes to reset');
      return;
    }
    const proceed = confirm('Do you want to reset the changes ?');
    if (!proceed) {
      e.preventDefault();
      return;
    }
    setErrors({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
    document.dispatchEvent(new CustomEvent('reset-member-register-form'));
  };

  const onFormSubmitted = async (e: any) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!formRef.current) {
        return;
      }
      const isBothSame = onFormChange();
      if(isBothSame) {
        toast.info("There are no changes to save")
        return;
      }
      triggerLoader(true);
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      const formattedInputValues = formInputsToMemberObj(formValues);

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
        return;
      }
      setErrors({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
      const isSame = onFormChange();
      if (isSame) {
        triggerLoader(false);
        toast.info('No changes to save');
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
      const { data, isError } = await updateMember(selectedMember.uid, payload, authToken);
      triggerLoader(false);
      if (isError) {
        toast.error('Member updated failed. Something went wrong, please try again later');
      } else {
        /* if (actionRef.current) {
            actionRef.current.style.visibility = 'hidden';
          } */
        setErrors({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
        toast.success('Member updated successfully');
        router.refresh();
      }
      console.log(data, isError);
    } catch (e) {
      console.log(e);
      triggerLoader(false);
      toast.error('Member updated failed. Something went wrong, please try again later');
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

      console.log('form change', initialValues, apiObjs, isBothSame, JSON.stringify(apiObjs), '-----------------', JSON.stringify(formattedInputValues));
      return isBothSame;
    }
  }

  const onProfileTypeSelected = useCallback(
    (item: any) => {
      if (item.name === profileType) {
        return false;
      }

      router.push(`/settings/members?id=${selectedMember.uid}&profileType=${item.name}`);
    },
    [profileType, selectedMember]
  );

  useEffect(() => {
    triggerLoader(false);
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
      if (profileType === 'info') {
        let proceed = true;
        const isSame = onFormChange();
        console.log(isSame, e.detail);
        if (!isSame) {
          proceed = confirm('There are some unsaved changed. Do you want to proceed?');
        }
        if (!proceed) {
          return;
        }
      }
      router.push(url);
    }
    document.addEventListener('settings-navigate', handleNavigate);
    return function () {
      document.removeEventListener('settings-navigate', handleNavigate);
    };
  }, [initialValues, profileType]);

  return (
    <>
      <div className="ms">
        <div className="ms__member-selection">
          <div className="ms__member-selection__dp">
            <SearchableSingleSelect
              arrowImgUrl="/icons/arrow-down.svg"
              displayKey="name"
              id="manage-teams-settings"
              onChange={(item: any) => onMemberChanged(item.id)}
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
        {profileType === 'info' && (
          <div className="ms__tab">
            <div className="ms__tab__desktop">
              <Tabs errorInfo={tabsWithError} activeTab={activeTab.name} onTabClick={(v) => setActiveTab({ name: v })} tabs={steps.map((v) => v.name)} />
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
        {profileType === 'info' && (
          <form noValidate onReset={onResetForm} onSubmit={onFormSubmitted} ref={formRef} className="ms__content">
            <div className="ms__content__cn">
              <div className={`${activeTab.name !== 'basic' ? 'hidden' : ''}`}>
                <MemberBasicInfo isAdminEdit={true} errors={[]} initialValues={initialValues.basicInfo} />
              </div>
              <div className={`${activeTab.name !== 'skills' ? 'hidden' : ''}`}>
                <MemberSkillsInfo isEdit={true} errors={[]} initialValues={initialValues.skillsInfo} skillsOptions={allData.skills} teamsOptions={allData.teams} />
              </div>
              <div className={`${activeTab.name !== 'contributions' ? 'hidden' : ''}`}>
                <MemberContributionInfo errors={[]} initialValues={initialValues.contributionInfo} projectsOptions={allData.projects} />
              </div>
              <div className={`${activeTab.name !== 'social' ? 'hidden' : ''}`}>
                <MemberSocialInfo initialValues={initialValues.socialInfo} />
              </div>
            </div>
            <SettingsAction />
          </form>
        )}
        {profileType === 'preference' && <MemberPrivacyReadOnly preferences={preferences} />}
      </div>

      <Modal modalRef={errorDialogRef} onClose={onModalClose}>
        <div className="error">
          <h2 className="error__title">Validation Errors</h2>
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
            width: 50vw;
            height: auto;
            padding: 16px;
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

          .ms__member-selection {
            padding: 0 24px;
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
            padding: 32px 24px;
          }
          @media (min-width: 1024px) {
            .ms {
              width: 656px;
              border: 1px solid #e2e8f0;
            }
            .ms__member-selection {
              padding: 16px;
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
