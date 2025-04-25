import React, { FC } from 'react';
import Image from 'next/image';

import s from './CloseAskDialog.module.css';
import { useForm } from 'react-hook-form';
import { AskCloseReasons, CloseAskForm } from '@/components/core/close-ask-dialog/types';
import { yupResolver } from '@hookform/resolvers/yup';
import { closeAskFormSchema, REASON_OPTIONS } from '@/components/core/close-ask-dialog/helpers';
import RadioButton from '@/components/form/radio-button';
import SearchableSingleSelect from '@/components/form/searchable-single-select';

interface Props {
  data: {
    title: string;
    description: string;
    tags: string[];
    uid: string;
    teamUid: string;
  };
  onClose: () => void;
  isVisible: boolean;
}

export const CloseAskDialog: FC<Props> = ({ data, onClose, isVisible }) => {
  const methods = useForm<CloseAskForm>({
    defaultValues: {
      reason: AskCloseReasons.FULLY_ADDRESSED,
      resolvedBy: '',
      comments: '',
    },
    resolver: yupResolver(closeAskFormSchema),
  });

  const { handleSubmit, register, watch, setValue } = methods;
  const { reason } = watch();

  const onSubmit = (data: CloseAskForm) => {
    console.log(data);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={s.modal}>
        <div className={s.modalContent}>
          <button type="button" className={s.closeButton} onClick={onClose}>
            <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
          </button>
          <h2>Let us know why you finalize Ask?</h2>
          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className={s.formContentWrapper}>
              <RadioButton name="reason" options={REASON_OPTIONS} selectedValue={reason} onChange={(value) => setValue('reason', value, { shouldValidate: true })} />
              {/*<SearchableSingleSelect label="Who helped resolve the ask?" name="resolvedBy" onChange={(selectedOption) => setValue('resolvedBy', selectedOption)} />*/}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
