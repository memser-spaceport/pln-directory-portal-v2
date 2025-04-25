import { Option } from '@/types/shared.types';

export enum AskCloseReasons {
  FULLY_ADDRESSED = 'Fully Addressed',
  PARTIALLY_ADDRESSED = 'Partially Addressed',
  NO_LONGER_NEEDED = 'No Longer Needed',
  UNADRESSABLE = 'Unadressable',
  DUPLICATE = 'Duplicate/Created in Error',
  OTHER = 'Other',
}

export type CloseAskForm = {
  reason: string;
  resolvedBy: Option | null;
  comments?: string;
};

export interface CloseAskDialogProps {
  teamName: string;
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
