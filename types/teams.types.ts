import { IListOptions } from "./shared.types";

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
  }
  

  export interface ITeamFilterSelectedItems {
    tags: { selected: boolean; value: string; disabled: boolean }[];
    membershipSources: { selected: boolean; value: string; disabled: boolean }[];
    fundingStage: { selected: boolean; value: string; disabled: boolean }[];
    technology: { selected: boolean; value: string; disabled: boolean }[];
    focusAreas: any
  }
  
  export type ITeamListOptions = IListOptions & {
    "technologies.title__with"?: string;
    "membershipSources.title__with"?: string;
    "industryTags.title__with"?: string;
    "fundingStage.title__with"?: string;
    "teamMemberRoles.member.uid"?: string;
    plnFriend?: boolean;
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
  }

  export interface ITag {
    title: string;
  }

  export interface ITeam {
    role?: string;
    id?: string;
    logo?: string;
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
  }