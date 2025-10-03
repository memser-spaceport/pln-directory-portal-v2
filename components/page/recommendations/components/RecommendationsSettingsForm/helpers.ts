import * as yup from 'yup';

export function getSelectedFrequency(freq: number = 7) {
  switch (freq) {
    case 14:
      return { value: 14, label: 'Every 2 weeks' };
    case 30:
      return { value: 30, label: 'Monthly' };
    case 1:
      return { value: 1, label: 'Daily' };
    default:
      return { value: 7, label: 'Weekly' };
  }
}

export function getInitialValues() {
  return {
    enabled: true,
    frequency: { value: 7, label: 'Weekly' },
    // industryTags: [],
    keywords: [],
    teamTechnology: [],
    roles: [],
    fundingStage: [],
  };
}

const selectOptionSchema = yup.object({
  value: yup.string().defined().required(),
  label: yup.string().defined().required(),
});

export const recommendationsSettingsSchema = yup
  .object({
    enabled: yup.boolean().required(),

    frequency: yup
      .object({
        value: yup.number().required('Frequency value is required'),
        label: yup.string().required('Frequency label is required'),
      })
      .required('Frequency is required'),

    // industryTags: yup.array().of(selectOptionSchema).min(1, 'Select at least one industry tag').required('Industry tags are required'),

    roles: yup.array().of(yup.string().defined()).default([]),
    fundingStage: yup.array().of(selectOptionSchema).default([]),
    teamTechnology: yup.array().of(selectOptionSchema).default([]),
    keywords: yup.array().of(yup.string().defined()).default([]),
  })
  .test(
    'require-one-when-enabled',
    'At least one of Roles, Company Stage, Team Technology, or Keywords must be filled when enabled',
    function (values) {
      const { enabled, roles, fundingStage, teamTechnology, keywords } = values || {};
      if (!enabled) return true;

      return (
        (roles && roles.length > 0) ||
        (fundingStage && fundingStage.length > 0) ||
        (teamTechnology && teamTechnology.length > 0) ||
        (keywords && keywords.length > 0)
      );
    },
  );
