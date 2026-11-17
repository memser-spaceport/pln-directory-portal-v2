import { fireEvent, render, screen } from '@testing-library/react';

import { RolesSection } from '@/components/page/home/HomeV2/RolesSection';
import { recordMemberSignal } from '@/services/member-signals/member-signals.service';
import type { IHomeRole } from '@/types/home.types';

jest.mock('@/services/member-signals/member-signals.service', () => ({ recordMemberSignal: jest.fn() }));
jest.mock('@/analytics/home.analytics', () => ({
  useHomeAnalytics: () => ({ onRoleClicked: jest.fn(), onSeeAllClicked: jest.fn() }),
}));

const mockRecord = recordMemberSignal as jest.Mock;

const role = (over: Partial<IHomeRole>): IHomeRole =>
  ({
    uid: 'job-1',
    title: 'Protocol Engineer',
    teamUid: 'team-1',
    teamName: 'Acme',
    teamLogoUrl: null,
    location: 'Remote',
    applyUrl: 'https://jobs.example.com/1',
    ...over,
  }) as IHomeRole;

describe('RolesSection member signal', () => {
  beforeEach(() => mockRecord.mockClear());

  it('records a job view when a role opens its posting', () => {
    render(<RolesSection roles={[role({})]} total={1} signedIn />);

    fireEvent.click(screen.getByRole('link', { name: 'Protocol Engineer' }));

    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledWith({ action: 'view', entityType: 'job-opening', entityId: 'job-1' });
  });

  it('records nothing when a role has no posting and opens the board', () => {
    render(<RolesSection roles={[role({ applyUrl: null })]} total={1} signedIn />);

    fireEvent.click(screen.getByRole('link', { name: 'Protocol Engineer' }));

    expect(mockRecord).not.toHaveBeenCalled();
  });
});
