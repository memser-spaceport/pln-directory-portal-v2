import { GANTRY_STAGE_LABELS } from './constants';
import type { Option } from '@/components/form/FormSelect/types';
import type { SubmitIdeaFormData } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

export type SubmitIdeaModalVariant = 'idea' | 'roadmap';

export const SUBMIT_IDEA_MODAL_COPY: Record<
  SubmitIdeaModalVariant,
  { title: string; subtitle: string; submitLabel: string; submittingLabel: string }
> = {
  idea: {
    title: 'Share a need',
    subtitle:
      'Tell us about a problem you’re facing or something getting in your way. The product team reviews every need before it moves onto the roadmap.',
    submitLabel: 'Create Need',
    submittingLabel: 'Creating...',
  },
  roadmap: {
    title: 'Create item',
    subtitle: 'Add an item to the board and choose the stage it should start in.',
    submitLabel: 'Create Item',
    submittingLabel: 'Creating...',
  },
};

export function getSubmitIdeaFormDefaults(variant: SubmitIdeaModalVariant): SubmitIdeaFormData {
  const stage: Option =
    variant === 'roadmap'
      ? { label: GANTRY_STAGE_LABELS.PLANNED, value: 'PLANNED' }
      : { label: GANTRY_STAGE_LABELS.IDEA, value: 'IDEA' };

  return {
    title: '',
    description: '',
    stage,
  };
}
