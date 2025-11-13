import * as yup from 'yup';

import { MAX_NAME_LENGTH } from '@/constants/profile';

export const signupSchema = yup.object().shape({
  image: yup.mixed<File>().nullable().defined(),
  name: yup.string().max(MAX_NAME_LENGTH).required('Required'),
  email: yup.string().email('Must be a valid email').required('Required'),
  teamOrProject: yup.mixed<string | Record<string, string>>().defined().nullable(),
  teamName: yup.string().optional(),
  websiteAddress: yup.string().optional(),
  subscribe: yup.boolean().required('Required'),
  agreed: yup.boolean().isTrue().required('Required'),
});
