'use client';

import { clsx } from 'clsx';
import { Controller, useFormContext } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { FormSelect } from '@/components/form/FormSelect';
import { FormMultiSelect } from '@/components/form/FormMultiSelect/FormMultiSelect';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import {
  GANTRY_CREATE_STAGE_OPTIONS,
  GANTRY_IMPACT_REASONING_MAX_LENGTH,
  GANTRY_ITEM_TYPE_OPTIONS,
  GANTRY_TAG_OPTIONS,
} from '@/services/gantry/constants';
import type { GantryImpactValue, GantryStage } from '@/services/gantry/types';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { GantryStageOptionLabel } from './GantryStageOptionLabel';
import { ImpactControl } from './ImpactControl';
import formStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import s from './IdeaFormFields.module.scss';

function renderStageOption(stage: GantryStage) {
  return <GantryStageOptionLabel stage={stage} />;
}

interface Props {
  readonly canSetStageOnCreate?: boolean;
  /** Renders the impact rating block (feature-flag gated by the caller). */
  readonly showImpact?: boolean;
  /** Renders the goal-link reasoning textarea (members and authors; curators assign objectives instead). */
  readonly showReasoning?: boolean;
  /** When true, shows required markers / yup required context. Create and edit default to optional. */
  readonly impactRequired?: boolean;
  readonly requireReasoning?: boolean;
}

/** Rating + goal-link reasoning, slotted after Description (form-context driven). */
function ImpactFormBlock({
  showReasoning,
  impactRequired,
  requireReasoning,
}: {
  readonly showReasoning: boolean;
  readonly impactRequired: boolean;
  readonly requireReasoning: boolean;
}) {
  const { control } = useFormContext();
  return (
    <div className={s.impactBlock}>
      <Controller
        name="impact"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <span className={s.impactLabel}>Impact to goals {impactRequired && <span aria-hidden>*</span>}</span>
            <ImpactControl
              value={(field.value as GantryImpactValue | null) ?? null}
              onChange={field.onChange}
              label="Impact to goals"
            />
            {fieldState.error && <span className={s.impactError}>{fieldState.error.message}</span>}
          </div>
        )}
      />
      {showReasoning && (
        <FormTextArea
          name="impactReasoning"
          label="Why this matters"
          isRequired={requireReasoning}
          isOptional={!requireReasoning}
          placeholder="Describe how this creates impact and why — what changes if it gets done?"
          rows={2}
          maxLength={GANTRY_IMPACT_REASONING_MAX_LENGTH}
          showCharCount
        />
      )}
    </div>
  );
}

const IDEAS_EDITOR_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'bullet' }, { list: 'ordered' }],
  ['link', 'image'],
];

export function IdeaFormFields({
  canSetStageOnCreate = false,
  showImpact = false,
  showReasoning = false,
  impactRequired = false,
  requireReasoning = false,
}: Props) {
  return (
    <div className={formStyles.form}>
      <div className={clsx(s.titleField, !canSetStageOnCreate && s.titleFieldNeed)}>
        <FormField
          name="title"
          label={canSetStageOnCreate ? 'Title' : 'What do you need?'}
          placeholder="Ex: find warm intro to member"
          isRequired
          max={TITLE_MAX_LENGTH}
          maxLength={TITLE_MAX_LENGTH}
          description={
            canSetStageOnCreate ? `Max. ${TITLE_MAX_LENGTH} characters.` : 'Focus on the problem, not the solution.'
          }
        />
      </div>

      {canSetStageOnCreate && (
        <FormSelect
          name="stage"
          label="Stage"
          placeholder="Select a stage"
          options={GANTRY_CREATE_STAGE_OPTIONS}
          renderOption={({ option }) => renderStageOption(option.value as GantryStage)}
          formatOptionLabel={(option) => renderStageOption(option.value as GantryStage)}
        />
      )}

      <div className={s.descriptionField}>
        <FormEditor
          name="description"
          label="Description (optional)"
          classes={!canSetStageOnCreate ? { label: s.gantryFieldLabel } : undefined}
          placeholder={
            canSetStageOnCreate
              ? 'Add any extra context for this item.'
              : 'What is the context? What have you tried? Any examples or links?'
          }
          enableMentions
          simplified
          toolbarConfig={IDEAS_EDITOR_TOOLBAR}
          minHeight={80}
          maxLength={DESCRIPTION_MAX_LENGTH}
          showCharCount
        />
      </div>

      {showImpact && (
        <ImpactFormBlock
          showReasoning={showReasoning}
          impactRequired={impactRequired}
          requireReasoning={requireReasoning}
        />
      )}

      <FormMultiSelect
        name="tags"
        label="Tags"
        placeholder="Select tags..."
        options={GANTRY_TAG_OPTIONS}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      />

      <FormSelect
        name="type"
        label="Type of request"
        placeholder="Select a type"
        options={GANTRY_ITEM_TYPE_OPTIONS}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      />
    </div>
  );
}
