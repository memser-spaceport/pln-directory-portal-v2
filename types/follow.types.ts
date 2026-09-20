export interface ITeamFollowState {
  following: boolean;
  followerCount: number;
}

export interface ITeamFollower {
  uid: string;
  name: string;
  imageUrl: string | null;
  role?: string;
}

export interface ITeamFollowersResponse {
  total: number;
  items: ITeamFollower[];
}

export interface IFollowedTeam {
  uid: string;
  name: string;
  logoUrl: string | null;
  followedAt: string;
  followerCount: number;
}

export interface IFollowedTeamsResponse {
  page: number;
  limit: number;
  total: number;
  items: IFollowedTeam[];
}
