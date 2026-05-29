'use client';

import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { FormSelect } from '@/components/form/FormSelect';
import { GANTRY_CREATE_STAGE_OPTIONS } from '@/services/gantry/constants';
import type { GantryStage } from '@/services/gantry/types';
import { DESCRIPTION_MAX_LENGTH } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
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
      <div className={s.titleField}>
        <FormField
          name="title"
          label={canSetStageOnCreate ? 'Title' : 'What is your current need?'}
          placeholder={
            canSetStageOnCreate ? 'Give this item a short, clear title.' : 'Describe the problem you’re facing.'
          }
          isRequired
          max={100}
          maxLength={100}
          description={canSetStageOnCreate ? 'Max. 100 characters.' : 'Max. 100 characters.'}
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

      <FormEditor
        name="description"
        label="Description (optional)"
        placeholder={
          canSetStageOnCreate
            ? 'Add any extra context for this item.'
            : 'Add any extra context — links, examples, screenshots. Describe the problem, not a specific solution.'
        }
        enableMentions
        simplified
        toolbarConfig={IDEAS_EDITOR_TOOLBAR}
        minHeight={200}
        maxLength={DESCRIPTION_MAX_LENGTH}
        showCharCount
      />
    </div>
  );
}
