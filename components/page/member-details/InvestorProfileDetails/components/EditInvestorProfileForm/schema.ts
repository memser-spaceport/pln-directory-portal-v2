import * as yup from 'yup';

export const editInvestorProfileSchema = yup.object().shape({
  // type: yup
  //   .object()
  //   .shape({
  //     label: yup.string().required(),
  //     value: yup.string().required(),
  //   })
  //   .defined()
  //   .nullable(),
  team: yup
    .object()
    .shape({
      label: yup.string().required(),
      value: yup.string().required(),
    })
    .defined()
    .nullable(),
  typicalCheckSize: yup
    .string()
    // .when(['type', 'secRulesAccepted'], {
    //   is: (type: any, secRulesAccepted: boolean) =>
    //     (type?.value === 'ANGEL' || type?.value === 'ANGEL_AND_FUND') && secRulesAccepted,
    //   then: () => yup.string().required('Required'),
    //   otherwise: () => yup.string().optional(),
    // })
    .defined(),
  investmentFocusAreas: yup
    .array()
    .of(yup.string().required())
    // .when(['type', 'secRulesAccepted'], {
    //   is: (type: any, secRulesAccepted: boolean) =>
    //     (type?.value === 'ANGEL' || type?.value === 'ANGEL_AND_FUND') && secRulesAccepted,
    //   then: () => yup.array().of(yup.string().required()).min(1, 'Required'),
    //   otherwise: () => yup.array().of(yup.string().required()).optional(),
    // })
    .defined(),
  investInStartupStages: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    // .when(['type', 'secRulesAccepted'], {
    //   is: (type: any, secRulesAccepted: boolean) =>
    //     (type?.value === 'ANGEL' || type?.value === 'ANGEL_AND_FUND') && secRulesAccepted,
    //   then: () =>
    //     yup
    //       .array()
    //       .of(
    //         yup.object().shape({
    //           label: yup.string().required(),
    //           value: yup.string().required(),
    //         }),
    //       )
    //       .min(1, 'Required'),
    //   otherwise: () =>
    //     yup
    //       .array()
    //       .of(
    //         yup.object().shape({
    //           label: yup.string().required(),
    //           value: yup.string().required(),
    //         }),
    //       )
    //       .optional(),
    // })
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
  secRulesAccepted: yup
    .boolean()
    // .when('type', {
    //   is: (type: any) => type?.value === 'ANGEL' || type?.value === 'ANGEL_AND_FUND',
    //   then: () => yup.boolean().required('Required'),
    //   otherwise: () => yup.boolean().optional(),
    // })
    .defined(),
  isInvestViaFund: yup.boolean().required(),
});
