import React from 'react';
import {
  getAnalyticsMemberInfo,
  getAnalyticsUserInfo,
  getParsedValue,
  triggerLoader,
  normalizeOfficeHoursUrl,
} from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { createFollowUp, getFollowUps } from '@/services/office-hours.service';
import { toast } from '@/components/core/ToastContainer';
import { EVENTS, LEARN_MORE_URL, TOAST_MESSAGES } from '@/utils/constants';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IUserInfo } from '@/types/shared.types';
import { IMember } from '@/types/members.types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import s from './OfficeHoursHandle.module.scss';
import { clsx } from 'clsx';

interface Props {
  userInfo: IUserInfo;
  member: IMember;
  isLoggedIn: boolean;
}

export const OfficeHoursHandle = ({ userInfo, member, isLoggedIn }: Props) => {
  const { officeHours } = member;
  const memberAnalytics = useMemberAnalytics();
  const router = useRouter();

  const onScheduleMeeting = async () => {
    if (!userInfo.uid || !officeHours) {
      return;
    }

    try {
      triggerLoader(true);
      const authToken = Cookies.get('authToken') || '';
      const response: any = await createFollowUp(userInfo.uid, getParsedValue(authToken), {
        data: {},
        hasFollowUp: true,
        type: 'SCHEDULE_MEETING',
        targetMemberUid: member.id,
      });

      if (response?.error) {
        triggerLoader(false);
        if (response?.error?.data?.message?.includes('yourself is forbidden')) {
          toast.error(TOAST_MESSAGES.SELF_INTERACTION_FORBIDDEN);
        }

        if (response?.error?.data?.message?.includes('Interaction with same user within 30 minutes is forbidden')) {
          toast.error(TOAST_MESSAGES.INTERACTION_RESTRICTED);
        }
        return;
      }
      triggerLoader(false);
      setTimeout(() => {
        const normalizedOfficeHoursUrl = normalizeOfficeHoursUrl(officeHours);
        window.open(normalizedOfficeHoursUrl, '_blank');
      });
      const allFollowups = await getFollowUps(userInfo.uid ?? '', getParsedValue(authToken), 'PENDING,CLOSED');
      if (!allFollowups?.error) {
        const result = allFollowups?.data ?? [];
        if (result.length > 0) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, { detail: { notification: result[0] } }));
          document.dispatchEvent(
            new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } }),
          );
          router.refresh();
        }
      }
    } catch (error) {
      triggerLoader(false);
      console.error(error);
    }
    memberAnalytics.onOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
  };

  const onLearnMoreBtnClick = () => {
    memberAnalytics.onLearnMoreClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
  };

  return (
    <div className={s.root}>
      <span className={s.handle}>
        <Image
          loading="lazy"
          src="/icons/contact/meet-contact-logo.svg"
          alt="Office hours logo"
          height={24}
          width={24}
        />
        <span
          className={clsx(s.label, {
            [s.forceVisible]: isLoggedIn,
          })}
        >
          Office Hours
        </span>
      </span>
      <span
        className={clsx(s.description, {
          [s.hidden]: isLoggedIn,
        })}
      >
        Office Hours are 15-30 minute meetings that members can schedule with others in network.
      </span>
      <a href={LEARN_MORE_URL} target="blank" className={s.link} onClick={onLearnMoreBtnClick}>
        Learn more <Image loading="lazy" alt="learn more" src="/icons/open-link.svg" height={18} width={18} />
      </a>
      {isLoggedIn && (
        <button className={s.scheduleButton} onClick={onScheduleMeeting}>
          Schedule Meeting
        </button>
      )}
    </div>
  );
};
