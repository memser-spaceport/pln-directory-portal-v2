export interface ITeamFollowState {
  following: boolean;
  followerCount: number;
}

export interface ITeamFollower {
  uid: string;
  name: string;
  image: string | null;
  role?: string;
}

export interface ITeamFollowersResponse {
  total: number;
  items: ITeamFollower[];
}
