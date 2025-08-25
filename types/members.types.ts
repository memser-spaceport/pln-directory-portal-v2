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
  isHost?: boolean;
  isSpeaker?: boolean;
  isHostAndSpeaker?: boolean;
  isVerified?: string;
};

export interface IMemberResponse {
  uid: string;
  name: string;
  image: { url: string };
  isVerified: boolean;
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
  bio?: string;
}

export interface IProjectContribution {
  currentProject: boolean;
  description: string;
  endDate: string;
  memberUid: string;
  project: {
    contactEmail: string;
    createdAt: string;
    createdBy: string;
    description: string;
    isDeleted: boolean;
    isFeatured: boolean;
    logoUid: string;
    lookingForFunding: boolean;
    maintainingTeamUid: string;
    name: string;
    osoProjectName: string;
    kpis: { key: string; value: string }[];
    logo: {
      cid: string;
      createdAt: string;
      filename: string;
      height: number;
      size: number;
      thumbnailToUid: null;
      type: string;
      uid: string;
      updatedAt: string;
      url: string;
      version: string;
      width: number;
    };
    projectLinks: {
      url: string;
      name: string;
    }[];
    readMe: string;
    tagline: string;
    score: number;
    tags: string[];
    uid: string;
    updatedAt: string;
  };
  projectUid: string;
  role: string;
  startDate: string;
  uid: string;
}

export interface ILinkedinProfile {
  uid: string;
  memberUid: string;
  linkedinProfileId: string;
  linkedinHandler: null;
  profileData: {
    sub: string;
    name: string;
    email: string;
    locale: {
      country: string;
      language: string;
    };
    picture: string;
    given_name: string;
    family_name: string;
    email_verified: boolean;
  };
  isVerified: boolean;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMember {
  profile?: string | null;
  id: string;
  name: string;
  skills: [{ uid: string; title: string }];
  teamMemberRoles?: ITeamMemberRole[];
  projectContributions: IProjectContribution[];
  location: IMemberLocation;
  email?: string | null;
  githubHandle?: string | null;
  discordHandle?: string | null;
  telegramHandle?: string | null;
  twitter?: string | null;
  accessLevel: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'Rejected';
  officeHours: string | null;
  ohInterest?: string[] | null;
  ohHelpWith?: string[] | null;
  ohStatus?: null | 'NOT_FOUND' | 'BROKEN' | 'OK';
  teamLead: boolean;
  teams: ITeam[];
  mainTeam: IMemberTeam | null;
  openToWork: boolean;
  linkedinHandle?: string | null;
  repositories?:
    | {
        createdAt: string;
        description: null;
        name: string;
        updatedAt: string;
        url: string;
      }[]
    | { statusCode: number; message: string };
  preferences: IMemberPreferences;
  bio?: string;
  isVerified?: boolean;
  eventGuests?: [];
  visibleHandles?: string[];
  linkedinProfile: ILinkedinProfile;
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
  hasOfficeHours: string;
  memberRoles: string;
  isRecent: string;
  includeUnVerified: string;
  isHost: string;
  isSpeaker: string;
  isSponsor: string;
  isHostAndSpeakerAndSponsor: string;
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
  showOfficeHoursDialog?: boolean;
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
