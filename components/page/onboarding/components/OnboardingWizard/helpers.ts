import * as yup from 'yup';

export const onboardingSchema = yup.object({
  image: yup
    .mixed<File>()
    .nullable()
    .defined()
    .test('fileType', 'Only image files are allowed', (file) => {
      if (!file) return false; // reject null
      return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    }),
  name: yup.string().required('Required'),
  email: yup.string().email('Must be a valid email').required('Required'),
  officeHours: yup.string().required('Required'),
  telegram: yup.string().required('Required'),
});
