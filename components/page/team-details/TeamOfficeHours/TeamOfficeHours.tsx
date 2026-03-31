'use client';

import { clsx } from 'clsx';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { TEAM_OFFICE_HOURS_MSG, TOAST_MESSAGES } from '@/utils/constants';

import { toast } from '@/components/core/ToastContainer';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import { Tooltip } from '@/components/core/tooltip/tooltip';

import s from './TeamOfficeHours.module.scss';

interface Props {
  team: ITeam;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  officeHoursFlag?: boolean;
  isLoggedInMemberPartOfTeam?: boolean;
}

export function TeamOfficeHours(props: Props) {
  const { team, isLoggedIn, userInfo, isLoggedInMemberPartOfTeam = false } = props;

  const officeHours = team?.officeHours;
  const teamAnalytics = useTeamAnalytics();
  const router = useRouter();

  const onLoginClickHandler = () => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      teamAnalytics.onTeamDetailOfficeHoursLoginClicked(getAnalyticsTeamInfo(team));
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  };

  const onScheduleMeeting = (event: any) => {
    if (!isLoggedInMemberPartOfTeam) {
      teamAnalytics.onScheduleMeetingClicked(getAnalyticsUserInfo(userInfo), getAnalyticsTeamInfo(team));
    } else {
      event.preventDefault();
    }
  };

  if (!officeHours) {
    return null;
  }

  return (
    <div className={s.root}>
      <div className={s.left}>
        <div>
          <img loading="lazy" alt="calendar" className={s.calendarIcon} src="/icons/calendar.svg" />
        </div>
        {!isLoggedIn ? (
          <p className={s.message}>
            {TEAM_OFFICE_HOURS_MSG} {team?.name}
          </p>
        ) : (
          <h2 className={s.title}>Office Hours</h2>
        )}
      </div>
      <div className={s.right}>
        {isLoggedIn && officeHours && (
          <Tooltip
            asChild
            trigger={
              <a href={officeHours} target="blank" onClick={onScheduleMeeting}>
                <button className={clsx(s.meetingButton, { [s.disabled]: isLoggedInMemberPartOfTeam })}>
                  Schedule Meeting
                </button>
              </a>
            }
            content={isLoggedInMemberPartOfTeam ? 'You cannot schedule meeting with your own team!' : ''}
          />
        )}

        {isLoggedIn && !officeHours && (
          <button disabled className={clsx(s.meetingButton, s.disabled)}>
            Not Available
          </button>
        )}

        {!isLoggedIn && (
          <button onClick={onLoginClickHandler} className={s.meetingButton}>
            Login to Schedule
          </button>
        )}
      </div>
    </div>
  );
}
