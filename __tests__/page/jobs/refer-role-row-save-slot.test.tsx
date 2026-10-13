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

jest.mock('@/services/jobs/hooks/useJobApplications', () => ({
  useRoleApplication: (...args: unknown[]) => mockUseRoleApplication(...args),
}));

// The row's contract with the saved map is the save record (or null): it needs
// the date as well as the fact, for the clock inside the Saved tab.
const mockUseRoleSavedJob = jest.fn().mockReturnValue(null);
const mockToggleSavedJob = jest.fn();
jest.mock('@/services/jobs/hooks/savedJobs/useRoleSavedJob', () => ({
  useRoleSavedJob: (...args: unknown[]) => mockUseRoleSavedJob(...args),
}));
jest.mock('@/services/jobs/hooks/savedJobs/useToggleSavedJob', () => ({
  useToggleSavedJob: () => ({ mutate: mockToggleSavedJob }),
}));

const goToLogin = jest.fn();
jest.mock('@/components/core/login/utils', () => ({
  useLoginRedirect: () => goToLogin,
}));

const mockUseRoleApplication = jest.fn().mockReturnValue(null);

import { ReferRoleRow, type RowSaveProps } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow';
import type { IJobRole } from '@/types/jobs.types';
import type { IUserInfo } from '@/types/shared.types';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();

const ROLE: IJobRole = {
  uid: 'role-1',
  roleTitle: 'Community Manager',
  roleCategory: 'GTM/Marketing',
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  lastUpdated: daysAgo(30),
  postedDate: daysAgo(30),
  detectionDate: null,
};

const MEMBER = { uid: 'm1', name: 'Polina', email: 'p@example.com' } as unknown as IUserInfo;

const TEAM = {
  uid: 'team-1',
  name: 'Acme',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
};

const renderRow = (save?: RowSaveProps) =>
  render(
    <ReferRoleRow
      role={ROLE}
      teamId="team-1"
      teamName="Acme"
      team={TEAM}
      currentUser={MEMBER}
      source="job-board"
      save={save}
    />,
  );

beforeEach(() => {
  mockUseRoleApplication.mockReturnValue(null);
  mockUseRoleSavedJob.mockReturnValue(null);
  mockToggleSavedJob.mockClear();
  goToLogin.mockClear();
});

describe('ReferRoleRow save slot', () => {
  it('renders no bookmark without save props, so the team profile is unchanged', () => {
    renderRow();

    expect(screen.queryByRole('button', { pressed: false })).not.toBeInTheDocument();
  });

  it('offers the bookmark unpressed, and saves on the press', () => {
    renderRow({ memberUid: 'm1', savedScope: false });

    const bookmark = screen.getByRole('button', { name: 'Save Community Manager' });
    expect(bookmark).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(bookmark);
    expect(mockToggleSavedJob).toHaveBeenCalledWith({ roleUid: 'role-1', saved: false }, expect.anything());
  });

  it('reports a saved role as pressed, and unsaves on the press', () => {
    mockUseRoleSavedJob.mockReturnValue({ jobUid: 'role-1', savedAt: daysAgo(3) });
    renderRow({ memberUid: 'm1', savedScope: false });

    const bookmark = screen.getByRole('button', { name: 'Unsave Community Manager' });
    expect(bookmark).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(bookmark);
    expect(mockToggleSavedJob).toHaveBeenCalledWith({ roleUid: 'role-1', saved: true }, expect.anything());
  });

  it('sends a signed-out press to sign-in and writes nothing', () => {
    renderRow({ memberUid: undefined, savedScope: false });

    fireEvent.click(screen.getByRole('button', { name: 'Save Community Manager' }));

    expect(goToLogin).toHaveBeenCalled();
    expect(mockToggleSavedJob).not.toHaveBeenCalled();
  });

  it('keeps the posting age outside the Saved tab', () => {
    mockUseRoleSavedJob.mockReturnValue({ jobUid: 'role-1', savedAt: daysAgo(3) });
    renderRow({ memberUid: 'm1', savedScope: false });

    expect(screen.getByText('4w ago')).toBeInTheDocument();
    expect(screen.queryByText(/^Saved/)).not.toBeInTheDocument();
  });

  it('reports when the role was saved inside the Saved tab', () => {
    mockUseRoleSavedJob.mockReturnValue({ jobUid: 'role-1', savedAt: daysAgo(3) });
    renderRow({ memberUid: 'm1', savedScope: true });

    expect(screen.getByText('Saved 3d ago')).toBeInTheDocument();
    expect(screen.queryByText('4w ago')).not.toBeInTheDocument();
  });

  it('lets the application outrank the save — a role you kept and sent is sent', () => {
    mockUseRoleApplication.mockReturnValue({ uid: 'app-1', jobUid: 'role-1', appliedAt: daysAgo(1) });
    mockUseRoleSavedJob.mockReturnValue({ jobUid: 'role-1', savedAt: daysAgo(3) });
    renderRow({ memberUid: 'm1', savedScope: true });

    expect(screen.getByText('Applied 1d ago')).toBeInTheDocument();
    expect(screen.queryByText('Saved 3d ago')).not.toBeInTheDocument();
  });
});
