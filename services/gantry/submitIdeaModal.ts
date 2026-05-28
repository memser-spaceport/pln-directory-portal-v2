import { GANTRY_STAGE_LABELS } from './constants';
import type { Option } from '@/components/form/FormSelect/types';
import type { SubmitIdeaFormData } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

export type SubmitIdeaModalVariant = 'idea' | 'roadmap';

export const SUBMIT_IDEA_MODAL_COPY: Record<
  SubmitIdeaModalVariant,
  { title: string; subtitle: string; submitLabel: string; submittingLabel: string }
> = {
  idea: {
    title: 'Submit an Idea',
    subtitle: 'Share what we should build next. Ideas are reviewed before they move onto the roadmap.',
    submitLabel: 'Submit Idea',
    submittingLabel: 'Submitting...',
  },
  roadmap: {
    title: 'Create Roadmap Item',
    subtitle: 'Add a committed item directly to the roadmap. It will start in Planned.',
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
    acceptanceCriteria: '',
    focusAreaUid: null,
    stage,
  };
}
