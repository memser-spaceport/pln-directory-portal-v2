export interface IUserInfo {
    isFirstTimeLogin: boolean;
    name: string;
    email: string;
    profileImageUrl: string;
    uid: string;
    roles: string[];
    leadingTeams: string[];
  }



  export interface IAnalyticsUserInfo {
    name: string | undefined;
    email: string | undefined;
    roles: string[] | undefined;
  }