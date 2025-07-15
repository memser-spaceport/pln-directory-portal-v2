import * as yup from 'yup';
import { isAfter } from 'date-fns';

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
      then: (s) =>
        s
          .test({
            name: 'datesOrder',
            test: (value, context) => {
              if (!context.parent.startDate || !value) {
                return true;
              }

              return isAfter(new Date(value), context.parent.startDate);
            },
            message: 'Cannot be earlier than start date',
          })
          .required('Required'),
    }),
  isCurrent: yup.boolean().defined(),
  location: yup.string().defined(),
});
