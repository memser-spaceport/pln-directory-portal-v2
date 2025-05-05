import React, { FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { triggerLoader } from '@/utils/common.utils';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import { useCloseAskMutation } from '@/services/teams/hooks/useCloseAskMutation';
import Image from 'next/image';
import { AskCloseReasons, CloseAskForm } from '@/components/core/update-ask-status-dialog/types';
import { closeAskFormSchema, closeAskInitialData } from '@/components/core/update-ask-status-dialog/helpers';
import s from '@/components/core/edit-ask-dialog/EditAskDialog.module.css';
import { AskStatus } from '@/components/core/update-ask-status-dialog/components/AskStatus';

interface Props {
  team: ITeam;
  ask: ITeamAsk;
  onClose: () => void;
}

export const StatusForm: FC<Props> = ({ team, ask, onClose }) => {
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
      comments: ask.closedComment ?? '',
      reason: ask.closedReason ?? AskCloseReasons.ACTIVE,
      disabled: ask.status === 'CLOSED',
    },
    resolver: yupResolver(closeAskFormSchema),
  });
  const {
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = methods;
  const { reason, resolvedBy, comments } = watch();
  const { mutateAsync } = useCloseAskMutation(team);

  const onSubmit = () => {
    if (reason === AskCloseReasons.ACTIVE) {
      onClose();
    } else {
      setView('confirm');
    }
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
            <h2>Are you sure you want to close your ask?</h2>
            <p className={s.confirmationMessage}>Clicking &apos;Archive&apos; will close and archive your asks.</p>
            <div className={s.dialogControls}>
              <button type="button" className={s.secondaryButton} onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className={s.primaryButton} onClick={onFinalize} disabled={isSubmitting}>
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
