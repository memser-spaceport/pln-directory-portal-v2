import * as yup from 'yup';

export const editExperienceSchema = yup.object().shape({
  title: yup.string().required('Required'),
  company: yup.string().required('Required'),
  description: yup.string().defined(),
  startDate: yup.string().nullable().defined().required('Required'),
  endDate: yup
    .string()
    .nullable()
    .defined()
    .when('isCurrent', {
      is: false,
      then: (s) => s.required('Required'),
    }),
  isCurrent: yup.boolean().defined(),
  location: yup.string().defined(),
});
