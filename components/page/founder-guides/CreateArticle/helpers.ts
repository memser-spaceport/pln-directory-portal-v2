import * as yup from 'yup';

const stripHtml = (html: string) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const createArticleSchema = yup.object().shape({
  category: yup
    .object()
    .nullable()
    .test({
      test: function (value) {
        if (!value) {
          return this.createError({ message: 'Category is required', type: 'required' });
        }
        return true;
      },
    })
    .required('Category is required'),
  title: yup
    .string()
    .min(3, 'Title must be at least 3 characters.')
    .max(255, 'Title exceeds 255 characters. Please shorten.')
    .required('Required'),
  summary: yup.string().max(100, 'Max 100 characters.').nullable(),
  content: yup
    .string()
    .test({
      name: 'minTextLength',
      message: 'Please enter longer content (at least 10 characters).',
      test: function (value) {
        const plainText = stripHtml(value || '');
        return plainText.trim().length >= 10;
      },
    })
    .test({
      name: 'maxTextLength',
      message: 'Max 600 characters.',
      test: function (value) {
        const plainText = stripHtml(value || '');
        return plainText.trim().length <= 600;
      },
    })
    .required('Required'),
  author: yup
    .object()
    .nullable()
    .test({
      test: function (value) {
        if (!value) {
          return this.createError({ message: 'Please select an author', type: 'required' });
        }
        return true;
      },
    })
    .required('Please select an author'),
  officeHoursUrl: yup.string().url('Must be a valid URL').nullable().optional(),
});

export type CreateArticleForm = {
  category: { label: string; value: string } | null;
  title: string;
  summary: string;
  content: string;
  // TODO: extend to support teams once a useAllTeams hook is available
  author: { label: string; value: string } | null;
  officeHoursUrl: string;
};
