import * as yup from 'yup';

export const editTeamDetailsSchema = yup.object({
  name: yup.string().trim().required('Please add Team Name').max(150),
  shortDescription: yup.string().trim().max(1000).defined(),
  isFund: yup.boolean().defined(),
  fundingStage: yup.object().nullable().defined(),
  industryTags: yup.array().of(yup.object()).defined(),
  about: yup.string().defined(),
});
