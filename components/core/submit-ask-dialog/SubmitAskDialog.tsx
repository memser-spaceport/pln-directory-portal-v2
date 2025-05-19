import React, { FC, useState } from 'react';

import { clsx } from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';
import Image from 'next/image';
import { useCreateAskMutation } from '@/services/teams/hooks/useCreateAskMutation';
import { ITeam } from '@/types/teams.types';
import { SubmitAskForm } from '@/components/core/submit-ask-dialog/types';
import { yupResolver } from '@hookform/resolvers/yup';
import { submitAskFormSchema } from '@/components/core/submit-ask-dialog/helpers';

import s from './SubmitAskDialog.module.scss';
import { triggerLoader } from '@/utils/common.utils';
import { AskDetails } from '@/components/core/edit-ask-dialog/components/AskDetails';

interface Props {
  toggleVariant?: 'primary' | 'secondary';
  toggleTitle?: string;
  team: ITeam;
  openAsksCount?: number;
  canSubmit: boolean;
}

export const SubmitAskDialog: FC<Props> = ({ toggleVariant = 'primary', toggleTitle = 'Submit Asks', team, canSubmit }) => {
  const [open, toggleOpen] = useState(false);

  const methods = useForm<SubmitAskForm>({
    defaultValues: {
      title: '',
      description: '',
      tags: [],
    },
    resolver: yupResolver(submitAskFormSchema),
  });

  const { mutateAsync } = useCreateAskMutation(team);

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (formData: SubmitAskForm) => {
    if (!team.name) {
      return;
    }
    triggerLoader(true);
    await mutateAsync({
      teamId: team.id,
      teamName: team.name,
      ...formData,
    });
    triggerLoader(false);
    toggleOpen(false);
    reset();
  };

  const onCancel = () => {
    toggleOpen(false);
    reset();
  };

  if (!canSubmit) {
    return null;
  }

  return (
    <>
      <button
        className={clsx(s.toggleButton, {
          [s.secondary]: toggleVariant === 'secondary',
        })}
        onClick={() => toggleOpen(true)}
      >
        {toggleTitle}
      </button>

      {open && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={() => toggleOpen(false)}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>Your Asks</h2>
            <p className={s.description}>Share short updates or requests for help, such as hiring needs, fundraising, or partnership opportunities.</p>
            <FormProvider {...methods}>
              <form noValidate onSubmit={handleSubmit(onSubmit)} className={s.form}>
                <AskDetails />
                <div className={s.dialogControls}>
                  <button type="button" className={s.secondaryButton} onClick={onCancel}>
                    Cancel
                  </button>
                  <button type="submit" className={s.primaryButton} disabled={isSubmitting} data-testid="submit-ask-button">
                    Submit
                  </button>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      )}
    </>
  );
};
