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
  TEAM_DETAIL_ALL_PROJECTS_CLOSE: "team-detail-all-projects-close",
  TEAM_DETAIL_ALL_MEMBERS_CLOSE: "team-detail-all-members-close"
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
  SESSION_EXPIRED_POPUP_LOGIN_BTN_CLICKED:"session-expired-popup-login-btn-clicked"
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
  AUTH_SETTINGS_EMAIL_UPDATE_SAME_AS_OLD: "AUTH_SETTINGS_EMAIL_UPDATE_SAME_AS_OLD"
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
  TEAM_EDIT_BY_LEAD: "team-edit-by-lead",
  TEAM_EDIT_BY_ADMIN: 'team-edit-by-admin',
  TEAM_DETAIL_ABOUT_SHOW_MORE_CLICKED: 'team-detail-about-show-more-clicked',
  TEAM_DETAIL_ABOUT_SHOW_LESS_CLICKED: 'team-detail-show-less-clicked',
  TEAM_DETAIL_SHOW_MORE_TECHNOLOGY_CLICKED: 'team-detail-show-more-technology-clicked',
  TEAM_DETAIL_CONTACT_CLICKED: 'team-detail-contact-clicked',
  TEAM_DETAIL_SEE_ALL_PROJECTS_CLICKED: 'team-detail-projects-see-all-clicked',
  TEAM_DETAIL_PROJECT_CLICKED: 'project-clicked',
  TEAM_DETAIL_SEE_ALL_MEMBERS_CLICKED: 'team-detail-members-see-all-clicked',
  TEAM_DETAIL_MEMBER_CLICKED: 'team-detail-member-clicked',
  PROJECT_EDIT_CLICKED: 'project-edit-clicked',
}

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

export const TECHNOLOGIES = ["Filecoin", "IPFS", "libp2p", "IPLD", "drand", "FVM", "SourceCred"];

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

export const ITEMS_PER_PAGE = 42;

export const ENROLLMENT_TYPE = {
  MEMBER: 'MEMBER',
  TEAM: 'TEAM',
};

export const ADMIN_ROLE = "DIRECTORYADMIN";

export const AIRTABLE_REGEX = /^rec[A-Za-z0-9]{14}/;
export const LINKEDIN_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile|company)\/([a-zA-Z0-9-_]+)/;
export const TWITTER_URL_REGEX = /twitter\.com\/([^/]+)/;
export const GITHUB_URL_REGEX = /github\.com\/([^/]+)/;
export const TELEGRAM_URL_REGEX = /t\.me\/([^/]+)/;
export const EMAIL_REGEX = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/;