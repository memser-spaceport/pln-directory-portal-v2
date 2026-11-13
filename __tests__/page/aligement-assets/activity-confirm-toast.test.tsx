import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  confirmToastContent,
  confirmToastMessage,
  NOT_PLAA_MEMBER_TOAST,
} from '@/components/page/aligement-assets/activities/confirm-toast';
import { ACTIVITY_CONFIRM_TOAST } from '@/constants/plaa';
import type { SnapshotActivityItem } from '@/services/plaa/hooks/useCurrentSnapshotStatus';

const hostOfficeHours = { id: 'host-office-hours', activity: 'Host Office Hours' };

const row = (siteActivityId: string | null | undefined, points = 100): SnapshotActivityItem => ({
  category: 'Knowledge Sharing',
  title: 'Host Office Hours',
  points,
  siteActivityId,
});

const ready = (activities: SnapshotActivityItem[]) => ({
  activities,
  activitiesStatus: 'ready' as const,
  periodLabel: 'November 2026',
});

describe('confirmToastMessage', () => {
  it("counts only the member's rows linked to this card in the open snapshot", () => {
    const message = confirmToastMessage(
      hostOfficeHours,
      ready([row('host-office-hours'), row('host-office-hours'), row('book-office-hours'), row(null, 500)]),
    );

    expect(message).toBe(
      'Confirmed! Host Office Hours credited 2 times (200 points) for November. New activity may take up to 48 hours to appear.',
    );
  });

  it('uses the singular for one credit and formats large point totals', () => {
    const message = confirmToastMessage(
      { id: 'build-ai-app-for-the-network', activity: 'Build an AI App for the Network' },
      ready([row('build-ai-app-for-the-network', 1000)]),
    );

    expect(message).toContain('credited 1 time (1,000 points) for November.');
  });

  it('says nothing is credited yet when the card has no rows this snapshot', () => {
    expect(confirmToastMessage(hostOfficeHours, ready([row('book-office-hours')]))).toBe(
      'Confirmed! Host Office Hours not credited yet for November. New activity may take up to 48 hours to appear.',
    );
  });

  it('describes kudos rows as kudos received', () => {
    const kudos = { id: 'give-network-kudos', activity: 'Give a Network Kudos' };

    expect(confirmToastMessage(kudos, ready([row('give-network-kudos', 20), row('give-network-kudos', 30)]))).toContain(
      'Confirmed! 2 kudos received (50 points) for November.',
    );
    expect(confirmToastMessage(kudos, ready([]))).toContain('Confirmed! No kudos received yet for November.');
  });

  it('falls back to the static message while records load or when they are unavailable', () => {
    const base = ready([row('host-office-hours')]);

    expect(confirmToastMessage(hostOfficeHours, { ...base, activitiesStatus: 'loading' })).toBe(ACTIVITY_CONFIRM_TOAST);
    expect(confirmToastMessage(hostOfficeHours, { ...base, activitiesStatus: 'unavailable' })).toBe(
      ACTIVITY_CONFIRM_TOAST,
    );
  });

  it('falls back to the static message when the API does not send siteActivityId yet', () => {
    expect(confirmToastMessage(hostOfficeHours, ready([row(undefined), row(undefined)]))).toBe(ACTIVITY_CONFIRM_TOAST);
  });

  it('tells a LabOS member without PLAA access that points are for PLAA members', () => {
    const message = confirmToastMessage(hostOfficeHours, ready([]), 'not-member');

    expect(message).toBe(NOT_PLAA_MEMBER_TOAST);
    expect(message.startsWith('Confirmed!')).toBe(false);
  });

  it('falls back to the static message while PLAA access is still being checked', () => {
    expect(confirmToastMessage(hostOfficeHours, ready([row('host-office-hours')]), 'checking')).toBe(
      ACTIVITY_CONFIRM_TOAST,
    );
  });

  it('links Profile in the fallback message and leaves other messages as plain text', () => {
    render(<>{confirmToastContent(ACTIVITY_CONFIRM_TOAST)}</>);
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/alignment-asset/profile');

    const counted = confirmToastMessage(hostOfficeHours, ready([row('host-office-hours')]));
    expect(confirmToastContent(counted)).toBe(counted);
  });
});
