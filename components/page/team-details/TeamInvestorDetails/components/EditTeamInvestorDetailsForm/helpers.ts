import * as yup from 'yup';

export type TOption = {
  label: string;
  value: string;
};

export type TTeamInvestorDetailsForm = {
  isFund: boolean;
  investInStartupStages: TOption[];
  typicalCheckSize: string;
  investmentFocusAreas: string[];
  investInFundTypes: TOption[];
};

export const editTeamInvestorDetailsSchema = yup.object().shape({
  isFund: yup.boolean().defined(),
  investInStartupStages: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .when('isFund', {
      is: true,
      then: (schema) => schema.min(1, 'Select at least one startup stage'),
      otherwise: (schema) => schema.defined(),
    })
    .defined(),
  typicalCheckSize: yup
    .string()
    .when('isFund', {
      is: true,
      then: (schema) => schema.required('Typical check size is required'),
      otherwise: (schema) => schema.defined(),
    })
    .defined(),
  investmentFocusAreas: yup.array().of(yup.string().required()).defined(),
  investInFundTypes: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .defined(),
});

export const parseCurrencyToNumber = (currencyString: string): number => {
  const numericString = currencyString.replace(/[^\d.]/g, '');
  const numericValue = parseFloat(numericString);

  return isNaN(numericValue) ? 0 : numericValue;
};
