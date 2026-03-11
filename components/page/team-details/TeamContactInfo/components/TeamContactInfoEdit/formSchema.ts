import * as yup from 'yup';

export const teamContactInfoSchema = yup.object({
  blog: yup.string().nullable().defined(),
  twitter: yup.string().nullable().defined(),
  website: yup.string().required('Website is required'),
  linkedin: yup.string().nullable().defined(),
  telegram: yup.string().nullable().defined(),
  contactMethod: yup.string().required('Contact method is required'),
});
