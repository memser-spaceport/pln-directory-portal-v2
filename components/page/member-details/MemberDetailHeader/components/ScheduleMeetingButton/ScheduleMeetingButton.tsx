'use client';

import clsx from 'clsx';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { Button } from '@/components/common/Button';
import { CalendarBlankIcon } from '@/components/icons';

import { useIsOfficeHoursLinkValid } from '../../../hooks/useIsOfficeHoursLinkValid';
import { useScheduleMeeting } from './useScheduleMeeting';

import { OfficeHoursDialog } from '../../../components/OfficeHoursDialog';
import { InvalidOfficeHoursLinkDialog } from './components/InvalidOfficeHoursLinkDialog';

import s from './ScheduleMeetingButton.module.scss';

interface Props {
  member: IMember;
  userInfo: IUserInfo;
  className?: string;
}

export function ScheduleMeetingButton(props: Props) {
  const { member, userInfo, className } = props;
  const isOfficeHoursValid = useIsOfficeHoursLinkValid({ member, userInfo, isLoggedIn: true });
  const meeting = useScheduleMeeting({ member, userInfo, isOfficeHoursValid });

  return (
    <>
      <Button style="fill" variant="primary" size="xs" className={clsx(s.button, className)} onClick={meeting.schedule}>
        <CalendarBlankIcon className={s.icon} aria-hidden="true" />
        Schedule Meeting
      </Button>
      <OfficeHoursDialog
        isOpen={meeting.isNoticeOpen}
        view="actionable"
        onClose={meeting.closeNotice}
        onContinue={meeting.continueFromNotice}
        userInfo={userInfo}
      />
      <InvalidOfficeHoursLinkDialog
        isOpen={meeting.isBrokenLinkOpen}
        onClose={meeting.closeBrokenLink}
        recipientName={member.name}
        recipientEmail={member.email}
        recipientTelegram={member.telegramHandle}
      />
    </>
  );
}
