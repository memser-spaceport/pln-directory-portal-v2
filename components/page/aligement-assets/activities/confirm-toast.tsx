import { useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from '@/components/core/ToastContainer';
import { useCurrentUserStore } from '@/services/auth/store';
import { useCurrentSnapshotStatus, type CurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';
import type { Activity } from './types';

const PROFILE_URL = '/alignment-asset/profile';
const DELAY_NOTE = 'New activity may take up to 48 hours to appear.';
const KUDOS_ACTIVITY_ID = 'give-network-kudos';

export const NOT_PLAA_MEMBER_TOAST =
  'Points are collected by PLAA members. Onboard to the Alignment Asset to start earning credit for this activity.';

type SnapshotForToast = Pick<CurrentSnapshotStatus, 'activities' | 'activitiesStatus' | 'periodLabel'>;

export type ConfirmToastAccess = 'member' | 'not-member' | 'unknown';

const monthOf = (periodLabel: string) => periodLabel.replace(/\s+\d{4}$/, '');

export function confirmToastMessage(
  activity: Pick<Activity, 'id' | 'activity'>,
  snapshot: SnapshotForToast,
  access: ConfirmToastAccess,
): string | null {
  if (access === 'not-member') return NOT_PLAA_MEMBER_TOAST;
  if (access === 'unknown' || snapshot.activitiesStatus !== 'ready') return null;

  const matches = snapshot.activities.filter((item) => item.siteActivityId === activity.id);
  const count = matches.length;
  const points = matches.reduce((sum, item) => sum + item.points, 0).toLocaleString('en-US');
  const month = monthOf(snapshot.periodLabel);

  if (activity.id === KUDOS_ACTIVITY_ID) {
    return count > 0
      ? `Confirmed! ${count} kudos received (${points} points) for ${month}. ${DELAY_NOTE}`
      : `Confirmed! No kudos received yet for ${month}. ${DELAY_NOTE}`;
  }

  return count > 0
    ? `Confirmed! ${activity.activity} credited ${count} ${count === 1 ? 'time' : 'times'} (${points} points) for ${month}. ${DELAY_NOTE}`
    : `Confirmed! ${activity.activity} not credited yet for ${month}. ${DELAY_NOTE}`;
}

export function confirmToastContent(message: string | null): ReactNode {
  if (message !== null) return message;
  return (
    <>
      Confirmed! See your{' '}
      <Link href={PROFILE_URL} style={{ textDecoration: 'underline' }}>
        Profile
      </Link>{' '}
      for this snapshot&apos;s credited activity. {DELAY_NOTE}
    </>
  );
}

export function useActivityConfirmToast() {
  const { currentUser } = useCurrentUserStore();
  const { activities, activitiesStatus, periodLabel } = useCurrentSnapshotStatus();
  const { canView, isLoading, isError } = usePlaaAccess();

  let access: ConfirmToastAccess = 'unknown';
  if (currentUser && !isLoading && !isError) access = canView ? 'member' : 'not-member';

  return useCallback(
    (activity: Pick<Activity, 'id' | 'activity'>) => {
      const message = confirmToastMessage(activity, { activities, activitiesStatus, periodLabel }, access);
      toast.success(confirmToastContent(message));
    },
    [activities, activitiesStatus, periodLabel, access],
  );
}
