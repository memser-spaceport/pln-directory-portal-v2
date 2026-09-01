import * as yup from 'yup';

import { socialFieldSchema } from '@/utils/profile/socialFieldSchema';

export function buildEditContactSchema(linkedinRequired: boolean) {
  const linkedin = socialFieldSchema('linkedin');

  return yup.object({
    linkedin: linkedinRequired ? linkedin.required('LinkedIn is required') : linkedin,
    telegram: socialFieldSchema('telegram'),
    github: socialFieldSchema('github'),
    twitter: socialFieldSchema('twitter'),
    bluesky: socialFieldSchema('bluesky'),
    discord: yup.string().nullable().defined(),
    email: yup.string().nullable().defined(),
    shareContacts: yup.boolean().defined(),
  });
}
