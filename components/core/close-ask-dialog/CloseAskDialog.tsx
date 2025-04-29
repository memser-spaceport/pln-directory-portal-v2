import React, { FC } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import RadioButton from '@/components/form/radio-button';
import TextArea from '@/components/form/text-area';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { closeAskFormSchema, closeAskInitialData, getDependantLabel, REASON_OPTIONS } from '@/components/core/close-ask-dialog/helpers';
import { useAllMembers } from '@/services/members/hooks/useAllMembers';
import { AskCloseReasons, CloseAskDialogProps, CloseAskForm, MemberOption } from '@/components/core/close-ask-dialog/types';
import { useCloseAskMutation } from '@/services/teams/hooks/useCloseAskMutation';
import { triggerLoader } from '@/utils/common.utils';

import s from './CloseAskDialog.module.css';

export const CloseAskDialog: FC<CloseAskDialogProps> = ({ data, onClose, isVisible, onSuccess, team }) => {
  const [view, setView] = React.useState<'close' | 'confirm'>('close');
  const methods = useForm<CloseAskForm>({
    defaultValues: closeAskInitialData,
    resolver: yupResolver(closeAskFormSchema),
  });
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = methods;
  const { reason, resolvedBy, comments } = watch();
  const { data: allMembers } = useAllMembers();
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
      teamId: data.teamUid,
      teamName: team?.name ?? '',
      uid: data.uid,
      status: 'CLOSED',
      closedReason: reason,
      closedComment: comments,
      closedByUid: resolvedBy?.uid,
    });

    if (res) {
      onClose();
      setView('close');
      reset(closeAskInitialData);

      await onSuccess();
    }

    triggerLoader(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {view === 'close' && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={onClose}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>Let us know why you finalize Ask?</h2>
            <form noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className={s.formContentWrapper}>
                <RadioButton name="reason" options={REASON_OPTIONS} selectedValue={reason} onChange={(value) => setValue('reason', value, { shouldValidate: true })} />
                {(reason === AskCloseReasons.FULLY_ADDRESSED || reason === AskCloseReasons.PARTIALLY_ADDRESSED) && (
                  <SearchableSingleSelect
                    id="resolvedBy"
                    formKey="resolvedBy"
                    onClear={() => setValue('resolvedBy', null, { shouldValidate: true })}
                    selectedOption={resolvedBy}
                    label="Who helped resolve the ask?"
                    options={allMembers?.data ?? []}
                    name="resolvedBy"
                    uniqueKey="uid"
                    iconKey="profile"
                    arrowImgUrl="/icons/arrow-down.svg"
                    displayKey="name"
                    onChange={(selectedOption) => setValue('resolvedBy', selectedOption as MemberOption)}
                  />
                )}
                <TextArea
                  label={getDependantLabel(reason)}
                  onChange={(e) => setValue('comments', e.target.value, { shouldValidate: true })}
                  maxLength={1000}
                  placeholder="Enter Details Here"
                  isMandatory={false}
                  name="comments"
                  id="comments"
                  data-testid="close-ask-comments"
                />
              </div>
              <div className={s.dialogControls}>
                <button type="button" className={s.secondaryButton} onClick={onCancel}>
                  Cancel
                </button>
                <button type="submit" className={s.primaryButton}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <button type="button" className={s.errorButton} onClick={onFinalize} disabled={isSubmitting}>
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
