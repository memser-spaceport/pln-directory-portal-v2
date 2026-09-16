import React from 'react';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { SkillsTagsInput } from '@/components/form/SkillsTagsInput/SkillsTagsInput';
import s from './ProfileSkillsInput.module.scss';

export const ProfileSkillsInput = () => {
  const { data } = useMemberFormOptions();
  const suggestions = data?.skills.map((item: { name: string }) => item.name) ?? [];

  return (
    <div className={s.root}>
      <SkillsTagsInput
        name="skills"
        selectLabel="Professional skills"
        placeholder="Add your skills"
        suggestions={suggestions}
      />
      <p className={s.hint}>Sharing your skills help founders & teams connect with you.</p>
    </div>
  );
};
