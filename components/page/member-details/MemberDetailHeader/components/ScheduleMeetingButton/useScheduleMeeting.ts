import { useState } from 'react';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useReportBrokenOfficeHours } from '@/services/members/hooks/useReportBrokenOfficeHours';

import { useOpenOfficeHoursLink } from './useOpenOfficeHoursLink';

interface Input {
  member: IMember;
  userInfo: IUserInfo;
  isOfficeHoursValid: boolean;
}

export function useScheduleMeeting(input: Input) {
  const { member, userInfo, isOfficeHoursValid } = input;
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isBrokenLinkOpen, setIsBrokenLinkOpen] = useState(false);
  const { onOfficeHourClicked } = useMemberAnalytics();
  const { mutate: reportBrokenLink } = useReportBrokenOfficeHours();
  const { data: memberPreferences } = useGetMemberPreferences(userInfo?.uid);
  const openLink = useOpenOfficeHoursLink({ member, userInfo });
  const showNotice = memberPreferences?.memberPreferences?.showOfficeHoursDialog !== false;

  const schedule = () => {
    onOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));

    if (!isOfficeHoursValid) {
      setIsBrokenLinkOpen(true);
      reportBrokenLink({ memberId: member.id });
      return;
    }

    if (showNotice) {
      setIsNoticeOpen(true);
      return;
    }

    openLink();
  };

  const continueFromNotice = () => {
    setIsNoticeOpen(false);
    openLink();
  };

  return {
    schedule,
    continueFromNotice,
    isNoticeOpen,
    closeNotice: () => setIsNoticeOpen(false),
    isBrokenLinkOpen,
    closeBrokenLink: () => setIsBrokenLinkOpen(false),
  };
}
