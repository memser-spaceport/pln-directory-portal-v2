export type MembersListQueryParams = {
  searchParams: any;
};

export type MemberNotificationSettings = {
  memberUid: string;
  recommendationsEnabled: boolean;
  subscribed: boolean;
  showInvitationDialog: boolean;
  emailFrequency: number;
  byFocusArea: boolean;
  byRole: boolean;
  byFundingStage: boolean;
  byIndustryTag: boolean;
  focusAreaList: string[];
  fundingStageList: string[];
  technologyList: string[];
  industryTagList: string[];
  keywordList: string[];
  roleList: string[];
};

export type MemberProfileStatus = {
  memberUid: string;
  completeness: number;
};
