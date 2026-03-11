import * as yup from 'yup';

import { isEditorEmpty } from '@/utils/isEditorEmpty';

export const editTeamDetailsSchema = yup.object({
  name: yup.string().trim().required('Please add Team Name').max(150),
  shortDescription: yup.string().trim().required('Please add a Description').max(1000),
  fundingStage: yup.object().nullable().required('Please add Company Stage'),
  industryTags: yup.array().of(yup.object()).min(1, 'Please add Industry Tags').required('Please add Industry Tags'),
  about: yup
    .string()
    .test('about-required', 'Please add a Long Description', (value) => !isEditorEmpty(value || ''))
    .required('Please add a Long Description'),
});
