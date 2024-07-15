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
}

export interface IResource {
  name: string;
  link: string;
  icon: string;
}

export interface IIrlTeam {
  id: string;
  name: string;
  role: string;
  teamLead: boolean;
  mainTeam: boolean;
}

export interface IGuest {
  uid: string;
  teamUid: string;
  teamName: string;
  teamLogo:string;
  memberUid: string;
  memberName: string;
  memberRole: string;
  reason: string;
  telegramId: string;
  isTelegramRemoved: boolean;
  officeHours: string;
  createdAt: string;
  projectContributions: string[];
  topics: [];
  additionalInfo: any;
}

export interface IEventDetails {
  id: string;
  name: string;
  slugUrl: string;
  bannerUrl: string;
  eventCount: string;
  description: string;
  websiteUrl: string;
  telegram: string;
  type: string;
  startDate: string;
  endDate: string;
  eventLocation: string;
  resources: IResource[];
  guests: IGuest[];
  topics: string[];
  isExclusionEvent: boolean;
  additionalInfo: any;
}
