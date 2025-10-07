import * as yup from 'yup';
import isBoolean from 'lodash/isBoolean';

import { ENROLLMENT_TYPE } from '@/utils/constants';
import { validatePariticipantsEmail } from '@/services/participants-request.service';

import { Option } from './types';

export const createTeamSchema = yup.object({
  name: yup
    .string()
    .required('Required field')
    .test('unique-name', 'Name already exists', async (value: string) => {
      if (!value) {
        return false;
      }

      const { isValid } = await validatePariticipantsEmail(value, ENROLLMENT_TYPE.TEAM);
      return isBoolean(isValid) ? isValid : true;
    }),
  description: yup.string().required('Required field').max(150, 'Description is too long'),
  image: yup.mixed<File>().notRequired(),
  role: yup.string().notRequired(),
  fundingStage: yup.mixed<Option>().defined().required('Required field'),
  industryTags: yup.array().of(yup.mixed<Option>().defined()).defined().min(1, 'Select at least one tag'),
  website: yup.string().required('Required field'),
  contactMethod: yup.string().required('Required field'),
  isInvestmentFund: yup.boolean().default(false),
  fundTypes: yup
    .array()
    .of(
      yup
        .mixed<{
          label: string;
          value: string;
        }>()
        .defined(),
    )
    .defined(),
  startupStages: yup
    .array()
    .of(
      yup
        .mixed<{
          label: string;
          value: string;
        }>()
        .defined(),
    )
    .defined(),
  checkSize: yup.string(),
  investmentFocus: yup.array(yup.string().defined()),
});

export type CreateTeamForm = yup.InferType<typeof createTeamSchema>;
