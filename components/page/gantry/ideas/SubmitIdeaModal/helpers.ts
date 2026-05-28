import * as yup from 'yup';
import type { Option } from '@/components/form/FormSelect/types';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export const submitIdeaSchema = yup.object().shape({
  title: yup.string().required('Title is required').max(100, 'Max 100 characters'),
  description: yup
    .string()
    .required('Description is required')
    .test('not-empty-html', 'Description is required', (value) => !!value && stripHtml(value).length > 0),
  acceptanceCriteria: yup.string().optional(),
  focusAreaUid: yup
    .object({
      label: yup.string().required(),
      value: yup.string().required(),
    })
    .nullable()
    .optional(),
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
  acceptanceCriteria: string;
  focusAreaUid: Option | null;
  stage?: Option | null;
}

export function stripHtmlContent(html: string): string {
  return stripHtml(html);
}
