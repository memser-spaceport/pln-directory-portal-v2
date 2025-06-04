import React, { useState } from 'react';
import Image from 'next/image';
import { Field } from '@base-ui-components/react/field';

import { IUserInfo } from '@/types/shared.types';
import { useOnboardingState } from '@/services/onboarding/store';

import { LEARN_MORE_URL } from '@/utils/constants';

import s from './ContactsStep.module.scss';

interface Props {
  userInfo: IUserInfo;
}

export const ContactsStep = ({ userInfo }: Props) => {
  const {
    actions: { setStep },
  } = useOnboardingState();

  return (
    <div className={s.root}>
      <div className={s.title}>How others can connect with you</div>
      <div className={s.subtitle}>
        Share your calendar link to enable easy scheduling with team members — you&apos;ll also gain access to book their available office hours.{' '}
        <a href={LEARN_MORE_URL} target="blank">
          Learn More <Image loading="lazy" alt="learn more" src="/icons/learn-more.svg" height={16} width={16} />
        </a>
      </div>

      <Field.Root className={s.field}>
        <Field.Label className={s.label}>Office Hours</Field.Label>
        <Field.Control required placeholder="User Office Hours" className={s.input} />
        <Field.Error className={s.error}>Required</Field.Error>
        <Field.Description className={s.fieldDescription}>We recommend using a Calendly or Google Calendar link.</Field.Description>
      </Field.Root>

      <Field.Root className={s.field}>
        <Field.Label className={s.label}>Telegram</Field.Label>
        <Field.Control required placeholder="Enter Telegram Username" className={s.input} />
        <Field.Error className={s.error}>Required</Field.Error>
        <Field.Description className={s.fieldDescription}>Copy @username in your profile settings</Field.Description>
      </Field.Root>
    </div>
  );
};
