import * as yup from 'yup';

function isTeamLeadForSelectedTeam(context: yup.TestContext): boolean {
  // @ts-ignore
  const { member } = context.options.context;
  const selectedTeam = context.parent.team;
  return !!member?.teams.find((team: any) => team.id === selectedTeam?.value)?.teamLead || !!selectedTeam?.teamLead;
}

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
  typicalCheckSize: yup.string().when('secRulesAccepted', {
    is: true,
    then: (schema) => schema.required('Typical check size is required'),
    otherwise: (schema) => schema.defined(),
  }),
  investmentFocusAreas: yup.array().of(yup.string().required()).defined(),
  investInStartupStages: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .when('secRulesAccepted', {
      is: true,
      then: (schema) => schema.min(1, 'Select at least one startup stage'),
      otherwise: (schema) => schema.defined(),
    }),
  investInFundTypes: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .defined(),

  teamRole: yup.string().test({
    message: 'Role is required',
    test: function (value, context) {
      if (!context.parent.isInvestViaFund || !isTeamLeadForSelectedTeam(context)) {
        return true;
      }
      return !!value && value.trim().length > 0;
    },
  }),
  website: yup.string().test({
    message: 'Website is required',
    test: function (value, context) {
      if (!context.parent.isInvestViaFund || !isTeamLeadForSelectedTeam(context)) {
        return true;
      }

      if (!value || !value.trim()) {
        return this.createError({ message: 'Website is required' });
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
  teamTypicalCheckSize: yup.string().test({
    message: 'Typical check size is required',
    test: function (value, context) {
      if (!context.parent.isInvestViaFund || !isTeamLeadForSelectedTeam(context)) {
        return true;
      }
      return !!value;
    },
  }),
  teamInvestmentFocusAreas: yup.array().of(yup.string().required()).defined(),
  teamInvestInStartupStages: yup
    .array()
    .of(
      yup.object().shape({
        label: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .test({
      message: 'Select at least one startup stage',
      test: function (value, context) {
        if (!context.parent.isInvestViaFund || !isTeamLeadForSelectedTeam(context)) {
          return true;
        }
        return !!value && value.length > 0;
      },
    }),

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
