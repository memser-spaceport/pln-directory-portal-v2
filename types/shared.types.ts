import { ITeam } from "./teams.types";

export interface IUserInfo {
    isFirstTimeLogin?: boolean;
    name?: string;
    email?: string;
    profileImageUrl?: string;
    uid?: string;
    roles?: string[];
    leadingTeams?: string[];
  }



  export interface IAnalyticsUserInfo {
    name: string | undefined;
    email: string | undefined;
    roles: string[] | undefined;
  }

  export type IGetRequestOptions = {
    select?: string;
    with?: string;
  };
  
  export type IListOptions = IGetRequestOptions & {
    orderBy?: string;
    name__istartswith?: string;
    pagination?: boolean;
    query?: any;
  };

  export interface IFilterSelectedItem {
    selected: boolean;
    value: string;
    disabled: boolean;
  }


  export interface IFormatedFilterValues {
    tags?: { value: string; selected: boolean; disabled: boolean }[];
    membershipSources?: { value: string; selected: boolean; disabled: boolean }[];
    fundingStage?: { value: string; selected: boolean; disabled: boolean }[];
    technology?: { value: string; selected: boolean; disabled: boolean }[];
    skills?: { selected: boolean; value: string; disabled: boolean }[];
    region?: { selected: boolean; value: string; disabled: boolean }[];
    country?: { selected: boolean; value: string; disabled: boolean }[];
    metroArea?: { selected: boolean; value: string; disabled: boolean }[];
  }

  export type IFocusArea = {
    uid: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    parentUid: string;
    children: IFocusArea[];
    teamAncestorFocusAreas: ITeam[];
    projectAncestorFocusAreas: any;
  }

  export type IAnalyticsFocusArea = {
    id: string;
    title: string;
  }

  export interface IAnalyticsTeamInfo {
    name: string;
    shortDescription: string;
  }
