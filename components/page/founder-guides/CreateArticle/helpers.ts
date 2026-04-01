import * as yup from 'yup';

const stripHtml = (html: string) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const createArticleSchema = yup.object().shape({
  category: yup.object().nullable().optional(),
  title: yup.string().max(255, 'Title exceeds 255 characters. Please shorten.').nullable().optional(),
  summary: yup.string().max(100, 'Max 100 characters.').nullable().optional(),
  readingTime: yup
    .number()
    .transform((value, original) => (original === '' ? null : value))
    .min(1, 'Must be at least 1 minute.')
    .max(999, 'Max 999 minutes.')
    .nullable()
    .optional(),
  content: yup
    .string()
    .test({
      name: 'maxTextLength',
      message: 'Max 600 characters.',
      test: function (value) {
        if (!value) return true;
        const plainText = stripHtml(value);
        return plainText.trim().length <= 60000;
      },
    })
    .nullable()
    .optional(),
  author: yup.object().nullable().optional(),
  officeHoursUrl: yup.string().url('Must be a valid URL').nullable().optional(),
});

export type CreateArticleForm = {
  category: { label: string; value: string } | null;
  title: string;
  summary: string;
  readingTime: number | null;
  content: string;
  author: { label: string; value: string; type: 'member' | 'team' } | null;
  officeHoursUrl: string;
};
