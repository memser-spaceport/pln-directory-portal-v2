export enum MembersQueryKeys {
  GET_MEMBERS_LIST = 'GET_MEMBERS_LIST',
  GET_ALL_MEMBERS = 'GET_ALL_MEMBERS',
  GET_MEMBER = 'GET_MEMBER',
  GET_NOTIFICATIONS_SETTINGS = 'GET_NOTIFICATIONS_SETTINGS',
  GET_MEMBER_PREFERENCES = 'GET_MEMBER_PREFERENCES',
  GET_PROFILE_STATUS = 'GET_PROFILE_STATUS',
  GET_SKILLS_OPTIONS = 'GET_SKILLS_OPTIONS',
  GET_MEMBER_EXPERIENCE = 'GET_MEMBER_EXPERIENCE',
  GET_STORED_CV = 'GET_STORED_CV',
  GET_MEMBER_REPOSITORIES = 'GET_MEMBER_REPOSITORIES',
  GET_MEMBERS_ROLES_OPTIONS = 'GET_MEMBERS_ROLES_OPTIONS',
  VALIDATE_OFFICE_HOURS = 'VALIDATE_OFFICE_HOURS',
  GET_ROLES = 'GET_ROLES',
  GET_TOPICS = 'GET_TOPICS',
  GET_INVESTOR_SETTINGS = 'GET_INVESTOR_SETTINGS',
  GET_MEMBER_INVESTOR_SETTINGS = 'GET_MEMBER_INVESTOR_SETTINGS',
  GET_INVESTOR_TYPES = 'GET_INVESTOR_TYPES',
  GET_DEMO_DAY_SUBSCRIPTION = 'GET_DEMO_DAY_SUBSCRIPTION',
  GET_UI_FLAGS = 'GET_UI_FLAGS',
}

/* (`SHOW_CV_IMPORT` lived here, gating the CV importer on both of its hosts —
    the apply flow's profile step and the member profile page. It is gone because
    the feature is permanent: the drop area, the resting "Your CV" card and the
    review card are what those surfaces are now, not a variant of them. What the
    flag's own note said had to hold before it flipped still has to hold of every
    environment that runs this — the backend's `member-cv-imports` module
    deployed, with an AI provider configured, or the parse answers `PARSE_FAILED`
    for every document. */
