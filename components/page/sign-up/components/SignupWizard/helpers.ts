import * as yup from 'yup';

import { MAX_NAME_LENGTH } from '@/constants/profile';

// URL validation regex that accepts URLs with or without protocol
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

export const signupSchema = yup.object().shape({
  image: yup.mixed<File>().nullable().defined(),
  name: yup.string().max(MAX_NAME_LENGTH).required('Required'),
  email: yup.string().email('Must be a valid email').required('Required'),
  teamOrProject: yup.mixed<string | Record<string, string>>().defined().nullable(),
  teamName: yup.string().optional(),
  websiteAddress: yup.string().optional(),
  about: yup.string().max(400, 'Maximum 400 characters allowed').optional(),
  subscribe: yup.boolean().required('Required'),
  agreed: yup.boolean().isTrue().required('Required'),
  newTeamRole: yup.string().default('').when('$isAddingTeam', {
    is: true,
    then: (schema) => schema.required('Role is required'),
    otherwise: (schema) => schema.defined(),
  }),
  newTeamName: yup.string().default('').when('$isAddingTeam', {
    is: true,
    then: (schema) => schema.required('Team name is required'),
    otherwise: (schema) => schema.defined(),
  }),
  newTeamWebsite: yup.string().default('').when('$isAddingTeam', {
    is: true,
    then: (schema) => schema.required('Website is required'),
    otherwise: (schema) => schema.defined(),
  }),
});
