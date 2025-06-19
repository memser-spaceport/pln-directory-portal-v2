import React from 'react';
import TextEditor from '@/components/ui/text-editor';
import { useFormContext } from 'react-hook-form';

import s from './ContributionsDescriptionInput.module.scss';

export const ContributionsDescriptionInput = () => {
  const { watch, setValue } = useFormContext();
  const { description } = watch();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Description</span>
      </div>
      <TextEditor id="contr-description" text={description} setContent={(txt) => setValue('description', txt, { shouldValidate: true })} height={150} isToolbarSticky statusBar={false} />
    </div>
  );
};
