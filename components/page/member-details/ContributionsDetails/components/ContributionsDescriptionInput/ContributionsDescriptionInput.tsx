import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './ContributionsDescriptionInput.module.scss';
import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';

export const ContributionsDescriptionInput = () => {
  const { watch, setValue } = useFormContext();
  const { description } = watch();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Description</span>
      </div>
      <RichTextEditor id="contr-description" value={description} onChange={(txt) => setValue('description', txt, { shouldValidate: true, shouldDirty: true })} />
    </div>
  );
};
