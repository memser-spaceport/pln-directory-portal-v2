import { useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { ACTIVITY_CONFIRM_TOAST } from '@/constants/plaa';
import { toast, WIDE_TOAST_CLASS } from '@/components/core/ToastContainer';
import { useCurrentSnapshotStatus, type CurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';
import type { Activity } from './types';

const PROFILE_URL = '/alignment-asset/profile';
const DELAY_NOTE = 'New activity may take up to 48 hours to appear.';

/** For signed-in LabOS members without PLAA access (`plaa.access`), who can see the cards but don't collect points. */
export const NOT_PLAA_MEMBER_TOAST =
  'Points are collected by PLAA members. Onboard to the Alignment Asset to start earning credit for this activity.';

/** Cards whose Points Master rows are not "you did this", so they need their own wording. */
const KUDOS_ACTIVITY_ID = 'give-network-kudos';

type SnapshotForToast = Pick<CurrentSnapshotStatus, 'activities' | 'activitiesStatus' | 'periodLabel'>;

/** 'checking' covers a pending or failed permission lookup, so a member is never told they aren't one. */
export type ToastPlaaAccess = 'member' | 'not-member' | 'checking';

/**
 * The Confirm toast for an activity card, built from the member's records in the open snapshot —
 * the same records /profile and the snapshot bar count. Falls back to the static message whenever
 * those records can't be trusted to be complete.
 */
export function confirmToastMessage(
  activity: Pick<Activity, 'id' | 'activity'>,
  snapshot: SnapshotForToast,
  access: ToastPlaaAccess = 'member',
): string {
  // Non-members get an empty points list, which would otherwise read as "not credited yet".
  if (access === 'not-member') return NOT_PLAA_MEMBER_TOAST;
  if (access === 'checking') return ACTIVITY_CONFIRM_TOAST;
  if (snapshot.activitiesStatus !== 'ready') return ACTIVITY_CONFIRM_TOAST;
  // An API that predates siteActivityId would make every card look empty.
  if (snapshot.activities.some((item) => item.siteActivityId === undefined)) return ACTIVITY_CONFIRM_TOAST;

  const matches = snapshot.activities.filter((item) => item.siteActivityId === activity.id);
  const count = matches.length;
  const points = matches.reduce((sum, item) => sum + item.points, 0).toLocaleString('en-US');
  // The month alone reads better in a toast ("November", not "November 2026"); the label is shared with the snapshot bar.
  const period = snapshot.periodLabel.replace(/\s+\d{4}$/, '');

  if (activity.id === KUDOS_ACTIVITY_ID) {
    return count > 0
      ? `Confirmed! ${count} kudos received (${points} points) for ${period}. ${DELAY_NOTE}`
      : `Confirmed! No kudos received yet for ${period}. ${DELAY_NOTE}`;
  }

  return count > 0
    ? `Confirmed! ${activity.activity} credited ${count} ${count === 1 ? 'time' : 'times'} (${points} points) for ${period}. ${DELAY_NOTE}`
    : `Confirmed! ${activity.activity} not credited yet for ${period}. ${DELAY_NOTE}`;
}

/** The fallback message with "Profile" linked to the member's PLAA profile; other messages pass through. */
export function confirmToastContent(message: string): ReactNode {
  if (message !== ACTIVITY_CONFIRM_TOAST) return message;
  const [before, after] = ACTIVITY_CONFIRM_TOAST.split('Profile');
  return (
    <>
      {before}
      <Link href={PROFILE_URL} style={{ textDecoration: 'underline' }}>
        Profile
      </Link>
      {after}
    </>
  );
}

/** Shows the Confirm toast for an activity card. Used by both the activity table and the detail modal. */
export function useActivityConfirmToast() {
  const snapshot = useCurrentSnapshotStatus();
  const { activities, activitiesStatus, periodLabel } = snapshot;
  const { canView, isLoading, isError } = usePlaaAccess();
  const access: ToastPlaaAccess = isLoading || isError ? 'checking' : canView ? 'member' : 'not-member';
  return useCallback(
    (activity: Pick<Activity, 'id' | 'activity'>) => {
      const message = confirmToastMessage(activity, { activities, activitiesStatus, periodLabel }, access);
      toast.success(confirmToastContent(message), { className: WIDE_TOAST_CLASS });
    },
    [activities, activitiesStatus, periodLabel, access],
  );
}
