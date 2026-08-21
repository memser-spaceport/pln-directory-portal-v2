import * as yup from 'yup';

export const MIN_FOUNDED_YEAR = 1800;

export const editTeamDetailsSchema = yup.object({
  name: yup.string().trim().required('Please add Team Name').max(150),
  shortDescription: yup.string().trim().max(100, 'Max. 100 characters').defined(),
  dateFounded: yup
    .string()
    .trim()
    .matches(/^\d{4}$/, { message: 'Enter a 4-digit year, e.g. 2014', excludeEmptyString: true })
    // Evaluated per validation rather than at import time, so the upper bound never goes stale.
    .test('founded-year-range', `Enter a year between ${MIN_FOUNDED_YEAR} and the current year`, (value) => {
      if (!value || !/^\d{4}$/.test(value)) {
        return true;
      }

      const year = Number(value);

      return year >= MIN_FOUNDED_YEAR && year <= new Date().getFullYear();
    })
    .defined(),
  teamSize: yup
    .string()
    .trim()
    .max(13, 'Must be at most 13 characters')
    .matches(/^(\d+\s*[-–]\s*\d+|\d+\+?)$/, {
      message: 'Enter a number (e.g. 50) or a range (e.g. 11-50)',
      excludeEmptyString: true,
    })
    .defined(),
  location: yup.string().trim().defined(),
  isActive: yup.boolean().defined(),
  isFund: yup.boolean().defined(),
  fundingStage: yup.object().nullable().defined(),
  industryTags: yup.array().of(yup.object()).defined(),
  about: yup.string().defined(),
});
