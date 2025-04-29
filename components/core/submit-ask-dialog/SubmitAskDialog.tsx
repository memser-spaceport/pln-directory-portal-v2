import React, { FC, useState } from 'react';

import { clsx } from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';
import Image from 'next/image';
import TextField from '@/components/form/text-field';
import { FormField } from '@/components/form/form-field';
import TextEditor from '@/components/ui/text-editor';
import HiddenField from '@/components/form/hidden-field';
import { TagsSelector } from '@/components/core/tags-selector/TagsSelector';

import { useCreateAskMutation } from '@/services/teams/hooks/useCreateAskMutation';
import { ITeam } from '@/types/teams.types';
import { SubmitAskForm } from '@/components/core/submit-ask-dialog/types';
import { yupResolver } from '@hookform/resolvers/yup';
import { submitAskFormSchema } from '@/components/core/submit-ask-dialog/helpers';

import s from './SubmitAskDialog.module.css';
import { triggerLoader } from '@/utils/common.utils';

interface Props {
  toggleVariant?: 'primary' | 'secondary';
  toggleTitle?: string;
  team: ITeam;
}

const remainingAsks = 3;

export const SubmitAskDialog: FC<Props> = ({ toggleVariant = 'primary', toggleTitle = 'Submit Asks', team }) => {
  const [open, toggleOpen] = useState(false);

  const methods = useForm<SubmitAskForm>({
    defaultValues: {
      title: '',
      description: '',
      tags: [],
    },
    resolver: yupResolver(submitAskFormSchema),
  });

  const { mutateAsync } = useCreateAskMutation(team);

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = methods;
  const { title, description, tags } = watch();

  const onSubmit = async (formData: SubmitAskForm) => {
    if (!team.name) {
      return;
    }
    triggerLoader(true);
    await mutateAsync({
      teamId: team.id,
      teamName: team.name,
      ...formData,
    });
    triggerLoader(false);
    toggleOpen(false);
    reset();
  };

  const onCancel = () => {
    toggleOpen(false);
    reset();
  };

  return (
    <>
      <button
        className={clsx(s.toggleButton, {
          [s.secondary]: toggleVariant === 'secondary',
        })}
        onClick={() => toggleOpen(true)}
      >
        {toggleTitle}
      </button>

      {open && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={() => toggleOpen(false)}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>Your Asks</h2>
            <p className={s.description}>{`(${remainingAsks}${remainingAsks > 1 ? '/3 asks' : '/3 asks'} remaining) You can submit up to 3 asks`}</p>
            <FormProvider {...methods}>
              <form noValidate onSubmit={handleSubmit(onSubmit)} className={s.form}>
                <div className={s.formBody}>
                  <FormField name="title" footerComponent={<div className={s.charCount}>{`${32 - title.length}/32`}</div>}>
                    <TextField
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
                      <TextEditor
                        maxLength={200}
                        height={165}
                        isRequired={!!errors['description']}
                        statusBar={false}
                        toolbarOptions="bold italic underline strikethrough customLinkButton"
                        text={description}
                        setContent={(v) => setValue('description', v, { shouldValidate: true })}
                        errorMessage={errors['description']?.message ?? ''}
                        isToolbarSticky={false}
                      />
                      <HiddenField value={description.trim()} defaultValue={description} name={`description`} />
                    </div>
                  </FormField>
                  <FormField label="Select Tags*">
                    <TagsSelector />
                  </FormField>
                </div>

                <div className={s.dialogControls}>
                  <button type="button" className={s.secondaryButton} onClick={onCancel}>
                    Cancel
                  </button>
                  <button type="submit" className={s.primaryButton} disabled={isSubmitting} data-testid="submit-ask-button">
                    Submit
                  </button>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      )}
    </>
  );
};
