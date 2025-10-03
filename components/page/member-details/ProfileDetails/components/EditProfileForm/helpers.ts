import * as yup from 'yup';

import { MAX_NAME_LENGTH } from '@/constants/profile';

export const editProfileSchema = yup.object().shape({
  image: yup
    .mixed<File>()
    .defined()
    .nullable()
    .test('fileType', 'Only image files are allowed', (file) => {
      return !file || file.type.startsWith('image/');
    }),
  name: yup.string().max(MAX_NAME_LENGTH).required('Name is required'),
  country: yup.string().defined(),
  state: yup.string().defined(),
  city: yup.string().defined(),
  skills: yup.array().defined(),
  openToCollaborate: yup.boolean().defined(),
});
