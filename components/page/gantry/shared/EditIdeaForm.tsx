'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@/components/common/Button';
import { useCurrentUserStore } from '@/services/auth/store';
import { useUpdateGantryItem } from '@/services/gantry/hooks/useUpdateGantryItem';
import { useGantryObjectives } from '@/services/gantry/hooks/useGantryObjectives';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { isPreRoadmapStage, tagsToOptions } from '@/services/gantry/constants';
import type { GantryItem, GantryItemType } from '@/services/gantry/types';
import {
  editIdeaSchema,
  hasRichTextContent,
  type SubmitIdeaFormData,
} from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { IdeaFormFields } from './IdeaFormFields';
import { ObjectiveSelector } from './ObjectiveSelector';
import s from './EditIdeaForm.module.scss';

interface Props {
  readonly item: GantryItem;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}

export function EditIdeaForm({ item, onCancel, onSaved }: Props) {
  const access = useGantryAccess();
  const analytics = useGantryAnalytics();
  const { currentUser } = useCurrentUserStore();
  const { data: objectives = [], isLoading: isLoadingObjectives } = useGantryObjectives();
  const updateMutation = useUpdateGantryItem(item.uid);

  // authorImpact is the AUTHOR's rating: a curator editing someone else's item never touches it.
  const isAuthor = !!currentUser?.uid && item.createdByUid === currentUser.uid;
  const showImpact = isAuthor;
  // Once objectives are assigned they become the visible goal-link; the reasoning stays stored but hidden.
  const showReasoning = showImpact && item.objectives.length === 0;

  const methods = useForm<SubmitIdeaFormData>({
    resolver: yupResolver(editIdeaSchema) as any,
    defaultValues: {
      title: item.title,
      description: item.description,
      tags: tagsToOptions(item.tags),
      type: item.type ? { label: item.type, value: item.type } : null,
      impact: item.authorImpact,
      impactReasoning: item.authorImpactReasoning ?? '',
    },
    mode: 'onChange',
    // Optional on edit: forcing a rating here would block legacy-item edits (no backfill prompts).
    context: { impactRequired: false, reasoningRequired: false },
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: SubmitIdeaFormData) => {
    const reasoning = data.impactReasoning?.trim();
    await updateMutation.mutateAsync({
      title: data.title.trim(),
      description: hasRichTextContent(data.description) ? data.description : '',
      tags: data.tags?.map((o) => o.value) ?? [],
      type: (data.type?.value as GantryItemType) ?? null,
      ...(showImpact && data.impact != null ? { authorImpact: data.impact } : {}),
      ...(showImpact && reasoning ? { authorImpactReasoning: reasoning } : {}),
    });
    if (showImpact && data.impact != null && data.impact !== item.authorImpact) {
      analytics.onItemImpactRated(item.uid, data.impact, item.authorImpact !== null, 'edit');
    }
    onSaved();
  };

  return (
    <FormProvider {...methods}>
      <div className={s.root}>
        <h2 className={s.heading}>{isPreRoadmapStage(item.stage) ? 'Edit submission' : 'Edit item'}</h2>
        <div className={s.fields}>
          <IdeaFormFields showImpact={showImpact} showReasoning={showReasoning} impactRequired={false} />
        </div>

        <div className={s.objectiveSection}>
          <ObjectiveSelector
            item={item}
            canCurate={access.canCurate}
            objectives={objectives}
            isLoadingObjectives={isLoadingObjectives}
          />
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
