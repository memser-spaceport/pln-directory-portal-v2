import * as yup from 'yup';
import type { Option } from '@/components/form/FormSelect/types';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export const DESCRIPTION_MAX_LENGTH = 1000;

export const submitIdeaSchema = yup.object().shape({
  title: yup.string().required('Title is required').max(100, 'Max 100 characters'),
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
});

export interface SubmitIdeaFormData {
  title: string;
  description: string;
  stage?: Option | null;
}

/** True when the rich-text value has visible content (ignores empty Quill markup). */
export function hasRichTextContent(html: string | undefined | null): boolean {
  return !!html && stripHtml(html).length > 0;
}
