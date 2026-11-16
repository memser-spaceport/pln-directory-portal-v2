import Cookies from 'js-cookie';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { getParsedValue, normalizeOfficeHoursUrl } from '@/utils/common.utils';
import { getFollowUps } from '@/services/office-hours.service';

import { useCreateFollowUp } from '@/services/members/hooks/useCreateFollowUp';

import { toast } from '@/components/core/ToastContainer';

interface Input {
  member: IMember;
  userInfo: IUserInfo;
}

export function useOpenOfficeHoursLink(input: Input) {
  const { member, userInfo } = input;
  const { mutateAsync: createFollowUp } = useCreateFollowUp();

  return async () => {
    if (!userInfo.uid || !member.officeHours) {
      return;
    }

    const authToken = getParsedValue(Cookies.get('authToken') || '');
    const res = await createFollowUp({
      logInMemberUid: userInfo.uid,
      authToken,
      data: { data: {}, hasFollowUp: true, type: 'SCHEDULE_MEETING', targetMemberUid: member.id },
    });

    if (res?.error) {
      showFollowUpError(res.error.data?.message);
      return;
    }

    window.open(normalizeOfficeHoursUrl(member.officeHours), '_blank');
    await promptRating(userInfo.uid, authToken);
  };
}

function showFollowUpError(message?: string) {
  if (message?.includes('yourself is forbidden')) {
    toast.error(TOAST_MESSAGES.SELF_INTERACTION_FORBIDDEN);
  }

  if (message?.includes('Interaction with same user within 30 minutes is forbidden')) {
    toast.error(TOAST_MESSAGES.INTERACTION_RESTRICTED);
  }
}

async function promptRating(uid: string, authToken: string) {
  const followUps = await getFollowUps(uid, authToken, 'PENDING,CLOSED');
  const latest = followUps?.error ? undefined : followUps?.data?.[0];

  if (!latest) {
    return;
  }

  document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, { detail: { notification: latest } }));
  document.dispatchEvent(new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } }));
}
