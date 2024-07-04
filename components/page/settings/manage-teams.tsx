'use client';
import Tabs from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { getMemberInfoFormValues } from '@/utils/member.utils';
import SingleSelect from '@/components/form/single-select';
import TeamBasicInfo from '../team-form-info/team-basic-info';
import TeamProjectsInfo from '../team-form-info/team-projects-info';
import TeamSocialInfo from '../team-form-info/team-social-info';
import SettingsAction from './actions';

function ManageTeamsSettings() {
  const tabItems = ['basic', 'project details', 'social'];
  const [activeTab, setActiveTab] = useState('basic');
  const [allData, setAllData] = useState({ teams: [], projects: [], skills: [], isError: false });

  const initialValues = {
    skillsInfo: {
      teamsAndRoles: [{ teamTitle: '', role: '', teamUid: '' }],
      skills: [],
    },
    contributionInfo: {
      contributions: [],
    },
    basicInfo: {
      name: '',
      email: '',
      imageFile: '',
      plnStartDate: '',
      city: '',
      region: '',
      country: '',
    },
    socialInfo: {
      linkedinHandler: '',
      discordHandler: '',
      twitterHandler: '',
      githubHandler: '',
      telegramHandler: '',
      officeHours: '',
      comments: '',
    },
  };

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
      <div className="ms">
        <div className="ms__member-selection">
          <div className="ms__member-selection--dp">
            <SingleSelect displayKey="" id="" onItemSelect={(item) => console.log(item)} options={[]} selectedOption={null} uniqueKey="" />
          </div>
        </div>
        <div className="ms__tab">
          <Tabs activeTab={activeTab} onTabClick={(v) => setActiveTab(v)} tabs={tabItems} />
        </div>
        <div className="ms__content">
          {activeTab === 'basic' && <TeamBasicInfo errors={[]} initialValues={initialValues.basicInfo} />}
          {activeTab === 'project details' && <TeamProjectsInfo fundingStageOptions={[]} protocolOptions={[]} industryTagOptions={[]} membershipSourceOptions={[]} errors={[]} initialValues={initialValues.skillsInfo} />}
          {activeTab === 'social' && <TeamSocialInfo errors={[]} />}
        </div>
        <SettingsAction/>
      </div>

      <style jsx>
        {`
          .ms {
            width: 100%;
            border: 1px solid #e2e8f0;
            margin-bottom: 0px;
            height: 100%;
          }

          .ms__member-selection {
            padding: 16px;
            display: flex;
            justify-content: flex-start;
            width: 100%;
          }

          .ms__member-selection__dp {
            width: 150px;
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
            border-bottom: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          .ms__content {
            padding: 32px 54px;
            height: fit-content;
            min-height: calc(100svh - 128px);
          }
          @media (min-width: 1200px) {
            .ms {
              width: 656px;
            }
            .cs {
              width: 656px;
            }
          }
        `}
      </style>
    </>
  );
}

export default ManageTeamsSettings;
