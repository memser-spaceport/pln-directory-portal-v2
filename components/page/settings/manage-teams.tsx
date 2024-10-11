'use client';
import Tabs from '@/components/ui/tabs';
import { useEffect, useMemo, useRef, useState } from 'react';
import SingleSelect from '@/components/form/single-select';
import TeamBasicInfo from '../team-form-info/team-basic-info';
import TeamProjectsInfo from '../team-form-info/team-projects-info';
import TeamSocialInfo from '../team-form-info/team-social-info';
import { useRouter } from 'next/navigation';
import { getTeamsFormOptions, saveRegistrationImage } from '@/services/registration.service';
import { getTeamInitialValue, transformRawInputsToFormObj, transformTeamApiToFormObj } from '@/utils/team.utils';
import { compareObjsIfSame, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { updateTeam } from '@/services/teams.service';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { projectDetailsSchema, socialSchema, basicInfoSchema } from '@/schema/team-forms';
import Modal from '@/components/core/modal';
import SettingsAction from './actions';
import { validatePariticipantsEmail } from '@/services/participants-request.service';
import { ENROLLMENT_TYPE } from '@/utils/constants';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';

function ManageTeamsSettings(props: any) {
  //props
  const teams = props.teams ?? [];
  const selectedTeam = props.selectedTeam;
  const userInfo = props?.userInfo ?? {};

  //variables
  const steps = [{ name: 'basic' }, { name: 'project details' }, { name: 'social' }];
  const [activeTab, setActiveTab] = useState({ name: 'basic' });
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [allData, setAllData] = useState({ technologies: [], fundingStage: [], membershipSources: [], industryTags: [], focusAreas: [], isError: false });
  const [errors, setErrors] = useState({ basicErrors: [], socialErrors: [], projectErrors: [] });
  const tabsWithError = {
    basic: errors.basicErrors.length > 0,
    'project details': errors.projectErrors.length > 0,
    social: errors.socialErrors.length > 0,
  };
  const errorDialogRef = useRef<HTMLDialogElement>(null);
  const initialValues = useMemo(() => getTeamInitialValue(selectedTeam), [selectedTeam]);
  const [content, setContent] = useState(initialValues?.basicInfo.longDescription ?? '');
  const analytics = useSettingsAnalytics();

  const handleTabClick = (v: string) => {
    analytics.recordTeamProfileFormEdit(getAnalyticsUserInfo(userInfo), v.toUpperCase());
    setActiveTab({ name: v })
  }

  const onTeamChanged = (team: any) => {
    const uid = team?.id;
    if (uid === selectedTeam.uid) {
      return false;
    }
    let proceed = true;
    const isSame = onFormChange();
    if (!isSame) {
      proceed = confirm('There are some unsaved changes. Do you wish to continue');
    }
    if (!proceed) {
      return proceed;
    }

    triggerLoader(true);
    window.location.href = `/settings/teams?id=${uid}`;
    analytics.recordManageTeamsTeamChange(team, getAnalyticsUserInfo(userInfo));
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
    document.dispatchEvent(new CustomEvent('reset-team-register-form'));
    setErrors({ basicErrors: [], socialErrors: [], projectErrors: [] });
  };
  const validateForm = (schema: any, data: any) => {
    const validationResponse = schema.safeParse(data);
    if (!validationResponse.success) {
      const formattedErrors = validationResponse?.error?.errors?.map((error: any) => error.message);
      return { success: false, errors: formattedErrors };
    }
    return { success: true, errors: [] };
  };
  const validateBasicInfo = async (formattedData: any) => {
    const errors = [];
    formattedData.requestorEmail = 'test@test.com';
    const validationResponse = validateForm(basicInfoSchema, formattedData);
    if (formattedData.name.trim() !== initialValues.basicInfo.name.trim()) {
      const nameVerification = await validatePariticipantsEmail(formattedData.name, ENROLLMENT_TYPE.TEAM);

      if (!nameVerification.isValid) {
        errors.push('Name Already exists!');
      }
    }
    const imageFile = formattedData?.teamProfile;
    if (!validationResponse.success) {
      errors.push(...validationResponse.errors);
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

  const validateSocial = async (formattedData: any) => {
    let errors = [];
    const validationResponse = validateForm(socialSchema, formattedData);
    if (!validationResponse?.success) {
      errors.push(...validationResponse.errors);
    }
    return errors;
  };

  const validateProjectsInfo = async (formattedData: any) => {
    let errors = [];
    const validationResponse = validateForm(projectDetailsSchema, formattedData);
    if (!validationResponse.success) {
      errors.push(...validationResponse.errors);
    }

    return errors;
  };

  const onFormSubmitted = async (e: any) => {
    try {
      triggerLoader(true);
      e.stopPropagation();
      e.preventDefault();
      analytics.recordTeamProfileFormEdit(getAnalyticsUserInfo(userInfo), 'COMPLETED');
      if (!formRef.current) {
        triggerLoader(false);
        return;
      }

      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      formValues.longDescription = content;
      const formattedInputValues = transformRawInputsToFormObj(formValues);
      analytics.recordManageTeamSave('save-click', getAnalyticsUserInfo(userInfo), formattedInputValues);
      const basicInfoErrors: any = await validateBasicInfo({ ...formattedInputValues });
      const projectInfoErrors: any = await validateProjectsInfo({ ...formattedInputValues });
      const socialInfoErrors: any = await validateSocial({ ...formattedInputValues });
      const allErrors = [...basicInfoErrors, ...projectInfoErrors, ...socialInfoErrors];
      if (allErrors.length > 0) {
        setErrors({
          basicErrors: basicInfoErrors,
          projectErrors: projectInfoErrors,
          socialErrors: socialInfoErrors,
        });
        onShowErrorModal();
        triggerLoader(false);
        analytics.recordManageTeamSave('validation-error', getAnalyticsUserInfo(userInfo), formattedInputValues);
        return;
      }
      setErrors({ basicErrors: [], socialErrors: [], projectErrors: [] });
      const isBothSame = onFormChange();
      if (isBothSame) {
        toast.info('There are no changes to save');
        triggerLoader(false);
        return;
      }

      if (formattedInputValues.teamFocusAreas) {
        formattedInputValues.focusAreas = [...formattedInputValues.teamFocusAreas];
        delete formattedInputValues.teamFocusAreas;
      }

      if (formattedInputValues.teamProfile && formattedInputValues.teamProfile.size > 0) {
        const imgResponse = await saveRegistrationImage(formattedInputValues.teamProfile);
        const image = imgResponse?.image;
        formattedInputValues.logoUid = image.uid;
        formattedInputValues.logoUrl = image.url;
        const imgEle: any = document.getElementById('team-info-basic-image');
        if (imgEle) {
          imgEle.value = image.url;
        }
      } else if (selectedTeam?.logo?.uid && selectedTeam?.logo?.url && formattedInputValues.imageFile === selectedTeam?.logo?.url) {
        formattedInputValues.logoUid = selectedTeam?.logo?.uid;
        formattedInputValues.logoUrl = selectedTeam?.logo?.url;
      }

      delete formattedInputValues.teamProfile;
      delete formattedInputValues.imageFile;
      const payload = {
        participantType: 'TEAM',
        referenceUid: selectedTeam?.uid,
        uniqueIdentifier: selectedTeam?.name,
        newData: { ...formattedInputValues },
      };

      const authToken = Cookies.get('authToken');
      if (!authToken) {
        return;
      }
      const { data, isError } = await updateTeam(payload, JSON.parse(authToken), selectedTeam.uid);
      triggerLoader(false);
      if (isError) {
        toast.error('Team updated failed. Something went wrong, please try again later');
        analytics.recordManageTeamSave('save-error', getAnalyticsUserInfo(userInfo), payload);
      } else {
        /*  if (actionRef.current) {
            actionRef.current.style.visibility = 'hidden';
          } */
        toast.success('Team updated successfully');
        // window.location.href = `/settings/teams?id=${selectedTeam.uid}`;
        analytics.recordManageTeamSave('save-success', getAnalyticsUserInfo(userInfo), payload);
      }
    } catch (e) {
      triggerLoader(false);
      toast.error('Team updated failed. Something went wrong, please try again later');
      analytics.recordManageTeamSave('save-error', getAnalyticsUserInfo(userInfo));
    }
  };

  const onFormChange = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      const apiObjs = transformTeamApiToFormObj({ ...initialValues });
      const formattedInputValues = transformRawInputsToFormObj(formValues);
      // formattedInputValues.longDescription = content;
      delete formattedInputValues.teamProfile;
      if (!formattedInputValues.teamFocusAreas) {
        formattedInputValues.teamFocusAreas = [];
      }
      if (!formattedInputValues.imageFile) {
        formattedInputValues.imageFile = '';
      }
      const isBothSame = compareObjsIfSame(apiObjs, formattedInputValues);

      return isBothSame;
    }
  };

  useEffect(() => {
    analytics.recordTeamProfileFormEdit(getAnalyticsUserInfo(userInfo), 'BASIC');
    getTeamsFormOptions()
      .then((data) => {
        if (!data.isError) {
          setAllData(data as any);
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
      let proceed = true;
      const isSame = onFormChange();
      if (!isSame) {
        proceed = confirm('There are some unsaved changed. Do you want to proceed?');
      }
      if (!proceed) {
        return;
      }
      triggerLoader(true);
      router.push(url);
      router.refresh();
    }
    document.addEventListener('settings-navigate', handleNavigate);
    return function () {
      document.removeEventListener('settings-navigate', handleNavigate);
    };
  }, [initialValues]);

  return (
    <>
      <form noValidate onSubmit={onFormSubmitted} onReset={onResetForm} ref={formRef} className="ms">
        <div className="ms__head">
          <div className="ms__member-selection">
            <div className="ms__member-selection__dp">
              <SearchableSingleSelect
                arrowImgUrl="/icons/arrow-down.svg"
                displayKey="name"
                id="manage-teams-settings"
                onChange={(item: any) => onTeamChanged(item)}
                name=""
                formKey="name"
                onClear={() => {}}
                // onItemSelect=
                options={teams}
                selectedOption={selectedTeam}
                uniqueKey="id"
                iconKey="imageFile"
                defaultImage="/icons/team-default-profile.svg"
              />
            </div>
          </div>

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
                id="settings-teams-steps"
              />
            </div>
          </div>
        </div>
        <div className="ms__content">
          <div className={`${activeTab.name !== 'basic' ? 'hidden' : ''}`}>
            <TeamBasicInfo isEdit={true} errors={errors.basicErrors} initialValues={initialValues.basicInfo} longDesc={content} setLongDesc={setContent}/>
          </div>
          <div className={`${activeTab.name !== 'project details' ? 'hidden' : ''}`}>
            <TeamProjectsInfo
              errors={errors.projectErrors}
              protocolOptions={allData?.technologies}
              fundingStageOptions={allData?.fundingStage}
              membershipSourceOptions={allData?.membershipSources}
              industryTagOptions={allData?.industryTags}
              focusAreas={allData?.focusAreas}
              initialValues={initialValues.projectsInfo}
              showFocusArea={true}
            />
          </div>
          <div className={`${activeTab.name !== 'social' ? 'hidden' : ''}`}>
            <TeamSocialInfo initialValues={initialValues.socialInfo} errors={errors.socialErrors} />
          </div>
        </div>
        <SettingsAction />
      </form>

      <Modal modalRef={errorDialogRef} onClose={() => onModalClose()}>
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
                {errors.basicErrors.map((v, i) => (
                  <li className="error__item__list__msg" key={`basic-error-${i}`}>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errors.projectErrors.length > 0 && (
            <div className="error__item">
              <h3 className="error__item__title">Project Info</h3>
              <ul className="error__item__list">
                {errors.projectErrors.map((v, i) => (
                  <li className="error__item__list__msg" key={`basic-error-${i}`}>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errors.socialErrors.length > 0 && (
            <div className="error__item">
              <h3 className="error__item__title">Social Info</h3>
              <ul className="error__item__list">
                {errors.socialErrors.map((v, i) => (
                  <li className="error__item__list__msg" key={`basic-error-${i}`}>
                    {v}
                  </li>
                ))}
              </ul>
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
            //visibility: hidden;
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
              .ms__tab {
            padding-top: 0px;
          }
            .ms__head {
              top: 128.5px;
              padding-bottom: 0px;
            }
            .ms__member-selection {
              padding: 8px 16px;
              
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
              height: 68px;
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

export default ManageTeamsSettings;
