import * as yup from 'yup';

export const editTeamSchema = yup.object().shape({
  url: yup.string().defined(),
  name: yup.object().test({
    test: function (value) {
      if (!value) {
        return this.createError({ message: 'Required', type: 'required' });
      }

      return true;
    },
  }),
  role: yup.string().defined(),
});
