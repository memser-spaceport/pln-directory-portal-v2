import React from 'react';
import { FormField } from '@/components/form/form-field';
import TextField from '@/components/form/text-field';
import HiddenField from '@/components/form/hidden-field';
import { TagsSelector } from '@/components/core/tags-selector/TagsSelector';
import { useFormContext } from 'react-hook-form';
import s from '@/components/core/submit-ask-dialog/SubmitAskDialog.module.scss';
import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';

export const AskDetails = () => {
  const {
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();
  const { title, description, disabled } = watch();

  return (
    <div className={s.formBody}>
      <FormField name="title" footerComponent={<div className={s.charCount}>{`${32 - title.length}/32`}</div>}>
        <TextField
          disabled={disabled}
          isError={!!errors['title']}
          onChange={(e) => setValue('title', e.target.value, { shouldValidate: true })}
          maxLength={32}
          id="add-ask-title"
          label="Title*"
          value={title}
          defaultValue={title}
          name="title"
          type="text"
          placeholder="Enter short title eg. Looking for partnerships"
        />
      </FormField>
      <FormField label="Describe what you need help with*">
        <div className="addaskcnt__desc__edtr">
          {disabled ? (
            <p className={s.content} dangerouslySetInnerHTML={{ __html: description }} />
          ) : (
            <RichTextEditor value={description} onChange={(v) => setValue('description', v, { shouldValidate: true })} errorMessage={(errors['description']?.message as string) ?? ''} />
          )}

          <HiddenField value={description.trim()} defaultValue={description} name={`description`} />
        </div>
      </FormField>
      <FormField label="Select Tags*">
        <TagsSelector />
      </FormField>
    </div>
  );
};
