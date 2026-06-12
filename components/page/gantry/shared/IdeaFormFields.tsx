'use client';

import { clsx } from 'clsx';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { FormSelect } from '@/components/form/FormSelect';
import { FormMultiSelect } from '@/components/form/FormMultiSelect/FormMultiSelect';
import { GANTRY_CREATE_STAGE_OPTIONS, GANTRY_ITEM_TYPE_OPTIONS, GANTRY_TAG_OPTIONS } from '@/services/gantry/constants';
import type { GantryStage } from '@/services/gantry/types';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { GantryStageOptionLabel } from './GantryStageOptionLabel';
import formStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import s from './IdeaFormFields.module.scss';

function renderStageOption(stage: GantryStage) {
  return <GantryStageOptionLabel stage={stage} />;
}

interface Props {
  readonly canSetStageOnCreate?: boolean;
}

const IDEAS_EDITOR_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'bullet' }, { list: 'ordered' }],
  ['link', 'image'],
];

export function IdeaFormFields({ canSetStageOnCreate = false }: Props) {
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
          minHeight={100}
          maxLength={DESCRIPTION_MAX_LENGTH}
          showCharCount
        />
      </div>

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
