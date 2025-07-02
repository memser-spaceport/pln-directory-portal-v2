import * as yup from 'yup';

export const signupSchema = yup.object({
  image: yup.mixed<File>().nullable().defined(),
  name: yup.string().required('Required'),
  email: yup.string().email('Must be a valid email').required('Required'),
  teamOrProject: yup.mixed<string | Record<string, string>>().defined(),
  subscribe: yup.boolean().required('Required'),
  agreed: yup.boolean().isTrue().required('Required'),
});
