import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { LatestJobs } from '@/components/page/home/LatestJobs/LatestJobs';
import type { ILatestJobRole } from '@/utils/jobs.utils';

const mockOnJobClicked = jest.fn();

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobClicked: (...args: unknown[]) => mockOnJobClicked(...args),
  }),
}));

const buildRole = (overrides: Partial<ILatestJobRole['role']> = {}): ILatestJobRole['role'] => ({
  uid: 'role-1',
  roleTitle: 'Senior Engineer',
  roleCategory: 'Engineering',
  seniority: 'Senior (L4)',
  location: ['Remote'],
  workMode: 'remote',
  applyUrl: 'https://example.com/apply',
  lastUpdated: '2024-01-01T00:00:00.000Z',
  postedDate: '2024-01-01T00:00:00.000Z',
  detectionDate: null,
  ...overrides,
});

const buildTeam = (overrides: Partial<ILatestJobRole['team']> = {}): ILatestJobRole['team'] => ({
  uid: 'team-1',
  name: 'Protocol Labs',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  ...overrides,
});

describe('LatestJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when there are no roles', () => {
    const { container } = render(<LatestJobs roles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the section title, a "View all jobs" link, and each role card', () => {
    const roles: ILatestJobRole[] = [
      { role: buildRole(), team: buildTeam() },
      {
        role: buildRole({ uid: 'role-2', roleTitle: 'Product Designer' }),
        team: buildTeam({ uid: 'team-2', name: 'Design Guild' }),
      },
    ];

    render(<LatestJobs roles={roles} />);

    expect(screen.getByText('Latest Job Openings')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View all jobs/i })).toHaveAttribute('href', '/jobs');

    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
    expect(screen.getByText('Product Designer')).toBeInTheDocument();
    expect(screen.getByText('Design Guild')).toBeInTheDocument();
  });

  it('links each role to its applyUrl and opens it in a new tab', () => {
    const roles: ILatestJobRole[] = [{ role: buildRole(), team: buildTeam() }];
    render(<LatestJobs roles={roles} />);

    const link = screen.getByRole('link', { name: /Senior Engineer/i });
    expect(link).toHaveAttribute('href', 'https://example.com/apply');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('falls back to the job board link when a role has no applyUrl', () => {
    const roles: ILatestJobRole[] = [{ role: buildRole({ applyUrl: null }), team: buildTeam() }];
    render(<LatestJobs roles={roles} />);

    const link = screen.getByRole('link', { name: /Senior Engineer/i });
    expect(link).toHaveAttribute('href', '/jobs');
    expect(link).not.toHaveAttribute('target');
  });

  it('fires job click analytics when a role card is clicked', () => {
    const roles: ILatestJobRole[] = [{ role: buildRole(), team: buildTeam() }];
    render(<LatestJobs roles={roles} />);

    screen.getByRole('link', { name: /Senior Engineer/i }).click();

    expect(mockOnJobClicked).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: 'role-1',
        team_id: 'team-1',
        role_title: 'Senior Engineer',
        position_in_list: 0,
      }),
    );
  });
});
