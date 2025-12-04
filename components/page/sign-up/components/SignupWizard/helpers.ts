import * as yup from 'yup';

import { MAX_NAME_LENGTH } from '@/constants/profile';

// URL validation regex that accepts URLs with or without protocol
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

export const signupSchema = yup.object().shape({
  image: yup.mixed<File>().nullable().defined(),
  name: yup.string().max(MAX_NAME_LENGTH).required('Required'),
  email: yup.string().email('Must be a valid email').required('Required'),
  teamOrProject: yup.mixed<string | Record<string, string>>().defined().nullable(),
  teamName: yup
    .string()
    .optional()
    .test({
      test: (value, context) => {
        if (context.options.context?.isAddingTeam) {
          return !!value;
        }

        return true;
      },
      message: 'Team name is required',
    }),
  websiteAddress: yup
    .string()
    .optional()
    .test({
      test: (value, context) => {
        if (context.options.context?.isAddingTeam) {
          return !!value;
        }

        return true;
      },
      message: 'Website is required when adding a new team',
    }),
  about: yup.string().max(400, 'Maximum 400 characters allowed').optional(),
  subscribe: yup.boolean().required('Required'),
  agreed: yup.boolean().isTrue().required('Required'),
});
