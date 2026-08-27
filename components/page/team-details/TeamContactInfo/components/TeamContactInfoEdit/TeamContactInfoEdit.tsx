import React from 'react';
import { InferType } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

import { ITeam } from '@/types/teams.types';
import { getProfileFromURL } from '@/utils/common.utils';
import { toSocialFieldInputValue } from '@/utils/profile/toSocialFieldInputValue';

import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';
import { useTeamAnalytics } from '@/analytics/teams.analytics';

import { FormField } from '@/components/form/FormField';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

import s from './TeamContactInfoEdit.module.scss';
import { teamContactInfoSchema } from './formSchema';

type EditTeamContactForm = InferType<typeof teamContactInfoSchema>;

type Props = {
  team: ITeam;
  toggleIsEditMode: () => void;
};

export function TeamContactInfoEdit(props: Props) {
  const { team, toggleIsEditMode } = props;

  const methods = useForm<EditTeamContactForm>({
    // Handles are stored bare, but the X / Telegram / Bluesky fields require a leading "@", so
    // seed those with it — otherwise re-saving an untouched team fails validation.
    defaultValues: {
      blog: team?.blog,
      twitter: toSocialFieldInputValue('twitter', team?.twitter),
      website: team?.website ?? '',
      linkedin: team?.linkedinHandle,
      telegram: toSocialFieldInputValue('telegram', team?.telegramHandler),
      contactMethod: team?.contactMethod ?? '',
      jobReferEmail: team?.jobReferEmail ?? '',
      bluesky: toSocialFieldInputValue('bluesky', team?.blueskyHandler),
      crunchbase: team?.crunchbaseHandler,
    },
    resolver: yupResolver(teamContactInfoSchema),
  });

  const { onSubmit: commonOnSubmit, isPending } = useOnSubmit(team, toggleIsEditMode);
  const { onTeamDetailContactSaveClicked } = useTeamAnalytics();

  const onSubmit = async (formData: EditTeamContactForm) => {
    await commonOnSubmit({
      website: formData.website,
      contactMethod: formData.contactMethod,
      jobReferEmail: formData.jobReferEmail?.trim() ?? '',
      linkedinHandler: formData.linkedin,
      twitterHandler: formData.twitter,
      telegramHandler: formData.telegram,
      blog: formData.blog,
      blueskyHandler: formData.bluesky ? getProfileFromURL(formData.bluesky, 'bluesky') : formData.bluesky,
      crunchbaseHandler: formData.crunchbase
        ? getProfileFromURL(formData.crunchbase, 'crunchbase')
        : formData.crunchbase,
    });
    onTeamDetailContactSaveClicked({
      teamUid: team.id,
      hasBluesky: Boolean(formData.bluesky),
      hasCrunchbase: Boolean(formData.crunchbase),
    });
  };

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title="Edit Contact Details" onClose={toggleIsEditMode} isProcessing={isPending} />

        <DetailsSection classes={{ root: s.detailsSection }}>
          <FormField name="website" label="Website" placeholder="Enter website" isRequired />

          <FormField
            isRequired
            name="contactMethod"
            label="Preferred method of contact"
            placeholder="Enter contact method"
            description="What is the best way for people to connect with your team? (e.g., team Slack channel, team email address, team Discord server/channel, etc.)"
          />

          <FormField
            name="jobReferEmail"
            label="Job Referral/Application Contact"
            placeholder="jobs@team.com"
            description="Referrals for this team’s open roles go here instead of to selected members. Leave blank to send referrals to team leads."
          />

          <FormField name="linkedin" label="LinkedIn" placeholder="eg.,https://linkedin.com/in/company_name" />

          <FormField name="twitter" label="X (Twitter)" placeholder="eg.,@protocollabs" />

          <FormField name="telegram" label="Telegram" placeholder="eg.,name#1234" />

          <FormField name="blog" label="Blog" placeholder="Enter your teams blog address" />

          <FormField
            name="bluesky"
            label="Bluesky"
            placeholder="eg., @protocol.ai, protocol.ai or https://bsky.app/profile/protocol.ai"
          />

          <FormField
            name="crunchbase"
            label="Crunchbase"
            placeholder="eg., protocol-labs or https://www.crunchbase.com/organization/protocol-labs"
          />
        </DetailsSection>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
