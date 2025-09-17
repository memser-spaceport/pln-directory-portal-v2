import React from 'react';
import Image from 'next/image';
import { Field } from '@base-ui-components/react/field';
import { motion } from 'framer-motion';

import { IUserInfo } from '@/types/shared.types';

import { LEARN_MORE_URL } from '@/utils/constants';

import s from './ContactsStep.module.scss';
import { useFormContext } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';
import { clsx } from 'clsx';

interface Props {
  userInfo: IUserInfo;
}

export const ContactsStep = ({ userInfo }: Props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<OnboardingForm>();

  return (
    <motion.div className={s.root} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={s.title}>How others can connect with you</div>
      <div className={s.subtitle}>
        Share your calendar link to enable easy scheduling with team members — you&apos;ll also gain access to book
        their available office hours.{' '}
        <a href={LEARN_MORE_URL} target="blank">
          Learn More <Image loading="lazy" alt="learn more" src="/icons/learn-more.svg" height={16} width={16} />
        </a>
      </div>

      <Field.Root className={clsx(s.field, s.inputs)}>
        <Field.Label className={s.label}>Office Hours</Field.Label>
        <Field.Control
          {...register('officeHours')}
          placeholder="User Office Hours"
          className={clsx(s.input, {
            [s.error]: !!errors.officeHours,
          })}
        />
        {errors.officeHours ? (
          <Field.Error className={s.errorMsg} match={!!errors.officeHours}>
            {errors.officeHours?.message}
          </Field.Error>
        ) : (
          <Field.Description className={s.fieldDescription}>
            We recommend using a Calendly or Google Calendar link.
          </Field.Description>
        )}
      </Field.Root>

      <Field.Root className={s.field}>
        <Field.Label className={s.label}>Telegram</Field.Label>
        <Field.Control
          {...register('telegram')}
          placeholder="Enter Telegram Username"
          className={clsx(s.input, {
            [s.error]: !!errors.telegram,
          })}
        />
        {errors.telegram ? (
          <Field.Error className={s.errorMsg} match={!!errors.telegram}>
            {errors.telegram?.message}
          </Field.Error>
        ) : (
          <Field.Description className={s.fieldDescription}>
            Copy @username in your Telegram profile settings
          </Field.Description>
        )}
      </Field.Root>
    </motion.div>
  );
};
