import React from 'react';
import MultiSelect from '@/components/form/multi-select';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { useFormContext } from 'react-hook-form';
import { TEditProfileForm } from '@/components/page/member-details/ProfileDetails/types';

import s from './ProfileSkillsInput.module.scss';

export const ProfileSkillsInput = () => {
  const { data } = useMemberFormOptions();

  const { watch, setValue } = useFormContext<TEditProfileForm>();
  const { skills } = watch();

  const onAddSkill = (val: TEditProfileForm['skills'][0]) => {
    setValue('skills', [...skills, val], { shouldValidate: true, shouldDirty: true });
  };

  const onRemoveSkill = (item: TEditProfileForm['skills'][0]) => {
    const newItems = [...skills].filter((v) => v.id !== item.id);

    setValue('skills', newItems, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Professional skills</span>
      </div>
      <MultiSelect
        options={data?.skills ?? []}
        selectedOptions={skills}
        onAdd={onAddSkill}
        onRemove={onRemoveSkill}
        uniqueKey="id"
        displayKey="name"
        // label="Professional skills"
        placeholder="Select applicable skills"
        closeImgUrl="/icons/close.svg"
        arrowImgUrl="/icons/arrow-down.svg"
      />
      <p className={s.hint}>Sharing your skills help other network members & teams connect with you.</p>
    </div>
  );
};
