import React, { FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { triggerLoader } from '@/utils/common.utils';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import s from '@/components/core/edit-ask-dialog/EditAskDialog.module.css';
import { AskStatus } from '@/components/core/edit-ask-dialog/components/AskStatus';
import { AskCloseReasons, CloseAskForm } from '@/components/core/close-ask-dialog/types';
import { closeAskFormSchema, closeAskInitialData } from '@/components/core/close-ask-dialog/helpers';
import { useCloseAskMutation } from '@/services/teams/hooks/useCloseAskMutation';
import Image from 'next/image';

interface Props {
  team: ITeam;
  ask: ITeamAsk;
  onClose: () => void;
}

export const StatusForm: FC<Props> = ({ team, ask, onClose }) => {
  console.log(ask);
  const [view, setView] = React.useState<'close' | 'confirm'>('close');
  const methods = useForm<CloseAskForm>({
    defaultValues: {
      ...closeAskInitialData,
      resolvedBy: ask.closedBy
        ? {
            name: ask.closedBy.name,
            profile: ask.closedBy.image.url,
          }
        : null,
      comments: ask.closedComment,
      reason: ask.closedReason ?? AskCloseReasons.FULLY_ADDRESSED,
      disabled: ask.status === 'CLOSED',
    },
    resolver: yupResolver(closeAskFormSchema),
  });
  const {
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;
  const { reason, resolvedBy, comments } = watch();
  const { mutateAsync } = useCloseAskMutation(team);

  const onSubmit = () => {
    setView('confirm');
  };

  const onCancel = () => {
    onClose();
    setView('close');
    reset(closeAskInitialData);
  };

  const onFinalize = async () => {
    triggerLoader(true);
    const res = await mutateAsync({
      teamId: ask.teamUid,
      teamName: team?.name ?? '',
      uid: ask.uid,
      status: 'CLOSED',
      closedReason: reason,
      closedComment: comments,
      closedByUid: resolvedBy?.uid,
    });

    if (res) {
      onClose();
      setView('close');
      reset(closeAskInitialData);
    }

    triggerLoader(false);
  };

  return (
    <>
      <FormProvider {...methods}>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className={s.form}>
          <AskStatus />
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
      {view === 'confirm' && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={onClose}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>Are you sure you want to finalize your ask?</h2>
            <p className={s.confirmationMessage}>Clicking &apos;Finalize&apos; will close your ask and make it no longer editable.</p>
            <div className={s.dialogControls}>
              <button type="button" className={s.secondaryButton} onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className={s.primaryButton} onClick={onFinalize} disabled={isSubmitting}>
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
