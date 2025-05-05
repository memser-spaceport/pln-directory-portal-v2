import React from 'react';
import RadioButton from '@/components/form/radio-button';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import TextArea from '@/components/form/text-area';
import { useFormContext } from 'react-hook-form';
import { useAllMembers } from '@/services/members/hooks/useAllMembers';

import s from './AskStatus.module.css';
import { getDependantLabel, REASON_OPTIONS } from '@/components/core/update-ask-status-dialog/helpers';
import { AskCloseReasons, MemberOption } from '@/components/core/update-ask-status-dialog/types';
import { FormField } from '@/components/form/form-field';

export const AskStatus = () => {
  const { data: allMembers } = useAllMembers();
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { reason, resolvedBy, disabled, comments } = watch();

  return (
    <div className={s.formContentWrapper}>
      <RadioButton disabled={disabled} name="reason" options={REASON_OPTIONS} selectedValue={reason} onChange={(value) => setValue('reason', value, { shouldValidate: true })} />
      {(reason === AskCloseReasons.FULLY_ADDRESSED || reason === AskCloseReasons.PARTIALLY_ADDRESSED) && (
        <FormField name="resolvedBy">
          <SearchableSingleSelect
            id="resolvedBy"
            formKey="resolvedBy"
            onClear={() => setValue('resolvedBy', null, { shouldValidate: true, shouldDirty: true })}
            selectedOption={resolvedBy}
            label="Who helped resolve the ask?"
            options={allMembers?.data ?? []}
            name="resolvedBy"
            uniqueKey="uid"
            iconKey="profile"
            arrowImgUrl="/icons/arrow-down.svg"
            displayKey="name"
            onChange={(selectedOption) => setValue('resolvedBy', selectedOption as MemberOption, { shouldValidate: true })}
            disabled={disabled}
          />
        </FormField>
      )}
      {reason !== AskCloseReasons.ACTIVE && (
        <FormField name="comments">
          <TextArea
            label={getDependantLabel(reason)}
            onChange={(e) => setValue('comments', e.target.value, { shouldValidate: true })}
            maxLength={1000}
            placeholder="Enter Details Here"
            isMandatory={!!errors.comments}
            name="comments"
            id="comments"
            data-testid="close-ask-comments"
            disabled={disabled}
            defaultValue={comments}
          />
        </FormField>
      )}
    </div>
  );
};
