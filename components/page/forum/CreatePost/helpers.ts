import * as yup from 'yup';
import { isAfter } from 'date-fns';

export const createPostSchema = yup.object().shape({
  topic: yup.object().test({
    test: function (value) {
      if (!value) {
        return this.createError({ message: 'Required', type: 'required' });
      }

      return true;
    },
  }),
  title: yup.string().required('Required'),
  content: yup.string().required('Required'),
});
