export interface IIrlCard {
  id: string;
  name: string;
  description: string;
  location: string;
  slugUrl: string;
  bannerUrl: string;
  startDate: string;
  endDate: string;
  type: string;
  attendees: number;
  userInfo?: any;
  timezone: string
}
export interface IIrlLocationCard {
  id: number;
  location: string;
  flag: string;
  icon: string;
  pastEvents: any;
  upcomingEvents: any;
  isActive: boolean;
}

export interface IIrlGuestTeam {
  name: string;
  id: string;
  role: string;
  logo: string;
}

export interface IIrlEvent {
  uid: string;
  name: string;
  isHost: boolean;
  isSpeaker: boolean;
  slugURL: string;
  hostSubEvents: {
    link: string;
    name: string;
  }[];
  speakerSubEvents: {
    link: string;
    name: string;
  }[];
  type: string;
  startDate: string;
  endDate: string;
  logo: string;
}
export interface IGuest {
  teamUid: string;
  teamName: string;
  teamLogo: string;
  memberUid: string;
  memberName: string;
  memberLogo: string;
  events: IIrlEvent[];
  teams: IIrlGuestTeam[];
  topics: string[];
  reason: string;
  telegramId: string;
  officeHours: string;
  additionalInfo: any
  eventNames: string[];
}

export interface IAnalyticsGuestLocation {
  uid: string;
  name: string;
}

export interface IGuestDetails {
  guests: IGuest[];
  events: IIrlEvent[];
  isUserGoing: boolean;
  currentGuest: IGuest;
  totalGuests: number;
}

export interface IIrlLocation {
  uid: string;
  name: string;
}

export interface IIrlGathering {
  uid: string;
  name: string;
  type: string | null;
  description: string;
  startDate: string;
  endDate: string;
  logo: any;
  banner: {
    uid: string;
    cid: string;
    width: number;
    height: number;
    url: string;
    filename: string;
    size: number;
    type: string;
    version: string;
    thumbnailToUid: string;
    createdAt: string;
    updatedAt: string;
  };
  resources: {
    icon: string;
    link: string;
    name: string;
    description: string;
  }[];
  additionalInfo: {
    schedule: string;
    isExclusiveEvent: boolean;
  };
  hostSubEvents: IIrlParticipationEvent[];
  speakerSubEvents: IIrlParticipationEvent[];
}

export interface IIrlGuest {
  memberUid: string;
  memberName: string;
  memberLogo: string;
  teamUid: string;
  teamName: string;
  teamLogo: string;
  teams: { name: string; id: string; logo: string; }[];
  projectContributions: any[];
  eventNames: string[];
  events: {
    uid: string;
    name: string;
    startDate: string;
    endDate: string;
    logo: string;
    isHost: boolean;
    isSpeaker: boolean;
    hostSubEvents: any[];
    speakerSubEvents: any[];
  }[];
  topics: string[];
  officeHours: string;
  telegramId: string;
  reason: null;
  additionalInfo: {
    checkInDate: string;
    checkOutDate: string;
    hostSubEvents: any[];
    speakerSubEvents: any[];
  };
}

export interface IIrlAttendeeFormErrors {
  gatheringErrors: string[],
  participationErrors: string[],
  dateErrors: string[],
}

export interface IIrlParticipationEvent {
  uid: string;
  name: string;
  link: string
}

export interface AdditionalResource {
  link: string;
  type: string;
}
export interface Resource {
  icon: string;
  link: string;
  name: string;
  isPublic: boolean;
  description: string;
}

export interface Logo {
  uid: string;
  cid: string;
  width: number;
  height: number;
  url: string;
}
export interface IUpcomingEvents {
  uid: string;
  name: string;
  description: string;
  location: string;
  slugURL: string;
  bannerUrl: string;
  startDate: Date;
  endDate: Date;
  type: string;
  logo: Logo;
  resources: Resource[];
}

export interface IPastEvents {
  uid: string;
  name: string;
  description: string;
  location: string;
  slugURL: string;
  bannerUrl: string;
  startDate: Date;
  endDate: Date;
  type: string;
  logo: Logo;
  resources: Resource[];
}

export interface ILocationDetails {
  events: any;
  allEvents: any;
  priority: number;
  uid: string;
  location: string;
  flag: string;
  icon: string;
  upcomingEvents: IUpcomingEvents[];
  pastEvents: IPastEvents[];
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  resources: AdditionalResource[];
}
