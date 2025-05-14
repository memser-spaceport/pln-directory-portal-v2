import { IListOptions } from './shared.types';

export interface ITeamsSearchParams {
  searchBy?: string;
  sort?: string;
  tags: string;
  membershipSources: string;
  fundingStage: string;
  technology: string;
  includeFriends: string;
  viewType?: string;
  page?: string;
  officeHoursOnly: string;
  focusAreas: string;
  isRecent: string;
  isHost: string;
  isSponsor: string;
  asks?: string;
}
  

export interface ITeamFilterSelectedItems {
  tags: { selected: boolean; value: string; disabled: boolean }[];
  membershipSources: { selected: boolean; value: string; disabled: boolean }[];
  fundingStage: { selected: boolean; value: string; disabled: boolean }[];
  technology: { selected: boolean; value: string; disabled: boolean }[];
  focusAreas: any;
  asks: { selected: boolean; value: string; disabled: boolean }[];
}

export type ITeamListOptions = IListOptions & {
  'technologies.title__with'?: string;
  'membershipSources.title__with'?: string;
  'industryTags.title__with'?: string;
  'fundingStage.title__with'?: string;
  'teamMemberRoles.member.uid'?: string;
  plnFriend?: boolean;
  askTags?: string;
};

export interface ITeamResponse {
  uid?: string;
  logo?: { url: string | null };
  name?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  website?: string | null;
  twitter?: string | null;
  contactMethod?: string | null;
  fundingStage: { title: string };
  membershipSources: ITag[];
  industryTags: ITag[];
  technologies: ITag[];
  members?: string[];
  teamMemberRoles?: [];
  linkedinHandler?: string;
  twitterHandler?: string;
  linkedinHandle?: string | null;
  createdAt?: string;
  asks?: string[];
}

export interface ITag {
  title: string;
}

export interface ITeamAsk {
  uid: string;
  title: string;
  tags: string[];
  description: string;
  teamUid: string;
  status: 'OPEN' | 'CLOSED';
  closedReason?: string;
  closedComment: string;
  closedBy?: {
    name: string;
    uid: string;
    image: { url: string };
  };
}

export interface ITeam {
  asks: never[];
  role?: string;
  id: string;
  logo?: string;
  logoUid?: string;
  name?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  website?: string | null;
  twitter?: string | null;
  contactMethod?: string | null;
  fundingStage?: { title: string };
  membershipSources?: ITag[];
  industryTags?: ITag[];
  technologies?: ITag[];
  mainTeam?: boolean;
  teamLead?: boolean;
  linkedinHandle?: string | null;
  maintainingProjects: any[];
  contributingProjects: any[];
  officeHours?: string | null;
  teamFocusAreas: any[];
  eventGuests?: any;
}

export interface ITeamDetailParams {
  id: string;
}

export interface IFormatedTeamProject {
  uid: string;
  logo: { url: string };
  tagline: string;
  name: string;
  lookingForFunding: boolean;
  hasEditAccess: boolean;
  isDeleted: boolean;
  isMaintainingProject: boolean;
}
