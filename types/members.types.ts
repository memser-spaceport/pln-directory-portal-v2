import { IListOptions } from './shared.types';
import { ITeam, ITeamResponse } from './teams.types';

export type IMemberListOptions = IListOptions & {
  officeHours__not?: 'null';
  'skills.title__with'?: string;
  'location.continent__with'?: string;
  'location.country__with'?: string;
  'location.metroarea__with'?: string;
  'teamMemberRoles.team.uid'?: string | string[];
  plnFriend?: boolean;
  openToWork?: boolean;
  isRecent?: boolean;
  includeUnVerified?: string;
};

export interface IMemberResponse {
  uid: string;
  name: string;
  image: { url: string };
  skills: [{ title: string }];
  teamMemberRoles: ITeamMemberRole[];
  projectContributions: [];
  location: IMemberLocation;
  email: string;
  githubHandler: string;
  discordHandler: string;
  telegramHandler: string;
  twitterHandler: string;
  officeHours: string;
  teamLead: boolean;
  teams: ITeamResponse;
  mainTeam: IMemberTeam;
  openToWork: boolean;
  linkedinHandler: string;
  repositories: [];
  preferences: {};
  createdAt: string;
  bio?:string;
}

export interface IMember {
  profile?: string | null;
  id: string;
  name: string;
  skills: [{ title: string }];
  teamMemberRoles?: ITeamMemberRole[];
  projectContributions: [];
  location: IMemberLocation;
  email?: string | null;
  githubHandle?: string | null;
  discordHandle?: string | null;
  telegramHandle?: string | null;
  twitter?: string | null;
  officeHours: string | null;
  teamLead: boolean;
  teams: ITeam[];
  mainTeam: IMemberTeam | null;
  openToWork: boolean;
  linkedinHandle?: string | null;
  repositories?: [];
  preferences: IMemberPreferences;
  bio?: string;
  isVerified?: boolean;
  eventGuests?: [];
}

export interface ILoggedoutMember {}

export interface ILoggedinMember {}

export interface ITeamMemberRole {
  team: ITeamResponse;
  role: string;
  uid: string;
  teamLead: boolean;
  member: IMemberResponse;
  mainTeam: IMemberTeam;
}

export interface IMemberLocation {
  metroArea: string;
  city: string;
  country: string;
  region: string;
  continent: string;
}

export interface IMemberTeam {
  id?: string;
  name?: string;
  role?: string;
  teamLead?: boolean;
  mainTeam?: boolean;
}

export type TMembersFiltersValues = {
  skills: string[];
  region: string[];
  country: string[];
  metroArea: string[];
  technology: string[];
};

export interface IMemberFilterSelectedItem {
  selected: boolean;
  value: string;
  disabled: boolean;
}

export interface IMemberFilterSelectedItems {
  skills: { selected: boolean; value: string; disabled: boolean }[];
  region: { selected: boolean; value: string; disabled: boolean }[];
  country: { selected: boolean; value: string; disabled: boolean }[];
  metroArea: { selected: boolean; value: string; disabled: boolean }[];
}

export interface IMembersSearchParams {
  searchBy?: string;
  sort?: string;
  skills: string;
  region: string;
  country: string;
  metroArea: string;
  includeFriends: string;
  viewType?: string;
  openToWork: string;
  officeHoursOnly: string;
  memberRoles: string;
  isRecent: string;
  includeUnVerified: string;
}

export interface IMemberDetailParams {
  id: string;
}

export interface IMemberPreferences {
  showEmail: boolean;
  showDiscord: boolean;
  showTwitter: boolean;
  showLinkedin: boolean;
  showTelegram: boolean;
  showGithubHandle: boolean;
  showGithubProjects: boolean;
}

export interface IMemberRepository {
  name: string;
  description: string;
  url: string;
}

export interface IAnalyticsMemberInfo {
  id: string;
  name: string;
}
