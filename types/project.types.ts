import { IMember } from "./members.types";
import { ITeam } from "./teams.types";

export interface IProjectResponse {
    contactEmail: string;
    createdAt: string;
    createdBy: string;
    creator: {
        name: string;
        uid: string;
        image: string
    };
    description: string;
    isDeleted: boolean;
    kpis: [{key: string, value: string}];
    logo: string;
    logoUid: string;
    lookingForFunding: boolean;
    maintainingTeam: {
        logo: string;
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
    contributingTeams: ITeam[];
    contributions: IMember[]
}

export interface IProjectLinks {
    url: string;
    name: string;
  }

  export interface IAnalyticsProjectInfo {
    name: string;
    description: string;
  }
  