export interface ProjectOption {
  projectUid: string;
  projectName: string;
  projectLogo: string;
  maintainingTeamUid?: string;
  createdBy?: string;
  contributingTeamUids?: string[];
}
