import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({ onJobClicked: jest.fn(), onJobReferClicked: jest.fn() }),
}));

jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu', () => ({
  ReferMenu: () => <div data-testid="refer-menu" />,
}));
jest.mock('@/prototypes/entries/job-board/components/ReferModal/ReferModal', () => ({
  ReferModal: () => null,
}));

// The applied map rides a per-row query subscription; the row's contract with
// it is a boolean, which is what these tests steer.
const mockUseIsRoleApplied = jest.fn().mockReturnValue(false);
jest.mock('@/services/jobs/hooks/useJobApplications', () => ({
  useIsRoleApplied: (...args: unknown[]) => mockUseIsRoleApplied(...args),
}));

import { ReferRoleRow, type RowApplyProps } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow';
import type { IJobRole } from '@/types/jobs.types';

const role = (applyUrl: string | null): IJobRole => ({
  uid: 'role-1',
  roleTitle: 'Community Manager',
  roleCategory: 'GTM/Marketing',
  seniority: null,
  location: [],
  workMode: null,
  applyUrl,
  lastUpdated: '2026-05-01T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: null,
});

const renderRow = (applyUrl: string | null, apply?: RowApplyProps) =>
  render(
    <ReferRoleRow
      role={role(applyUrl)}
      teamId="team-1"
      teamName="Acme"
      currentUser={null}
      source="job-board"
      apply={apply}
    />,
  );

beforeEach(() => {
  mockUseIsRoleApplied.mockReturnValue(false);
});

describe('ReferRoleRow with in-app apply props', () => {
  const onApply = jest.fn();
  const apply: RowApplyProps = { onApply, memberUid: 'm1' };

  beforeEach(() => onApply.mockClear());

  it('renders a real Apply button that hands the full target to the flow', () => {
    renderRow('https://example.com/apply', apply);

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith({ role: role('https://example.com/apply'), teamId: 'team-1', teamName: 'Acme' });
  });

  it('makes link-less roles appliable — in-app Apply never needed the posting URL', () => {
    renderRow(null, apply);

    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    // The title still degrades to plain text, and no external affordance appears.
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('relabels the external arrow as the posting link — reading the ad and applying are different acts', () => {
    renderRow('https://example.com/apply', apply);

    const arrow = screen.getByLabelText('Open the Community Manager posting');
    expect(arrow).toHaveAttribute('href', 'https://example.com/apply?utm_source=os.pl.xyz&utm_medium=job_board');
    // The flag-off label must NOT exist while in-app Apply owns the slot.
    expect(screen.queryByLabelText('Apply to Community Manager')).not.toBeInTheDocument();
  });

  it('reports Applied in the same slot instead of offering again', () => {
    mockUseIsRoleApplied.mockReturnValue(true);
    renderRow('https://example.com/apply', apply);

    const appliedButton = screen.getByRole('button', { name: /Applied/ });
    expect(appliedButton).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    // Having applied is no reason to stop being able to read the ad.
    expect(screen.getByLabelText('Open the Community Manager posting')).toBeInTheDocument();
  });

  it('subscribes the applied lookup per row, scoped by member and gated on the props', () => {
    renderRow(null, apply);
    expect(mockUseIsRoleApplied).toHaveBeenCalledWith('role-1', { memberUid: 'm1', enabled: true });
  });
});

describe('ReferRoleRow without apply props (flag off / rejected viewer)', () => {
  it('renders no in-app Apply slot at all — prop absence is the gate', () => {
    renderRow('https://example.com/apply');

    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Applied/ })).not.toBeInTheDocument();
    // The arrow keeps its production label and job.
    expect(screen.getByLabelText('Apply to Community Manager')).toBeInTheDocument();
  });

  it('keeps the applied subscription inert — zero fetch work at flag-off', () => {
    renderRow(null);
    expect(mockUseIsRoleApplied).toHaveBeenCalledWith('role-1', { memberUid: undefined, enabled: false });
  });
});
