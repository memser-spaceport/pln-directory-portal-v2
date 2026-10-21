import * as yup from 'yup';

export const MIN_FOUNDED_YEAR = 1800;
export const MAX_TEAM_LOCATIONS = 10;
export const MAX_TEAM_LOCATION_LENGTH = 100;

export const editTeamDetailsSchema = yup.object({
  name: yup.string().trim().required('Please add Team Name').max(150),
  shortDescription: yup.string().trim().max(150, 'Max. 150 characters').defined(),
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
  locations: yup
    .array()
    .of(yup.object({ value: yup.string().trim().defined() }))
    .max(MAX_TEAM_LOCATIONS, `Add up to ${MAX_TEAM_LOCATIONS} locations`)
    .test(
      'primary-location',
      'Add a primary location, or make one of your other locations primary',
      ([primary, ...others] = []) => !!primary.value?.trim() || others.every((location) => !location.value?.trim()),
    )
    .test('unique-locations', 'Each location can only be added once', (locations = []) => {
      const filled = locations.map((location) => location.value?.trim().toLowerCase()).filter(Boolean);
      return new Set(filled).size === filled.length;
    })
    .defined(),
  isActive: yup.boolean().defined(),
  isFund: yup.boolean().defined(),
  fundingStage: yup.object().nullable().defined(),
  industryTags: yup.array().of(yup.object()).defined(),
  about: yup.string().defined(),
});
