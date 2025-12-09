import * as yup from 'yup';

export const editInvestorProfileSchema = yup.object().shape({
  // Team selection - optional
  team: yup
    .object()
    .shape({
      label: yup.string().required(),
      value: yup.string().required(),
    })
    .defined()
    .nullable(),

  // Angel investor fields
  typicalCheckSize: yup.string().defined(),
  investmentFocusAreas: yup.array().of(yup.string().required()).defined(),
  investInStartupStages: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .defined(),
  investInFundTypes: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .defined(),

  teamRole: yup.string().defined(),
  website: yup.string().url().defined(),
  teamTypicalCheckSize: yup.string().defined(),
  teamInvestmentFocusAreas: yup.array().of(yup.string().required()).defined(),
  teamInvestInStartupStages: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .defined(),

  teamInvestInFundTypes: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .defined(),

  // SEC rules acceptance - for angel investors
  secRulesAccepted: yup.boolean().defined(),

  // Fund investment checkbox
  isInvestViaFund: yup.boolean().required(),
});
