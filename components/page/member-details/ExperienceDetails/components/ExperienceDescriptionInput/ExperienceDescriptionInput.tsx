import React from 'react';
import { useFormContext } from 'react-hook-form';

import s from './ExperienceDescriptionInput.module.scss';
import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';

export const ExperienceDescriptionInput = () => {
  const { watch, setValue } = useFormContext();
  const { description } = watch();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Impact or Work Description</span>
      </div>
      <RichTextEditor
        id="exp-description"
        value={description}
        onChange={(txt) => setValue('description', txt, { shouldValidate: true, shouldDirty: true })}
      />
    </div>
  );
};
