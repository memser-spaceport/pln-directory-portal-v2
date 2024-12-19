export const NAV_OPTIONS = [
  {
    name: 'Home',
    url: '/',
    selectedLogo: '/icons/home.svg',
    unSelectedLogo: '/icons/home-deselected.svg',
  },
  {
    name: 'Teams',
    url: '/teams',
    selectedLogo: '/icons/teams--selected.svg',
    unSelectedLogo: '/icons/team.svg',
  },
  {
    name: 'People',
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
  OPEN_REMOVE_GUESTS_POPUP: 'open-remove-guests-popup',
  OPEN_FLOATING_BAR: 'open-floating-bar',
  GET_NOTIFICATIONS: 'get-notifications',
  TRIGGER_RATING_POPUP: 'trigger-notification-popup',
  OPEN_MEMBER_BIO_POPUP: 'open-member-bio-popup',
  UPDATE_TELEGRAM_HANDLE: 'update-telegram-handle',
  UPDATE_OFFICE_HOURS: 'update-office-hours',
  OPEN_IAM_GOING_POPUP: 'open-iam-going-popup',
};

export const HELPER_MENU_OPTIONS = [
  {
    icon: '/icons/submitteam.svg',
    name: 'Submit a Team',
    type: 'button',
    isExternal: false,
  },
  {
    icon: '/icons/message.svg',
    name: 'ProtoSphere',
    type: '_blank',
    url: process.env.PROTOSPHERE_URL,
    isExternal: true,
  },
  {
    icon: '/icons/question-circle-grey.svg',
    name: 'Get Support',
    type: '_blank',
    url: process.env.GET_SUPPORT_URL,
    isExternal: true,
  },
  {
    icon: '/icons/changelog.svg',
    name: 'Changelog',
    url: '/changelog',
    type: '',
    isExternal: false,
  }
];

export const JOIN_NETWORK_MENUS = [
  { name: 'As a People', key: 'member', logo: '/icons/join-member.svg' },
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
  GO_TO_TOP_BTN_CLICKED: 'go-to-top-btn-clicked',
  NAVBAR_NOTIFICATION_MENU_CLICKED: 'navbar-notification-menu-clicked',
  NAVBAR_APP_LOGO_CLICKED: 'navbar_app_logo_clicked',
  SUBMIT_A_TEAM_BTN_CLICKED: 'submit_a_team_btn_clicked',
};

export const NOTIFICATION_ANALYTICS_EVENTS = {
  NOTIFICATION_ITEM_CLICKED: 'notification-item-clicked',
  NOTIFICATION_SELL_ALL_NOTIFICATIONS_CLICKED: 'notification-see-all-notifications-clicked',
  OFFICE_HOURS_FEEDBACK_SUBMITTED: 'office-hours-feedback-submitted',
  OFFICE_HOURS_FEEDBACK_SUCCESS: 'office-hours-feedback-success',
  OFFICE_HOURS_FEEDBACK_FAILED: 'office-hours-feedback-failed',
};

export const SETTINGS_ANALYTICS_EVENTS = {
  SETTINGS_SIDE_MENU_CLICK: 'settings-side-menu-click',
  SETTINGS_MANAGE_TEAMS_TEAM_CHANGE: 'settings-manage-teams-team-change',
  SETTINGS_MANAGE_TEAMS_SAVE: 'settings-manage-teams-save',
  SETTINGS_MANAGE_MEMBERS_MEMBER_CHANGE: 'settings-manage-members-member-change',
  SETTINGS_MANAGE_MEMBERS_SAVE: 'settings-manage-members-save',
  SETTINGS_MEMBER_PROFILE_SAVE: 'settings-member-profile-save',
  SETTINGS_USER_PREFERENCES: 'settings-user-preferences',
  SETTINGS_USER_PREFERENCES_RESET: 'settings-user-reset',
  SETTINGS_MEMBER_EMAIL_ADMIN_EDIT_CLICK: 'settings-member-change-email-clicked',
  SETTINGS_MEMBER_EMAIL_ADMIN_EDIT_CANCEL: 'settings-member-change-email-cancelled',
  SETTINGS_MEMBER_EMAIL_ADMIN_EDIT_SUCCESS: 'settings-member-change-email-success',
  SETTINGS_USER_PROFILE_EDIT_FORM: 'settings-user-profile-edit-form',
  SETTINGS_MEMBER_PROFILE_EDIT_FORM: 'settings-member-profile-edit-form',
  SETTINGS_TEAM_PROFILE_EDIT_FORM: 'settings-team-profile-edit-form',

  PR_CONRTIBUTIONS_LIST_ITEM_ADD: 'pr-contributions-list-item-add',
  PR_CONRTIBUTIONS_LIST_ITEM_DELETE: 'pr-contributions-list-item-delete',
  PR_CONRTIBUTIONS_LIST_ITEM_ADDPROJECT: 'pr-contributions-list-item-addproject',
};

export const JOIN_NETWORK_ANALYTICS_EVENTS = {
  MEMBER_JOIN_NETWORK_NEXT_CLICK: 'member-join-network-form-steps',
  MEMBER_JOIN_NETWORK_BACK_CLICK: 'member-join-network-back-click',
  MEMBER_JOIN_NETWORK_SAVE: 'member-join-network-save',
  TEAM_JOIN_NETWORK_NEXT_CLICK: 'team-join-network-form-steps',
  TEAM_JOIN_NETWORK_BACK_CLICK: 'team-join-network-back-click',
  TEAM_JOIN_NETWORK_SAVE: 'member-join-network-save',
};

export const SIGN_UP_ANALYTICS_EVENTS = {
  SIGN_UP_FORM_SUBMIT: 'sign-up-form-submit',
  SIGN_UP_FORM_CANCEL: 'sign-up-form-cancel',
  SIGN_UP_POLICY_URL_CLICK: 'sign-up-policy-url-click',
  SIGN_UP_HOME_CLICK_AFTER_SUCCESS: 'sign-up-home-click-after-success',
};

export const PROJECT_ANALYTICS_EVENTS = {
  PROJECT_DETAIL_DELETE_SUCCESS: 'project-detail-delete-success',
  PROJECT_DETAIL_DELETE_FAILED: 'project-detail-delete-failed',
  PROJECT_DETAIL_DELETE_BTN_CLICKED: 'project-detail-delete-clicked',
  PROJECT_DETAIL_DELETE_CANCEL_BTN_CLICKED: 'project-detail-delete-clicked-canceled',
  PROJECT_DETAIL_DELETE_CONFIRM_CLICKED: 'project-detail-delete-clicked-confirmed',
  PROJECT_DETAIL_EDIT_CLICKED: 'project-detail-edit-clicked',
  PROJECT_DETAIL_LINKS_CLICKED: 'project-detail-link-clicked',
  PROJECT_EDIT_CLICKED: 'project-edit-clicked',
  PROJECT_EDIT_CANCEL: 'project-edit-cancel-clicked',
  PROJECT_ADD_CANCEL: 'project-add-cancel-clicked',
  PROJECT_ADD_SAVE_CLICKED: 'project-add-save-clicked',
  PROJECT_EDIT_SAVE_CLICKED: 'project-edit-save-clicked',
  PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_CANCELLED: 'project-detail-additional-detail-edit-cancelled',
  PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE: 'project-detail-additional-detail-edit-save-clicked',
  PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE_SUCCESS: 'project-detail-additional-detail-edit-save-success',
  PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE_FAILED: 'project-detail-additional-detail-edit-save-failed',
  PROJECT_DETAIL_MAINTAINER_TEAM_CLICKED: 'project-detail-maintainer-team-clicked',
  PROJECT_DETAIL_CONTRIBUTING_TEAM_CLICKED: 'project-detail-contributing-team-clicked',
  PROJECT_DETAIL_SEEALL_CLICKED: 'project-detail-teams-seeall-clicked',
  PROJECT_DETAIL_SEE_ALL_CONTRIBUTORS_CLICKED: 'project-detail-see-all-contributors-clicked',
  PROJECT_DETAIL_CONTRIBUTOR_PROFILE_CLICKED: 'project-detail-contributor-profile-clicked',
  PROJECT_DETAIL_DESC_SHOW_MORE_CLICKED: 'project-detail-desc-show-more-clicked',
  PROJECT_DETAIL_DESC_SHOW_LESS_CLICKED: 'project-detail-desc-show-less-clicked',
  PROJECT_DETAIL_DESC_CANCEL_CLICKED: 'project-detail-desc-cancel-clicked',
  PROJECT_DETAIL_DESC_EDIT_CLICKED: 'project-detail-desc-edit-clicked',
  PROJECT_DETAIL_DESC_EDIT_SAVE_CLICKED:  'project-detail-desc-edit-save-clicked',
  PROJECT_DETAIL_DESC_EDIT_SAVE: 'project-detail-desc-edit-save',

  PROJECT_LIST_FILTERS_APPLIED: 'projects-filters-applied',
  PROJECT_LIST_FILTERS_CLEARED: 'projects-filters-cleared',
  PROJECT_LIST_PROJECT_CLICKED: 'project-clicked',
  PROJECT_ADD_CLICKED: 'project-add-click',
  PROJECT_LIST_SEARCH_APPLIED: 'projects-search',
  PROJECT_LIST_VIEW_TYPE_CLCIKED: 'project-list-view-type_clciked',
  PROJECT_LIST_SORT_CLICKED: 'project-list-sort-clicked',
  PROJECT_FILTER_PANEL_CLOSE_CLICKED: 'project-filter-panel-close-clicked',
  PROJECT_VIEW_FILTER_RESULT_CLICKED: 'project-view-filter-result-clicked',
  PROJECT_ADD_INITIATED: 'project-add-initiated',
  PROJECT_ADD_SUCCESS: 'project-add-save-success',
  PROJECT_ADD_FAILED: 'project-add-save-fail',
  PROJECT_EDIT_INITIATED: 'project-edit-initiated',
  PROJECT_EDIT_SUCCESS: 'project-edit-save-success',
  PROJECT_EDIT_FAILED: 'project-edit-save-failed',
};

export const TOAST_MESSAGES = {
  LOGOUT_MSG: 'You have been logged out successfully',
  LOGIN_MSG: 'Successfully Logged In',
  LOGGED_IN_MSG: 'You are already logged in',
  SOMETHING_WENT_WRONG: 'Something went wrong',
  DETAILS_ADDED_SUCCESSFULLY: 'Your details has been added successfully',
  ATTENDEE_ADDED_SUCCESSFULLY: 'Attendee added successfully',
  DETAILS_UPDATED_SUCCESSFULLY: 'Your details has been updated successfully',
  ATTENDEE_UPDATED_SUCCESSFULLY: 'Attendee updated successfully',
  ATTENDEE_DELETED_SUCCESSFULLY: 'Attendee deleted successfully',
  FEEDBACK__SUCCESS: 'We will follow up for feedback soon',
  FEEDBACK_INITIATED_SUCCESS: 'Great! Enjoy your conversation',
  FEEDBACK_THANK: 'Thank you for the feedback!',
  INTERACTION_RESTRICTED: 'Action restricted: Try scheduling after some time',
  FEEDBACK__ALREADY__RECORDED: 'Thanks, we have already recorded your feedback',
  SELF_INTERACTION_FORBIDDEN: 'Scheduling office hours with yourself is not allowed',
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
  SETTINGS_USER_CHANGE_EMAIL_CLICKED: 'AUTH_SETTINGS_EMAIL_UPDATE_CLICKED',
  AUTH_SETTINGS_EMAIL_UPDATE_SUCCESS: 'AUTH_SETTINGS_EMAIL_UPDATE_SUCCESS',
  AUTH_SETTINGS_EMAIL_UPDATE_FAILED: 'AUTH_SETTINGS_EMAIL_UPDATE_FAILED',
  AUTH_SETTINGS_EMAIL_UPDATE_SAME_AS_OLD: 'AUTH_SETTINGS_EMAIL_UPDATE_SAME_AS_OLD',
  AUTH_SIGN_UP_BTN_CLICKED: 'AUTH_SIGN_UP_BTN_CLICKED',
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
  TEAM_DETAIL_ABOUT_EDIT_CLICKED: 'team-detail-edit-clicked',
  TEAM_DETAIL_ABOUT_EDIT_CANCEL_CLICKED: 'team-detail-about-edit-cancel-clicked',
  TEAM_DETAIL_ABOUT_EDIT_SAVE_CLICKED: 'team-detail-about-edit-save-clicked',
  TEAM_DETAIL_SHOW_MORE_TECHNOLOGY_CLICKED: 'team-detail-show-more-technology-clicked',
  TEAM_DETAIL_CONTACT_CLICKED: 'team-detail-contact-clicked',
  TEAM_DETAIL_SEE_ALL_PROJECTS_CLICKED: 'team-detail-projects-see-all-clicked',
  TEAM_DETAIL_PROJECT_CLICKED: 'project-clicked',
  TEAM_DETAIL_SEE_ALL_MEMBERS_CLICKED: 'team-detail-members-see-all-clicked',
  TEAM_DETAIL_ADD_PROJECT_CLICKED: 'team-detail-add-project-clicked',
  TEAM_DETAIL_MEMBER_CLICKED: 'team-detail-member-clicked',
  TEAM_OFFICEHOURS_CLICKED: 'team-officehours-clicked',
  PROJECT_EDIT_CLICKED: 'project-edit-clicked',
  TEAM_OFFICEHOURS_LOGIN_BTN_CLICKED: 'team-officehours-login-btn-clicked',
  TEAM_DETAIL_ABOUT_SAVE: 'team-detail-about-save',
  ON_CLICK_SEE_MORE_BUTTON_IRL_CONTRIBUTIONS: 'on_click_see_more_button_irl_contributions',
  TEAM_DETAILS_ON_CLICK_IRL_CONTRIBUTIONS: 'team-details-on-click-irl-contributions',
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
  MEMBER_DETAIL_EDIT_BY_SELF: 'member-edit-by-self',
  MEMBER_DETAIL_EDIT_BY_ADMIN: 'member-edit-by-admin',

  MEMBER_DETAIL_EDIT_PROFILE_CLICKED: 'member-detail-edit-profile-clicked',
  MEMBER_DETAIL_SOCIAL_LINK_CLICKED: 'member-detail-social-link_clicked',
  MEMBER_DETAIL_LEARN_MORE_BTN_CLICKED: 'member-detail-learn-more-btn-clicked',
  MEMBER_DETAIL_TEAMS_SEE_ALL_CLICKED: 'member-detail-teams-see-all-clicked',
  MEMBER_DETAIL_TEAM_CLICKED: 'memeber-detail-team-clicked',
  MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_SEE_ALL_CLICKED: 'member-detail-project-contributions-see-all-clicked',
  MEMBER_DETAIL_PROJECT_CLICKED: 'member-detail-project-clicked',
  MEMBER_DETAIL_GITHUB_HANDLE_UPDATE_CLICKED: 'member-detail-github-handle-update-clicked',
  MEMBER_DETAIL_BIO_READ_MORE_CLICKED: 'member-detail-bio-read-more-clicked',
  MEMBER_DETAIL_BIO_READ_LESS_CLICKED: 'member-detail-bio-read-less-clicked',
  MEMBER_DETAIL_BIO_EDIT_CLICKED: 'member-detail-bio-edit-clicked',
  MEMBER_DETAIL_BIO_EDIT_CANCEL_CLICKED: 'member-detail-bio-edit-cancel-clicked',
  MEMBER_DETAIL_BIO_EDIT_SAVE_CLICKED: 'member-detail-bio-edit-save-clicked',
  MEMBER_DETAIL_BIO_EDIT_RECORD_SAVE: 'member-detail-bio-edit-record-save',
  ON_CLICK_SEE_MORE_BUTTON_IRL_CONTRIBUTIONS: 'on_click_see_more_button_irl_contributions',
  MEMBER_DETAILS_ON_CLICK_IRL_CONTRIBUTIONS: 'member-details-on-click-irl-contributions',
};

export const IRL_ANALYTICS_EVENTS = {
  
};

export const HOME_ANALYTICS_EVENTS = {
  FOCUS_AREA_TEAMS_CLICKED: 'focus-teams-clicked',
  FOCUS_AREA_PROJECT_CLICKED: 'focus-project-clicked',
  FOCUS_AREA_PROTOCOL_LABS_VISION_URL_CLICKED: 'focus-area-protocol-labs-vision-url-clicked',

  FEATURED_SUBMIT_REQUEST_CLICKED: 'featured-submit-request-clicked',
  FEATUTRED_MEMBER_CARD_CLICKED: 'featured-member-card-clicked',
  FEATUTRED_TEAM_CARD_CLICKED: 'featured-team-card-clicked',
  FEATURED_IRL_CARD_CLICKED: 'featured-irl-card-clicked',
  FEATURED_PROJECT_CARD_CLICKED: 'featured-project-card-clicked',
  FEATURED_MEMBER_BIO_SEE_MORE_CLICKED: 'featured-member-bio-see-more-clicked',
  FEATURED_MEMBER_BIO_POPUP_VIEW_PROFILE_BTN_CLICKED: 'featured-member-bio-popup-view-profile-btn-clicked',

  DISCOVER_CAROUSEL_ACTIONS_CLICKED: 'discover-carousel-actions-clicked',
  DISCOVER_CARD_CLICKED: 'discover-card-clicked',
  DISCOVER_HUSKY_AI_CLICKED: 'discover-husky-ai-clicked',
};

export const HOME = {
  TRIGGER_FOCUS_AREA_DIALOG: 'trigger-focus-area-dialog',
};

export const PAGE_ROUTES = {
  HOME: '/',
  MEMBERS: '/members',
  TEAMS: '/teams',
  SETTINGS: '/settings',
  PROJECTS: '/projects',
  IRL: '/irl',
  NOTIFICATIONS: '/notifications',
  ADD_TEAM: '/teams/add',
  SIGNUP: '/sign-up'
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

export const ITEMS_PER_PAGE = 25;

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
  EMAIL_HELP_TXT: 'Enabling this will display your email to all logged in people ',
  SHOW_GITHUB: 'Show GitHub',
  GH_HELP_TXT: 'Enabling this will display your GitHub handle to all logged in people',
  SHOW_TELEGRAM: 'Show Telegram',
  TELEGRAM_HELP_TXT: 'Enabling this will display your Telegram handle to all logged in people',
  SHOW_LIN_PFL: 'Show LinkedIn Profile',
  LIN_HELP_TXT: 'Enabling this will display your LinkedIn Profile link to all logged in people',
  SHOW_DISCORD: 'Show Discord',
  DISCORD_HLP_TXT: 'Enabling this will display your Discord handle link to all logged in people',
  OPEN_TO_COLLABORATE: 'Open to collborate',
  OTC_HELP_TXT: 'Enabling this will let the people know your collaboration logged in status',
  SHOW_TWITTER: 'Show Twitter',
  TWITTER_HELP_TXT: 'Enabling this will display your Twitter Handle to all logged in people ',
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

export const EVENT_TYPE = {
  INVITE_ONLY: 'INVITE_ONLY',
  PUBLIC: 'PUBLIC',
};

export const OH_GUIDELINE_URL = 'https://protosphere.plnetwork.io/posts/Office-Hours-Guidelines-and-Tips-clsdgrbkk000ypocoqsceyfaq';

export const ChangeLogList = [
  {
    title: 'Version 4.1.0 - Enhanced IRL Gatherings Experience!',
    tag: 'Improvements',
    releaseType: { name: 'Major Release', icon: '/icons/star-orange.svg' },
    date: '17, Oct 2024',
    shortContent: `
    <div style="font-size: 14px; line-height:23px;">
    <p>We are excited to announce a complete overhaul of our IRL Gatherings platform! This revamp brings several key updates designed to make discovering, attending, and engaging with events and their organizers easier.</p>
    <br/>
    <p>This new layout is designed to be intuitive, ensuring you can quickly find the events that matter most to you based on your location. Whether you’re searching for upcoming events or reflecting on past ones, you will be able to move through the platform with ease.</p>
    <br/>
    <p>Here’s what’s new:</p>
    <br/>
    <p><b>Location-Centric Event Grouping</b>: In this new version, all events are now grouped by their respective locations, making it simpler to explore gatherings happening in your area. You can now view a comprehensive list of events happening at any given location, with an easy-to-use interface that allows you to toggle between upcoming and past events. Whether you are looking forward to the next big gathering or want to revisit an event that took place earlier, all the details are at your fingertips.</p>
    <br/>
    <p><b>Comprehensive Event Insights</b>: Each event listing now comes with expanded details, including information on the speakers and hosts for specific events. This gives you a better understanding of who will be leading the event, offering insights into their expertise and the topics they will cover. With this update, you will know exactly who’s shaping the conversation and experience, allowing you to make more informed decisions about which gatherings to attend.</p>
    <br/>
    <p>This revamp transforms the way you explore and engage with IRL gatherings, helping you stay connected with the right events and the right people.</p>
    <br/>
    <p> Dive in today and make the most out of your experience with our network!</p>
    </div>`,
  },
  {
    title: 'Version 4.0.0 -  Introducing the All New Home Page',
    tag: 'New Feature',
    releaseType: { name: 'Major Release', icon: '/icons/star-orange.svg' },
    date: '27, Sep 2024',
    shortContent: `
    <div style="font-size: 14px; line-height:23px;">
    <p style="font-size:16px"><b>New Home Page is LIVE! 🎉</b></p>
    <br/>
    <p>We are thrilled to unveil our brand-new Home Page, your gateway to smarter network discovery - Powered by Husky, our homegrown LLM. This update is designed to make your exploration of the network more dynamic, personalized, and engaging.</p>
    <br/>
    <p style="font-size:16px; padding-bottom:12px"><b>What's New ?</b></p>
    <p>With three dynamic sections -  Focus Areas, Discover, and Featured, you will now have everything you need to stay connected, engaged, and ahead of the curve.</p>
    <br/>
    <ul style="padding-left:32px; margin-bottom:15px; font-size: 14px; line-height:23px; list-style: disc;">

    <li>
    <p style="padding-bottom:8px"><b>Focus Areas:</b></p>
    <p>This section highglights Teams and Projects on the Directory, classified across 4 major focus areas - Digital Human Rights, Public Goods, Advanced Technologies, and Innovation Network, helping you stay laser-focused on the areas that drive success.
    </p>
    </li>
    </br>
    <li>
     <p  style="padding-bottom:8px"><b>Discover Section:</b></p>
    <p style="padding-bottom:8px">This section offers a curated feed of all the latest network happenings. Whether it’s breaking news, upcoming events, or project updates-with Husky, you can always go beyond the surface and explore more about -
    </p>
    <p style="padding-bottom:8px"><b>Teams:</b> Get insights into the teams that are driving innovation in the network. Explore their roles, contributions, and impact on various projects.</p>
    <p style="padding-bottom:8px"><b>Projects:</b> Get insights into cutting-edge projects across the network. Track their progress, understand their goals, and find opportunities to contribute.</p>
    <p><b>IRL Events:</b> Explore various events and whether it’s key takeaways, event highlights, or notable discussions, you’ll get the scoop on everything that went down so you can stay up to speed, even if you weren’t there.</p>
    </li>
    </br>
    <li>
    <p  style="padding-bottom:8px"><b>Featured Section:</b></p>
    <p>
    This section spotlights on the biggest movers and shakers in the network. Whether it's groundbreaking projects, high-impact teams, influential people, or exciting events, this section highlights the most impactful activities across the network.
    </p>
    </li>
    </ul>
    </div>`,
  },
  {
    title: 'Version 3.0.1 - Office Hours Feedback',
    tag: 'New Feature',
    date: '13, Aug 2024',
    shortContent: `
    <div style="font-size: 14px; line-height:23px;">
    <p>Exciting news!</p>
    <br/>
    <p>You can now provide feedback for every Office Hour you book by sharing your experiences, suggestions, and insights, helping us improve the network collaboration.</p>
    <p style="margin-top: 20px"> However, don't worry if you missed providing your feedback. All your missed notifications will be available on your Notifications Page, so you can catch up at your convenience by accessing the page using the bell icon on the top navigation bar.</p>
    </div>`,
  },

  {
    title: 'Version 3.0.0 - Enhancements',
    tag: 'Improvements',
    releaseType: { name: 'Major Release', icon: '/icons/star-orange.svg' },
    date: '19, Jul 2024',
    shortContent: `<ul style="padding-left:32px; margin-bottom:15px; font-size: 14px; line-height:23px; list-style: disc;">
    <li>Introducing improved mobile responsiveness and layout adaptability across all devices.</li>
    <li>We have made a few improvements to the user interface for a more intuitive and visually appealing experience</li>
      <ul style="padding-left:32px; list-style: lower-alpha !important; margin-bottom:15px; font-size: 14px; line-height:23px; list-style: disc;">
        <li>Revamp of UI/UX Design for Account Settings and Registration.</li>
        <li>Cards displayed per row in the list layout is now dynamic and arranged based on the device's width.</li>
      </ul>
    </ul>`,
  },

  {
    title: 'Version 2.1.3 - Enhancements',
    tag: 'Improvements',
    date: '12, Jul 2024',
    shortContent: `<p style="font-size: 14px; line-height:24px;">
    Users can now find the Focus Area details on the Teams and Projects detail pages.
    </p>`,
  },
  {
    title: 'Version 2.1.2 - Enhancements',
    tag: 'Improvements',
    date: '05, Jul 2024',
    shortContent: `<p style="font-size: 14px; line-height:23px;">
    <span style="font-size: 14px; line-height:23px;">Feel free to connect with your fellow attendees at the events by</span><br/>
    <ul style="padding-left:32px; margin-bottom:15px; font-size: 14px; line-height:23px; list-style: disc;">
    <li>Scheduling Office Hours</li>
    <li>Connecting via Telegram</li>
    </ul>
    <span style="font-size: 14px; line-height:23px;">Additionally, your Telegram Handles will be automatically displayed at the IRL events you attend, per the related Privacy Settings.</span>
    </p>`,
  },
  {
    title: 'Version 2.1.1 - Enhancements',
    tag: 'Improvements',
    date: '14, Jun 2024',
    shortContent: `<p style="font-size: 14px; line-height:23px;">
    We are excited to introduce office hours for teams. With this option, you can now schedule office hours with other teams to drop in, ask questions, discuss projects, or seek guidance.
    </p>`,
  },
  {
    title: 'Version 2.1.0 - Enhancements',
    tag: 'Improvements',
    date: '31, May 2024',
    shortContent: `<p style="font-size: 14px; line-height:23px;">
      <span style="font-size: 14px;line-height:23px; font-weight: 600">IRL Gatherings - Enhanced Detail Page View</span><br/>
      <ul style="padding-left:32px; font-size:14px; line-height:23px; list-style: disc;">
      <li>A dedicated "Resources" section now lists all important URLs.</li>
      <li>The "Attendees" section features UI improvements and allows searching by name, team, or project.</li>
      <li>Attendees can now tag topics of interest and filter others using these tags.</li>
      </ul>
      <br/>
      <span style="font-size: 14px;line-height:23px; font-weight: 600">Updated Authentication Service (for both the Directory & ProtoSphere)</span>
      <br/>
      <p style="padding-left: 16px; font-size:14px; line-height:23px;">We have updated our Authentication Service. Please verify and link your directory membership email to a login method of your choice. If you can't remember your membership email, <a style="text-decoration:underline; color:#156ff7" href="https://www.plnetwork.io/contact?showModal=getSupport" target="_blank"> contact us here</a> for assistance.</p>
      </p>`,
  },
  {
    title: 'Version 2.0.8 - Introducing Landing Page for IRL Gatherings',
    tag: 'Improvements',
    date: '10, May 2024',
    shortContent: `<p style="font-size: 14px; line-height:23px;">
    We're excited to unveil our new landing page dedicated to IRL Gatherings! Our new landing page serves as a one-stop destination for all upcoming IRL gatherings hosted within our network. Network people can easily navigate through a curated list of events, each accompanied by detailed information and RSVP options.
    </p>`,
  },
  {
    title: 'Version 2.0.7 - Enhancements to Project module & People Search',
    tag: 'Improvements',
    date: '30, Apr 2024',
    shortContent: `<div>
      <ul style="list-style: disc; font-size: 14px; line-height:23px; padding-left:20px;">
      <li>We have added a new filter in Project's page to search projects based on the focus areas that they contribute to.</li>
      <ul style="padding-left: 16px; font-size: 14px; line-height:23px;">Projects are categorized into one of these categories-
      <ul style="list-style: lower-alpha; padding:revert; font-size: 14px; line-height:23px">
      <li>Digital Human Rights: Building a foundation of freedom and safety in the digital age.</li>
      <li>Public Goods: Creating more efficient and equitable structures for global progress.</li>
      <li>Advanced Technologies: Ensuring responsible advancement in AI, AR, VR, BCI, and other emerging fields.</li>
      <li>Innovation Network: Projects that facilitate collaboration, offer technical and financial support to drive research and development.</li>
      </ul>
      </ul>
      <li>We can add a people as a contributor in Project module and the contribution details would get reflected automatically in the related people details page.</li>
      <li>In addition to the current capability of searching people by people name & team name, this enhancement will allow the people to be searched using a project name as well. Every people associated with the project as a contributor would be returned in the search result.</li>
      </ul></div>`,
  },
  {
    title: 'Version 2.0.6 - Enhanced Edit feature for Teams',
    tag: 'Improvements',
    date: '19, Apr 2024',
    shortContent: `<p style="font-size: 14px; line-height:23px;">
    Team leads can use this update to make changes to the Focus and Sub focus areas within their teams. Additionally, a quick access feature to submit a support request from the directory has been enabled.
    </p>`,
  },
  {
    title: 'Version 2.0.5 - Enhanced search on People roles',
    tag: 'Improvements',
    date: '17, Apr 2024',
    shortContent: `<div>
      <ul style="list-style: disc; font-size: 14px; line-height:23px;">
      This release is an further improvement on the filters based on people roles which was released as <a style="text-decoration:underline; color:#156ff7" href='#version-2.0.1'>Version 2.0.1</a> on 22, Mar 2024. This feature update enables users to type and search roles they are looking for into the Role filter's search bar.
      </ul></div>`,
  },
  {
    title: 'Version 2.0.4 - IRL Gatherings',
    tag: 'New Feature',
    releaseType: { name: 'Beta', icon: '/icons/dot-purple.svg' },
    date: '12, Apr 2024',
    isBeta: true,
    shortContent: `<div>
      <ul style="list-style: disc; font-size: 14px;  line-height:23px;">
      Exciting news! We've rolled out a feature (Beta) that brings detailed participation information to our IRL Gatherings. Network people can now view a list of attendees for upcoming conferences and events, empowering them to see who else is attending and facilitating networking opportunities. With this new feature, network people can now connect with like-minded individuals, plan meetups, and maximize their conference experience.
      </ul></div>`,
  },
  {
    title: 'Version 2.0.3 - Improved People Search',
    tag: 'Improvements',
    date: '03, Apr 2024',
    shortContent: `<div>
      <ul style="list-style: disc; font-size: 14px;  line-height:23px;">
      With this update, in addition to the current capability of searching by people name, this enhancement will allow the people to be searched using a team name as well. Every people of the team would be returned in the search result.
      </ul></div>`,
  },
  {
    title: "Version 2.0.2 - Filters based on Teams' Focus areas",
    tag: 'New Feature',
    date: '29, Mar 2024',
    shortContent: `<div>
      <ul style="list-style: disc; font-size: 14px;  line-height:23px; padding-left:20px;">
      <li>Added a new filter in Team's page to search teams based on the focus areas/sub focus areas that they contribute to.</li>
      <li>Teams are categorized into one of these categories-
      <ul style="list-style: lower-alpha; padding:revert; font-size: 14px; line-height:23px">
      <li> Digital Human Rights: Building a foundation of freedom and safety in the digital age.</li>
      <li>Public Goods: Creating more efficient and equitable structures for global progress.</li>
      <li>Advanced Technologies: Ensuring responsible advancement in AI, AR, VR, BCI, and other emerging fields.</li>
      <li>Innovation Network: Teams, people, and projects that facilitate collaboration, offer technical and financial support to drive research and development.</li>
      </ul> 
      </li>
      </ul></div>`,
  },
  {
    title: 'Version 2.0.1 - Filters based on People roles',
    tag: 'New Feature',
    date: '22, Mar 2024 ',
    shortContent: `<div id='version-2.0.1'>
      <ul style="list-style: disc; font-size: 14px; line-height:23px; padding-left:20px;">
      <li>Added a new filter in People's page to search people based on their role.</li>
      <li>Roles that are currently supported in the filter are
      <ul style="list-style: lower-alpha; padding:revert; font-size: 14px;  line-height:23px;">
      <li>Founder/Co-Founder</li>
      <li>CEO</li>
      <li>CTO</li>
      <li>COO</li>
      </ul>
      </li>
      </ul></div>`,
  },
];

export const tagColors = [
  {
    name: 'New Feature',
    color: '#2ABC76',
  },
  {
    name: 'Improvements',
    color: '#35BAE4',
  },
  { name: 'Beta', color: '#C169D7' },
  { name: 'Fixed', color: '#4871D9' },
];

export const SOCIAL_IMAGE_URL = 'https://plabs-assets.s3.us-west-1.amazonaws.com/images/Directory-Portal-Thumbnail-BETA-removed.png';

export const OFFICE_HOURS_STEPS = {
  MEETING_INITIATED: {
    name: 'MEETING_INITIATED',
  },
  MEETING_SCHEDULED: {
    name: 'MEETING_SCHEDULED',
  },
  NOT_HAPPENED: {
    name: 'not-happened',
  },
  MEETING_RESCHEDULED: {
    name: 'MEETING_RESCHEDULED',
  },
};

export const TROUBLES_INFO = {
  didntHappened: {
    name: 'Meeting didn’t happen',
    reasons: [],
  },
  technicalIssues: {
    name: 'Faced Technical Issues',
    reasons: [],
  },
};

export const NOT_SCHEDULED_OPTIONS = ['Link is broken', 'I plan to schedule soon', 'Preferred slot is not available', 'Other'];

export const DIDNTHAPPENEDOPTIONS = [
  {
    name: "Meeting link didn't work",
  },
  {
    name: 'Got rescheduled',
  },
  {
    name: 'Got cancelled',
  },
  {
    name: "People didn't show up",
  },
  {
    name: 'I could not make it',
  },
  { name: 'Call quality issues' },
  {
    name: 'Other',
  },
];

export const TECHNICALISSUESOPTIONS = [{ name: 'Noise or disturbance during the call' }, { name: 'Network issue' }, { name: 'Other' }];

export const NOTIFICATION_TYPES = {
  meetingInitiated: {
    name: 'MEETING_INITIATED',
  },
  meetingScheduled: {
    name: 'MEETING_SCHEDULED',
  },
  meetingRescheduled: {
    name: 'MEETING_RESCHEDULED',
  },
};

export const RATINGS = [
  {
    value: 1,
    backgroundColor: '#FFD9C9',
    disableColor: '#e3e3e3',
  },

  {
    value: 2,
    backgroundColor: '#FFF2C9',
    disableColor: '#f1f1f1',
  },

  {
    value: 3,
    backgroundColor: '#FFF2C9',
    disableColor: '#f1f1f1',
  },

  {
    value: 4,
    backgroundColor: '#C5F9D0',
    disableColor: '#e5e5e5',
  },

  {
    value: 5,
    backgroundColor: '#C5F9D0',
    disableColor: '#e5e5e5',
  },
];

export const FEEDBACK_RESPONSE_TYPES = {
  positive: {
    name: 'POSITIVE',
  },
  negative: {
    name: 'NEGATIVE',
  },
};

export const NOTIFICATION_REFETCH_TIME = 300000;

export const HOME_PAGE_LINKS = {
  FEATURED_REQUEST_URL: 'https://airtable.com/appgb6O7eF6mBEl8t/pagZ15qnE9hcxpuP0/form',
  FOCUSAREA_PROTOCOL_LABS_VISION_URL: 'https://protocol.ai/blog/transcription-pl-vision-driving-a-breakthroughs-in-computing-to-push-humanity-forward/'
};

export const ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS = ['DIRECTORYADMIN'];

export const IAM_GOING_POPUP_MODES = {
  ADD: 'ADD',
  EDIT: 'EDIT',
  ADMINADD: 'ADMINADD',
}

export const PLN_LOCATIONS = [{
  id: 1,
  location: "Kyoto",
  flag: "&#127471;&#127477;",
  icon: "/images/irl/kyoto.svg",
  pastEvents: 7,
  upcomingEvents: 6,
  isActive: true,
}, 
{
  id: 2,
  location: "Mumbai",
  flag: "&#127470;&#127475;",
  icon: "/images/irl/mumbai.svg",
  pastEvents: 4,
  upcomingEvents: 10,
  isActive: false,
}, 
{
  id: 3,
  location: "Australia",
  flag: "&#127462;&#127482;",
  icon: "/images/irl/australia.svg",
  pastEvents: 2,
  upcomingEvents: 4,
  isActive: false,
}, 
{
  id: 4,
  location: "France", 
  flag: "&#127467;&#127479;",
  icon: "/images/irl/france.svg",
  pastEvents: 8,
  upcomingEvents: 2,
  isActive: false,
},
{
  id: 5,
  location: "USA",
  flag: "&#127482;&#127480;",
  icon: "",
  pastEvents: 2,  
  upcomingEvents: 3,
  isActive: false,
},
{
  id: 6,
  location: "Bali",
  flag: "&#127470;&#127465",
  icon: "",
  pastEvents: 1,  
  upcomingEvents: 6,
  isActive: false,
},
{
  id: 7,
  location: "Brazil",
  flag: "&#127463;&#127479;",
  icon: "",
  pastEvents: 3,  
  upcomingEvents: 2,
  isActive: false,
},
{
  id: 8,
  location: "Bangalore",
  flag: "&#127470;&#127475;",
  icon: "",
  pastEvents: 5,  
  upcomingEvents: 7,
  isActive: false,
},
{
  id: 9,
  location: "Canberra",
  flag: "&#127462;&#127482;",
  icon: "",
  pastEvents: 4,  
  upcomingEvents: 3,
  isActive: false,
},
{
  id: 10,
  location: "Bangalore",
  flag: "&#127470;&#127475;",
  icon: "",
  pastEvents: 5,  
  upcomingEvents: 7,
  isActive: false,
},
{
  id: 11,
  location: "Canberra",
  flag: "&#127462;&#127482;",
  icon: "",
  pastEvents: 4,  
  upcomingEvents: 3,
  isActive: false,
}
];

export const IRL_ATTENDEE_FORM_ERRORS = {
  CHECKOUT_DATE_REQUIRED: "Departure date is required",
  CHECKIN_DATE_REQUIRED: "Arrival date is required",
  DATE_DIFFERENCE : "Departure date should be greater than or equal to the Arrival date",
  SELECT_MEMBER: "Please select a people",
  SELECT_GATHERING: "At least one Gathering should be selected",

}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const IRL_SUBMIT_FORM_LINK = "https://eventsmanagement.labweek.io/"

export const LOGIN_BANNER_URL="https://plabs-assets.s3.us-west-1.amazonaws.com/images/login-banner.png"
export const IRL_DEFAULT_TOPICS="AI,Apps,AR/VR,Argentina,Automation,AVS,BCI,Capital Allocation,Collaboration,Compliance,Compute,Cryptography,Culture,Decentralized IP,Decentralized Compute,Decentralized AI,DeFi,DePin,DeSci,Dev Tooling,Distributed Systems,Encryption,Events,Extended Reality,Filecoin,Funding Mechanism,Fundraising,Governance,Growth,GTM,Hackathon,Hard Tech,Human Organization,Human AI-Cooperation,Incentives,InfoSec,Interoperability,IoT,Longevity & Biotech,Marketing,Networks,Neurotech,OpSec,Partnerships,Privacy,Product Market Fit,Products,Public Goods,Real World Crypto,Retrieval,RWA,Scaling,Security,SLA's,Startups,Storage,Sustainability,Tokenomics,UI/UX,Wallet,Web3,ZK Proofs"

export const GROUP_TYPES = {
  TEAM: 'Team',
  PROJECT: 'Project',
}

export const SIGN_UP = {
  POLICY_URL: 'https://protocol.ai/legal/',
  CAPTCHA_URL: 'https://www.google.com/recaptcha/api/siteverify'
}