import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { LatestJobsSection } from '@/components/page/home/LatestJobsSection';
import type { ILatestJobOpening } from '@/components/page/home/LatestJobsSection/hooks/useLatestJobOpenings';

const mockUseLatestJobOpenings = jest.fn();

jest.mock('@/components/page/home/LatestJobsSection/hooks/useLatestJobOpenings', () => ({
  useLatestJobOpenings: () => mockUseLatestJobOpenings(),
}));

function buildOpening(overrides: Partial<ILatestJobOpening['role']> = {}, uid = 'role-1'): ILatestJobOpening {
  return {
    role: {
      uid,
      roleTitle: 'Senior Software Engineer',
      roleCategory: 'Engineering',
      seniority: 'Senior (L4)',
      location: ['Remote'],
      workMode: 'remote',
      applyUrl: 'https://example.com/apply',
      lastUpdated: '2026-08-01T00:00:00.000Z',
      postedDate: '2026-08-01T00:00:00.000Z',
      detectionDate: null,
      ...overrides,
    },
    team: {
      uid: 'team-1',
      name: 'Protocol Labs',
      logoUrl: null,
      focusAreas: [],
      subFocusAreas: [],
    },
  };
}

describe('LatestJobsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing while loading', () => {
    mockUseLatestJobOpenings.mockReturnValue({ openings: [], isLoading: true, isError: false });
    const { container } = render(<LatestJobsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on error', () => {
    mockUseLatestJobOpenings.mockReturnValue({ openings: [], isLoading: false, isError: true });
    const { container } = render(<LatestJobsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there are no openings', () => {
    mockUseLatestJobOpenings.mockReturnValue({ openings: [], isLoading: false, isError: false });
    const { container } = render(<LatestJobsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the section heading, a link to the full job board, and each opening', () => {
    mockUseLatestJobOpenings.mockReturnValue({
      openings: [buildOpening({}, 'role-1'), buildOpening({ roleTitle: 'Product Designer' }, 'role-2')],
      isLoading: false,
      isError: false,
    });

    render(<LatestJobsSection />);

    expect(screen.getByRole('heading', { name: 'Latest Job Openings' })).toBeInTheDocument();

    const viewAllLink = screen.getByRole('link', { name: 'View all jobs' });
    expect(viewAllLink).toHaveAttribute('href', '/jobs');

    expect(screen.getByRole('link', { name: 'Senior Software Engineer' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Product Designer' })).toBeInTheDocument();
    expect(screen.getAllByText('Protocol Labs')).toHaveLength(2);
  });

  it('links each role to its apply URL with the job board attribution params', () => {
    mockUseLatestJobOpenings.mockReturnValue({
      openings: [buildOpening()],
      isLoading: false,
      isError: false,
    });

    render(<LatestJobsSection />);

    const roleLink = screen.getByRole('link', { name: 'Senior Software Engineer' });
    expect(roleLink).toHaveAttribute('href', 'https://example.com/apply?utm_source=os.pl.xyz&utm_medium=job_board');
    expect(roleLink).toHaveAttribute('target', '_blank');
  });

  it('renders role title as plain text (no link) when there is no apply URL', () => {
    mockUseLatestJobOpenings.mockReturnValue({
      openings: [buildOpening({ applyUrl: null })],
      isLoading: false,
      isError: false,
    });

    render(<LatestJobsSection />);

    expect(screen.queryByRole('link', { name: 'Senior Software Engineer' })).not.toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });
});
