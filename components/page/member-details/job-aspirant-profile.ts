import { JOB_ASPIRANT_POLICY_CODE, JOB_BOARD_SIGN_UP_SOURCE } from '@/services/jobs/job-board-viewer';

type JobAspirantMember = {
  rbac?: { policies?: { code: string }[] } | null;
  signUpSource?: string;
  mainTeam?: { name?: string } | null;
};

export const isJobAspirantMember = (member: JobAspirantMember | null | undefined): boolean =>
  Boolean(member?.rbac?.policies?.some((policy) => policy.code === JOB_ASPIRANT_POLICY_CODE)) ||
  (member?.signUpSource === JOB_BOARD_SIGN_UP_SOURCE && !member?.mainTeam?.name);

export const shouldShowInvestorProfile = (args: {
  isOwner: boolean;
  isAdmin: boolean;
  isInvestor?: boolean | null;
  isJobAspirant: boolean;
}): boolean => {
  if (!args.isOwner && !args.isAdmin) {
    return false;
  }

  if (args.isJobAspirant) {
    return args.isInvestor === true;
  }

  return args.isInvestor === null || Boolean(args.isInvestor);
};

export const shouldPlaceCvAfterProfileDetails = (args: {
  showCvSection: boolean;
  isJobAspirant: boolean;
  isOwner: boolean;
}): boolean => args.showCvSection && (args.isJobAspirant || !args.isOwner);

export const shouldPlaceCvInDefaultPosition = (args: {
  showCvSection: boolean;
  isJobAspirant: boolean;
  isOwner: boolean;
}): boolean => args.showCvSection && args.isOwner && !args.isJobAspirant;
