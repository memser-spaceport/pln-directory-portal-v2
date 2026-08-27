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

// The applied map rides a per-row query subscription. The row's contract with
// it is the application record (or null) — it needs the date as well as the
// fact, because once applied the row's clock reports the application instead of
// the posting's age.
const mockUseRoleApplication = jest.fn().mockReturnValue(null);
jest.mock('@/services/jobs/hooks/useJobApplications', () => ({
  useRoleApplication: (...args: unknown[]) => mockUseRoleApplication(...args),
}));

const APPLICATION = { uid: 'app-1', jobUid: 'role-1', appliedAt: '2026-05-01T00:00:00.000Z' };

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

const TEAM = {
  uid: 'team-1',
  name: 'Acme',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
};

/* `team` is required for the in-app slot now, not just for View job: the flow
   opens on the reading step and that step draws the team's masthead. */
const renderRow = (applyUrl: string | null, apply?: RowApplyProps) =>
  render(
    <ReferRoleRow
      role={role(applyUrl)}
      teamId="team-1"
      teamName="Acme"
      team={TEAM}
      currentUser={null}
      source="job-board"
      apply={apply}
    />,
  );

beforeEach(() => {
  mockUseRoleApplication.mockReturnValue(null);
});

describe('ReferRoleRow with in-app apply props', () => {
  const onApply = jest.fn();
  const apply: RowApplyProps = { onApply, memberUid: 'm1' };

  beforeEach(() => onApply.mockClear());

  it('renders a real Apply button that hands the full target to the flow', () => {
    renderRow('https://example.com/apply', apply);

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith({
      role: role('https://example.com/apply'),
      teamId: 'team-1',
      teamName: 'Acme',
      team: TEAM,
    });
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
    mockUseRoleApplication.mockReturnValue(APPLICATION);
    renderRow('https://example.com/apply', apply);

    const appliedButton = screen.getByRole('button', { name: /Applied/ });
    expect(appliedButton).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    // Having applied is no reason to stop being able to read the ad.
    expect(screen.getByLabelText('Open the Community Manager posting')).toBeInTheDocument();
  });

  it('subscribes the applied lookup per row, scoped by member and gated on the props', () => {
    renderRow(null, apply);
    expect(mockUseRoleApplication).toHaveBeenCalledWith('role-1', { memberUid: 'm1', enabled: true });
  });
});

/* The row used to render Apply as an outbound `<a>` for an unapproved member —
   the hiring team's own posting instead of the in-app flow. Approval no longer
   gates applying, so the row has one Apply for every viewer that gets the slot
   at all.

   Kept as a guard rather than deleted: a reintroduced branch would still render
   something called "Apply", and only the element type would say which one. */
describe('ReferRoleRow Apply is always in-app', () => {
  const onApply = jest.fn();
  const apply: RowApplyProps = { onApply, memberUid: 'm1' };

  beforeEach(() => onApply.mockClear());

  it('renders a button, never an outbound posting link', () => {
    renderRow('https://example.com/apply', apply);

    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Apply' })).not.toBeInTheDocument();
  });

  it('offers Apply even with no posting URL — the flow does not need one', () => {
    renderRow(null, apply);

    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it('hands the press to the flow', () => {
    renderRow('https://example.com/apply', apply);

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith({
      role: role('https://example.com/apply'),
      teamId: 'team-1',
      teamName: 'Acme',
      team: TEAM,
    });
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
    expect(mockUseRoleApplication).toHaveBeenCalledWith('role-1', { memberUid: undefined, enabled: false });
  });
});

/**
 * The row once the in-app description exists.
 *
 * Apply leaves the row entirely: a row carries a title, a seniority and a
 * location, which is not enough to decide with, so pressing Apply from it was
 * pressing send on a job you had not read. What replaces it is the reading step.
 */
describe('ReferRoleRow with the in-app description on', () => {
  const onApply = jest.fn();
  const onViewJob = jest.fn();
  const team = TEAM;

  const renderDetailRow = (applyUrl: string | null = 'https://example.com/apply') =>
    render(
      <ReferRoleRow
        role={role(applyUrl)}
        teamId="team-1"
        teamName="Acme"
        team={team}
        currentUser={null}
        source="job-board"
        apply={{ onApply, memberUid: 'm1', onViewJob }}
      />,
    );

  beforeEach(() => {
    onApply.mockClear();
    onViewJob.mockClear();
  });

  it('offers the reading step instead of Apply', () => {
    renderDetailRow();

    expect(screen.getByRole('button', { name: 'View job' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
  });

  /** The team travels too — the drawer's masthead needs the logo and focus
   *  areas that an id and a name cannot carry. */
  it('hands the team to the drawer along with the role', () => {
    renderDetailRow();

    fireEvent.click(screen.getByRole('button', { name: 'View job' }));

    expect(onViewJob).toHaveBeenCalledWith({
      role: role('https://example.com/apply'),
      teamId: 'team-1',
      teamName: 'Acme',
      team,
    });
    expect(onApply).not.toHaveBeenCalled();
  });

  /** One door, two handles. A title going somewhere other than the button
   *  beside it is the confusion this avoids. */
  it('opens the same drawer from the role title', () => {
    renderDetailRow();

    fireEvent.click(screen.getByRole('button', { name: 'Community Manager' }));

    expect(onViewJob).toHaveBeenCalledTimes(1);
  });

  /**
   * One button in both states. The applied fact is already in this row — the
   * clock reports it — so a second report of it in the slot that used to hold
   * the offer would only be filling the space the offer left. And having applied
   * is no reason to stop being able to reread the job.
   */
  it('keeps View job after applying, and moves the fact to the clock', () => {
    mockUseRoleApplication.mockReturnValue(APPLICATION);
    renderDetailRow();

    expect(screen.getByRole('button', { name: 'View job' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Applied$/ })).not.toBeInTheDocument();
    expect(screen.getByText(/^Applied /)).toBeInTheDocument();
  });

  /**
   * Without the team there is no masthead to render, so the row must not offer
   * the drawer at all — the flag reaching the row is not sufficient on its own.
   */
  /* No team record, no in-app slot at all — where this used to fall back to a
     direct Apply. The flow opens on a reading step that draws the team's
     masthead, so a row that cannot name the team cannot start one. */
  it('renders no in-app slot when the surface has no team record', () => {
    render(
      <ReferRoleRow
        role={role('https://example.com/apply')}
        teamId="team-1"
        teamName="Acme"
        currentUser={null}
        source="job-board"
        apply={{ onApply, memberUid: 'm1', onViewJob }}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View job' })).not.toBeInTheDocument();
  });

  /** Reading our panel and reading the team's own ad are different acts, so the
   *  arrow out survives the swap. */
  it('keeps the link out to the original posting', () => {
    renderDetailRow();

    expect(screen.getByRole('link', { name: /Open the Community Manager posting/i })).toBeInTheDocument();
  });
});
