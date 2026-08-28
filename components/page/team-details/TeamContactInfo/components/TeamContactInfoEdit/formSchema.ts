import * as yup from 'yup';

import { socialFieldSchema } from '@/utils/profile/socialFieldSchema';

export const teamContactInfoSchema = yup.object({
  blog: socialFieldSchema('blog'),
  twitter: socialFieldSchema('twitter'),
  website: socialFieldSchema('website').required('Website is required'),
  linkedin: socialFieldSchema('linkedin'),
  telegram: socialFieldSchema('telegram'),
  bluesky: socialFieldSchema('bluesky'),
  crunchbase: socialFieldSchema('crunchbase'),
  contactMethod: yup.string().required('Contact method is required'),
  jobReferEmail: yup
    .string()
    .defined()
    .test('email-or-empty', 'Enter a valid email', (value) => {
      const trimmed = value?.trim() ?? '';
      return !trimmed || yup.string().email().isValidSync(trimmed);
    }),
});
