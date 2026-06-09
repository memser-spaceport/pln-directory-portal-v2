'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/common/Button';
import { useUpdateGantryItem } from '@/services/gantry/hooks/useUpdateGantryItem';
import { isPreRoadmapStage, tagsToOptions } from '@/services/gantry/constants';
import type { GantryItem } from '@/services/gantry/types';
import {
  editIdeaSchema,
  hasRichTextContent,
  type SubmitIdeaFormData,
} from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
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
    resolver: yupResolver(editIdeaSchema) as any,
    defaultValues: {
      title: item.title,
      description: item.description,
      tags: tagsToOptions(item.tags),
    },
    mode: 'onChange',
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: SubmitIdeaFormData) => {
    await updateMutation.mutateAsync({
      title: data.title.trim(),
      description: hasRichTextContent(data.description) ? data.description : '',
      tags: data.tags?.map((o) => o.value) ?? [],
    });
    onSaved();
  };

  return (
    <FormProvider {...methods}>
      <div className={s.root}>
        <h2 className={s.heading}>
          {isPreRoadmapStage(item.stage) ? 'Edit submission' : 'Edit item'}
        </h2>
        <div className={s.fields}>
          <IdeaFormFields />
        </div>
        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onCancel} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)}>{updateMutation.isPending ? 'Saving...' : 'Save changes'}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
