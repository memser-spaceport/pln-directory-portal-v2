import * as yup from 'yup';

export const editTeamSchema = yup.object().shape({
  url: yup.string().defined(),
  name: yup.object().when('$isAddingTeamInline', {
    is: true,
    then: (schema) => schema.optional(),
    otherwise: (schema) =>
      schema.test({
        test: function (value) {
          if (!value) {
            return this.createError({ message: 'Required', type: 'required' });
          }
          return true;
        },
      }),
  }),
  role: yup.string().defined(),
  mainTeam: yup.boolean().defined(),
  newTeamName: yup.string().default('').when('$isAddingTeamInline', {
    is: true,
    then: (schema) => schema.required('Team name is required'),
    otherwise: (schema) => schema.defined(),
  }),
  newTeamWebsite: yup.string().default('').when('$isAddingTeamInline', {
    is: true,
    then: (schema) => schema.required('Website is required'),
    otherwise: (schema) => schema.defined(),
  }),
  newTeamRole: yup.string().default('').when('$isAddingTeamInline', {
    is: true,
    then: (schema) => schema.required('Role is required'),
    otherwise: (schema) => schema.defined(),
  }),
});
