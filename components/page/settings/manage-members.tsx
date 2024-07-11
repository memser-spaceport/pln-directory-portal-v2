'use client';
import Tabs from '@/components/ui/tabs';
import MemberBasicInfo from '../member-info/member-basic-info';
import { useEffect, useRef, useState } from 'react';
import MemberSkillsInfo from '../member-info/member-skills-info';
import MemberContributionInfo from '../member-info/member-contributions-info';
import MemberSocialInfo from '../member-info/member-social-info';
import { getMemberInfoFormValues, apiObjsToMemberObj, formInputsToMemberObj, utcDateToDateFieldString } from '@/utils/member.utils';
import SingleSelect from '@/components/form/single-select';
import { useRouter } from 'next/navigation';
import { compareObjsIfSame, triggerLoader } from '@/utils/common.utils';
import { toast } from 'react-toastify';
import { updateMember } from '@/services/members.service';
import Cookies from 'js-cookie';
import { validateLocation } from '@/services/location.service';
import { TeamAndSkillsInfoSchema, basicInfoSchema, projectContributionSchema } from '@/schema/member-forms';
import Modal from '@/components/core/modal';
interface ManageMembersSettingsProps {
  members: any[];
  selectedMember: any;
}

function ManageMembersSettings({ members, selectedMember }: ManageMembersSettingsProps) {
  const steps = [{ name: 'basic' }, { name: 'skills' }, { name: 'contributions' }, { name: 'social' }];
  const [activeTab, setActiveTab] = useState({ name: 'basic' });
  const [allData, setAllData] = useState({ teams: [], projects: [], skills: [], isError: false });
  const formRef = useRef<HTMLFormElement | null>(null);
  const actionRef = useRef<HTMLDivElement | null>(null);
  const errorDialogRef = useRef<HTMLDialogElement>(null);
  const [errors, setErrors] = useState<any>({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] });
  const router = useRouter();
  const initialValues = {
    skillsInfo: {
      teamsAndRoles: selectedMember.teamMemberRoles ?? [],
      skills: selectedMember.skills ?? [],
    },
    contributionInfo: selectedMember?.projectContributions ?? [],
    basicInfo: {
      name: selectedMember?.name,
      email: selectedMember.email,
      imageFile: selectedMember?.image?.url,
      plnStartDate: selectedMember?.plnStartDate ? utcDateToDateFieldString(selectedMember?.plnStartDate) : '',
      city: selectedMember?.location?.city ?? '',
      region: selectedMember?.location?.region ?? '',
      country: selectedMember?.location?.country ?? '',
    },
    socialInfo: {
      linkedinHandler: selectedMember?.linkedinHandler,
      discordHandler: selectedMember?.discordHandler,
      twitterHandler: selectedMember?.twitterHandler,
      githubHandler: selectedMember?.githubHandler,
      telegramHandler: selectedMember?.telegramHandler,
      officeHours: selectedMember?.officeHours,
      moreDetails: selectedMember?.moreDetails,
    },
  };

  const onMemberChanged = (uid: string) => {
    if (formRef.current) {
      formRef.current.reset();
      onResetForm()
    }
    router.push(`/settings/members?id=${uid}`, { scroll: false });
  };

  const onResetForm = async () => {
    if (actionRef.current) {
      actionRef.current.style.visibility = 'hidden';
    }
    setErrors({ basicErrors: [], socialErrors: [], contributionErrors: {}, skillsErrors: [] })
    document.dispatchEvent(new CustomEvent('reset-member-register-form'));
  };

  const onFormSubmitted = async (e: any) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      triggerLoader(true);
      if (formRef.current) {
        const formData = new FormData(formRef.current);
        const formValues = Object.fromEntries(formData);
        const formattedInputValues = formInputsToMemberObj(formValues);

        const basicErrors: any[] = await checkBasicInfoForm({ ...formattedInputValues });
        const skillsErrors: any[] = await checkSkillInfoForm({ ...formattedInputValues });
        const contributionErrors: any = await checkContributionInfoForm({ ...formattedInputValues });
        const allFormErrors = [...basicErrors, ...skillsErrors, ...Object.keys(contributionErrors)];

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
          return;
        }

        const payload = {
          participantType: 'MEMBER',
          referenceUid: selectedMember.uid,
          uniqueIdentifier: selectedMember.email,
          newData: { ...formattedInputValues },
        };

        const rawToken = Cookies.get('authToken');
        if(!rawToken) {
          return;
        }
        const authToken = JSON.parse(rawToken);
        const { data, isError } = await updateMember(selectedMember.uid, payload, authToken);
        triggerLoader(false);
        if (isError) {
          toast.error('Member updated failed. Something went wrong, please try again later');
        } else {
          if (actionRef.current) {
            actionRef.current.style.visibility = 'hidden';
          }
          toast.success('Member updated successfully');
        }
        console.log(data, isError);
      }
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
  const onFormChange = async () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      const apiObjs = apiObjsToMemberObj({ ...initialValues });
      const formattedInputValues = formInputsToMemberObj(formValues);
      delete formattedInputValues.memberProfile;
      const isBothSame = compareObjsIfSame(apiObjs, formattedInputValues);

      console.log('form change', isBothSame, JSON.stringify(apiObjs), '-----------------', JSON.stringify(formattedInputValues));
      if (actionRef.current) {
        actionRef.current.style.visibility = isBothSame ? 'hidden' : 'visible';
      }
    }
  };

  useEffect(() => {
    // MutationObserver callback
    const observerCallback = async (mutationsList: any) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
          await onFormChange();
        }
      }
    };

    // Create a MutationObserver
    const observer = new MutationObserver(observerCallback);

    // Observe changes in the form
    if (formRef.current) {
      observer.observe(formRef.current, { childList: true, subtree: true, attributes: true });
    }

    // Cleanup function to disconnect the observer when the component unmounts
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [initialValues]);

  useEffect(() => {
    getMemberInfoFormValues()
      .then((d) => {
        if (!d.isError) {
          setAllData(d as any);
        }
      })
      .catch((e) => console.error(e));
  }, []);
  return (
    <>
      <form noValidate onInput={onFormChange} onReset={onResetForm} onSubmit={onFormSubmitted} ref={formRef} className="ms">
        <div className="ms__member-selection">
          <div className="ms__member-selection__dp">
            <SingleSelect
              arrowImgUrl="/icons/arrow-down.svg"
              displayKey="name"
              id="manage-members-settings"
              onItemSelect={(item: any) => onMemberChanged(item.id)}
              options={members}
              selectedOption={selectedMember}
              uniqueKey="id"
            />
          </div>
        </div>
        <div className="ms__tab">
          <div className="ms__tab__desktop">
            <Tabs activeTab={activeTab.name} onTabClick={(v) => setActiveTab({ name: v })} tabs={steps.map((v) => v.name)} />
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
        <div className="ms__content">
          <div className={`${activeTab.name !== 'basic' ? 'hidden' : ''}`}>
            <MemberBasicInfo errors={[]} initialValues={initialValues.basicInfo} />
          </div>
          <div className={`${activeTab.name !== 'skills' ? 'hidden' : ''}`}>
            <MemberSkillsInfo errors={[]} initialValues={initialValues.skillsInfo} skillsOptions={allData.skills} teamsOptions={allData.teams} />
          </div>
          <div className={`${activeTab.name !== 'contributions' ? 'hidden' : ''}`}>
            <MemberContributionInfo errors={[]} initialValues={initialValues.contributionInfo} projectsOptions={allData.projects} />
          </div>
          <div className={`${activeTab.name !== 'social' ? 'hidden' : ''}`}>
            <MemberSocialInfo initialValues={initialValues.socialInfo} />
          </div>
        </div>
        <div ref={actionRef} className="fa">
          <div className="fa__info">
            <img alt="save icon" src="/icons/save.svg" width="16" height="16" />
            <p>Attention! You have unsaved changes!</p>
          </div>
          <div className="fa__action">
            <button className="fa__action__cancel" type="reset">
              Cancel
            </button>
            <button className="fa__action__save" type="submit">
              Save Changes
            </button>
          </div>
        </div>
      </form>
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
                {errors.skillsErrors.map((v: any, i:any) => (
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
            visibility: hidden;
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
            gap: 6px;
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
            justify-content: flex-start;
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
            padding: 32px 24px;
            height: fit-content;
            min-height: calc(100svh - 128px);
          }
          @media (min-width: 1200px) {
            .ms {
              width: 656px;
              border: 1px solid #e2e8f0;
            }
            .ms__member-selection {
              padding: 16px;
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
            .fa {
              height: 72px;
              bottom: 16px;
              flex-direction: row;
              left: auto;
              border-radius: 8px;
              justify-content: space-between;
              align-items: center;
              width: calc(100% - 48px);
              margin: 0 24px;
              border: 2px solid #ff820e;
            }
          }
        `}
      </style>
    </>
  );
}

export default ManageMembersSettings;
