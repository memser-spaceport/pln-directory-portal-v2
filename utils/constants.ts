export const NAV_OPTIONS = [
  {
    name: 'Teams',
    url: '/teams',
    selectedLogo: '/icons/teams--selected.svg',
    unSelectedLogo: '/icons/team.svg',
  },
  {
    name: 'Members',
    url: '/members',
    selectedLogo: '/icons/members--selected.svg',
    unSelectedLogo: '/icons/members.svg',
  },
  {
    name: 'Projects',
    url: '/projects',
    selectedLogo: '/icons/projects--selected.svg',
    unSelectedLogo: '/icons/projects.svg',
  },
  {
    name: 'IRL Gatherings',
    url: '/irl',
    selectedLogo: '/icons/nav-calendar--selected.svg',
    unSelectedLogo: '/icons/nav-calendar.svg',
  },
];

export const EVENTS = {
  TRIGGER_LOADER: 'TRIGGER_LOADER',
  TRIGGER_MOBILE_NAV: 'TRIGGER_MOBILE_NAV',
  TRIGGER_REGISTER_LOADER: 'trigger-register-loader',
  OPEN_TEAM_REGISTER_DIALOG: 'open-team-register-dialog',
  OPEN_MEMBER_REGISTER_DIALOG: 'open-member-register-dialog',
  SHOW_FILTER: 'SHOW_FILTER',
  SHOW_MEMBERS_FILTER: 'show-members-filter',
  TEAM_DETAIL_ALL_PROJECTS_CLOSE: 'team-detail-all-projects-close',
  TEAM_DETAIL_ALL_MEMBERS_CLOSE: 'team-detail-all-members-close',
  PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE: 'project-detail-all-members-open-and-close',
  PROJECT_DETAIL_ALL_TEAMS_OPAN_AND_CLOSE: 'project-detail-all-teams-open-and-close',
  PROJECT_DETAIL_DELETE_MODAL_OPEN_AND_CLOSE: 'project-detail-delete-modal-open-and-close',
  ADD_OR_EDIT_PROJECT_STEP_CHANGE: 'add-or-edit-project-step-change',
  OPEN_MAINTAINING_TEAM_POPUP: 'open-maintaining-team-popup',
  OPEN_CONTRIBUTORS_POPUP: 'open-contributors-popup',
  SHOW_PROJECTS_FILTER: 'show-projects-filter',
  UPDATE_SELECTED_CONTRIBUTING_TEAM: 'update-selected-contring-team',
  UPDATE_SELECTED_CONTRIBUTORS: 'update-selected-contributors',
  PROJECT_ADD_MODAL_CLOSE_EVENT: 'project-add-modal-close-event',
};

export const HELPER_MENU_OPTIONS = [
  {
    icon: '/icons/message.svg',
    name: 'ProtoSphere',
    type: '_blank',
    url: process.env.PROTOSPHERE_URL,
  },
  {
    icon: '/icons/question-circle-grey.svg',
    name: 'Get Support',
    type: '_blank',
    url: process.env.GET_SUPPORT_URL,
  },
  {
    icon: '/icons/changelog.svg',
    name: 'Changelog',
    url: '/changelog',
    type: '',
  },
];

export const JOIN_NETWORK_MENUS = [
  { name: 'As a Member', key: 'member', logo: '/icons/join-member.svg' },
  { name: 'As a Team', key: 'team', logo: '/icons/join-team.svg' },
];

export const COMMON_ANALYTICS_EVENTS = {
  NAVBAR_MENU_ITEM_CLICKED: 'navbar-menu-item-clicked',
  NAVBAR_GET_HELP_ITEM_CLICKED: 'navbar-get-help-item-clicked',
  NAVBAR_ACCOUNTMENU_ITEM_CLICKED: 'navbar-accountmenu-item-clicked',
  NAVBAR_JOIN_NETWORK_CLICKED: 'navbar-join-network-menu-clicked',
  NAVBAR_JOIN_NETWORK_OPTION_CLICKED: 'navbar-join-network-option-clicked',
  NAVBAR_DRAWER_BTN_CLICKED: 'navbar-drawer-btn-clicked',
  FOOTER_PAGINATION_OPTION_CLICKED: 'footer-pagination-option-clicked',
  SESSION_EXPIRED_POPUP_LOGIN_BTN_CLICKED: 'session-expired-popup-login-btn-clicked',
  GO_TO_TOP_BTN_CLICKED:"go-to-top-btn-clicked",
};

export const PROJECT_ANALYTICS_EVENTS = {
  PROJECT_DETAIL_DELETE_SUCCESS: 'project-detail-delete-success',
  PROJECT_DETAIL_DELETE_FAILED: 'project-detail-delete-failed',
  PROJECT_DETAIL_DELETE_BTN_CLICKED: 'project-detail-delete-btn-clicked',
  PROJECT_DETAIL_DELETE_CANCEL_BTN_CLICKED: 'project-detail-delete-cancel-btn-clicked',
  PROJECT_DETAIL_EDIT_CONFIRM_CLICKED: 'project-edit-confirm-btn-clicked',
  PROJECT_DETAIL_EDIT_CLICKED: 'project-detail-edit-clicked',
  PROJECT_DETAIL_LINKS_CLICKED: 'project-detail-link-clicked',
  PROJECT_EDIT_CLICKED: 'project-edit-clicked',
  PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_CANCELLED: 'project-detail-additional-detail-edit-cancelled',
  PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE: 'project-detail-additional-detail-edit-save-clicked',
  PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE_SUCCESS: 'project-detail-additional-detail-edit-save-success',
  PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE_FAILED: 'project-detail-additional-detail-edit-save-failed',
  PROJECT_DETAIL_MAINTAINER_TEAM_CLICKED: 'project-detail-maintainer-team-clicked',
  PROJECT_DETAIL_CONTRIBUTING_TEAM_CLICKED: 'project-detail-contributing-team-clicked',
  PROJECT_DETAIL_SEEALL_CLICKED: 'project-detail-teams-seeall-clicked',
  PROJECT_DETAIL_SEE_ALL_CONTRIBUTORS_CLICKED: 'project-detail-see-all-contributors-clicked',
  PROJECT_DETAIL_CONTRIBUTOR_PROFILE_CLICKED: 'project-detail-contributor-profile-clicked',

  PROJECT_LIST_FILTERS_APPLIED: 'projects-filters-applied',
  PROJECT_LIST_FILTERS_CLEARED: 'projects-filters-cleared',
  PROJECT_LIST_PROJECT_CLICKED: 'project-clicked',
  PROJECT_ADD_CLICKED: 'project-add-click',
  PROJECT_LIST_SEARCH_APPLIED: 'projects-search',
  PROJECT_LIST_VIEW_TYPE_CLCIKED: 'project-list-view-type_clciked',
  PROJECT_LIST_SORT_CLICKED: 'project-list-sort-clicked',
  PROJECT_FILTER_PANEL_CLOSE_CLICKED: 'project-filter-panel-close-clicked',
  PROJECT_VIEW_FILTER_RESULT_CLICKED: 'project-view-filter-result-clicked',
};

export const TOAST_MESSAGES = {
  LOGOUT_MSG: 'You have been logged out successfully',
  LOGIN_MSG: 'Successfully Logged In',
  LOGGED_IN_MSG: 'You are already logged in',
  SOMETHING_WENT_WRONG: 'Something went wrong',
};

export const AUTH_ANALYTICS = {
  AUTH_LOGIN_BTN_CLICKED: 'AUTH_LOGIN_BTN_CLICKED',
  AUTH_PROCEED_TO_LOGIN_CLICKED: 'AUTH_PROCEED_TO_LOGIN_CLICKED',
  AUTH_INFO_POPUP_CLOSED: 'AUTH_INFO_POPUP_CLOSED',
  AUTH_PRIVY_LOGIN_SUCCESS: 'AUTH_PRIVY_LOGIN_SUCCESS',
  AUTH_DIRECTORY_LOGIN_INIT: 'AUTH_DIRECTORY_LOGIN_INIT',
  AUTH_DIRECTORY_LOGIN_SUCCESS: 'AUTH_DIRECTORY_LOGIN_SUCCESS',
  AUTH_DIRECTORY_LOGIN_FAILURE: 'AUTH_DIRECTORY_LOGIN_FAILURE',
  AUTH_PRIVY_LINK_SUCCESS: 'AUTH_PRIVY_LINK_SUCCESS',
  AUTH_PRIVY_UNLINK_EMAIL: 'AUTH_PRIVY_UNLINK_EMAIL',
  AUTH_PRIVY_DELETE_USER: 'AUTH_PRIVY_DELETE_USER',
  AUTH_PRIVY_LINK_ERROR: 'AUTH_PRIVY_LINK_ERROR',
  AUTH_SETTINGS_PRIVY_ACCOUNT_LINK: 'AUTH_SETTINGS_PRIVY_ACCOUNT_LINK',
  AUTH_SETTINGS_EMAIL_UPDATE_SUCCESS: 'AUTH_SETTINGS_EMAIL_UPDATE_SUCCESS',
  AUTH_SETTINGS_EMAIL_UPDATE_FAILED: 'AUTH_SETTINGS_EMAIL_UPDATE_FAILED',
  AUTH_SETTINGS_EMAIL_UPDATE_SAME_AS_OLD: 'AUTH_SETTINGS_EMAIL_UPDATE_SAME_AS_OLD',
};

export const TEAMS_ANALYTICS_EVENTS = {
  TEAM_OFFICE_HOURS_FILTER_SELECTED: 'team-office-hours-filter-selected',
  TEAM_FRIENDS_OF_PROTOCOL_FILTER_SELECTED: 'team-friends-of-protocol-filter-selected',
  FILTERS_APPLIED: 'filters-applied',
  TEAM_CLEAR_ALL_FILTERS_APPLIED: 'team-clears-all-filters-applied',
  TEAM_VIEW_FILTER_RESULT_CLICKED: 'team-view-filter-result-clicked',
  TEAM_CLOSE_FILTER_PANEL_CLICKED: 'team-close-filter-panel-clicked',
  TEAMS_SEARCH: 'team-search',
  TEAM_FOCUS_AREA_HELP_CLICKED: 'team-filter-focus-area-help-clicked',
  DIRECTORY_LIST_SORTBY_CHANGED: 'directory-list-sortby-changed',
  TEAMS_VIEW_TYPE_CHANGED: 'team-view-type-changed',
  TEAM_OPEN_FILTER_PANEL_CLICKED: 'team-open-filter-panel-clicked',
  TEAM_CLICKED: 'team-clicked',
  TEAM_PAGINATION_OPTION_CLICKED: 'team-pagination-option-clicked',
  TEAM_EDIT_BY_LEAD: 'team-edit-by-lead',
  TEAM_EDIT_BY_ADMIN: 'team-edit-by-admin',
  TEAM_DETAIL_ABOUT_SHOW_MORE_CLICKED: 'team-detail-about-show-more-clicked',
  TEAM_DETAIL_ABOUT_SHOW_LESS_CLICKED: 'team-detail-show-less-clicked',
  TEAM_DETAIL_SHOW_MORE_TECHNOLOGY_CLICKED: 'team-detail-show-more-technology-clicked',
  TEAM_DETAIL_CONTACT_CLICKED: 'team-detail-contact-clicked',
  TEAM_DETAIL_SEE_ALL_PROJECTS_CLICKED: 'team-detail-projects-see-all-clicked',
  TEAM_DETAIL_PROJECT_CLICKED: 'project-clicked',
  TEAM_DETAIL_SEE_ALL_MEMBERS_CLICKED: 'team-detail-members-see-all-clicked',
  TEAM_DETAIL_MEMBER_CLICKED: 'team-detail-member-clicked',
  TEAM_OFFICEHOURS_CLICKED: 'team-officehours-clicked',
  PROJECT_EDIT_CLICKED: 'project-edit-clicked',
};

export const MEMBER_ANALYTICS_EVENTS = {
  MEMBER_LIST_MEMEBR_CLICKED: 'member-clicked',
  MEMBER_LIST_FILTERS_APPLIED: 'filters-applied',
  MEMBER_ROLE_FILTER_SEARCH_CALLED: 'member-role-filter-search-called',
  MEMBER_ROLE_FILTER_SELECT_ALL: 'member-role-filter-select-all',
  MEMBER_ROLE_FILTER_SEARCH_ERROR: 'member-role-filter-search-error',

  MEMBER_LIST_VIEW_TYPE_CLICKED: 'member-list-view-type-clicked',
  MEMBER_LIST_SEARCH_CLICKED: 'member-list-search-clicked',
  MEMBER_LIST_SORT_CLICKED: 'member-list-sort-clicked',
  MEMBER_LIST_FILTER_TOGGLE_CLICKED: 'member-list-filter-toggle-clicked',
  MEMBER_LIST_FILTER_TAG_SELECTED: 'member-list-filter-tag-selected',
  MEMBER_LIST_FILTER_CLEAR_ALL_CLICKED: 'member-list-filter-clear-all-clicked',
  MEMBER_LIST_VIEW_FILTER_RESULT_CLICKED: 'member-list-view-filter-result-clicked',
  MEMBER_LIST_CLOSE_FILTER_PANEL_CLICKED: 'member-list-close-filter-panel-clicked',

  MEMBER_DETAIL_OFFICEHOURS_CLICKED: 'member-officehours-clicked',
  MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_EDIT: 'member-pr-contributions-edit',
  MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_ADD: 'member-pr-contributions-add',
  MEMBER_DETAIL_GITHUB_PROJECT_VIEW_ALL_CLICKED: 'member-github-project-view-all-clicked',
  MEMBER_DETAIL_GITHUB_PROJECT_ITEM_CLICKED: 'member-github-project-view-item-clicked',

  MEMBER_DETAIL_EDIT_PROFILE_CLICKED: 'member-detail-edit-profile-clicked',
  MEMBER_DETAIL_SOCIAL_LINK_CLICKED: 'member-detail-social-link_clicked',
  MEMBER_DETAIL_LEARN_MORE_BTN_CLICKED: 'member-detail-learn-more-btn-clicked',
  MEMBER_DETAIL_TEAMS_SEE_ALL_CLICKED: 'member-detail-teams-see-all-clicked',
  MEMBER_DETAIL_TEAM_CLICKED: 'memeber-detail-team-clicked',
  MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_SEE_ALL_CLICKED: 'member-detail-project-contributions-see-all-clicked',
  MEMBER_DETAIL_PROJECT_CLICKED: 'member-detail-project-clicked',
  MEMBER_DETAIL_GITHUB_HANDLE_UPDATE_CLICKED: 'member-detail-github-handle-update-clicked',
};

export const IRL_ANALYTICS_EVENTS = {
  IRL_GATHERING_CARD_CLICKED: 'irl_gathering_card_clicked',
  IRL_INVITE_ONLY_RESTRICTION_POPUP_LOGIN_CLICKED: 'irl_invite_only_restriction_popup_login_clicked',

  IRL_DETAILS_NAVBAR_BACK_BTN_CLICKED: 'irl-navbar-back-btn-clicked',
  IRL_DETAILS_RESOURCE_CLICKED: 'irl-resource-clicked',
  IRL_DETAILS_RESOURCES_LOGIN_BTN_CLICKED: 'irl-resources-login-btn-clicked',
  IRL_DETAILS_RESOURCE_POPUP_RESOURCE_LINK_CLICKED: 'irl-banner-resource-popup-resource-link-clicked',
  IRL_DETAILS_RESOURCE_POPUP_LOGIN_CLICKED: 'irl-resource-popup-login-clicked',
  IRL_DETAILS_RESOURCES_SEE_MORE_CLICKED: 'irl-resources-see-more-clicked',
  IRL_DETAILS_INFO_STRIP_JOIN_BTN_CLICKED: 'irl-info-strip-join-btn-clicked',
  IRL_DETAILS_JOIN_EVENT_STRIP_LOGIN_BTN_CLICKED: 'irl-join-event-strip-login-btn-clicked',
  IRL_DETAILS_JOIN_EVENT_STRIP_IAM_GOING_BTN_CLICKED: 'irl-join-event-strip-iam-going-btn-clicked',

  IRL_DETAILS_GUEST_LIST_SEARCH: 'irl-guest-list-search',
  IRL_DETAILS_BANNER_VIEW_SCHEDULE_BTN_CLICKED: 'irl-banner-view-schedule-btn-clicked',
  IRL_DETAILS_GUEST_LIST_LOGIN_BTN_CLICKED: 'irl-guest-list-login-btn-clicked',
  IRL_DETAILS_EDIT_RESPONSE_BTN_CLICKED: 'irl-edit-response-btn-clicked',
  IRL_DETAILS_GUEST_LIST_IAM_GOING_BTN_CLICKED: 'irl-guest-list-iam-going-btn-clicked',

  IRL_DETAILS_GUEST_LIST_TABLE_SORT_CLICKED: 'irl-guest-list-table-sort-clicked',
  IRL_DETAILS_GUEST_LIST_TABLE_FILTER_BTN_CLICKED: 'irl-guest-list-table-filter-btn-clicked',
  IRL_DETAILS_GUEST_LIST_TABLE_FILTER_APPLY_BTN_CLICKED: 'irl-guest-list-table-filter-apply-btn-clicked',
  IRL_DETAILS_GUEST_LIST_TABLE_LOGIN_BTN_CLICKED: 'irl-guest-list-table-login-btn-clicked',
  IRL_DETAILS_GUEST_LIST_TABLE_TEAM_CLICKED: 'irl-guest-list-table-team-clicked',
  IRL_DETAILS_GUEST_LIST_TABLE_MEMBER_CLICKED: 'irl-guest-list-table-member-clicked',
  IRL_DETAILS_GUEST_LIST_TABLE_TELEGRAM_LINK_CLICKED: 'irl-guest-list-table-telegram-link-clicked',
  IRL_DETAILS_GUEST_LIST_TABLE_OFFICE_HOURS_LINK_CLICKED: 'irl-guest-list-table-office-hours-link-clicked',
  IRL_DETAILS_GUEST_LIST_TABLE_ADD_OFFICE_HOURS_CLICKED: 'irl-guest-list-table-add-office-hours-clicked',

  IRL_RSVP_POPUP_SAVE_BTN_CLICKED: 'irl-rsvp-popup-save-btn-clicked',
  IRL_RSVP_POPUP_UPDATE_BTN_CLICKED: 'irl-rsvp-popup-update-btn-clicked',
  IRL_RSVP_POPUP_OH_GUIDELINE_URL_CLICKED: 'irl-rsvp-popup-oh-guideline-url-clicked',
  IRL_RSVP_POPUP_PRIVACY_SETTING_LINK_CLICKED: 'irl-rsvp-popup-privacy-setting-link-clicked',
};

export const PAGE_ROUTES = {
  MEMBERS: '/members',
  TEAMS: '/teams',
  SETTINGS: '/settings',
  PROJECTS: '/projects',
  IRL: '/irl',
};

export const SORT_OPTIONS = {
  ASCENDING: 'Name,asc',
  DESCENDING: 'Name,desc',
};

export const TECHNOLOGIES = ['Filecoin', 'IPFS', 'libp2p', 'IPLD', 'drand', 'FVM', 'SourceCred'];

export const URL_QUERY_VALUE_SEPARATOR = '|';

export const PRIVATE_FILTERS = ['region', 'country', 'metroArea'];

export const VIEW_TYPE_OPTIONS = {
  GRID: 'Grid View',
  LIST: 'List View',
};

export const SORT_ICONS = [
  {
    name: 'Name,asc',
    label: 'Ascending',
    selectedIcon: '/icons/ascending-selected.svg',
    deselectIcon: '/icons/ascending-black.svg',
  },
  {
    name: 'Name,desc',
    label: 'Descending',
    selectedIcon: '/icons/descending-selected.svg',
    deselectIcon: '/icons/descending-black.svg',
  },
];

export const FOCUS_AREAS_FILTER_KEYS = {
  projects: 'projectAncestorFocusAreas',
  teams: 'teamAncestorFocusAreas',
};

export const ITEMS_PER_PAGE = 300;

export const ENROLLMENT_TYPE = {
  MEMBER: 'MEMBER',
  TEAM: 'TEAM',
};

export const ADMIN_ROLE = 'DIRECTORYADMIN';

export const AIRTABLE_REGEX = /^rec[A-Za-z0-9]{14}/;
export const LINKEDIN_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile|company)\/([a-zA-Z0-9-_]+)/;
export const TWITTER_URL_REGEX = /twitter\.com\/([^/]+)/;
export const GITHUB_URL_REGEX = /github\.com\/([^/]+)/;
export const TELEGRAM_URL_REGEX = /t\.me\/([^/]+)/;
export const EMAIL_REGEX = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/;

export const LEARN_MORE_URL = 'https://protosphere.plnetwork.io/posts/Office-Hours-Guidelines-and-Tips-clsdgrbkk000ypocoqsceyfaq';

const DEFAULT_PRIVACY_VISIBILITY = true;

export const PRIVACY_CONSTANTS = {
  CONTACT_DETAILS: 'Contact Details',
  SHOW_EMAIL: 'Show Email',
  EMAIL_HELP_TXT: 'Enabling this will display your email to all logged in members ',
  SHOW_GITHUB: 'Show GitHub',
  GH_HELP_TXT: 'Enabling this will display your GitHub handle to all logged in members',
  SHOW_TELEGRAM: 'Show Telegram',
  TELEGRAM_HELP_TXT: 'Enabling this will display your Telegram handle to all logged in members',
  SHOW_LIN_PFL: 'Show LinkedIn Profile',
  LIN_HELP_TXT: 'Enabling this will display your LinkedIn Profile link to all logged in members',
  SHOW_DISCORD: 'Show Discord',
  DISCORD_HLP_TXT: 'Enabling this will display your Discord handle link to all logged in members',
  OPEN_TO_COLLABORATE: 'Open to collborate',
  OTC_HELP_TXT: 'Enabling this will let the members know your collaboration logged in status',
  SHOW_TWITTER: 'Show Twitter',
  TWITTER_HELP_TXT: 'Enabling this will display your Twitter Handle to all logged in members ',
  SHOW_GH_PJCTS: 'Show my GitHub Projects',
  GH_PJCTS_HELP_TXT: 'Control visibility of your GitHub projects',
  PROFILE: 'Profile',
  DEFAULT_SETTINGS: {
    showEmail: DEFAULT_PRIVACY_VISIBILITY,
    showGithubHandle: DEFAULT_PRIVACY_VISIBILITY,
    showTelegram: DEFAULT_PRIVACY_VISIBILITY,
    showLinkedin: DEFAULT_PRIVACY_VISIBILITY,
    showDiscord: DEFAULT_PRIVACY_VISIBILITY,
    showGithubProjects: DEFAULT_PRIVACY_VISIBILITY,
    showTwitter: DEFAULT_PRIVACY_VISIBILITY,
  },
};

export const ROLE_FILTER_QUERY_NAME = 'memberRoles';
export const OFFICE_HOURS_MSG = 'Schedule a one on one office hours discussion with';
export const TEAM_OFFICE_HOURS_MSG = 'Join office hours discussion with';

export const PROJECT_FORM_STEPS = ['General', 'Contributors', 'KPIs', 'More Details'];

export const INVITE_ONLY_RESTRICTION_ERRORS = {
  NOT_LOGGED_IN: 'not_logged_in',
  UNAUTHORIZED: 'unauthorized',
};

export const EVENT_TYPE = {
  INVITE_ONLY: 'INVITE_ONLY',
};

export const OH_GUIDELINE_URL ='';