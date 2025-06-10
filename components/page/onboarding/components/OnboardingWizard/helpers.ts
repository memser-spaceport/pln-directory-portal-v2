import * as yup from 'yup';

export const onboardingSchema = yup.object({
  image: yup.mixed<File>().nullable().defined(),
  name: yup.string().required('Required'),
  email: yup.string().email('Must be a valid email').required('Required'),
  officeHours: yup.string().required('Required'),
  telegram: yup.string().required('Required'),
});
