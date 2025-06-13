import * as yup from 'yup';

export const editContributionsSchema = yup.object().shape({
  name: yup.object().test({
    test: function (value) {
      if (!value) {
        return this.createError({ message: 'Required', type: 'required' });
      }

      return true;
    },
  }),
  role: yup.string().required('Required'),
  description: yup.string().defined(),
  startDate: yup.string().nullable().defined(),
  endDate: yup.string().nullable().defined(),
});
