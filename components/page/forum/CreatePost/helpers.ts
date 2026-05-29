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
  title: yup
    .string()
    .min(3, 'Title must be at least 3 characters.')
    .required('Required')
    .max(255, 'Title exceeds 255 characters. Please shorten.'),
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
        return plainText.trim().length <= 32767;
      },
    })
    .required('Required'),
});

/**
 * Builds the HTML body prefilled into the forum editor when a user arrives at
 * /forum/posts/new with `title` + `url` query params (e.g. from the home
 * news-feed "Discuss" affordance). Returns an empty string when no URL is
 * present, or when the URL is not a plain http(s) URL — this drops
 * `javascript:` and other potentially executable schemes that would run on
 * click in the rendered editor and persist into the forum on submit.
 *
 * Both the URL (inside the href attribute) and the title (used as link text)
 * are HTML-escaped to prevent attribute-breakout XSS.
 */
export function buildForumPrefillContent(prefillTitle: string, prefillUrl: string): string {
  if (!prefillUrl) return '';
  if (!/^https?:\/\//i.test(prefillUrl)) return '';
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const safeUrl = escapeHtml(encodeURI(prefillUrl));
  const linkText = prefillTitle ? escapeHtml(prefillTitle) : escapeHtml(prefillUrl);
  return `<p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a></p>`;
}
