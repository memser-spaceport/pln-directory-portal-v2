

export const NAV_OPTIONS = [
    {
      name: "Teams",
      url: "/teams",
      selectedLogo: "/icons/teams--selected.svg",
      unSelectedLogo: "/icons/team.svg",
    },
    {
      name: "Members",
      url: "/members",
      selectedLogo: "/icons/members--selected.svg",
      unSelectedLogo: "/icons/members.svg",
    },
    {
      name: "Projects",
      url: "/projects",
      selectedLogo: "/icons/projects--selected.svg",
      unSelectedLogo: "/icons/projects.svg",
    },
    {
      name: "IRL Gatherings",
      url: "/irl",
      selectedLogo: "/icons/nav-calendar.svg",
      unSelectedLogo: "/icons/nav-calendar.svg",
    },
  ];

  export const EVENTS = {
    TRIGGER_LOADER: "TRIGGER_LOADER",
    TRIGGER_MOBILE_NAV: "TRIGGER_MOBILE_NAV",
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
    { name: "As a Member", logo: "/icons/join-member.svg" },
    { name: "As a Team", logo: "/icons/join-team.svg" },
  ];


  export const COMMON_ANALYTICS_EVENTS = {
    NAVBAR_MENU_ITEM_CLICKED: 'navbar-menu-item-clicked',
    NAVBAR_GET_HELP_ITEM_CLICKED: 'navbar-get-help-item-clicked',
    NAVBAR_ACCOUNTMENU_ITEM_CLICKED: 'navbar-accountmenu-item-clicked',
    NAVBAR_JOIN_NETWORK_CLICKED: "navbar-join-network-menu-clicked",
    NAVBAR_JOIN_NETWORK_OPTION_CLICKED: "navbar-join-network-option-clicked",
    NAVBAR_DRAWER_BTN_CLICKED: "navbar-drawer-btn-clicked",
  }