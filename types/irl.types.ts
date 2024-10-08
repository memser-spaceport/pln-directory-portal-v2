export interface IIrlCard {
  id: string;
  name: string;
  description: string;
  location: string;
  slugUrl: string;
  bannerUrl: string;
  startDate: Date;
  endDate: Date;
  type: string;
  attendees: number;
  priority: number;
  userInfo?: any;
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
}