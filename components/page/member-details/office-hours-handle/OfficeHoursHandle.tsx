import React from 'react';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, getParsedValue, getProfileFromURL, triggerLoader } from '@/utils/common.utils';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import Cookies from 'js-cookie';
import { createFollowUp, getFollowUps } from '@/services/office-hours.service';
import { toast } from 'react-toastify';
import { EVENTS, LEARN_MORE_URL, TOAST_MESSAGES } from '@/utils/constants';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IUserInfo } from '@/types/shared.types';
import { IMember } from '@/types/members.types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Props {
  userInfo: IUserInfo;
  member: IMember;
}

export const OfficeHoursHandle = ({ userInfo, member }: Props) => {
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
        window.open(officeHours, '_blank');
      });
      const allFollowups = await getFollowUps(userInfo.uid ?? '', getParsedValue(authToken), 'PENDING,CLOSED');
      if (!allFollowups?.error) {
        const result = allFollowups?.data ?? [];
        if (result.length > 0) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, { detail: { notification: result[0] } }));
          document.dispatchEvent(new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } }));
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
    <ProfileSocialLink
      profile="Office Hours"
      height={24}
      width={24}
      callback={onScheduleMeeting}
      type="officeHours"
      handle="Office Hours"
      logo="/icons/contact/meet-contact-logo.svg"
      suffix={
        <a href={LEARN_MORE_URL} target="blank" style={{ display: 'flex', alignItems: 'center' }} onClick={onLearnMoreBtnClick}>
          <Image loading="lazy" alt="learn more" src="/icons/info.svg" height={16} width={16} />
        </a>
      }
    />
  );
};
