import * as yup from 'yup';

export type TOption = {
  label: string;
  value: string;
};

export type TTeamInvestorDetailsForm = {
  investInStartupStages: TOption[];
  typicalCheckSize: string;
  investmentFocusAreas: string[];
  investInFundTypes: TOption[];
};

export const editTeamInvestorDetailsSchema = yup.object().shape({
  investInStartupStages: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .min(1, 'Select at least one startup stage')
    .defined(),
  typicalCheckSize: yup
    .string()
    .required('Typical check size is required')
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
