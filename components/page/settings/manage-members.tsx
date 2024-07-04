'use client';
import Tabs from '@/components/ui/tabs';
import MemberBasicInfo from '../member-info/member-basic-info';
import { useEffect, useState } from 'react';
import MemberSkillsInfo from '../member-info/member-skills-info';
import MemberContributionInfo from '../member-info/member-contributions-info';
import MemberSocialInfo from '../member-info/member-social-info';
import { getMemberInfoFormValues } from '@/utils/member.utils';
import SingleSelect from '@/components/form/single-select';
import SettingsAction from './actions';


interface ManageMembersSettingsProps {
    members: any[],
    selectedMember: any
}

function ManageMembersSettings({members, selectedMember}: ManageMembersSettingsProps) {
  const steps = [{ name: 'basic' }, { name: 'skills' }, { name: 'contributions' }, { name: 'social' }];
  const [activeTab, setActiveTab] = useState({ name: 'basic' });
  const [allData, setAllData] = useState({ teams: [], projects: [], skills: [], isError: false });
  const initialValues = {
    skillsInfo: {
      teamsAndRoles: selectedMember.teamMemberRoles ?? [],
      skills: selectedMember.skills ?? [],
    },
    contributionInfo: {
      contributions: selectedMember.projectContributions ?? [],
    },
    basicInfo: {
      name: selectedMember?.name,
      email: selectedMember.email,
      imageFile: '',
      plnStartDate: '',
      city: selectedMember?.location?.city,
      region:  selectedMember?.location?.region,
      country:  selectedMember?.location?.country,
    },
    socialInfo: {
      linkedinHandler: selectedMember?.linkedinHandler,
      discordHandler: selectedMember?.discordHandler,
      twitterHandler: selectedMember?.twitterHandler,
      githubHandler: selectedMember?.githubHandler,
      telegramHandler: selectedMember?.telegramHandler,
      officeHours: selectedMember?.officeHours,
      comments: selectedMember?.comments,
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
          <div className="ms__member-selection__dp">
            <SingleSelect  arrowImgUrl="/icons/arrow-down.svg"  displayKey="name" id="manage-members-settings" onItemSelect={(item) => console.log(item)} options={members} selectedOption={selectedMember} uniqueKey="id" />
          </div>
        </div>
        <div className="ms__tab">
          <div className="ms__tab__desktop">
            <Tabs activeTab={activeTab.name} onTabClick={(v) => setActiveTab({ name: v })} tabs={steps.map((v) => v.name)} />
          </div>
          <div className="ms__tab__mobile">
            <SingleSelect arrowImgUrl="/icons/arrow-down.svg" uniqueKey="name" onItemSelect={(item: any) => setActiveTab(item)} displayKey="name" options={steps} selectedOption={activeTab} id="settings-member-steps" />
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
          }
        `}
      </style>
    </>
  );
}

export default ManageMembersSettings;
