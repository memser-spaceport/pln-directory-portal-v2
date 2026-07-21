'use client';

// Prototype-local copy of production IdeaFormFields (per prototypes "copy & simplify"), split so
// the goal + rating block can slot in right after the Description, before Tags/Type. Reuses the
// production field components + module scss read-only — only the field ORDER differs (via children).

import type { ReactNode } from 'react';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { FormSelect } from '@/components/form/FormSelect';
import { FormMultiSelect } from '@/components/form/FormMultiSelect/FormMultiSelect';
import { GANTRY_CREATE_STAGE_OPTIONS, GANTRY_ITEM_TYPE_OPTIONS, GANTRY_TAG_OPTIONS } from '@/services/gantry/constants';
import type { GantryStage } from '@/services/gantry/types';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { GantryStageOptionLabel } from '@/components/page/gantry/shared/GantryStageOptionLabel';
import formStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import s from '@/components/page/gantry/shared/IdeaFormFields.module.scss';

const IDEAS_EDITOR_TOOLBAR: (string | Record<string, unknown>)[][] = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'bullet' }, { list: 'ordered' }],
  ['link', 'image'],
];

function renderStageOption(stage: GantryStage) {
  return <GantryStageOptionLabel stage={stage} />;
}

/** Title → Stage → Description → {children} → Tags → Type. `children` is the goal + rating block. */
export function ItemFormFields({ children }: { children: ReactNode }) {
  return (
    <div className={formStyles.form}>
      <div className={s.titleField}>
        <FormField
          name="title"
          label="Title"
          placeholder="Ex: find warm intro to member"
          isRequired
          max={TITLE_MAX_LENGTH}
          maxLength={TITLE_MAX_LENGTH}
          description={`Max. ${TITLE_MAX_LENGTH} characters.`}
        />
      </div>

      <FormSelect
        name="stage"
        label="Stage"
        placeholder="Select a stage"
        options={GANTRY_CREATE_STAGE_OPTIONS}
        renderOption={({ option }) => renderStageOption(option.value as GantryStage)}
        formatOptionLabel={(option) => renderStageOption(option.value as GantryStage)}
      />

      <div className={s.descriptionField}>
        <FormEditor
          name="description"
          label="Description (optional)"
          placeholder="Add any extra context for this item."
          enableMentions
          simplified
          toolbarConfig={IDEAS_EDITOR_TOOLBAR}
          minHeight={100}
          maxLength={DESCRIPTION_MAX_LENGTH}
          showCharCount
        />
      </div>

      {children}

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
