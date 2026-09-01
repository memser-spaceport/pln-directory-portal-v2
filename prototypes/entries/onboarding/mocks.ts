/**
 * Who is being onboarded.
 *
 * Production's wizard is handed a `memberInfo` record that already exists — the
 * account is created before onboarding runs, so the name and email are whatever
 * sign-up captured and the rest of the profile is empty. That is the state this
 * seeds: a name, and nothing else.
 */
export const MOCK_USER = {
  /* What the account was created with. Onboarding's job is to confirm it, which
     is why production's `ProfileStep` renders it in an editable field rather
     than as a greeting. */
  name: 'Polina Bublii',
  email: '',
};

/** Empty on purpose — the whole point is watching these fill in. */
export const EMPTY_ONBOARDING = {
  name: MOCK_USER.name,
  email: MOCK_USER.email,
  officeHours: '',
  telegram: '',
};
