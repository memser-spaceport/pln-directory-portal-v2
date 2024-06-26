import { IImageResponse } from "./shared.types";

export interface IProjectResponse {
    contactEmail: string;
    createdAt: string;
    createdBy: string;
    creator: {
        name: string;
        uid: string;
        image: IImageResponse;
    };
    description: string;
    isDeleted: boolean;
    kpis: [{key: string, value: string}];
    logo: IImageResponse;
    logoUid: string;
    lookingForFunding: boolean;
    maintainingTeam: {
        logo: IImageResponse;
        name: string;
        uid: string;
    }
    maintainingTeamUid: string;
    name: string;
    projectLinks: IProjectLinks[];
    readMe: string;
    tagline: string;
    uid: string;
    updatedAt: string;
}

export interface IProjectLinks {
    url: string;
    name: string;
  }

  export interface IAnalyticsProjectInfo {
    name: string;
    description: string;
  }
  