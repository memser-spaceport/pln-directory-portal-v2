'use client';
import Tabs from '@/components/ui/tabs';
import MemberBasicInfo from '../member-info/member-basic-info';
import { useEffect, useState } from 'react';
import MemberSkillsInfo from '../member-info/member-skills-info';
import MemberContributionInfo from '../member-info/member-contributions-info';
import MemberSocialInfo from '../member-info/member-social-info';
import { getMemberInfoFormValues } from '@/utils/member.utils';
import SettingsAction from './actions';
import SingleSelect from '@/components/form/single-select';

function MemberSettings() {
  const steps = [{ name: 'basic' }, { name: 'skills' }, { name: 'contributions' }, { name: 'social' }];
  const [activeTab, setActiveTab] = useState({ name: 'basic' });
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
        <div className="ms__tab">
          <div className="ms__tab__desktop">
            <Tabs activeTab={activeTab.name} onTabClick={(v) => setActiveTab({ name: v })} tabs={steps.map((v) => v.name)} />
          </div>
          <div className="ms__tab__mobile">
            <SingleSelect uniqueKey="name" onItemSelect={(item: any) => setActiveTab(item)} displayKey="name" options={steps} selectedOption={activeTab} id="settings-member-steps" />
          </div>
        </div>
        <div className="ms__content">
          {activeTab.name === 'basic' && <MemberBasicInfo errors={[]} initialValues={initialValues.basicInfo} />}
          {activeTab.name === 'skills' && <MemberSkillsInfo errors={[]} initialValues={initialValues.skillsInfo} skillsOptions={allData.skills} teamsOptions={allData.teams} />}
          {activeTab.name === 'contributions' && <MemberContributionInfo errors={[]} initialValues={initialValues.contributionInfo} projectsOptions={allData.projects} />}
          {activeTab.name === 'social' && <MemberSocialInfo initialValues={initialValues.socialInfo} />}
        </div>
        <SettingsAction />
      </div>

      <style jsx>
        {`
          .ms {
            width: 100%;
            margin-bottom: 0px;
            height: 100%;
          }

          .ms__tab {
            padding-top: 10px;
          }
          .ms__tab__desktop {
            display: none;
          }
          .ms__tab__mobile {
            display: block;
            padding: 0 24px;
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
            .cs {
              width: 656px;
            }
            .ms__content {
              padding: 32px 54px;
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

export default MemberSettings;
