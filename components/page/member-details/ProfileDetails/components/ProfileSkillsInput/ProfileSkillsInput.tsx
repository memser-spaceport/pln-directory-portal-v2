import React from 'react';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import s from './ProfileSkillsInput.module.scss';

export const ProfileSkillsInput = () => {
  const { data } = useMemberFormOptions();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Professional skills</span>
      </div>
      <FormMultiSelect
        placeholder="Select applicable skills"
        options={
          data?.skills.map((item: { id: string; name: string }) => ({
            value: item.id,
            label: item.name,
          })) ?? []
        }
        name="skills"
      />
      <p className={s.hint}>Sharing your skills help other network members & teams connect with you.</p>
    </div>
  );
};
