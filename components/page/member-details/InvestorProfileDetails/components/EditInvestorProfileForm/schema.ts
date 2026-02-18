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
  website: yup.string().test({
    message: 'Please enter a valid URL',
    test: function (value, context) {
      if (!context.parent.isInvestViaFund) {
        return true;
      }

      // @ts-ignore
      const { member } = context.options.context;
      const selectedTeam = context.parent.team;

      const isTeamLead = member?.teams.find((team: any) => team.id === selectedTeam?.value)?.teamLead;

      if (!value || !isTeamLead) {
        return true;
      }

      try {
        new URL(value);
        return true;
      } catch {
        return this.createError({ message: 'Please enter a valid URL' });
      }
    },
  }),
  //   .when('isInvestViaFund', {
  //   is: true,
  //   then: () => yup.string().url().required(),
  //   otherwise: () => yup.string().defined(),
  // }),
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

  // Inline add team fields
  newTeamName: yup.string().defined(),
  newTeamWebsite: yup.string().defined(),
  newTeamRole: yup.string().defined(),
});
