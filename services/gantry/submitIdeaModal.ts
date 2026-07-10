import { GANTRY_STAGE_LABELS } from './constants';
import type { Option } from '@/components/form/FormSelect/types';
import type { SubmitIdeaFormData } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

export type SubmitIdeaModalVariant = 'idea' | 'roadmap';

export function getSubmitIdeaDraftKey(variant: SubmitIdeaModalVariant): string {
  return `form-draft:gantry:submit-idea:${variant}`;
}

export const SUBMIT_IDEA_MODAL_COPY: Record<
  SubmitIdeaModalVariant,
  {
    title: string;
    subtitle: string;
    submitLabel: string;
    submittingLabel: string;
    footerNote?: string;
  }
> = {
  idea: {
    title: 'Share a need',
    subtitle:
      'Tell us about a problem you are facing or a gap you have noticed. The product team reviews every submission and uses these signals to inform what we build next.',
    submitLabel: 'Submit',
    submittingLabel: 'Submitting...',
    footerNote: 'Your name will be attached to this submission.',
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
    tags: [],
    type: null,
    objectives: [],
  };
}
