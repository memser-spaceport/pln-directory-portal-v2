import * as yup from 'yup';
import type { Option } from '@/components/form/FormSelect/types';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export const TITLE_MAX_LENGTH = 150;
export const DESCRIPTION_MAX_LENGTH = 1000;

const tagsSchema = yup
  .array()
  .of(yup.object({ label: yup.string().required(), value: yup.string().required() }))
  .optional();

const typeSchema = yup
  .object({ label: yup.string().required(), value: yup.string().required() })
  .nullable()
  .optional();

const objectivesSchema = yup
  .array()
  .of(yup.object({ label: yup.string().required(), value: yup.string().required() }))
  .optional();

export const submitIdeaSchema = yup.object().shape({
  title: yup
    .string()
    .required('Title is required')
    .max(TITLE_MAX_LENGTH, `Max ${TITLE_MAX_LENGTH} characters`),
  description: yup
    .string()
    .optional()
    .test(
      'max-length',
      `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`,
      (value) => !value || stripHtml(value).length <= DESCRIPTION_MAX_LENGTH,
    ),
  stage: yup
    .object({
      label: yup.string().required(),
      value: yup.string().required(),
    })
    .nullable()
    .optional(),
  tags: tagsSchema,
  type: typeSchema,
  objectives: objectivesSchema,
});

export const editIdeaSchema = yup.object().shape({
  title: yup
    .string()
    .required('Title is required')
    .max(TITLE_MAX_LENGTH, `Max ${TITLE_MAX_LENGTH} characters`),
  description: yup.string().optional(),
  tags: tagsSchema,
  type: typeSchema,
});

export interface SubmitIdeaFormData {
  title: string;
  description: string;
  stage?: Option | null;
  tags?: Option[];
  type?: Option | null;
  objectives?: Option[];
}

export type SubmitIdeaDraft = {
  form: SubmitIdeaFormData;
  showCreateObjective: boolean;
  newObjectiveTitle: string;
};

export function isSubmitIdeaDraftEmpty(draft: SubmitIdeaDraft): boolean {
  const { form, newObjectiveTitle, showCreateObjective } = draft;

  return (
    !(form.title ?? '').trim() &&
    !hasRichTextContent(form.description) &&
    !(form.tags?.length) &&
    !form.type &&
    !(form.objectives?.length) &&
    !(newObjectiveTitle ?? '').trim() &&
    !showCreateObjective
  );
}

/** True when the rich-text value has visible content (ignores empty Quill markup). */
export function hasRichTextContent(html: string | undefined | null): boolean {
  return !!html && stripHtml(html).length > 0;
}
