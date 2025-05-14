import { ITeam } from '@/types/teams.types';

export enum AskCloseReasons {
  ACTIVE = 'Active',
  FULLY_ADDRESSED = 'Fully Addressed',
  PARTIALLY_ADDRESSED = 'Partially Addressed',
  NO_LONGER_NEEDED = 'No Longer Needed',
  UNADRESSABLE = 'Unaddressable',
  DUPLICATE = 'Duplicate/Created in Error',
  OTHER = 'Other',
}

export type CloseAskForm = {
  reason: string;
  resolvedBy: MemberOption | null;
  comments?: string;
  disabled?: boolean;
};

export interface CloseAskDialogProps {
  team: ITeam;
  data: {
    title: string;
    description: string;
    tags: string[];
    uid: string;
    teamUid: string;
  };
  onClose: () => void;
  isVisible: boolean;
  onSuccess: () => Promise<void>;
}

export type MemberOption = {
  isVerified: boolean;
  name: string;
  profile: string;
  uid: string;
};
