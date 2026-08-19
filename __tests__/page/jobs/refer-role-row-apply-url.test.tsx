import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({ onJobClicked: jest.fn(), onJobReferClicked: jest.fn() }),
}));

// The refer modal pulls in a member search and the referral service; the share menu has
// its own popover. Neither is what these assertions are about.
jest.mock('@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu', () => ({
  ReferMenu: () => <div data-testid="refer-menu" />,
}));
jest.mock('@/prototypes/entries/job-board/components/ReferModal/ReferModal', () => ({
  ReferModal: () => null,
}));

import { ReferRoleRow } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow';
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

const renderRow = (applyUrl: string | null) =>
  render(
    <ReferRoleRow role={role(applyUrl)} teamId="team-1" teamName="Acme" currentUser={null} source="team-profile" />,
  );

describe('ReferRoleRow without an applyUrl', () => {
  it('offers no arrow when there is nowhere to go', () => {
    renderRow(null);

    expect(screen.queryByLabelText('Apply to Community Manager')).not.toBeInTheDocument();
  });

  it('renders the title as plain text, not a link that does nothing', () => {
    renderRow(null);

    expect(screen.getByText('Community Manager')).toBeInTheDocument();
    // `.titleLink` carries a pointer cursor and a hover underline, so an href-less
    // anchor would advertise a click it cannot honour.
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('still offers Refer, which does not depend on the posting URL', () => {
    renderRow(null);

    expect(screen.getByRole('button', { name: 'Refer' })).toBeInTheDocument();
    expect(screen.getByTestId('refer-menu')).toBeInTheDocument();
  });

  it('keeps both the title link and the arrow when a URL is present', () => {
    renderRow('https://example.com/apply');

    const arrow = screen.getByLabelText('Apply to Community Manager');
    expect(arrow).toHaveAttribute('href', 'https://example.com/apply?utm_source=os.pl.xyz&utm_medium=team_profile');
    expect(arrow).toHaveAttribute('target', '_blank');
    expect(arrow).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.getByRole('link', { name: 'Community Manager' })).toHaveAttribute('target', '_blank');
  });
});
