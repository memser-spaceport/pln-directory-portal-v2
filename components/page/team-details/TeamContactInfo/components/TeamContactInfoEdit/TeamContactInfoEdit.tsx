import React from 'react';
import { InferType } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

import { ITeam } from '@/types/teams.types';

import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';

import { FormField } from '@/components/form/FormField';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

import { teamContactInfoSchema } from './formSchema';

type EditTeamContactForm = InferType<typeof teamContactInfoSchema>;

type Props = {
  team: ITeam;
  toggleIsEditMode: () => void;
};

export function TeamContactInfoEdit(props: Props) {
  const { team, toggleIsEditMode } = props;

  const methods = useForm<EditTeamContactForm>({
    defaultValues: {
      blog: team?.blog,
      twitter: team?.twitter,
      website: team?.website ?? '',
      linkedin: team?.linkedinHandle,
      telegram: team?.telegramHandler,
      contactMethod: team?.contactMethod ?? '',
    },
    resolver: yupResolver(teamContactInfoSchema),
  });

  const commonOnSubmit = useOnSubmit(team, toggleIsEditMode);

  const onSubmit = async (formData: EditTeamContactForm) => {
    await commonOnSubmit({
      website: formData.website,
      contactMethod: formData.contactMethod,
      linkedinHandler: formData.linkedin,
      twitterHandler: formData.twitter,
      telegramHandler: formData.telegram,
      blog: formData.blog,
    });
  };

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title="Edit Contact Details" onClose={toggleIsEditMode} />

        <DetailsSection>
          <FormField name="website" label="Website" placeholder="Enter website" isRequired />

          <FormField
            isRequired
            name="contactMethod"
            label="Preferred method of contact"
            placeholder="Enter contact method"
            description="What is the best way for people to connect with your team? (e.g., team Slack channel, team email address, team Discord server/channel, etc.)"
          />

          <FormField name="linkedin" label="LinkedIn" placeholder="eg.,https://linkedin.com/in/company_name" />

          <FormField name="twitter" label="X (Twitter)" placeholder="eg.,@protocollabs" />

          <FormField name="telegram" label="Telegram" placeholder="eg.,name#1234" />

          <FormField name="blog" label="Blog" placeholder="Enter your teams blog address" />
        </DetailsSection>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
