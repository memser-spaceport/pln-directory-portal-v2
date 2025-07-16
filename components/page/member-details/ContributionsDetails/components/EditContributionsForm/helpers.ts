import * as yup from 'yup';
import { isAfter } from 'date-fns';

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
  endDate: yup
    .string()
    .nullable()
    .defined()
    .test({
      name: 'datesOrder',
      test: (value, context) => {
        if (!context.parent.startDate || !value) {
          return true;
        }

        return isAfter(new Date(value), context.parent.startDate);
      },
      message: 'Cannot be earlier than start date',
    }),
  isCurrent: yup.boolean().defined(),
});
