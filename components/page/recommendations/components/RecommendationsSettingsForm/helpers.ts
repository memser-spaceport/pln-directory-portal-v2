import { MemberNotificationSettings } from '@/services/members/types';

export function getSelectedFrequency(freq: number = 7) {
  switch (freq) {
    case 14:
      return { value: 14, label: 'Every 2 weeks' };
    case 30:
      return { value: 30, label: 'Monthly' };
    case 1:
      return { value: 1, label: 'Daily' };
    default:
      return { value: 7, label: 'Weekly' };
  }
}

export function getInitialValues(initialData: MemberNotificationSettings | null) {
  return {
    enabled: initialData?.recommendationsEnabled ?? false,
    frequency: initialData ? getSelectedFrequency(initialData.emailFrequency) : { value: 7, label: 'Weekly' },
    industryTags: initialData?.industryTagList ? initialData.industryTagList.map((tag) => ({ value: tag, label: tag })) : [],
    roles: initialData?.roleList ? initialData.roleList.map((role) => ({ value: role, label: role })) : [],
    fundingStage: initialData?.fundingStageList ? initialData.fundingStageList.map((stage) => ({ value: stage, label: stage })) : [],
  };
}
