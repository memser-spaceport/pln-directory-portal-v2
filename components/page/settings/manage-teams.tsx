'use client';
import Tabs from '@/components/ui/tabs';
import { useEffect, useRef, useState } from 'react';
import { getMemberInfoFormValues } from '@/utils/member.utils';
import SingleSelect from '@/components/form/single-select';
import TeamBasicInfo from '../team-form-info/team-basic-info';
import TeamProjectsInfo from '../team-form-info/team-projects-info';
import TeamSocialInfo from '../team-form-info/team-social-info';
import SettingsAction from './actions';
import { useRouter } from 'next/navigation';
import { getTeamsFormOptions } from '@/services/registration.service';
import { transformRawInputsToFormObj, transformTeamApiToFormObj } from '@/utils/team.utils';
import { compareObjsIfSame, triggerLoader } from '@/utils/common.utils';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { updateTeam } from '@/services/teams.service';
import Cookies from 'js-cookie'
import { toast } from 'react-toastify';

function ManageTeamsSettings(props) {
  const teams = props.teams ?? [];
  const selectedTeam = props.selectedTeam;
  const steps = [{ name: 'basic' }, { name: 'project details' }, { name: 'social' }];
  const [activeTab, setActiveTab] = useState({ name: 'basic' });
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const actionRef = useRef<HTMLDivElement | null>(null);
  const [allData, setAllData] = useState({ technologies: [], fundingStage: [], membershipSources: [], industryTags: [], isError: false });
  const [basicErrors, setBasicErrors] = useState<string[]>([]);
  const [projectDetailsErrors, setProjectDetailsErrors] = useState<string[]>([]);
  const [socialErrors, setSocialErrors] = useState<string[]>([]);

  const initialValues = {
    basicInfo: {
      requestorEmail: '',
      teamProfile: '',
      name: selectedTeam.name,
      shortDescription: selectedTeam.shortDescription ?? '',
      longDescription: selectedTeam.longDescription ?? '',
      officeHours: selectedTeam.officeHours ?? '',
    },
    projectsInfo: {
      technologies: selectedTeam.technologies ?? [],
      membershipSources: selectedTeam.membershipSources ?? [],
      industryTags: selectedTeam.industryTags ?? [],
      fundingStage: {
        id: selectedTeam.fundingStageUid,
        name: selectedTeam?.fundingStage?.title,
      },
    },
    socialInfo: {
      contactMethod: selectedTeam?.contactMethod ?? '',
      website: selectedTeam?.website ?? '',
      linkedinHandler: selectedTeam?.linkedinHandler ?? '',
      twitterHandler: selectedTeam?.twitterHandler ?? '',
      telegramHandler: selectedTeam?.telegramHandler ?? '',
      blog: selectedTeam?.blog ?? '',
    },
  };

  const onTeamChanged = (uid: string) => {
    if (formRef.current) {
      formRef.current.reset();
    }
    router.push(`/settings/teams?id=${uid}`, { scroll: false });
  };

  const onResetForm = async () => {
    if (actionRef.current) {
      actionRef.current.style.visibility = 'hidden';
    }
    document.dispatchEvent(new CustomEvent('reset-team-register-form'));
  };

  const onFormSubmitted = async (e) => {
   try {
    e.stopPropagation();
    e.preventDefault();
    triggerLoader(true)
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      const formattedInputValues = transformRawInputsToFormObj(formValues);

      const payload = {
        participantType: 'TEAM',
        referenceUid: selectedTeam?.uid,
        uniqueIdentifier: selectedTeam?.name,
        newData: { ...formattedInputValues },
      };

      const {data,  isError} = await updateTeam(payload, JSON.parse(Cookies.get('authToken')), selectedTeam.uid)
      triggerLoader(false)
      if(isError) {
        toast.error("Team updated failed. Something went wrong, please try again later")
      } else {
        if (actionRef.current) {
          actionRef.current.style.visibility = 'hidden';
        }
        toast.success("Team updated successfully")
      }
      console.log(data, isError)
    }
   } catch (e) {
    triggerLoader(false);
    toast.error("Team updated failed. Something went wrong, please try again later")
   }
  };

  const onFormChange = async () => {
    console.log('form changed');
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const formValues = Object.fromEntries(formData);
      const apiObjs = transformTeamApiToFormObj({ ...initialValues });
      const formattedInputValues = transformRawInputsToFormObj(formValues);
      delete formattedInputValues.teamProfile;
      const isBothSame = compareObjsIfSame(apiObjs, formattedInputValues);

      console.log('form change', isBothSame, JSON.stringify(apiObjs), '-----------------', JSON.stringify(formattedInputValues));
      if (actionRef.current) {
        actionRef.current.style.visibility = isBothSame ? 'hidden' : 'visible';
      }
    }
  };

  useEffect(() => {
    // MutationObserver callback
    const observerCallback = async (mutationsList) => {
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
      observer.observe(formRef.current, { childList: true, subtree: true });
    }

    // Cleanup function to disconnect the observer when the component unmounts
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [initialValues]);

  useEffect(() => {
    getTeamsFormOptions()
      .then((data) => {
        if (!data.isError) {
          setAllData(data as any);
        }
      })
      .catch((e) => console.error(e));
  }, []);
  return (
    <>
      <form onSubmit={onFormSubmitted} onInput={onFormChange} onReset={onResetForm} ref={formRef} className="ms">
        <div className="ms__member-selection">
          <div className="ms__member-selection--dp">
            <SearchableSingleSelect
              arrowImgUrl="/icons/arrow-down.svg"
              displayKey="name"
              id="manage-teams-settings"
              onChange={(item: any) => onTeamChanged(item.id)}
              name=""
              formKey="name"
              onClear={() => {}}
              // onItemSelect=
              options={teams}
              selectedOption={selectedTeam}
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
              id="settings-teams-steps"
            />
          </div>
        </div>
        <div className="ms__content">
          <div className={`${activeTab.name !== 'basic' ? 'hidden' : ''}`}>
            <TeamBasicInfo isEdit={true} errors={basicErrors} initialValues={initialValues.basicInfo} />
          </div>
          <div className={`${activeTab.name !== 'project details' ? 'hidden' : ''}`}>
            <TeamProjectsInfo
              errors={projectDetailsErrors}
              protocolOptions={allData?.technologies}
              fundingStageOptions={allData?.fundingStage}
              membershipSourceOptions={allData?.membershipSources}
              industryTagOptions={allData?.industryTags}
              initialValues={initialValues.projectsInfo}
            />
          </div>
          <div className={`${activeTab.name !== 'social' ? 'hidden' : ''}`}>
            <TeamSocialInfo initialValues={initialValues.socialInfo} errors={socialErrors} />
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

      <style jsx>
        {`
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
          @media (min-width: 1024px) {
            .ms {
              width: 656px;
              border: 1px solid #e2e8f0;
            }
            .ms__member-selection {
              padding: 16px;
            }
            .ms__member-selection__dp {
              width: 150px;
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

export default ManageTeamsSettings;