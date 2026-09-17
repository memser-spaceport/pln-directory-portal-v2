import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RoleApplicantsLine } from '@/components/page/team-details/TeamOpenRoles/components/RoleApplicantsLine';
import type { ApplicantCount } from '@/schema/team-applicants';

const count = (over: Partial<ApplicantCount> = {}): ApplicantCount => ({
  roleUid: 'role-1',
  applicantCount: 2,
  interestCount: 1,
  newCount: 2,
  newestAvatars: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
  ...over,
});

const renderLine = (c: ApplicantCount | undefined) =>
  render(<RoleApplicantsLine teamId="team-1" roleUid="role-1" count={c} />);

describe('RoleApplicantsLine', () => {
  it('counts both lists, because both are people who answered this role', () => {
    renderLine(count());

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/applicants/)).toBeInTheDocument();
  });

  it('says "applicant" for one', () => {
    renderLine(count({ applicantCount: 1, interestCount: 0 }));

    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/applicant$/)).toBeInTheDocument();
  });

  it('opens the applicants page already on this role', () => {
    renderLine(count());

    expect(screen.getByRole('link')).toHaveAttribute('href', '/teams/team-1/applicants?role=role-1');
  });

  it('marks how many this viewer has not opened', () => {
    renderLine(count({ newCount: 2 }));

    expect(screen.getByText(/2 new/)).toBeInTheDocument();
  });

  it('says nothing about new when everything has been read', () => {
    renderLine(count({ newCount: 0 }));

    expect(screen.queryByText(/new/)).not.toBeInTheDocument();
  });

  /* A role posted yesterday with no applicants is normal. A zero under every
     row would turn the section into a scoreboard of the team's own postings. */
  it('renders nothing at all for a role nobody has answered', () => {
    const { container } = renderLine(count({ applicantCount: 0, interestCount: 0, newCount: 0, newestAvatars: [] }));

    expect(container).toBeEmptyDOMElement();
  });

  /* Absence is an answer: the counts response omits roles with nobody, so a
     missing entry is "nobody", not "not known yet". */
  it('renders nothing when this role has no entry in the counts', () => {
    const { container } = renderLine(undefined);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows at most three faces, and copes with none', () => {
    const { rerender } = renderLine(
      count({ newestAvatars: ['https://example.com/a.jpg', 'https://example.com/b.jpg', 'https://example.com/c.jpg'] }),
    );
    expect(screen.getAllByRole('presentation', { hidden: true }).length).toBeLessThanOrEqual(3);

    rerender(<RoleApplicantsLine teamId="team-1" roleUid="role-1" count={count({ newestAvatars: [] })} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
