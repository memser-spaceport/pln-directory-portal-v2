import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RoleApplicantsLine } from '@/components/page/team-details/TeamOpenRoles/components/RoleApplicantsLine';
import type { ApplicantCount } from '@/schema/team-applicants';

const count = (over: Partial<ApplicantCount> = {}): ApplicantCount => ({
  roleUid: 'role-1',
  applicantCount: 2,
  interestCount: 1,
  suggestedCount: 0,
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

  /* The line is the lead's way in to the Suggested tab too, so a role with only
     suggestions still gets one. */
  it('draws the line for a role that only has suggestions', () => {
    const { container } = renderLine(
      count({ applicantCount: 0, interestCount: 0, suggestedCount: 3, newCount: 0, newestAvatars: [] }),
    );

    expect(container.textContent).toContain('3 suggested');
    expect(container.textContent).not.toContain('applicant');
    expect(container.textContent).not.toContain('·');
    /* LAB-2853: straight to the Suggested tab, the list it names. */
    expect(screen.getByRole('link')).toHaveAttribute('href', '/teams/team-1/applicants?role=role-1&tab=suggested');
  });

  /* The "● N new" mark belongs to the answers, so it sits before the
     suggested link (LAB-2853); with nothing new the line reads as one run. */
  it('names suggestions after the people who answered', () => {
    const { container } = renderLine(count({ suggestedCount: 3, newCount: 0 }));

    expect(container.textContent).toContain('2 applicants · 1 interested · 3 suggested');
  });

  /* LAB-2853: "N suggested" is its own link, so each press opens the list it names. */
  it('links "N suggested" to the Suggested tab, apart from the answers', () => {
    renderLine(count({ suggestedCount: 3, newCount: 2 }));

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/teams/team-1/applicants?role=role-1');
    expect(links[0]).toHaveTextContent(/2 applicants · 1 interested/);
    expect(links[0]).toHaveTextContent(/2 new/);
    expect(links[0]).not.toHaveTextContent(/suggested/);
    expect(links[1]).toHaveAttribute('href', '/teams/team-1/applicants?role=role-1&tab=suggested');
    expect(links[1]).toHaveTextContent(/^3 suggested$/);
  });

  it('encodes the role uid in the suggested link', () => {
    render(
      <RoleApplicantsLine
        teamId="team-1"
        roleUid="role/1"
        count={count({ applicantCount: 0, interestCount: 0, suggestedCount: 1, newCount: 0, newestAvatars: [] })}
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/teams/team-1/applicants?role=role%2F1&tab=suggested');
  });

  /* A role posted yesterday with no applicants is normal. A zero under every
     row would turn the section into a scoreboard of the team's own postings. */
  it('renders nothing at all for a role nobody has answered', () => {
    const { container } = renderLine(
      count({ applicantCount: 0, interestCount: 0, suggestedCount: 0, newCount: 0, newestAvatars: [] }),
    );

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
