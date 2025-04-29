import React from 'react';
import s from '@/components/core/close-ask-dialog/CloseAskDialog.module.css';
import RadioButton from '@/components/form/radio-button';
import { getDependantLabel, REASON_OPTIONS } from '@/components/core/close-ask-dialog/helpers';
import { AskCloseReasons, MemberOption } from '@/components/core/close-ask-dialog/types';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import TextArea from '@/components/form/text-area';
import { useFormContext } from 'react-hook-form';
import { useAllMembers } from '@/services/members/hooks/useAllMembers';

export const AskStatus = () => {
  const { data: allMembers } = useAllMembers();
  const { watch, setValue } = useFormContext();
  const { reason, resolvedBy, disabled, comments } = watch();

  console.log(resolvedBy);

  return (
    <div className={s.formContentWrapper}>
      <RadioButton disabled={disabled} name="reason" options={REASON_OPTIONS} selectedValue={reason} onChange={(value) => setValue('reason', value, { shouldValidate: true })} />
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
          disabled={disabled}
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
        disabled={disabled}
        defaultValue={comments}
      />
    </div>
  );
};
