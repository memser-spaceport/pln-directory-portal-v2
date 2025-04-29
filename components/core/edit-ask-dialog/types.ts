import { MemberOption } from '@/components/core/close-ask-dialog/types';

export type EditAskForm = {
  title: string;
  description: string;
  tags: string[];
  disabled?: boolean;
};
