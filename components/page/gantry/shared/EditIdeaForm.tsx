'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/common/Button';
import { useUpdateGantryItem } from '@/services/gantry/hooks/useUpdateGantryItem';
import type { GantryItem } from '@/services/gantry/types';
import { submitIdeaSchema, hasRichTextContent, type SubmitIdeaFormData } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { IdeaFormFields } from './IdeaFormFields';
import s from './EditIdeaForm.module.scss';

interface Props {
  readonly item: GantryItem;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}

export function EditIdeaForm({ item, onCancel, onSaved }: Props) {
  const updateMutation = useUpdateGantryItem(item.uid);

  const methods = useForm<SubmitIdeaFormData>({
    resolver: yupResolver(submitIdeaSchema) as any,
    defaultValues: {
      title: item.title,
      description: item.description,
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = methods;

  const onSubmit = async (data: SubmitIdeaFormData) => {
    await updateMutation.mutateAsync({
      title: data.title.trim(),
      description: hasRichTextContent(data.description) ? data.description : '',
    });
    onSaved();
  };

  return (
    <FormProvider {...methods}>
      <div className={s.root}>
        <h2 className={s.heading}>
          {item.stage === 'IDEA' || item.stage === 'UNDER_REVIEW' ? 'Edit need' : 'Edit item'}
        </h2>
        <div className={s.fields}>
          <IdeaFormFields />
        </div>
        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onCancel} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={!isValid || updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}
