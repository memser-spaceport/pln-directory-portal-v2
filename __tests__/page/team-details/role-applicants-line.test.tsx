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
  /* Both lists are on the line — both are people who answered this role — but
     they are named separately, because they did different things. */
  it('names each list, rather than summing them under one noun', () => {
    const { container } = renderLine(count());

    expect(container.textContent).toContain('2 applicants');
    expect(container.textContent).toContain('1 interested');
  });

  it('says "applicant" for one', () => {
    const { container } = renderLine(count({ applicantCount: 1, interestCount: 0 }));

    expect(container.textContent).toContain('1 applicant');
    expect(container.textContent).not.toContain('interested');
  });

  /**
   * The bug this wording replaced: a role whose only answer is interest read
   * "2 applicants" here and then opened on "No one has applied to this role
   * yet." — the line and the page it leads to contradicting each other about
   * the same two people.
   */
  it('calls interest interest when nobody applied', () => {
    const { container } = renderLine(count({ applicantCount: 0, interestCount: 2 }));

    expect(container.textContent).toContain('2 interested');
    expect(container.textContent).not.toContain('applicant');
  });

  /* No "0 interested" trailing a role nobody pressed interest on. */
  it('says nothing about a list that is empty', () => {
    const { container } = renderLine(count({ applicantCount: 3, interestCount: 0 }));

    expect(container.textContent).toContain('3 applicants');
    expect(container.textContent).not.toContain('·');
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
    renderLine(
      count({ newestAvatars: ['https://example.com/a.jpg', 'https://example.com/b.jpg', 'https://example.com/c.jpg'] }),
    );
    expect(screen.getAllByRole('presentation', { hidden: true }).length).toBeLessThanOrEqual(3);

    /* No faces is not no line: members without a picture contribute no avatar,
       and the tally is what the row is actually for. */
    const { container } = render(
      <RoleApplicantsLine teamId="team-1" roleUid="role-1" count={count({ newestAvatars: [] })} />,
    );
    expect(container.textContent).toContain('2 applicants');
  });
});
