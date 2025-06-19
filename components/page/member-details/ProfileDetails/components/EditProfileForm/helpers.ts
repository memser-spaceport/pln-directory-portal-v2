import * as yup from 'yup';

export const editProfileSchema = yup.object().shape({
  image: yup
    .mixed<File>()
    .defined()
    .nullable()
    .test('fileType', 'Only image files are allowed', (file) => {
      return !file || file.type.startsWith('image/');
    }),
  name: yup.string().required('Name is required'),
  bio: yup.string().defined(),
  country: yup.string().defined(),
  state: yup.string().defined(),
  city: yup.string().defined(),
  skills: yup.array().defined(),
  openToCollaborate: yup.boolean().defined(),
});
