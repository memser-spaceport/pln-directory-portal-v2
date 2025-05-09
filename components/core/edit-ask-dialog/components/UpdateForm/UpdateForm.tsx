import React, { FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { EditAskForm } from '@/components/core/edit-ask-dialog/types';
import { yupResolver } from '@hookform/resolvers/yup';
import { editAskFormSchema } from '@/components/core/edit-ask-dialog/helpers';
import { useUpdateAskMutation } from '@/services/teams/hooks/useUpdateAskMutation';
import { SubmitAskForm } from '@/components/core/submit-ask-dialog/types';
import { triggerLoader } from '@/utils/common.utils';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import s from '@/components/core/edit-ask-dialog/EditAskDialog.module.css';
import { AskDetails } from '@/components/core/edit-ask-dialog/components/AskDetails';

interface Props {
  team: ITeam;
  ask: ITeamAsk;
  onClose: () => void;
}

export const UpdateForm: FC<Props> = ({ team, ask, onClose }) => {
  const methods = useForm<EditAskForm>({
    defaultValues: {
      title: ask.title,
      description: ask.description,
      tags: ask.tags,
      disabled: ask.status === 'CLOSED',
    },
    resolver: yupResolver(editAskFormSchema),
  });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const { mutateAsync } = useUpdateAskMutation(team);

  const onSubmit = async (formData: SubmitAskForm) => {
    if (!team.name) {
      return;
    }
    triggerLoader(true);
    await mutateAsync({
      teamId: team.id,
      teamName: team.name,
      ask: {
        description: formData.description,
        tags: formData.tags,
        title: formData.title,
        uid: ask.uid,
      },
    });
    triggerLoader(false);
    onClose();
    reset();
  };

  const onCancel = () => {
    onClose();
    reset();
  };

  return (
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
  );
};
