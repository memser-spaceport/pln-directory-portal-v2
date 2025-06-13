import React from 'react';
import TextEditor from '@/components/ui/text-editor';
import { useFormContext } from 'react-hook-form';

import s from './ProfileBioInput.module.scss';

export const ProfileBioInput = () => {
  const { watch, setValue } = useFormContext();
  const { bio } = watch();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Bio</span>
        <button className={s.genButton}>Gen Bio with AI</button>
      </div>
      <TextEditor id="member-bio" text={bio} setContent={(txt) => setValue('bio', txt, { shouldValidate: true })} height={200} />
    </div>
  );
};
