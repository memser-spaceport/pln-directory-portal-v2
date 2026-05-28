'use client';

import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { FormSelect } from '@/components/form/FormSelect';
import { useGantryFocusAreas } from '@/services/gantry/hooks/useGantryFocusAreas';
import { GANTRY_CREATE_STAGE_OPTIONS } from '@/services/gantry/constants';
import type { GantryStage } from '@/services/gantry/types';
import { GantryStageOptionLabel } from './GantryStageOptionLabel';
import formStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';

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
  const { options: focusAreaOptions, isLoading: isFocusAreasLoading } = useGantryFocusAreas();

  return (
    <div className={formStyles.form}>
      <FormField
        name="title"
        label="Title"
        placeholder="What should we build?"
        isRequired
        max={100}
        maxLength={100}
        description="Max. 100 characters."
      />

      <FormSelect
        name="focusAreaUid"
        label="Focus area"
        placeholder="Select a focus area (optional)"
        options={focusAreaOptions}
        disabled={isFocusAreasLoading}
        isClearable
      />

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
        label="Description"
        placeholder={
          'Describe the problem and proposed solution in detail.\nInclude context, goals, and any constraints.'
        }
        enableMentions
        isRequired
        simplified
        toolbarConfig={IDEAS_EDITOR_TOOLBAR}
        minHeight={200}
      />

      <FormEditor
        name="acceptanceCriteria"
        label="Acceptance criteria (optional)"
        placeholder="How will we know this is done? List measurable outcomes if helpful."
        enableMentions={false}
        simplified
        toolbarConfig={IDEAS_EDITOR_TOOLBAR}
        minHeight={150}
      />
    </div>
  );
}
