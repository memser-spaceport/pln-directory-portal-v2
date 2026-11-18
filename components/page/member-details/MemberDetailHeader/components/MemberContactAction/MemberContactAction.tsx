'use client';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { useMemberContactAction } from './useMemberContactAction';

import { RequestIntroEntry } from '@/components/page/intro-request/RequestIntroEntry';
import { ScheduleMeetingButton } from '../ScheduleMeetingButton';

interface Props {
  member: IMember;
  userInfo: IUserInfo;
  offerBooking: boolean;
  className?: string;
}

export function MemberContactAction(props: Props) {
  const { member, userInfo, offerBooking, className } = props;
  const action = useMemberContactAction({ member, offerBooking });

  if (action === 'schedule') {
    return <ScheduleMeetingButton member={member} userInfo={userInfo} className={className} />;
  }

  if (action === 'intro') {
    return <RequestIntroEntry type="MEMBER" targetId={member.id} targetName={member.name} className={className} />;
  }

  return null;
}
