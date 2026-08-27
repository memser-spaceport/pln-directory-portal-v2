export enum MembersQueryKeys {
  GET_MEMBERS_LIST = 'GET_MEMBERS_LIST',
  GET_ALL_MEMBERS = 'GET_ALL_MEMBERS',
  GET_MEMBER = 'GET_MEMBER',
  GET_NOTIFICATIONS_SETTINGS = 'GET_NOTIFICATIONS_SETTINGS',
  GET_MEMBER_PREFERENCES = 'GET_MEMBER_PREFERENCES',
  GET_PROFILE_STATUS = 'GET_PROFILE_STATUS',
  GET_SKILLS_OPTIONS = 'GET_SKILLS_OPTIONS',
  GET_MEMBER_EXPERIENCE = 'GET_MEMBER_EXPERIENCE',
  GET_MEMBER_REPOSITORIES = 'GET_MEMBER_REPOSITORIES',
  GET_MEMBERS_ROLES_OPTIONS = 'GET_MEMBERS_ROLES_OPTIONS',
  VALIDATE_OFFICE_HOURS = 'VALIDATE_OFFICE_HOURS',
  GET_ROLES = 'GET_ROLES',
  GET_TOPICS = 'GET_TOPICS',
  GET_INVESTOR_SETTINGS = 'GET_INVESTOR_SETTINGS',
  GET_MEMBER_INVESTOR_SETTINGS = 'GET_MEMBER_INVESTOR_SETTINGS',
  GET_INVESTOR_TYPES = 'GET_INVESTOR_TYPES',
  GET_DEMO_DAY_SUBSCRIPTION = 'GET_DEMO_DAY_SUBSCRIPTION',
}

/**
 * "Fill my Experience section from a CV": the drop area in the section's empty
 * state, the "Update from CV" header control, and the review card that follows a
 * parse. Offered by the apply flow's profile step and by the member profile
 * page.
 *
 * Separate from `SHOW_JOB_BOARD_APPLY`, and no longer nested inside it: the
 * member profile page is not behind that flag, so on that host this one stands
 * alone. In the apply flow it still gates a feature within an already-gated one.
 *
 * **The endpoints exist now.** `POST /v1/members/:uid/cv-imports` (202),
 * `GET .../cv-imports/latest` and `POST .../cv-imports/apply` shipped in the
 * backend's `member-cv-imports` module, and `cv-import.service.ts` is written
 * against them rather than against the handoff spec. What remains before this
 * flips in a deployed environment is confirming the module is actually deployed
 * there and that its AI provider is configured — the parse runs an LLM call, so
 * an environment with the routes but no model answers `PARSE_FAILED` for every
 * document.
 *
 * **It lives here because it now has two hosts.** It began in
 * `services/jobs/constants` when the apply flow's profile step was the only one;
 * the member profile page is the second, and the components it gates were always
 * `member-details/`. The hosts read it; the section itself never does — the
 * `enableCvImport` prop is what keeps it flag-free, so a third host is one prop
 * rather than another import.
 *
 * Read literal-first in `&&` so the bundler folds the branch. BUILD-time: a
 * dashboard change needs a redeploy.
 */
export const SHOW_CV_IMPORT: boolean = process.env.NEXT_PUBLIC_SHOW_CV_IMPORT === 'true';
