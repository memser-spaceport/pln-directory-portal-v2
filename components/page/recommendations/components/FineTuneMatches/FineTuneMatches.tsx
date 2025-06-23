import React, { useMemo } from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';

import s from './FineTuneMatches.module.scss';
import { MatchesSelector } from '@/components/page/recommendations/components/MatchesSelector';
import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';
import { useFormContext } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import { useMemberRolesOptions } from '@/services/members/hooks/useMemberRolesOptions';

export const FineTuneMatches = () => {
  const { data } = useTeamsFormOptions();
  const { data: rolesData } = useMemberRolesOptions();
  const { getValues } = useFormContext<TRecommendationsSettingsForm>();
  const { industryTags, roles, fundingStage } = getValues();

  const options = useMemo(() => {
    if (!data) {
      return {
        industryTagsOptions: [],
        fundingStageOptions: [],
      };
    }

    return {
      industryTagsOptions: data.industryTags.map((val: { id: any; name: any }) => ({
        value: val.id,
        label: val.name,
      })),
      fundingStageOptions: data.fundingStage.map((val: { id: any; name: any }) => ({
        value: val.id,
        label: val.name,
      })),
    };
  }, [data]);

  const rolesOptions = useMemo(() => {
    if (!rolesData) {
      return [];
    }

    return rolesData.map((val: { role: string }) => ({
      value: val.role,
      label: val.role,
    }));
  }, [rolesData]);

  return (
    <Collapsible.Root className={s.Collapsible} defaultOpen={industryTags.length > 0 || roles.length > 0 || fundingStage.length > 0}>
      <Collapsible.Trigger className={s.Trigger}>
        <div className={s.col}>
          <div className={s.primary}>Fine-tune matches</div>
          <div className={s.secondary}>Customize recommendations and find the right people for your goals.</div>
        </div>

        <ChevronDownIcon className={s.Icon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={s.Panel} key={industryTags.length + roles.length + fundingStage.length}>
        <div className={s.Content}>
          <MatchesSelector
            desc="The project is a leader in the industry you are tracking."
            hint="Choose a direction that matches your interests."
            icon={<HashIcon />}
            title="Industry tags"
            options={options.industryTagsOptions}
            name="industryTags"
          />
          <MatchesSelector
            desc="This user is perfect for you to collaborate with."
            hint="Select additional roles to broaden your recommendations."
            icon={<RoleIcon />}
            title="Role"
            options={rolesOptions}
            name="roles"
            isColorfulBadges={false}
          />
          <MatchesSelector
            desc="New project Reached the stage you are tracking."
            hint="Select the stage of project funding to get more relevant advice."
            icon={<HashIcon />}
            title="Funding Stage"
            options={options.fundingStageOptions}
            name="fundingStage"
            isColorfulBadges={false}
            menuPlacement="top"
          />
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

function HashIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.65625 1.03125C6.1875 1.125 6.5625 1.625 6.46875 2.1875L6.15625 4H9.125L9.5 1.84375C9.59375 1.3125 10.0938 0.9375 10.6562 1.03125C11.1875 1.125 11.5625 1.625 11.4688 2.1875L11.1562 4H13C13.5312 4 14 4.46875 14 5C14 5.5625 13.5312 6 13 6H10.8438L10.1562 10H12C12.5312 10 13 10.4688 13 11C13 11.5625 12.5312 12 12 12H9.84375L9.46875 14.1875C9.375 14.7188 8.875 15.0938 8.3125 15C7.78125 14.9062 7.40625 14.4062 7.5 13.8438L7.8125 12.0312H4.84375L4.46875 14.1875C4.375 14.7188 3.875 15.0938 3.3125 15C2.78125 14.9062 2.40625 14.4062 2.5 13.8438L2.8125 12H1C0.4375 12 0 11.5625 0 11C0 10.4688 0.4375 10 1 10H3.125L3.8125 6H2C1.4375 6 1 5.5625 1 5C1 4.46875 1.4375 4 2 4H4.125L4.5 1.84375C4.59375 1.3125 5.09375 0.9375 5.65625 1.03125ZM5.84375 6L5.15625 10H8.125L8.8125 6H5.84375Z"
        fill="#156FF7"
      />
    </svg>
  );
}

const RoleIcon = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7 8C4.78125 8 3 6.21875 3 4C3 1.8125 4.78125 0 7 0C9.1875 0 11 1.8125 11 4C11 6.21875 9.1875 8 7 8ZM5.5625 9.5H8.40625C8.78125 9.5 9.15625 9.5625 9.5 9.625C9.4375 10.1875 9.71875 10.7188 10.1875 11.0312C9.65625 11.3438 9.34375 12 9.5625 12.6875C9.6875 13.0938 9.84375 13.4688 10.0625 13.8438C10.2812 14.25 10.5312 14.5938 10.8125 14.875C11.3125 15.4062 12.0625 15.4688 12.625 15.1562V15.1875C12.625 15.4688 12.6875 15.7812 12.8438 16H0.90625C0.40625 16 0 15.5938 0 15.0938C0 12 2.46875 9.5 5.5625 9.5ZM13.625 6.84375C13.625 6.625 13.75 6.40625 13.9688 6.375C14.2812 6.28125 14.625 6.25 15 6.25C15.3438 6.25 15.6875 6.28125 16 6.375C16.2188 6.40625 16.375 6.625 16.375 6.84375V7.78125C16.5938 7.90625 16.8438 8.03125 17.0625 8.1875L17.8438 7.75C18.0312 7.625 18.25 7.65625 18.4062 7.8125C18.6562 8.0625 18.875 8.34375 19.0312 8.65625C19.2188 8.96875 19.375 9.3125 19.4688 9.625C19.5312 9.84375 19.4375 10.0625 19.25 10.1875L18.4688 10.625C18.4688 10.75 18.4688 10.875 18.4688 11C18.4688 11.125 18.4688 11.25 18.4688 11.4062L19.25 11.8438C19.4375 11.9375 19.5312 12.1562 19.4688 12.375C19.375 12.7188 19.2188 13.0312 19.0312 13.3438C18.875 13.6562 18.6562 13.9375 18.4062 14.1875C18.25 14.3438 18.0312 14.375 17.8438 14.2812L17.0625 13.8125C16.8438 14 16.625 14.125 16.375 14.2188V15.1875C16.375 15.4062 16.2188 15.5938 16 15.6562C15.6875 15.7188 15.3438 15.75 15 15.75C14.625 15.75 14.2812 15.7188 13.9688 15.6562C13.75 15.5938 13.625 15.4062 13.625 15.1875V14.2188C13.375 14.125 13.125 14 12.9062 13.8125L12.125 14.2812C11.9375 14.375 11.7188 14.3438 11.5625 14.1875C11.3125 13.9375 11.125 13.6562 10.9375 13.3438C10.75 13.0312 10.5938 12.7188 10.5 12.375C10.4375 12.1562 10.5312 11.9375 10.7188 11.8438L11.5 11.4062C11.5 11.25 11.5 11.125 11.5 11C11.5 10.875 11.5 10.75 11.5 10.625L10.7188 10.1562C10.5312 10.0625 10.4375 9.84375 10.5 9.625C10.5938 9.3125 10.75 8.96875 10.9375 8.65625C11.0938 8.34375 11.3125 8.0625 11.5625 7.8125C11.7188 7.65625 11.9375 7.625 12.125 7.75L12.9062 8.1875C13.125 8.03125 13.375 7.90625 13.625 7.78125V6.84375ZM16.5 11C16.5 10.1875 15.8125 9.5 15 9.5C14.1562 9.5 13.4688 10.1875 13.4688 11C13.4688 11.8438 14.1562 12.5 15 12.5C15.8125 12.5 16.5 11.8438 16.5 11Z"
      fill="#156FF7"
    />
  </svg>
);
