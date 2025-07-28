import * as yup from 'yup';
import { isAfter } from 'date-fns';

const stripHtml = (html: string) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const createPostSchema = yup.object().shape({
  user: yup.object().nullable(),
  topic: yup
    .object()
    .test({
      test: function (value) {
        if (!value) {
          return this.createError({ message: 'Required', type: 'required' });
        }

        return true;
      },
    })
    .required('Required'),
  title: yup.string().min(3, 'The title must be at least 3 characters long').required('Required').max(255, 'Please enter a shorter title. Titles cannot be longer than 255 character(s).'),
  content: yup
    .string()
    .test({
      name: 'minTextLength',
      message: 'Please enter a longer post. Posts should contain at least 8 character(s).',
      test: function (value) {
        const plainText = stripHtml(value || '');
        return plainText.trim().length >= 8;
      },
    })
    .test({
      name: 'maxTextLength',
      message: 'Please enter a shorter post. Posts should not contain more than 32767 character(s).',
      test: function (value) {
        const plainText = stripHtml(value || '');
        return plainText.trim().length < 32767;
      },
    })
    .required('Required'),
});
