import React from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { TEditContactForm } from '@/components/page/member-details/ContactDetails/types';

import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';

import s from './EditContactForm.module.scss';
import Image from 'next/image';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const EditContactForm = ({ onClose, member, userInfo }: Props) => {
  const methods = useForm<TEditContactForm>({
    defaultValues: {
      officeHours: member.officeHours,
      telegram: member.telegramHandle,
      github: member.githubHandle,
      linkedin: member.linkedinHandle,
      discord: member.discordHandle,
      twitter: member.twitter,
    },
  });
  const { handleSubmit, reset } = methods;

  const onSubmit = (formData: TEditContactForm) => {
    console.log(formData);
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls onClose={onClose} title="Edit Contact Details" />
        <div className={s.body}>
          <div className={s.row}>
            <Image src={getLogoByProvider('officeHours')} alt="Office hours" height={24} width={24} />
            <FormField
              name="officeHours"
              label="Office Hours"
              placeholder="Enter Office Hours link"
              description="Drop your calendar link here so others can get in touch with you at a time that is convenient. We recommend 15-min meetings scheduled."
            />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('telegram')} alt="Telegram" height={24} width={24} />
            <FormField name="telegram" label="Telegram" placeholder="Enter Telegram handle" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('github')} alt="Github" height={24} width={24} />
            <FormField name="github" label="Github" placeholder="Enter Github handle" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('linkedin')} alt="Linkedin" height={24} width={24} />
            <FormField name="linkedin" label="LinkedIn" placeholder="eg.,https://linkedin.com/in/jbenetcs" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('discord')} alt="Discord" height={24} width={24} />
            <FormField name="discord" label="Discord" placeholder="eg.,name#1234" />
          </div>
          <div className={s.row}>
            <Image src={getLogoByProvider('twitter')} alt="Twitter" height={24} width={24} />
            <FormField name="twitter" label="Twitter" placeholder="eg.,@protocollabs" />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

function getLogoByProvider(provider: string): string {
  switch (provider) {
    case 'linkedin': {
      return '/icons/contact/linkedIn-contact-logo.svg';
    }
    case 'discord': {
      return '/icons/contact/discord-contact-logo.svg';
    }
    case 'email': {
      return '/icons/contact/email-contact-logo.svg';
    }
    case 'github': {
      return '/icons/contact/github-contact-logo.svg';
    }
    case 'team': {
      return '/icons/contact/team-contact-logo.svg';
    }
    case 'telegram': {
      return '/icons/contact/telegram-contact-logo.svg';
    }
    case 'twitter': {
      return '/icons/contact/twitter-contact-logo.svg';
    }
    case 'officeHours': {
      return '/icons/contact/meet-contact-logo.svg';
    }
    default: {
      return '/icons/contact/website-contact-logo.svg';
    }
  }
}
